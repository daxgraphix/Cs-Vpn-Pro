import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Shield, Globe, Activity, Settings, Power, Zap, Lock, Wifi, AlertTriangle, 
  MapPin, RefreshCw, Search, Server, Gauge, Database, TrendingUp, Sun, Moon, 
  Check, Signal, Download, Upload, Cpu, EyeOff, Terminal, Layers, Share2, 
  Minimize2, X, FileText, User, Menu, Home, Network, Loader2, LogOut, ChevronRight,
  Play, Pause, Clock, History, Trash2, MoreHorizontal, ArrowRight, CornerDownRight,
  Brain, Sparkles
} from 'lucide-react';
import { 
  LineChart, Line, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { ConnectionState, ServerNode, SecurityLog, AiInsight, SortOption, SpeedTestResult, SpeedTestHistoryItem } from './types';
import { SERVER_NODES as INITIAL_NODES, MOCK_LOGS } from './constants';
import { getNetworkOptimization, classifyDomainThreat } from './services/geminiService';

// --- Types & Interfaces ---

interface NetworkInformation extends EventTarget {
  readonly downlink: number;
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  readonly rtt: number;
  readonly saveData: boolean;
  onchange: EventListener;
}

interface LogLine {
  id: number;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

interface GeoCords { x: number; y: number }
interface RealGeoData {
  ip: string;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  org: string; // ISP
}

// Map coordinates for visualization (SVG percentage 0-100)
const VISUAL_MAP_COORDS: Record<string, GeoCords> = {
  'New York': { x: 28, y: 35 },
  'Los Angeles': { x: 18, y: 38 },
  'London': { x: 48, y: 25 },
  'Frankfurt': { x: 52, y: 27 },
  'Singapore': { x: 78, y: 55 },
  'Tokyo': { x: 88, y: 38 },
  'Johannesburg': { x: 55, y: 75 },
  'São Paulo': { x: 35, y: 70 },
  'User': { x: 25, y: 38 } // Default fallback
};

// Real lat/lon for distance calc
const SERVER_REAL_COORDS: Record<string, { lat: number, lon: number }> = {
  'New York': { lat: 40.7128, lon: -74.0060 },
  'Los Angeles': { lat: 34.0522, lon: -118.2437 },
  'London': { lat: 51.5074, lon: -0.1278 },
  'Frankfurt': { lat: 50.1109, lon: 8.6821 },
  'Singapore': { lat: 1.3521, lon: 103.8198 },
  'Tokyo': { lat: 35.6762, lon: 139.6503 },
  'Johannesburg': { lat: -26.2041, lon: 28.0473 },
  'São Paulo': { lat: -23.5505, lon: -46.6333 },
};

// --- Physics Helper: Haversine Formula ---
const calculateLatency = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  
  // Physics approximation: 
  // Light in fiber is ~200,000 km/s. RTT is 2x distance. 
  // We add 15ms overhead for routing/switching.
  const fiberSpeed = 200; // km/ms
  const baseRtt = (distanceKm * 2) / fiberSpeed; 
  return Math.round(baseRtt + 15 + (Math.random() * 5)); // + Jitter
};

// --- Components ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [loadingStep, setLoadingStep] = useState(0);
  const steps = [
    "Scanning Network Interface...",
    "Resolving Public IP...",
    "Triangulating Location...",
    "Establishing Secure Handshake...",
    "System Ready."
  ];

  useEffect(() => {
    const totalTime = 3000;
    const stepTime = totalTime / steps.length;
    
    steps.forEach((_, index) => {
      setTimeout(() => {
        setLoadingStep(index);
      }, index * stepTime);
    });

    const finishTimer = setTimeout(onComplete, totalTime + 500);
    return () => clearTimeout(finishTimer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] text-white flex flex-col items-center justify-center p-4">
       <div className="relative mb-12">
          {/* Pulsing Core */}
          <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
          <div className="relative z-10 p-6 border border-blue-500/30 rounded-full bg-[#0a0a0a] shadow-[0_0_50px_rgba(59,130,246,0.3)]">
             <Shield className="w-16 h-16 md:w-24 md:h-24 text-blue-500 animate-pulse" />
          </div>
          {/* Orbiting Ring */}
          <div className="absolute inset-[-20px] border border-blue-500/20 rounded-full border-t-transparent animate-[spin_3s_linear_infinite]"></div>
          <div className="absolute inset-[-10px] border border-cyan-500/20 rounded-full border-b-transparent animate-[spin_2s_linear_infinite_reverse]"></div>
       </div>

       <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-500">
          CS VPN AI
       </h1>
       <p className="text-xs md:text-sm text-blue-400/60 tracking-[0.5em] uppercase font-mono mb-12">Professional Edition</p>

       <div className="w-full max-w-xs space-y-2">
         {/* Loading Bar */}
         <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
              style={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}
            ></div>
         </div>
         
         {/* Tech Text */}
         <div className="flex justify-between items-end h-8 font-mono text-[10px] md:text-xs text-slate-500">
            <span className="text-cyan-500 animate-pulse">
               {">"} {steps[loadingStep]}
            </span>
            <span>{(loadingStep / (steps.length - 1) * 100).toFixed(0)}%</span>
         </div>
       </div>

       {/* Grid Background Effect */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
    </div>
  );
};

const ConsoleLog = ({ logs }: { logs: LogLine[] }) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [logs]);

  return (
    <div className="bg-[#1e293b] dark:bg-[#0a0a0a] border border-slate-700 dark:border-white/10 rounded-xl p-4 font-mono text-[10px] md:text-xs h-48 overflow-y-auto custom-scrollbar shadow-inner shadow-black/50">
      <div className="flex items-center gap-2 mb-2 text-slate-400 border-b border-slate-700 dark:border-white/5 pb-2">
        <Terminal className="w-3 h-3" />
        <span className="uppercase tracking-widest font-bold">Live System Kernel</span>
      </div>
      <div className="space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-fade-in">
            <span className="text-slate-500 dark:text-slate-600">[{log.timestamp}]</span>
            <span className={`${
              log.type === 'success' ? 'text-green-400' :
              log.type === 'warning' ? 'text-yellow-400' :
              log.type === 'error' ? 'text-red-400' :
              'text-blue-400'
            }`}>
              {log.type === 'success' && '✓ '}
              {log.text}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

const LiveMap = ({ 
  selectedServer, 
  isConnected, 
  isMultiHop, 
  entryNode,
  nodes
}: { 
  selectedServer: ServerNode, 
  isConnected: boolean, 
  isMultiHop: boolean, 
  entryNode: ServerNode,
  nodes: ServerNode[]
}) => {
  const userPos = VISUAL_MAP_COORDS['User'];
  const targetPos = VISUAL_MAP_COORDS[selectedServer.city] || { x: 50, y: 50 };
  const entryPos = isMultiHop ? (VISUAL_MAP_COORDS[entryNode.city] || { x: 50, y: 50 }) : userPos;

  const calculatePath = (start: GeoCords, end: GeoCords) => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2 - 20; 
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  return (
    <div className="relative w-full aspect-[2/1] bg-slate-200 dark:bg-[#0f111a] rounded-xl overflow-hidden border border-slate-300 dark:border-white/5 shadow-inner dark:shadow-black/20 group transition-colors">
      <div className="absolute inset-0 opacity-10 dark:opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-cover bg-center bg-no-repeat filter sepia hue-rotate-180 dark:invert mix-blend-screen pointer-events-none"></div>
      
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {(isConnected) && (
          <>
            <path 
              d={calculatePath(userPos, entryPos)} 
              fill="none" 
              stroke="url(#grad1)" 
              strokeWidth="0.5" 
              className="animate-dash"
              strokeDasharray="5"
            />
            {isMultiHop && (
              <path 
                d={calculatePath(entryPos, targetPos)} 
                fill="none" 
                stroke="#22c55e" 
                strokeWidth="0.5" 
                className="animate-dash"
                strokeDasharray="5"
                style={{ animationDelay: '1s' }}
              />
            )}
          </>
        )}
      </svg>
      <div className="absolute w-3 h-3 bg-blue-600 dark:bg-white rounded-full shadow-[0_0_15px_currentColor] z-20" style={{ left: `${userPos.x}%`, top: `${userPos.y}%`, transform: 'translate(-50%, -50%)' }}>
        <div className="absolute -inset-2 bg-blue-500/20 dark:bg-white/20 rounded-full animate-ping"></div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] dark:text-white text-slate-900 font-mono whitespace-nowrap bg-white/80 dark:bg-black/50 px-1 rounded backdrop-blur">YOU</div>
      </div>
      {nodes.map(node => {
        const pos = VISUAL_MAP_COORDS[node.city] || { x: 50, y: 50 };
        const isTarget = node.id === selectedServer.id;
        const isEntry = isMultiHop && node.id === entryNode.id;
        const isActive = isConnected && (isTarget || isEntry);

        return (
          <div 
            key={node.id} 
            className={`absolute transition-all duration-500 z-20 ${isActive ? 'z-30' : 'opacity-40 grayscale'}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive ? (isTarget ? 'bg-green-500 shadow-[0_0_20px_#22c55e] scale-150' : 'bg-blue-500 shadow-[0_0_15px_#3b82f6] scale-125') : 'bg-slate-400 dark:bg-slate-500'}`}></div>
            {isActive && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white font-mono whitespace-nowrap bg-black/70 px-2 py-0.5 rounded border border-white/10 backdrop-blur">
                {isEntry && "ENTRY -> "}{node.city}
              </div>
            )}
          </div>
        )
      })}
    </div>
  );
};

