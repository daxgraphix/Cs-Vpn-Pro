import { ServerNode } from './types';

// Helper to generate random historical data
const generateHistory = (base: number, variance: number) => 
  Array.from({ length: 10 }, () => Math.max(10, Math.floor(base + (Math.random() * variance * 2 - variance))));

export const SERVER_NODES: ServerNode[] = [
  { id: 'us-east-1', country: 'United States', city: 'New York', region: 'Americas', latency: 24, load: 45, score: 92, flag: '🇺🇸', ip: '104.22.14.89', latencyHistory: generateHistory(24, 5) },
  { id: 'us-west-1', country: 'United States', city: 'Los Angeles', region: 'Americas', latency: 68, load: 30, score: 85, flag: '🇺🇸', ip: '198.51.100.23', latencyHistory: generateHistory(68, 10) },
  { id: 'uk-lon-1', country: 'United Kingdom', city: 'London', region: 'Europe', latency: 95, load: 60, score: 78, flag: '🇬🇧', ip: '185.24.11.4', latencyHistory: generateHistory(95, 15) },
  { id: 'de-fra-1', country: 'Germany', city: 'Frankfurt', region: 'Europe', latency: 102, load: 40, score: 80, flag: '🇩🇪', ip: '159.69.12.99', latencyHistory: generateHistory(102, 12) },
  { id: 'sg-sin-1', country: 'Singapore', city: 'Singapore', region: 'Asia', latency: 180, load: 25, score: 70, flag: '🇸🇬', ip: '139.162.22.1', latencyHistory: generateHistory(180, 20) },
  { id: 'jp-tok-1', country: 'Japan', city: 'Tokyo', region: 'Asia', latency: 165, load: 55, score: 72, flag: '🇯🇵', ip: '172.104.99.201', latencyHistory: generateHistory(165, 18) },
  { id: 'za-jnb-1', country: 'South Africa', city: 'Johannesburg', region: 'Africa', latency: 210, load: 20, score: 65, flag: '🇿🇦', ip: '102.130.11.5', latencyHistory: generateHistory(210, 25) },
  { id: 'br-sao-1', country: 'Brazil', city: 'São Paulo', region: 'Americas', latency: 120, load: 35, score: 76, flag: '🇧🇷', ip: '177.12.44.8', latencyHistory: generateHistory(120, 15) },
];

export const MOCK_LOGS = [
  { id: '1', timestamp: new Date(), domain: 'analytics.google.com', category: 'Tracker', action: 'Allowed', riskScore: 10 },
  { id: '2', timestamp: new Date(Date.now() - 5000), domain: 'malicious-site.xyz', category: 'Malware', action: 'Blocked', riskScore: 95 },
  { id: '3', timestamp: new Date(Date.now() - 15000), domain: 'adult-content-cdn.net', category: 'Adult', action: 'Blocked', riskScore: 88 },
  { id: '4', timestamp: new Date(Date.now() - 25000), domain: 'facebook.com', category: 'Safe', action: 'Allowed', riskScore: 5 },
] as const;