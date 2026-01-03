import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Shield, 
  Globe, 
  Activity, 
  Settings, 
  Power, 
  Zap,
  Lock,
  Wifi,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Search,
  Server,
  Gauge,
  Database,
  TrendingUp,
  Sun,
  Moon,
  Check,
  Signal,
  Download,
  Upload,
  Cpu,
  EyeOff,
  Terminal,
  Layers,
  Share2,
  Minimize2,
  X,
  FileText,
  User,
  Menu,
  Home
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  XAxis
} from 'recharts';
import { ConnectionState, ServerNode, SecurityLog, AiInsight, SortOption, SpeedTestResult } from './types';
import { SERVER_NODES, MOCK_LOGS } from './constants';
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

const GEO_MAP: Record<string, GeoCords> = {
  'New York': { x: 28, y: 35 },
  'Los Angeles': { x: 18, y: 38 },
  'London': { x: 48, y: 25 },
  'Frankfurt': { x: 52, y: 27 },
  'Singapore': { x: 78, y: 55 },
  'Tokyo': { x: 88, y: 38 },
  'Johannesburg': { x: 55, y: 75 },
  'São Paulo': { x: 35, y: 70 },
  'User': { x: 25, y: 38 } 
};

// --- Components ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [loadingStep, setLoadingStep] = useState(0);
  const steps = [
    "Initializing Core Systems...",
    "Loading Neural Weights...",
    "Verifying Integrity...",
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
       <p className="text-xs md:text-sm text-blue-400/60 tracking-[0.5em] uppercase font-mono mb-12">Next Gen Privacy</p>

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
    <div className="bg-slate-900 dark:bg-[#0a0a0a] border border-slate-700 dark:border-white/10 rounded-xl p-4 font-mono text-[10px] md:text-xs h-48 overflow-y-auto custom-scrollbar shadow-inner shadow-black/50">
      <div className="flex items-center gap-2 mb-2 text-slate-400 border-b border-slate-700 dark:border-white/5 pb-2">
        <Terminal className="w-3 h-3" />
        <span className="uppercase tracking-widest font-bold">System Kernel Log</span>
      </div>
      <div className="space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-fade-in">
            <span className="text-slate-500 dark:text-slate-600">[{log.timestamp}]</span>
            <span className={`${
              log.type === 'success' ? 'text-green-500 dark:text-green-400' :
              log.type === 'warning' ? 'text-yellow-500 dark:text-yellow-400' :
              log.type === 'error' ? 'text-red-500 dark:text-red-400' :
              'text-blue-500 dark:text-blue-300'
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
  entryNode 
}: { 
  selectedServer: ServerNode, 
  isConnected: boolean, 
  isMultiHop: boolean, 
  entryNode: ServerNode 
}) => {
  const userPos = GEO_MAP['User'];
  const targetPos = GEO_MAP[selectedServer.city] || { x: 50, y: 50 };
  const entryPos = isMultiHop ? (GEO_MAP[entryNode.city] || { x: 50, y: 50 }) : userPos;

  const calculatePath = (start: GeoCords, end: GeoCords) => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2 - 20; 
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  return (
    <div className="relative w-full aspect-[2/1] bg-slate-100 dark:bg-[#0f111a] rounded-xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner dark:shadow-black/20 group transition-colors">
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
      {SERVER_NODES.map(node => {
        const pos = GEO_MAP[node.city] || { x: 50, y: 50 };
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
            : 'bg-white dark:bg-[#0f111a] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
          }`}
        >
          {current === p.id && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>}
          <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">{p.name}</div>
          <div className="flex gap-2 text-[9px] font-mono uppercase text-slate-400 mb-2">
            <span className="bg-slate-100 dark:bg-white/5 px-1 rounded">{p.type}</span>
            <span className={`${p.speed === 'Ultra' ? 'text-green-500 dark:text-green-400' : 'text-blue-500 dark:text-blue-400'}`}>{p.speed}</span>
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">{p.desc}</div>
        </button>
      ))}
    </div>
  )
};

// --- Main App ---

