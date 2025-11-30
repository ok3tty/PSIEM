/**
 * Type definitions for PSIEM Security Dashboard
 */

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type LogLevel = 'critical' | 'error' | 'warning' | 'info';

export type SystemStatus = 'online' | 'offline' | 'degraded' | 'pending';

export interface Threat {
  id: string;
  timestamp: Date;
  severity: SeverityLevel;
  type: string;
  source: string;
  status: 'active' | 'resolved' | 'investigating';
  description: string;
}

export interface MetricData {
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  lastModified: Date;
  tags: string[];
}

export interface IntrusionAlert {
  id: string;
  timestamp: Date;
  signatureName: string;
  sourceIp: string;
  destinationIp?: string;
  severity: SeverityLevel;
  matchedRule: string;
  blocked: boolean;
}

export interface AnomalyDetection {
  id: string;
  timestamp: Date;
  anomalyType: string;
  confidenceScore: number;
  affectedSystem: string;
  description: string;
}

export interface EventLog {
  id: string;
  timestamp: Date;
  logLevel: LogLevel;
  sourceSystem: string;
  eventType: string;
  message: string;
  ipAddress?: string;
}

export interface SystemHealthMetric {
  serviceName: string;
  status: SystemStatus;
  responseTime?: number;
  uptime?: number;
  lastCheck: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
