/**
 * Mock data for PSIEM Dashboard
 * This data simulates real-time security monitoring information
 */

import { 
  Threat, 
  PasswordEntry, 
  IntrusionAlert, 
  EventLog, 
  SystemHealthMetric,
  ChartDataPoint,
  AnomalyDetection
} from '@/types';

// Helper function to generate random date within last N hours
const getRandomDate = (hoursAgo: number): Date => {
  const now = new Date();
  const randomHours = Math.random() * hoursAgo;
  return new Date(now.getTime() - randomHours * 60 * 60 * 1000);
};

// Mock Threats for Dashboard
export const mockThreats: Threat[] = [
  {
    id: '1',
    timestamp: getRandomDate(2),
    severity: 'critical',
    type: 'SQL Injection',
    source: '192.168.1.105',
    status: 'active',
    description: 'Attempted SQL injection on login form'
  },
  {
    id: '2',
    timestamp: getRandomDate(4),
    severity: 'high',
    type: 'Brute Force Attack',
    source: '10.0.0.45',
    status: 'investigating',
    description: 'Multiple failed login attempts detected'
  },
  {
    id: '3',
    timestamp: getRandomDate(6),
    severity: 'medium',
    type: 'Port Scan',
    source: '172.16.0.88',
    status: 'resolved',
    description: 'Unauthorized port scanning activity'
  },
  {
    id: '4',
    timestamp: getRandomDate(8),
    severity: 'high',
    type: 'Malware Detection',
    source: '192.168.1.77',
    status: 'active',
    description: 'Suspicious file execution detected'
  },
  {
    id: '5',
    timestamp: getRandomDate(10),
    severity: 'low',
    type: 'Unauthorized Access',
    source: '10.10.10.10',
    status: 'resolved',
    description: 'Access attempt from unknown device'
  }
];

// Chart data for threat timeline
export const mockThreatTimeline: ChartDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  threats: Math.floor(Math.random() * 15) + 5,
  blocked: Math.floor(Math.random() * 12) + 3
}));

// Chart data for attack types
export const mockAttackTypes = [
  { name: 'SQL Injection', value: 35, fill: 'hsl(var(--destructive))' },
  { name: 'XSS', value: 25, fill: 'hsl(var(--warning))' },
  { name: 'Brute Force', value: 20, fill: 'hsl(var(--primary))' },
  { name: 'DDoS', value: 15, fill: 'hsl(var(--info))' },
  { name: 'Malware', value: 5, fill: 'hsl(var(--success))' }
];

// System status data
export const mockSystemStatus: ChartDataPoint[] = [
  { system: 'Web Server', status: 95 },
  { system: 'Database', status: 88 },
  { system: 'API Gateway', status: 92 },
  { system: 'File Server', status: 85 },
  { system: 'Mail Server', status: 90 }
];

// Network activity data
export const mockNetworkActivity: ChartDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  incoming: Math.floor(Math.random() * 100) + 50,
  outgoing: Math.floor(Math.random() * 80) + 30
}));

// Password Manager Entries
export const mockPasswords: PasswordEntry[] = [
  {
    id: '1',
    name: 'GitHub',
    username: 'admin@company.com',
    password: 'SecurePass123!@#',
    url: 'https://github.com',
    category: 'Development',
    lastModified: new Date('2024-01-15'),
    tags: ['work', 'development']
  },
  {
    id: '2',
    name: 'AWS Console',
    username: 'cloud-admin',
    password: 'Aws#Cloud$2024',
    url: 'https://aws.amazon.com',
    category: 'Cloud Services',
    lastModified: new Date('2024-02-01'),
    tags: ['work', 'cloud', 'critical']
  },
  {
    id: '3',
    name: 'Database Admin',
    username: 'db_admin',
    password: 'DB@Admin#Pass456',
    category: 'Database',
    lastModified: new Date('2024-01-20'),
    tags: ['work', 'database']
  },
  {
    id: '4',
    name: 'Email',
    username: 'security@company.com',
    password: 'Email!Secure789',
    url: 'https://mail.company.com',
    category: 'Email',
    lastModified: new Date('2024-02-10'),
    tags: ['work', 'email']
  },
  {
    id: '5',
    name: 'VPN Access',
    username: 'vpn_user',
    password: 'VPN#Secure$Pass',
    category: 'Network',
    lastModified: new Date('2024-01-25'),
    tags: ['work', 'vpn', 'critical']
  }
];

