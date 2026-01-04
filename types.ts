export interface ServerNode {
  id: string;
  country: string;
  city: string;
  region: 'Americas' | 'Europe' | 'Asia' | 'Africa';
  latency: number; // in ms
  load: number; // percentage 0-100
  score: number; // AI calculated score
  flag: string;
  ip: string; // Virtual IP
  latencyHistory: number[]; // Historical latency data for sparklines
}

export type SortOption = 'latency' | 'load' | 'score';

export interface SecurityLog {
  id: string;
  timestamp: Date;
  domain: string;
  category: 'Malware' | 'Adult' | 'Phishing' | 'Tracker' | 'Safe';
  action: 'Blocked' | 'Allowed' | 'Flagged';
  riskScore: number;
}

export interface VpnStats {
  dataUsage: number; // in MB
  duration: number; // in seconds
  threatsBlocked: number;
  encryptionStatus: 'Active' | 'Inactive';
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTING = 'DISCONNECTING',
  RECONNECTING = 'RECONNECTING'
}

export interface AiInsight {
  id?: string;
  type: 'optimization' | 'security' | 'prediction';
  message: string;
  confidence: number;
  timestamp: string;
  details?: string;
}

export interface SpeedTestResult {
  download: number; // Mbps
  upload: number; // Mbps
  ping: number; // ms
  status: 'idle' | 'ping' | 'download' | 'upload' | 'completed';
  progress: number; // 0-100
}

export interface SpeedTestHistoryItem {
  id: number;
  timestamp: string;
  download: number;
  upload: number;
  ping: number;
  server: string;
}