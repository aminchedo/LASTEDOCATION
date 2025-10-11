export interface TrainingJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  model: string;
  dataset: string;
  progress: number;
  createdAt: number;
  updatedAt: number;
  config?: any;
  metrics?: {
    loss?: number;
    accuracy?: number;
    [key: string]: any;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  type: string;
  size?: number;
  description?: string;
  installed?: boolean;
}

export interface DatasetInfo {
  id: string;
  name: string;
  size?: number;
  rows?: number;
  description?: string;
  installed?: boolean;
}
