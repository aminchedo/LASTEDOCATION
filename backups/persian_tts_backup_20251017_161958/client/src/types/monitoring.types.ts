// File: client/src/types/monitoring.types.ts

export interface HealthCheckResult {
  status: 'pass' | 'fail';
  message?: string;
  responseTime?: number;
}

export interface HealthChecks {
  database: HealthCheckResult;
  filesystem: HealthCheckResult;
  memory: HealthCheckResult;
  disk: HealthCheckResult;
}

export interface CPUMetrics {
  usage: number;
  cores: number;
  model?: string;
}

export interface MemoryMetrics {
  total: number;
  free: number;
  used: number;
  usagePercent: number;
}

export interface SystemMetrics {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  uptime: number;
  timestamp: string;
}

export interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: HealthChecks;
  metrics?: {
    system: SystemMetrics;
    performance: PerformanceMetrics;
    analytics: ApiAnalytics;
  };
}

export interface EndpointStat {
  endpoint: string;
  count: number;
}

export interface ErrorRate {
  total: number;
  errors: number;
  errorRate: number;
  timeWindow: string;
}

export interface ApiAnalytics {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  avgDuration: number;
  endpoints: EndpointStat[];
  errorRate?: ErrorRate;
}

export interface OperationStats {
  operation: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
}

export type PerformanceMetrics = OperationStats[];

export interface MonitoringData {
  health: HealthData;
  system: SystemMetrics;
  analytics: ApiAnalytics;
  performance: PerformanceMetrics;
}

export interface UseMonitoringResult {
  data: MonitoringData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}
