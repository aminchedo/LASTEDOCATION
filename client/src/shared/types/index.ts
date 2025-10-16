export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'queued' | 'succeeded' | 'canceled' | 'training' | 'preparing' | 'evaluating' | 'error' | 'paused';

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
  validated?: boolean;
  records?: number;
  sources?: string[];
  language?: string;
}

export interface TrainingMetrics {
  loss: number;
  accuracy: number;
  epoch: number;
  step?: number;
  totalSteps?: number;
  perplexity?: number;
}

export interface TrainingConfig {
  baseModelPath?: string;
  datasetPath?: string;
  outputDir?: string;
  epochs?: number;
  learningRate?: number;
  batchSize?: number;
  maxSteps?: number;
  warmupSteps?: number;
  saveSteps?: number;
  evalSteps?: number;
  seed?: number;
  useGpu?: boolean;
}

export interface TrainingJob {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'preparing' | 'training' | 'evaluating' | 'error' | 'cancelled' | 'paused';
  progress: number;
  startTime?: string;
  endTime?: string;
  startedAt?: string;
  completedAt?: string;
  finishedAt?: string;
  config?: TrainingConfig;
  metrics?: TrainingMetrics;
  model?: string;
  epochs?: number;
  lastLog?: string;
  error?: string;
  currentPhase?: string;
  logs?: string[];
  step?: number;
  totalSteps?: number;
  currentStep?: number;
  currentEpoch?: number;
  totalEpochs?: number;
  bestMetric?: number;
  eta?: number;
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
  metrics?: Record<string, unknown>;
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
}

export interface DataSource {
  id: string;
  name: string;
  kind: DataSourceKind;
  url?: string;
  status: 'active' | 'inactive' | 'error';
  lastSync?: string;
  recordsCount?: number;
  connected?: boolean;
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
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused' | 'running' | 'error';
  size?: number;
  downloadedSize?: number;
  startTime?: string;
  endTime?: string;
}

export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'paused' | 'running' | 'error';

export interface DownloadJob extends Download {
  repoId?: string;
  speed?: number;
  eta?: number;
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