export default function App() {
  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [selectedServer, setSelectedServer] = useState<ServerNode>(SERVER_NODES[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settings & Features
  const [isMultiHop, setIsMultiHop] = useState(false);
  const [entryNode, setEntryNode] = useState<ServerNode>(SERVER_NODES[1]);
  const [protocol, setProtocol] = useState('WireGuard');
  const [killSwitch, setKillSwitch] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [safetyMode, setSafetyMode] = useState<'standard' | 'family' | 'strict'>('standard');
  const [autoReconnect, setAutoReconnect] = useState(true);
  
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
  
  // Real Network Data
  const [linkInfo, setLinkInfo] = useState<{ type: string, downlink: number, rtt: number }>({ type: 'Unknown', downlink: 0, rtt: 0 });
  const [originalIp, setOriginalIp] = useState<string>("Scanning...");
  const [speedTest, setSpeedTest] = useState<SpeedTestResult>({ download: 0, upload: 0, ping: 0, status: 'idle' });
  const [sessionUsage, setSessionUsage] = useState(0);
  const [totalUsage, setTotalUsage] = useState(0);

  // Theme Sync
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Network Listeners
  useEffect(() => {
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
      return () => {
          if ('connection' in navigator) {
              ((navigator as any).connection as NetworkInformation).removeEventListener('change', updateNetworkInfo);
          }
      };
  }, []);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setOriginalIp(data.ip))
      .catch(() => setOriginalIp("Unknown"));
    
     const savedUsage = localStorage.getItem('cs_vpn_total_usage');
     if(savedUsage) setTotalUsage(parseFloat(savedUsage));
  }, []);

  // Connection Logic
  const addConsoleLog = (text: string, type: LogLine['type'] = 'info') => {
    setConsoleLogs(prev => [...prev, { id: Date.now(), text, type, timestamp: new Date().toLocaleTimeString().split(' ')[0] }]);
  };

  const connectSequence = async () => {
    setConsoleLogs([]);
    setStatus(ConnectionState.CONNECTING);
    const steps = [
      { msg: `Initializing ${protocol} Interface...`, type: 'info', delay: 200 },
      { msg: "Resolving host endpoints...", type: 'info', delay: 600 },
      { msg: `Generating Session Keys (Curve25519)...`, type: 'info', delay: 1200 },
      { msg: "Handshake: Initiating...", type: 'warning', delay: 1800 },
      { msg: `Peer Authorized: ${selectedServer.ip}`, type: 'success', delay: 2400 },
    ];
    if (isMultiHop) {
      steps.push({ msg: `Routing via Entry Node: ${entryNode.city}`, type: 'info', delay: 2800 });
      steps.push({ msg: "Establishing secondary tunnel...", type: 'warning', delay: 3200 });
    }
    steps.push({ msg: "Assigning Virtual IP...", type: 'info', delay: isMultiHop ? 3600 : 2800 });
    steps.push({ msg: "Tunnel Established. Encryption: AES-256-GCM", type: 'success', delay: isMultiHop ? 4000 : 3200 });
    for (const step of steps) setTimeout(() => addConsoleLog(step.msg, step.type as any), step.delay);
    setTimeout(() => setStatus(ConnectionState.CONNECTED), isMultiHop ? 4200 : 3500);
  };

  const handleConnect = () => {
    if (status === ConnectionState.DISCONNECTED) {
      connectSequence();
      getNetworkOptimization(SERVER_NODES, "User Location", "reactive").then(setAiInsight);
    } else {
      setStatus(ConnectionState.DISCONNECTING);
      addConsoleLog("Termination signal received...", "warning");
      setTimeout(() => {
        addConsoleLog("Tunnel closed. Statistics flushed.", "info");
        setStatus(ConnectionState.DISCONNECTED);
      }, 1000);
    }
  };

  // Traffic Sim
  useEffect(() => {
    let interval: any;
    if (status === ConnectionState.CONNECTED) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
        const baseSpeed = linkInfo.downlink > 0 ? linkInfo.downlink : 25;
        const volatility = Math.random() * 0.3;
        const currentUsage = Math.max(0.1, baseSpeed * (0.2 + volatility));
        setTrafficData(prev => [...prev, { time: '', value: parseFloat(currentUsage.toFixed(1)) }].slice(-40));
        const added = (currentUsage / 8 / 2);
        setSessionUsage(prev => prev + added);
        setTotalUsage(prev => {
            const val = prev + added;
            localStorage.setItem('cs_vpn_total_usage', val.toString());
            return val;
        });
      }, 1000);
    } else {
      setSessionTime(0);
      setTrafficData([]);
      setSessionUsage(0);
    }
    return () => clearInterval(interval);
  }, [status, linkInfo]);

  // Speed Test
  const runRealSpeedTest = async () => {
    setSpeedTest(prev => ({ ...prev, status: 'running', download: 0, ping: 0 }));
    addConsoleLog("Speed Test: Initiating download probe...", "info");
    const imageAddr = "https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River_%285mb%29.jpg"; 
    const downloadSize = 5245329; 
    const startTime = (new Date()).getTime();
    const cacheBuster = "?nnn=" + startTime;
    try {
        const pingStart = performance.now();
        await fetch(imageAddr + cacheBuster, { method: 'HEAD', cache: 'no-store' });
        const pingEnd = performance.now();
        const pingTime = pingEnd - pingStart;
        setSpeedTest(prev => ({ ...prev, ping: pingTime }));
        addConsoleLog(`Latency Probe: ${pingTime.toFixed(1)}ms`, "success");
        const downloadStart = (new Date()).getTime();
        await fetch(imageAddr + cacheBuster, { cache: 'no-store' });
        const downloadEnd = (new Date()).getTime();
        const duration = (downloadEnd - downloadStart) / 1000;
        const bitsLoaded = downloadSize * 8;
        const speedMbps = bitsLoaded / duration / 1024 / 1024;
        setSpeedTest(prev => ({ ...prev, download: speedMbps, status: 'completed' }));
        addConsoleLog(`Speed Test Complete: ${speedMbps.toFixed(2)} Mbps`, "success");
    } catch (error) {
        setSpeedTest(prev => ({ ...prev, status: 'idle' }));
        addConsoleLog("Speed Test Failed: Network Error", "error");
    }
  };

  const checkDomain = async () => {
     const domain = prompt("Enter domain to check:");
     if(!domain) return;
     const result = await classifyDomainThreat(domain);
     alert(`AI Analysis for ${domain}:\nCategory: ${result.category}\nRisk Score: ${result.risk}`);
  };

  if (loading) return <SplashScreen onComplete={() => setLoading(false)} />;

  // Render Helpers
  const ringColor = status === ConnectionState.CONNECTED ? 'border-green-500' : 
                    status === ConnectionState.CONNECTING ? 'border-yellow-500' : 
                    'border-slate-300 dark:border-slate-700';
  
  const glowColor = status === ConnectionState.CONNECTED ? 'shadow-[0_0_50px_rgba(34,197,94,0.3)]' : 
                    status === ConnectionState.CONNECTING ? 'shadow-[0_0_30px_rgba(234,179,8,0.2)]' : 
                    'shadow-none';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden transition-colors duration-300">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-4 md:px-6 py-4 flex justify-between items-center transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg md:text-xl tracking-tight text-slate-900 dark:text-white">CS VPN <span className="text-blue-500">PRO</span></h1>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${status === ConnectionState.CONNECTED ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">{status === ConnectionState.CONNECTED ? 'SECURE' : 'IDLE'}</span>
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex bg-slate-100 dark:bg-[#12141c] p-1 rounded-xl border border-slate-200 dark:border-white/5">
          {['dashboard', 'servers', 'security', 'settings'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-right hidden lg:block">
            <p className="text-[9px] text-slate-500 uppercase font-bold">Public IP</p>
            <p className="font-mono text-xs text-slate-700 dark:text-slate-300">{status === ConnectionState.CONNECTED ? selectedServer.ip : originalIp}</p>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-slate-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-24 pb-32 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto space-y-6">

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
            
            {/* LEFT COLUMN: Controls */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden group shadow-lg flex flex-col items-center">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
                <div className="relative z-10 w-full flex flex-col items-center">
                  <button
                    onClick={handleConnect}
                    disabled={status === ConnectionState.CONNECTING}
                    className={`w-40 h-40 md:w-56 md:h-56 rounded-full border-4 ${ringColor} ${glowColor} bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center transition-all duration-700 hover:scale-105 active:scale-95 group-hover:border-opacity-100 border-opacity-50 shadow-2xl`}
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

              <div className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-6 shadow-lg">
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
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto">
                <div className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col relative md:col-span-2 shadow-lg">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-500" /> Global Traffic Map
                    </h2>
                    <div className="flex gap-4 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span>LAT: {selectedServer.latency}ms</span>
                    </div>
                  </div>
                  <LiveMap 
                    selectedServer={selectedServer} 
                    isConnected={status === ConnectionState.CONNECTED} 
                    isMultiHop={isMultiHop}
                    entryNode={entryNode}
                  />
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                     <ConsoleLog logs={consoleLogs} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500" /> Real-time Bandwidth
                    </h3>
                    <span className="text-xs font-mono text-green-600 dark:text-green-400 animate-pulse">
                      {trafficData.length > 0 ? trafficData[trafficData.length-1].value : 0} Mbps
                    </span>
                  </div>
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trafficData}>
                        <defs>
                          <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#colorTraffic)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-lg">
                  <div className="relative z-10">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Gauge className="w-4 h-4 text-yellow-500"/> Speed Check</h3>
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white">
                        {speedTest.download > 0 ? speedTest.download.toFixed(0) : '--'}
                      </span>
                      <span className="text-xs text-slate-500 mb-2">Mbps</span>
                    </div>
                    <button 
                      onClick={runRealSpeedTest}
                      disabled={speedTest.status === 'running'}
                      className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold transition-all"
                    >
                      {speedTest.status === 'running' ? 'TESTING...' : 'RUN TEST'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SERVERS TAB */}
        {activeTab === 'servers' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="flex items-center gap-4 bg-white dark:bg-[#0f111a] p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-lg">
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
              {SERVER_NODES.filter(n => n.city.toLowerCase().includes(searchTerm.toLowerCase())).map(node => (
                <button
                  key={node.id}
                  onClick={() => setSelectedServer(node)}
                  className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group shadow-md hover:shadow-lg ${selectedServer.id === node.id ? 'bg-blue-500/5 border-blue-500' : 'bg-white dark:bg-[#0f111a] border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5'}`}
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
             <div className="bg-white dark:bg-[#0f111a] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-white/5 shadow-xl">
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
                                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
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
                 <div className="bg-white dark:bg-[#0f111a] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-white/5 shadow-xl">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-6 text-lg">Advanced Filters</h3>
                      <div className="space-y-4">
                          {Object.keys(activeFilters).map((filter, i) => (
                              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5">
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
                 <div className="bg-white dark:bg-[#0f111a] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-white/5 shadow-xl">
                     <h3 className="font-bold text-slate-900 dark:text-white mb-4">DNS Configuration</h3>
                     <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-white/5 mb-4">
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
             <div className="bg-white dark:bg-[#0f111a] rounded-3xl p-8 md:p-10 border border-slate-200 dark:border-white/5 text-center shadow-xl">
                 <Settings className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-6" />
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Application Settings</h2>
                 <p className="text-slate-500 dark:text-slate-400 mb-10">Configure protocols, account details, and advanced routing options.</p>
                 <div className="grid gap-4 text-left">
                     <div className="p-6 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-white/5 flex justify-between items-center">
                         <div>
                             <h4 className="font-bold text-slate-900 dark:text-white">Auto Reconnect</h4>
                             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Restore connection on drop</p>
                         </div>
                         <button onClick={() => setAutoReconnect(!autoReconnect)} className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${autoReconnect ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                             <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${autoReconnect ? 'left-7' : 'left-1'}`}></div>
                         </button>
                     </div>
                     <div className="p-6 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-white/5 flex justify-between items-center">
                         <div>
                             <h4 className="font-bold text-slate-900 dark:text-white">Kill Switch</h4>
                             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Block internet access if VPN drops.</p>
                         </div>
                         <button onClick={() => setKillSwitch(!killSwitch)} className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${killSwitch ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                             <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${killSwitch ? 'left-7' : 'left-1'}`}></div>
                         </button>
                     </div>
                     <div className="p-6 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-white/5 flex justify-between items-center">
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

        {/* AI INSIGHT BAR (Persistent) - Adjusted Position for Mobile */}
        <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 p-2 md:p-3 z-40 transition-all duration-300">
           <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-purple-500/20 p-1.5 rounded-lg">
                    <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                 </div>
                 <div className="hidden md:block">
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">Neural Engine</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-lg">
                      {aiInsight ? aiInsight.message : "Monitoring global routing tables for latency anomalies..."}
                    </p>
                 </div>
                 <div className="md:hidden text-xs text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                    {aiInsight ? aiInsight.message : "AI Optimization Active"}
                 </div>
              </div>
              <button 
                className="text-[10px] font-bold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 px-3 py-1.5 rounded border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white transition-colors"
                onClick={() => getNetworkOptimization(SERVER_NODES, "User", "reactive").then(setAiInsight)}
              >
                OPTIMIZE
              </button>
           </div>
        </div>

      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-white dark:bg-[#0f111a] border-t border-slate-200 dark:border-white/5 flex justify-around items-center z-50 pb-safe">
        {[
          { id: 'dashboard', icon: Home, label: 'Home' },
          { id: 'servers', icon: Globe, label: 'Servers' },
          { id: 'security', icon: Shield, label: 'Security' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map((item) => (
           <button
             key={item.id}
             onClick={() => setActiveTab(item.id)}
             className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${
               activeTab === item.id 
               ? 'text-blue-600 dark:text-blue-400' 
               : 'text-slate-400 dark:text-slate-600'
             }`}
           >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'fill-current opacity-20' : ''}`} />
              <span className="text-[10px] font-bold">{item.label}</span>
           </button>
        ))}
      </nav>

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
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        /* Safe area padding for iPhone X+ */
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
}