// Intrusion Detection Alerts
export const mockIntrusionAlerts: IntrusionAlert[] = [
  {
    id: '1',
    timestamp: getRandomDate(1),
    signatureName: 'SQL Injection Attempt - Authentication Bypass',
    sourceIp: '203.0.113.45',
    destinationIp: '192.168.1.100',
    severity: 'critical',
    matchedRule: 'ET WEB_SPECIFIC_APPS SQL Injection Attempt',
    blocked: true
  },
  {
    id: '2',
    timestamp: getRandomDate(2),
    signatureName: 'Brute Force SSH Login Attempt',
    sourceIp: '198.51.100.88',
    destinationIp: '192.168.1.50',
    severity: 'high',
    matchedRule: 'ET SCAN Potential SSH Brute Force',
    blocked: true
  },
  {
    id: '3',
    timestamp: getRandomDate(3),
    signatureName: 'Suspicious PowerShell Command Execution',
    sourceIp: '192.168.1.105',
    severity: 'high',
    matchedRule: 'ET MALWARE Suspicious PowerShell Activity',
    blocked: false
  },
  {
    id: '4',
    timestamp: getRandomDate(4),
    signatureName: 'Cross-Site Scripting (XSS) Attempt',
    sourceIp: '185.220.100.244',
    destinationIp: '192.168.1.100',
    severity: 'medium',
    matchedRule: 'ET WEB_SPECIFIC_APPS XSS Attack Detected',
    blocked: true
  },
  {
    id: '5',
    timestamp: getRandomDate(5),
    signatureName: 'Port Scan Detected',
    sourceIp: '172.16.0.77',
    severity: 'medium',
    matchedRule: 'ET SCAN Aggressive Port Scan',
    blocked: false
  }
];

// Anomaly Detection Data
export const mockAnomalies: AnomalyDetection[] = [
  {
    id: '1',
    timestamp: getRandomDate(2),
    anomalyType: 'Unusual Traffic Pattern',
    confidenceScore: 0.87,
    affectedSystem: 'Web Server',
    description: 'Traffic volume 3x higher than normal baseline'
  },
  {
    id: '2',
    timestamp: getRandomDate(5),
    anomalyType: 'Abnormal User Behavior',
    confidenceScore: 0.92,
    affectedSystem: 'User Authentication',
    description: 'User accessing resources outside normal hours'
  },
  {
    id: '3',
    timestamp: getRandomDate(7),
    anomalyType: 'Data Exfiltration Pattern',
    confidenceScore: 0.78,
    affectedSystem: 'File Server',
    description: 'Large data transfer to external IP'
  }
];

// Event Logs
export const mockEventLogs: EventLog[] = Array.from({ length: 50 }, (_, i) => {
  const logLevels: Array<'critical' | 'error' | 'warning' | 'info'> = ['critical', 'error', 'warning', 'info'];
  const systems = ['Web Server', 'Database', 'API Gateway', 'File Server', 'Auth Service'];
  const eventTypes = ['Login', 'Configuration Change', 'Service Start', 'Service Stop', 'Error', 'Warning'];
  
  const level = logLevels[Math.floor(Math.random() * logLevels.length)];
  const system = systems[Math.floor(Math.random() * systems.length)];
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  return {
    id: `log-${i + 1}`,
    timestamp: getRandomDate(24),
    logLevel: level,
    sourceSystem: system,
    eventType,
    message: `${eventType} event on ${system} - Status: ${level}`,
    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
  };
}).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

// System Health Metrics
export const mockSystemHealth: SystemHealthMetric[] = [
  {
    serviceName: 'Dashboard Service',
    status: 'online',
    responseTime: 45,
    uptime: 99.9,
    lastCheck: new Date()
  },
  {
    serviceName: 'Log Collection',
    status: 'online',
    responseTime: 120,
    uptime: 99.5,
    lastCheck: new Date()
  },
  {
    serviceName: 'Database',
    status: 'online',
    responseTime: 25,
    uptime: 99.99,
    lastCheck: new Date()
  },
  {
    serviceName: 'AI Service',
    status: 'pending',
    lastCheck: new Date()
  }
];

// CPU/Memory/Network data for system health charts
export const mockResourceUsage = {
  cpu: Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    usage: Math.floor(Math.random() * 40) + 30
  })),
  memory: Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    usage: Math.floor(Math.random() * 30) + 50
  })),
  network: Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    in: Math.floor(Math.random() * 100) + 50,
    out: Math.floor(Math.random() * 80) + 30
  }))
};
