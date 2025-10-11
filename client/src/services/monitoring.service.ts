// File: client/src/services/monitoring.service.ts
import { api } from './api';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  activeDownloads?: number;
  activeTrainings?: number;
  timestamp: string;
}

export const monitoringService = {
  async getMetrics(): Promise<SystemMetrics> {
    return api.get<SystemMetrics>('/api/monitoring/metrics');
  },

  async getSystemHealth(): Promise<any> {
    return api.get('/api/health');
  },
};