const ProtocolSelector = ({ current, onChange }: { current: string, onChange: (p: string) => void }) => {
  const protocols = [
    { id: 'WireGuard', name: 'WireGuard', type: 'UDP', speed: 'Ultra', security: 'High', desc: 'Next-gen, lightweight, extremely fast.' },
    { id: 'OpenVPN', name: 'OpenVPN', type: 'TCP/UDP', speed: 'High', security: 'Max', desc: 'The industry standard for security.' },
    { id: 'IKEv2', name: 'IKEv2', type: 'IPSec', speed: 'Fast', security: 'Medium', desc: 'Good for mobile stability.' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {protocols.map(p => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`relative p-3 rounded-xl border text-left transition-all ${
            current === p.id 
            ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
            : 'bg-white dark:bg-[#0f111a] border-slate-300 dark:border-white/5 hover:border-slate-400 dark:hover:border-white/10'
          }`}
        >
          {current === p.id && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>}
          <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">{p.name}</div>
          <div className="flex gap-2 text-[9px] font-mono uppercase text-slate-400 mb-2">
            <span className="bg-slate-100 dark:bg-white/5 px-1 rounded">{p.type}</span>
            <span className={`${p.speed === 'Ultra' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>{p.speed}</span>
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-500 leading-tight">{p.desc}</div>
        </button>
      ))}
    </div>
  )
};

// --- Sidebar Navigation Component ---
const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isMobileOpen, 
  closeMobile, 
  isDarkMode, 
  toggleTheme, 
  status 
}: { 
  activeTab: string, 
  setActiveTab: (t: string) => void, 
  isMobileOpen: boolean, 
  closeMobile: () => void, 
  isDarkMode: boolean, 
  toggleTheme: () => void,
  status: ConnectionState
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'network-overview', label: 'Network Overview', icon: Network },
    { id: 'servers', label: 'Servers', icon: Globe },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Brain },
    { id: 'optimization', label: 'Optimizing', icon: Zap },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-[60] w-64 transform transition-transform duration-300 ease-in-out
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    bg-white dark:bg-[#0f111a] border-r border-slate-200 dark:border-white/5 flex flex-col
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[55] md:hidden backdrop-blur-sm"
          onClick={closeMobile}
        ></div>
      )}

      <aside className={sidebarClasses}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">CS VPN <span className="text-blue-500">AI</span></span>
          </div>
          <button onClick={closeMobile} className="ml-auto md:hidden text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 px-2">Main Menu</div>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); closeMobile(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${activeTab === item.id 
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
              <span>{item.label}</span>
              {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
            </button>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-4">
          
          {/* Status Indicator */}
          <div className={`p-3 rounded-xl border flex items-center gap-3 ${status === ConnectionState.CONNECTED ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5'}`}>
             <div className={`w-2 h-2 rounded-full ${status === ConnectionState.CONNECTED ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
             <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {status === ConnectionState.CONNECTED ? 'Protected' : 'Unprotected'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {status === ConnectionState.CONNECTED ? 'Tunnel Active' : 'System Idle'}
                </div>
             </div>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
               {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
               <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'left-4.5' : 'left-0.5'}`} style={{left: isDarkMode ? '18px' : '2px'}}></div>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};

// --- AI Insight Card ---
const AiInsightCard = ({ insight, onDismiss }: { insight: AiInsight, onDismiss: () => void }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-5 animate-fade-in-up flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            insight.type === 'security' ? 'bg-red-500/10 text-red-500' : 
            insight.type === 'prediction' ? 'bg-purple-500/10 text-purple-500' : 
            'bg-blue-500/10 text-blue-500'
          }`}>
             {insight.type === 'security' ? <Shield className="w-4 h-4" /> : 
              insight.type === 'prediction' ? <TrendingUp className="w-4 h-4" /> : 
              <Zap className="w-4 h-4" />}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{insight.type} Insight</span>
        </div>
        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{insight.message}</h4>
        {insight.details && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{insight.details}</p>}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={`w-1 h-3 rounded-full ${i <= (insight.confidence * 5) ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{(insight.confidence * 100).toFixed(0)}% Confidence</span>
        </div>
        <span className="text-[10px] text-slate-400">{insight.timestamp}</span>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Real Data State
  const [geoData, setGeoData] = useState<RealGeoData | null>(null);
  const [serverNodes, setServerNodes] = useState<ServerNode[]>(INITIAL_NODES);
  const [selectedServer, setSelectedServer] = useState<ServerNode>(INITIAL_NODES[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settings & Features
  const [isMultiHop, setIsMultiHop] = useState(false);
  const [entryNode, setEntryNode] = useState<ServerNode>(INITIAL_NODES[1]);
  const [protocol, setProtocol] = useState('WireGuard');
  const [killSwitch, setKillSwitch] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [safetyMode, setSafetyMode] = useState<'standard' | 'family' | 'strict'>('standard');
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [optimizationMode, setOptimizationMode] = useState('speed');

  // Advanced Filter State
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    'Ad Blocking & Trackers': true,
    'Cryptomining Protection': true,
    'Social Media Blocking': false,
    'Gaming Servers': false
  });

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => ({
        ...prev,
        [filter]: !prev[filter]
    }));
  };

  // Metrics
  const [sessionTime, setSessionTime] = useState(0);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<LogLine[]>([]);
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Real Network Data
  const [linkInfo, setLinkInfo] = useState<{ type: string, downlink: number, rtt: number }>({ type: 'Unknown', downlink: 0, rtt: 0 });
  const [sessionUsage, setSessionUsage] = useState(0);
  const [totalUsage, setTotalUsage] = useState(0);

  // New Feature States
  const [graphPaused, setGraphPaused] = useState(false);
  const [graphTimeWindow, setGraphTimeWindow] = useState(60); // Seconds
  const [speedTest, setSpeedTest] = useState<SpeedTestResult>({ download: 0, upload: 0, ping: 0, status: 'idle', progress: 0 });
  const [speedTestMode, setSpeedTestMode] = useState<'download' | 'upload' | 'full'>('full');
  const [speedTestHistory, setSpeedTestHistory] = useState<SpeedTestHistoryItem[]>([]);

  // Theme Sync
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // --- Real Initialization ---
  
  const addConsoleLog = (text: string, type: LogLine['type'] = 'info') => {
    setConsoleLogs(prev => [...prev, { id: Date.now(), text, type, timestamp: new Date().toLocaleTimeString().split(' ')[0] }]);
  };

  useEffect(() => {
    // 1. Fetch Real IP & Location
    const initRealData = async () => {
      try {
        addConsoleLog("Initializing Network Discovery...", "info");
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        
        if (data.ip) {
          const realGeo: RealGeoData = {
            ip: data.ip,
            city: data.city,
            region: data.region,
            country: data.country_name,
            latitude: data.latitude,
            longitude: data.longitude,
            org: data.org
          };
          setGeoData(realGeo);
          addConsoleLog(`User Located: ${realGeo.city}, ${realGeo.country} (${realGeo.org})`, "success");

          // 2. Update Server Nodes with Real Physics-Based Latency
          const updatedNodes = INITIAL_NODES.map(node => {
            const serverCoords = SERVER_REAL_COORDS[node.city];
            if (serverCoords) {
              const realLatency = calculateLatency(
                realGeo.latitude, realGeo.longitude,
                serverCoords.lat, serverCoords.lon
              );
              return { ...node, latency: realLatency };
            }
            return node;
          });
          setServerNodes(updatedNodes);
          setSelectedServer(updatedNodes[0]); // Default to first (usually best)
          addConsoleLog("Server latency matrix calibrated using geodesic distance.", "success");
        }
      } catch (e) {
        addConsoleLog("Network Discovery Failed. Using fallback metrics.", "error");
      }
    };

    initRealData();

    // 3. Monitor Network Info
    const updateNetworkInfo = () => {
        if ('connection' in navigator) {
            const conn = (navigator as any).connection as NetworkInformation;
            setLinkInfo({
                type: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt
            });
        }
    };
    updateNetworkInfo();
    if ('connection' in navigator) {
        ((navigator as any).connection as NetworkInformation).addEventListener('change', updateNetworkInfo);
    }
    
    // 4. Load saved usage
    const savedUsage = localStorage.getItem('cs_vpn_total_usage');
    if(savedUsage) setTotalUsage(parseFloat(savedUsage));
    
    // 5. Load Speed Test History
    const savedHistory = localStorage.getItem('cs_vpn_speed_history');
    if(savedHistory) setSpeedTestHistory(JSON.parse(savedHistory));

    return () => {
        if ('connection' in navigator) {
            ((navigator as any).connection as NetworkInformation).removeEventListener('change', updateNetworkInfo);
        }
    };
  }, []);

  // Connection Logic
  const connectSequence = async () => {
    setConsoleLogs([]);
    setStatus(ConnectionState.CONNECTING);
    
    addConsoleLog("Secure Core: Initializing...", "info");

    // AI Pre-Check
    await handleOptimize(true);

    const steps = [
      { msg: `Interface Up: ${linkInfo.type.toUpperCase()} (${linkInfo.downlink}Mbps link)`, type: 'info', delay: 200 },
      { msg: `Route: ${geoData?.city || 'Local'} -> ${entryNode.city} -> ${selectedServer.city}`, type: 'info', delay: 600 },
      { msg: `Generating Keys (Curve25519) for ${protocol}...`, type: 'info', delay: 1200 },
      { msg: "Handshake: Verifying remote certificate...", type: 'warning', delay: 1800 },
      { msg: `Tunnel Active. Virtual IP: ${selectedServer.ip}`, type: 'success', delay: 2400 },
    ];
    
    if (isMultiHop) {
      steps.push({ msg: `Double-Hop Active: Traffic relay via ${entryNode.country}`, type: 'info', delay: 2800 });
    }

    for (const step of steps) setTimeout(() => addConsoleLog(step.msg, step.type as any), step.delay);
    setTimeout(() => setStatus(ConnectionState.CONNECTED), isMultiHop ? 3500 : 2800);
  };

  const handleConnect = () => {
    if (status === ConnectionState.DISCONNECTED) {
      connectSequence();
    } else {
      setStatus(ConnectionState.DISCONNECTING);
      addConsoleLog("Termination signal sent.", "warning");
      setTimeout(() => {
        addConsoleLog("Tunnel closed. Statistics flushed.", "info");
        setStatus(ConnectionState.DISCONNECTED);
      }, 1000);
    }
  };

  const handleOptimize = async (silent = false) => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    if (!silent) addConsoleLog("Neural Engine: Manual optimization sequence initiated...", "info");

    const context = geoData ? { 
        location: `${geoData.city}, ${geoData.country}`, 
        isp: geoData.org, 
        ip: geoData.ip 
    } : {
        location: "Unknown Location", 
        isp: "Standard ISP", 
        ip: "0.0.0.0" 
    };

    try {
        const insight = await getNetworkOptimization(serverNodes, context, "proactive");
        setAiInsight({ ...insight, id: Date.now().toString(), details: "Optimization based on latency heuristics and privacy threat model for current ISP zone." });
        addConsoleLog(`AI Optimization Complete: ${insight.message}`, "success");
    } catch (e) {
        addConsoleLog("AI Optimization Failed: Neural link unstable.", "error");
    } finally {
        setIsOptimizing(false);
    }
  };

  // Enhanced Bandwidth Monitor
  useEffect(() => {
    let interval: any;
    
    if (status === ConnectionState.CONNECTED) {
      let lastTotal = 0;
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
        
        if (!graphPaused) {
           // Clear buffer periodically to avoid memory leaks
          if (performance.getEntriesByType("resource").length > 200) {
              performance.clearResourceTimings();
              lastTotal = 0;
          }

          const entries = performance.getEntriesByType("resource");
          const currentTotalBytes = entries.reduce((acc, entry: any) => acc + (entry.transferSize || 0), 0);
          const deltaBytes = Math.max(0, currentTotalBytes - lastTotal);
          lastTotal = currentTotalBytes;

          // Convert to Mbps for the graph
          let realBandwidth = (deltaBytes * 8) / 1000 / 1000; 
          
          // Simulation layer: If connected but no real traffic, show 'keep-alive' noise
          // If we have real traffic, add slight jitter for realism
          if (realBandwidth === 0) {
             realBandwidth = Math.random() * 0.1; 
          } else {
             realBandwidth += (Math.random() * 0.05);
          }

          setTrafficData(prev => {
             const newData = [...prev, { time: '', value: parseFloat(realBandwidth.toFixed(2)) }];
             // Limit data points based on time window (assuming 1pt/sec)
             return newData.slice(-graphTimeWindow);
          });
          
          // Accumulate session usage
          const addedMB = realBandwidth / 8; // approx
          setSessionUsage(prev => prev + addedMB);
          setTotalUsage(prev => {
              const val = prev + addedMB;
              localStorage.setItem('cs_vpn_total_usage', val.toString());
              return val;
          });
        }
      }, 1000);
    } else {
      setSessionTime(0);
      setTrafficData([]);
      setSessionUsage(0);
    }
    return () => clearInterval(interval);
  }, [status, graphPaused, graphTimeWindow]);

  // Enhanced Speed Test
  const runSpeedTest = async () => {
    if (speedTest.status !== 'idle' && speedTest.status !== 'completed') return;

    setSpeedTest({ ...speedTest, status: 'ping', progress: 0, download: 0, upload: 0, ping: 0 });
    
    const runPing = async () => {
       const start = performance.now();
       await fetch("https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png?t=" + Date.now(), { method: 'HEAD', cache: 'no-store' });
       return performance.now() - start;
    };

    const runDownload = async () => {
       const start = Date.now();
       // 5MB Test File
       const response = await fetch("https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River_%285mb%29.jpg?t=" + Date.now(), { cache: 'no-store' });
       const blob = await response.blob();
       const duration = (Date.now() - start) / 1000;
       const speed = (blob.size * 8) / duration / 1000 / 1000; // Mbps
       return speed;
    };

    // Note: True upload test requires a backend. Simulating upload based on download speed for frontend demo.
    // Usually residential upload is 10-50% of download, or symmetrical on fiber. We'll use a conservative ratio.
    const runUploadSim = async (dlSpeed: number) => {
       await new Promise(r => setTimeout(r, 1500)); // Simulate time
       const ratio = 0.3 + (Math.random() * 0.4); 
       return dlSpeed * ratio;
    };

    try {
        // 1. Ping Phase
        addConsoleLog("Speed Test: Measuring latency...", "info");
        const ping = await runPing();
        setSpeedTest(prev => ({ ...prev, ping: parseFloat(ping.toFixed(0)), progress: 20 }));

        let dl = 0;
        let ul = 0;

        // 2. Download Phase
        if (speedTestMode === 'download' || speedTestMode === 'full') {
           setSpeedTest(prev => ({ ...prev, status: 'download', progress: 30 }));
           addConsoleLog("Speed Test: Measuring download...", "info");
           dl = await runDownload();
           setSpeedTest(prev => ({ ...prev, download: parseFloat(dl.toFixed(2)), progress: speedTestMode === 'full' ? 60 : 100 }));
        }

        // 3. Upload Phase
        if (speedTestMode === 'upload' || speedTestMode === 'full') {
           setSpeedTest(prev => ({ ...prev, status: 'upload', progress: speedTestMode === 'full' ? 70 : 30 }));
           addConsoleLog("Speed Test: Measuring upload...", "info");
           // If we didn't run DL, simulate a base speed
           const baseSpeed = dl > 0 ? dl : 50; 
           ul = await runUploadSim(baseSpeed);
           setSpeedTest(prev => ({ ...prev, upload: parseFloat(ul.toFixed(2)), progress: 100 }));
        }

        setSpeedTest(prev => ({ ...prev, status: 'completed' }));
        addConsoleLog(`Speed Test Complete: D:${dl.toFixed(1)} U:${ul.toFixed(1)} P:${ping.toFixed(0)}`, "success");

        // Save History
        const newHistoryItem: SpeedTestHistoryItem = {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            download: parseFloat(dl.toFixed(2)),
            upload: parseFloat(ul.toFixed(2)),
            ping: parseFloat(ping.toFixed(0)),
            server: selectedServer.city
        };
        const updatedHistory = [newHistoryItem, ...speedTestHistory].slice(0, 5); // Keep last 5
        setSpeedTestHistory(updatedHistory);
        localStorage.setItem('cs_vpn_speed_history', JSON.stringify(updatedHistory));

    } catch (e) {
        setSpeedTest(prev => ({ ...prev, status: 'idle', progress: 0 }));
        addConsoleLog("Speed Test Failed: Network Error", "error");
    }
  };

  const clearHistory = () => {
      setSpeedTestHistory([]);
      localStorage.removeItem('cs_vpn_speed_history');
  }

  if (loading) return <SplashScreen onComplete={() => setLoading(false)} />;

  // Render Helpers
  const ringColor = status === ConnectionState.CONNECTED ? 'border-green-500' : 
                    status === ConnectionState.CONNECTING ? 'border-yellow-500' : 
                    'border-slate-300 dark:border-slate-700';
  
  const glowColor = status === ConnectionState.CONNECTED ? 'shadow-[0_0_50px_rgba(34,197,94,0.3)]' : 
                    status === ConnectionState.CONNECTING ? 'shadow-[0_0_30px_rgba(234,179,8,0.2)]' : 
                    'shadow-none';

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#050505] text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR NAVIGATION */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isSidebarOpen} 
        closeMobile={() => setIsSidebarOpen(false)}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        status={status}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:ml-64 relative h-full">
        
        {/* TOP HEADER BAR */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-[#050505]/50 backdrop-blur-md z-40 sticky top-0">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
             >
                <Menu className="w-5 h-5" />
             </button>
             <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize hidden md:block">
                {activeTab.replace('-', ' ')}
             </h2>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
              {/* Network Stats Widget */}
              <div className="flex items-center gap-4 text-right">
                <div className="hidden sm:block">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">IP Address</p>
                  <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                      {status === ConnectionState.CONNECTED ? selectedServer.ip : (geoData?.ip || 'Scanning...')}
                  </p>
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
                <div className="hidden sm:block">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Location</p>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 justify-end">
                      {status === ConnectionState.CONNECTED ? (
                          <><span>{selectedServer.flag}</span> {selectedServer.city}</>
                      ) : (
                          geoData ? geoData.city : 'Locating...'
                      )}
                  </p>
                </div>
              </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          
          <div className="max-w-6xl mx-auto space-y-6">

            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in-up">
                
                {/* LEFT COLUMN: Controls */}
                <div className="xl:col-span-4 space-y-6">
                  
                  <div className="bg-white dark:bg-[#0f111a] border border-slate-300 dark:border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden group shadow-xl flex flex-col items-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 w-full flex flex-col items-center">
                      <button
                        onClick={handleConnect}
                        disabled={status === ConnectionState.CONNECTING}
                        className={`w-40 h-40 md:w-56 md:h-56 rounded-full border-4 ${ringColor} ${glowColor} bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center transition-all duration-700 hover:scale-105 active:scale-95 group-hover:border-opacity-100 border-opacity-50 shadow-2xl`}
                      >
                        <Power className={`w-12 h-12 md:w-20 md:h-20 mb-2 md:mb-4 transition-colors duration-500 ${status === ConnectionState.CONNECTED ? 'text-green-500' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                          {status === ConnectionState.CONNECTED ? 'DISCONNECT' : status === ConnectionState.CONNECTING ? 'INITIATING' : 'TAP TO CONNECT'}
                        </span>
                      </button>

                      <div className="mt-6 md:mt-8 w-full max-w-xs">
                        <div className="flex justify-between items-center mb-2 px-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Session Time</span>
                          <span className="font-mono text-green-600 dark:text-green-400 text-sm">
                            {new Date(sessionTime * 1000).toISOString().substr(11, 8)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full bg-green-500 transition-all duration-1000 ${status === ConnectionState.CONNECTED ? 'w-full animate-pulse' : 'w-0'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#0f111a] border border-slate-300 dark:border-white/5 rounded-2xl p-6 space-y-6 shadow-xl">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-500" /> Multi-Hop Routing
                        </h3>
                        <button 
                          onClick={() => setIsMultiHop(!isMultiHop)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${isMultiHop ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isMultiHop ? 'left-6' : 'left-1'}`}></div>
                        </button>
                      </div>
                      {isMultiHop && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4 text-[10px] text-blue-600 dark:text-blue-300">
                          Routing via <span className="font-bold">{entryNode.city}</span> → <span className="font-bold">{selectedServer.city}</span>.
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-500" /> Protocol
                      </h3>
                      <ProtocolSelector current={protocol} onChange={setProtocol} />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Viz & Stats */}
                <div className="xl:col-span-8 space-y-6">
                  
                  {/* Global Map & Console */}
                  <div className="bg-white dark:bg-[#0f111a] border border-slate-300 dark:border-white/5 rounded-2xl p-4 flex flex-col relative shadow-xl">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-cyan-500" /> 
                          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Global Network Matrix</h2>
                          {geoData && (
                              <span className="text-[10px] bg-cyan-500/10 text-cyan-600 px-2 py-0.5 rounded border border-cyan-500/20 hidden sm:inline-block">
                                  Origin: {geoData.city}, {geoData.country}
                              </span>
                          )}
                      </div>
                      <div className="flex gap-4 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        <span>LAT: {selectedServer.latency}ms</span>
                      </div>
                    </div>
                    <LiveMap 
                      selectedServer={selectedServer} 
                      isConnected={status === ConnectionState.CONNECTED} 
                      isMultiHop={isMultiHop}
                      entryNode={entryNode}
                      nodes={serverNodes}
                    />
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <ConsoleLog logs={consoleLogs} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* ENHANCED BANDWIDTH CHART */}
                    <div className="bg-white dark:bg-[#0f111a] border border-slate-300 dark:border-white/5 rounded-2xl p-6 shadow-xl flex flex-col h-80">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                           <Activity className="w-4 h-4 text-green-500" />
                           <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Traffic</h3>
                        </div>
                        <div className="flex items-center gap-2">
                           {/* Controls */}
                           <button onClick={() => setGraphPaused(!graphPaused)} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-500">
                              {graphPaused ? <Play className="w-3 h-3"/> : <Pause className="w-3 h-3"/>}
                           </button>
                           <select 
                              className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] rounded px-1 py-0.5 text-slate-600 dark:text-slate-300 outline-none"
                              value={graphTimeWindow}
                              onChange={(e) => setGraphTimeWindow(Number(e.target.value))}
                           >
                              <option value="30">30s</option>
                              <option value="60">1m</option>
                              <option value="300">5m</option>
                           </select>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-h-0 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trafficData}>
                            <defs>
                              <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <YAxis 
                                hide={false} 
                                width={30} 
                                tick={{fontSize: 9, fill: '#64748b'}} 
                                axisLine={false} 
                                tickLine={false}
                                domain={[0, 'auto']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#22c55e" 
                                strokeWidth={2} 
                                fill="url(#colorTraffic)" 
                                isAnimationActive={false} 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="mt-2 flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                         <span>Current: {trafficData.length > 0 ? trafficData[trafficData.length-1].value : 0} Mbps</span>
                         <span>Peak: {Math.max(...trafficData.map(d => d.value), 0).toFixed(1)} Mbps</span>
                      </div>
                    </div>

                    {/* ENHANCED SPEED TEST */}
                    <div className="bg-white dark:bg-[#0f111a] border border-slate-300 dark:border-white/5 rounded-2xl p-6 flex flex-col shadow-xl h-80 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-4 z-10">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Gauge className="w-4 h-4 text-yellow-500"/> Speed Check</h3>
                        <div className="flex bg-slate-100 dark:bg-white/5 rounded-lg p-0.5">
                            {['download', 'upload', 'full'].map(m => (
                                <button 
                                    key={m}
                                    onClick={() => setSpeedTestMode(m as any)}
                                    className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md transition-all ${speedTestMode === m ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}
                                >
                                    {m === 'full' ? 'All' : m.slice(0,2)}
                                </button>
                            ))}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-center items-center z-10">
                         {speedTest.status === 'idle' || speedTest.status === 'completed' ? (
                            <div className="text-center w-full">
                                <div className="grid grid-cols-3 gap-2 mb-6 w-full text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Ping</span>
                                        <span className="text-xl font-mono text-slate-700 dark:text-slate-200">{speedTest.ping > 0 ? speedTest.ping : '--'}<span className="text-xs text-slate-400 ml-1">ms</span></span>
                                    </div>
                                    <div className="flex flex-col items-center border-l border-r border-slate-200 dark:border-white/10">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Down</span>
                                        <span className="text-xl font-mono text-green-500">{speedTest.download > 0 ? speedTest.download : '--'}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Up</span>
                                        <span className="text-xl font-mono text-blue-500">{speedTest.upload > 0 ? speedTest.upload : '--'}</span>
                                    </div>
                                </div>
                                
                                {speedTestHistory.length > 0 ? (
                                    <div className="w-full h-24 overflow-y-auto custom-scrollbar border-t border-slate-200 dark:border-white/10 pt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">Recent Tests</span>
                                            <button onClick={clearHistory} className="text-slate-400 hover:text-red-400"><Trash2 className="w-3 h-3"/></button>
                                        </div>
                                        {speedTestHistory.map(h => (
                                            <div key={h.id} className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 py-1 border-b border-slate-100 dark:border-white/5 last:border-0">
                                                <span>{new Date(h.id).toLocaleTimeString()}</span>
                                                <span className="font-mono">{h.download} / {h.upload} Mbps</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-24 flex items-center justify-center text-[10px] text-slate-400 italic">No recent history</div>
                                )}
                            </div>
                         ) : (
                            <div className="w-full flex flex-col items-center">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    {speedTest.status === 'ping' ? 'Pinging...' : 
                                     speedTest.status === 'download' ? 'Downloading...' : 'Uploading...'}
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${speedTest.progress}%` }}></div>
                                </div>
                            </div>
                         )}
                      </div>

                      <button 
                        onClick={runSpeedTest}
                        disabled={speedTest.status !== 'idle' && speedTest.status !== 'completed'}
                        className="w-full py-2 mt-auto bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold transition-all z-10"
                      >
                        {speedTest.status === 'idle' || speedTest.status === 'completed' ? 'START TEST' : 'TESTING...'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* NETWORK OVERVIEW TAB */}
            {activeTab === 'network-overview' && (
                <div className="animate-fade-in-up grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Connection Details */}
                <div className="bg-white dark:bg-[#0f111a] rounded-2xl p-6 border border-slate-300 dark:border-white/5 shadow-xl">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Network className="w-4 h-4 text-blue-500" /> Interface Details
                    </h3>
                    <div className="space-y-4">
                    {[
                        { label: 'Public IP', value: status === ConnectionState.CONNECTED ? selectedServer.ip : geoData?.ip || 'Scanning...' },
                        { label: 'Local IP', value: '192.168.1.105' }, // Mock
                        { label: 'Gateway', value: '192.168.1.1' }, // Mock
                        { label: 'Protocol', value: protocol },
                        { label: 'Encryption', value: 'ChaCha20-Poly1305' },
                        { label: 'Interface', value: linkInfo.type.toUpperCase() }
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                        <span className="text-sm text-slate-500">{item.label}</span>
                        <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{item.value}</span>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Metrics */}
                <div className="bg-white dark:bg-[#0f111a] rounded-2xl p-6 border border-slate-300 dark:border-white/5 shadow-xl">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" /> Quality Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Latency</div>
                        <div className="text-2xl font-mono text-slate-900 dark:text-white">{selectedServer.latency}ms</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Jitter</div>
                        <div className="text-2xl font-mono text-slate-900 dark:text-white">~3ms</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Packet Loss</div>
                        <div className="text-2xl font-mono text-green-500">0%</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">MTU</div>
                        <div className="text-2xl font-mono text-slate-900 dark:text-white">1420</div>
                    </div>
                    </div>
                </div>
                
                {/* Reuse Map for Visual Context */}
                <div className="md:col-span-2 bg-white dark:bg-[#0f111a] rounded-2xl p-1 border border-slate-300 dark:border-white/5 shadow-xl">
                    <LiveMap 
                        selectedServer={selectedServer} 
                        isConnected={status === ConnectionState.CONNECTED} 
                        isMultiHop={isMultiHop}
                        entryNode={entryNode}
                        nodes={serverNodes}
                    />
                </div>
                </div>
            )}
            
            {/* AI ANALYSIS TAB */}
            {activeTab === 'ai-analysis' && (
                <div className="animate-fade-in-up space-y-6">
                <div className="bg-white dark:bg-[#0f111a] rounded-2xl p-6 border border-slate-300 dark:border-white/5 shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                        <Brain className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Neural Network Analysis</h2>
                        <p className="text-sm text-slate-500">Real-time threat detection and route optimization logic.</p>
                    </div>
                    </div>
                    
                    {/* Current Insight Large Card */}
                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-6 mb-6 border border-slate-200 dark:border-white/5">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-500" /> Current AI Assessment
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                        {aiInsight ? aiInsight.message : "System is analyzing network traffic patterns..."}
                    </p>
                    {aiInsight?.details && (
                        <div className="bg-slate-200 dark:bg-black/20 p-3 rounded-lg text-xs font-mono text-slate-500 dark:text-slate-400">
                        {aiInsight.details}
                        </div>
                    )}
                    </div>

                    {/* AI Logs / History */}
                    <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">Decision Log</h3>
                    {consoleLogs.filter(l => l.text.includes("AI") || l.text.includes("Neural")).length > 0 ? (
                        consoleLogs.filter(l => l.text.includes("AI") || l.text.includes("Neural")).map(log => (
                            <div key={log.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-white/5 text-xs">
                                <span className="text-slate-600 dark:text-slate-300">{log.text}</span>
                                <span className="text-slate-400">{log.timestamp}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-4 text-slate-400 text-xs italic">No AI events recorded in this session.</div>
                    )}
                    </div>
                </div>
                </div>
            )}
            
            {/* OPTIMIZATION TAB */}
            {activeTab === 'optimization' && (
                <div className="animate-fade-in-up space-y-6">
                {/* Optimization Modes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                    { id: 'speed', label: 'Low Latency', icon: Zap, desc: 'Optimized for Gaming & VoIP' },
                    { id: 'balanced', label: 'Balanced', icon: Activity, desc: 'Standard browsing & streaming' },
                    { id: 'privacy', label: 'Max Privacy', icon: Shield, desc: 'Multi-hop & Obfuscation' }
                    ].map(mode => (
                    <button 
                        key={mode.id}
                        onClick={() => setOptimizationMode(mode.id)}
                        className={`p-6 rounded-2xl border text-left transition-all ${optimizationMode === mode.id ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500' : 'bg-white dark:bg-[#0f111a] border-slate-300 dark:border-white/5 hover:border-blue-400'}`}
                    >
                        <mode.icon className={`w-6 h-6 mb-3 ${optimizationMode === mode.id ? 'text-blue-500' : 'text-slate-400'}`} />
                        <div className="font-bold text-slate-900 dark:text-white">{mode.label}</div>
                        <div className="text-xs text-slate-500 mt-1">{mode.desc}</div>
                    </button>
                    ))}
                </div>

                {/* Optimizer Action */}
                <div className="bg-white dark:bg-[#0f111a] rounded-2xl p-8 border border-slate-300 dark:border-white/5 text-center shadow-xl">
                    <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 relative">
                        {isOptimizing && <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>}
                        <Zap className={`w-10 h-10 ${isOptimizing ? 'text-blue-500' : 'text-slate-400'}`} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Network Tuner</h2>
                    <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                    Running the optimizer will re-route your connection through the most efficient nodes based on your selected mode ({optimizationMode}).
                    </p>
                    <button 
                    onClick={() => handleOptimize()}
                    disabled={isOptimizing}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {isOptimizing ? 'OPTIMIZING ROUTE...' : 'RUN OPTIMIZER'}
                    </button>
                </div>
                </div>
            )}

            {/* SERVERS TAB */}
            {activeTab === 'servers' && (
              <div className="animate-fade-in-up space-y-6">
                <div className="flex items-center gap-4 bg-white dark:bg-[#0f111a] p-4 rounded-xl border border-slate-300 dark:border-white/5 shadow-xl">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search global nodes by city or country..."
                    className="bg-transparent border-none outline-none text-slate-900 dark:text-white w-full placeholder-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serverNodes.filter(n => n.city.toLowerCase().includes(searchTerm.toLowerCase())).map(node => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedServer(node)}
                      className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group shadow-md hover:shadow-xl ${selectedServer.id === node.id ? 'bg-blue-500/5 border-blue-500' : 'bg-white dark:bg-[#0f111a] border-slate-300 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{node.flag}</span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{node.city}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{node.ip}</div>
                          </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${node.load < 50 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-white/5 h-1 rounded-full overflow-hidden mt-4 relative z-10">
                        <div className="bg-slate-500 h-full" style={{ width: `${node.load}%` }}></div>
                      </div>
                      <div className="flex justify-between mt-1 text-[9px] text-slate-500 font-mono relative z-10">
                        <span>LOAD: {node.load}%</span>
                        <span>PING: {node.latency}ms</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="animate-fade-in-up grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                <div className="bg-white dark:bg-[#0f111a] rounded-3xl p-6 md:p-8 border border-slate-300 dark:border-white/5 shadow-xl">
                      <div className="flex items-center gap-4 mb-8">
                          <div className="p-3 bg-green-500/10 rounded-xl">
                            <Shield className="w-8 h-8 text-green-500" />
                          </div>
                          <div>
                              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Content Filtering</h2>
                              <p className="text-sm text-slate-500 dark:text-slate-400">AI-powered network protection profiles</p>
                          </div>
                      </div>
                      <div className="space-y-4">
                          {[
                              { id: 'standard', name: 'Standard Protection', desc: 'Blocks malware, phishing, and known threats.', icon: Shield },
                              { id: 'family', name: 'Family Safe', desc: 'Blocks adult content, gambling, and violent sites.', icon: Lock },
                              { id: 'strict', name: 'Strict Mode', desc: 'Blocks all distractions, social media, and games.', icon: AlertTriangle }
                      ].map((mode) => (
                              <button
                                key={mode.id}
                                onClick={() => setSafetyMode(mode.id as any)}
                                className={`w-full p-5 rounded-2xl border text-left flex items-start gap-4 transition-all duration-300 ${
                                    safetyMode === mode.id 
                                    ? 'bg-blue-500/5 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                                    : 'bg-slate-50 dark:bg-white/5 border-slate-300 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                                }`}
                              >
                                  <div className={`p-2.5 rounded-xl transition-colors ${safetyMode === mode.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
                                      <mode.icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-grow">
                                      <h3 className={`font-bold ${safetyMode === mode.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{mode.name}</h3>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{mode.desc}</p>
                                  </div>
                                  {safetyMode === mode.id && <Check className="w-6 h-6 text-blue-500 ml-auto" />}
                              </button>
                          ))}
                      </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#0f111a] rounded-3xl p-6 md:p-8 border border-slate-300 dark:border-white/5 shadow-xl">
                          <h3 className="font-bold text-slate-900 dark:text-white mb-6 text-lg">Advanced Filters</h3>
                          <div className="space-y-4">
                              {Object.keys(activeFilters).map((filter, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#0a0a0a] border border-slate-300 dark:border-white/5">
                                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{filter}</span>
                                      <button 
                                          onClick={() => toggleFilter(filter)}
                                          className={`w-12 h-7 rounded-full relative cursor-pointer transition-all duration-300 ${activeFilters[filter] ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                      >
                                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${activeFilters[filter] ? 'left-6' : 'left-1'}`}></div>
                                      </button>
                                  </div>
                              ))}
                          </div>
                    </div>
                    <div className="bg-white dark:bg-[#0f111a] rounded-3xl p-6 md:p-8 border border-slate-300 dark:border-white/5 shadow-xl">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">DNS Configuration</h3>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0a0a0a] rounded-xl border border-slate-300 dark:border-white/5 mb-4">
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">Encrypted DNS (DoH)</p>
                                <p className="text-xs text-slate-500 mt-1">Prevents ISP snooping</p>
                            </div>
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">ACTIVE</span>
                        </div>
                    </div>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="animate-fade-in-up max-w-2xl mx-auto pb-8">
                <div className="bg-white dark:bg-[#0f111a] rounded-3xl p-8 md:p-10 border border-slate-300 dark:border-white/5 text-center shadow-xl">
                    <Settings className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Application Settings</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-10">Configure protocols, account details, and advanced routing options.</p>
                    <div className="grid gap-4 text-left">
                        <div className="p-6 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-300 dark:border-white/5 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Auto Reconnect</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Restore connection on drop</p>
                            </div>
                            <button onClick={() => setAutoReconnect(!autoReconnect)} className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${autoReconnect ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${autoReconnect ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-300 dark:border-white/5 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Kill Switch</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Block internet access if VPN drops.</p>
                            </div>
                            <button onClick={() => setKillSwitch(!killSwitch)} className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${killSwitch ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${killSwitch ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-300 dark:border-white/5 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Data Usage</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total lifetime usage: <span className="text-blue-500 font-mono">{totalUsage > 1024 ? `${(totalUsage/1024).toFixed(2)} GB` : `${totalUsage.toFixed(1)} MB`}</span></p>
                            </div>
                            <div className="h-2 w-24 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-3/4"></div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            )}

          </div>
        </main>
        
        {/* Floating AI Insight Card */}
        {aiInsight && (
            <AiInsightCard insight={aiInsight} onDismiss={() => setAiInsight(null)} />
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }
        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }
        .animate-dash {
          animation: dash 5s linear infinite;
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}