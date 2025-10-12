export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'queued' | 'succeeded' | 'canceled';

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  size: number;
  format: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingJob {
  id: string;
  name: string;
  status: JobStatus;
  progress: number;
  startTime?: string;
  endTime?: string;
  config: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  config: Record<string, unknown>;
  results?: Record<string, unknown>;
}

export interface Model {
  id: string;
  name: string;
  type: string;
  version: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface DataSource {
  id: string;
  name: string;
  kind: DataSourceKind;
  url?: string;
  status: 'active' | 'inactive' | 'error';
  lastSync?: string;
}

export type DataSourceKind = 'huggingface' | 'local' | 'url' | 'database' | 'api';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Download {
  id: string;
  filename: string;
  url: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  size?: number;
  downloadedSize?: number;
  startTime?: string;
  endTime?: string;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  gpu?: number;
  timestamp: string;
}
