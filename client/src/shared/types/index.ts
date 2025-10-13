export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'queued' | 'succeeded' | 'canceled';

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  size: number;
  format: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  domain?: string;
  records?: number;
  sources?: string[];
  language?: string;
  validated?: boolean;
}

export interface TrainingJob {
  id: string;
  name: string;
  status: JobStatus;
  progress: number;
  startTime?: string;
  endTime?: string;
  startedAt?: string;
  finishedAt?: string;
  config?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  model?: string;
  dataset?: string;
  epochs?: number;
  currentPhase?: string;
  error?: string;
  logs?: string[];
  lastLog?: string;
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
  dataset?: string;
  model?: string;
  metrics?: Record<string, number>;
  notes?: string;
}

export interface Model {
  id: string;
  name: string;
  type: string;
  version: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  installed?: boolean;
  description?: string;
  tags?: string[];
  license?: string;
  url?: string;
  speed?: number;
  parameters?: number;
}

export interface DataSource {
  id: string;
  name: string;
  kind: DataSourceKind;
  url?: string;
  status: 'active' | 'inactive' | 'error';
  lastSync?: string;
  connected?: boolean;
  recordsCount?: number;
}

export type DataSourceKind = 'huggingface' | 'local' | 'url' | 'database' | 'api' | 'github' | 'gdrive' | 'web' | 'upload';

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

export interface DownloadJob {
  id: string;
  modelId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  repoId?: string;
  speed?: number;
  eta?: string;
  bytesDownloaded?: number;
  currentFile?: string;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  gpu?: number;
  timestamp: string;
}
