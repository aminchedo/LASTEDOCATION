import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface TrainingJobParams {
  datasetId?: string;
  datasetPath?: string;
  dataset?: string;
  epochs: number;
  batchSize: number;
  batch_size?: number;
  learningRate: number;
  lr?: number;
  modelType?: string;
}

export interface JobStatus {
  job_id: string;
  status: 'QUEUED' | 'STARTING' | 'LOADING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  progress: number;
  epoch?: number;
  step?: number;
  total_steps?: number;
  loss?: number;
  message?: string;
  created_at?: string;
  updated_at?: string;
  pid?: number;
  params?: {
    dataset?: string;
    epochs?: number;
    batch_size?: number;
    lr?: number;
  };
}

export interface CreateJobResponse {
  ok: boolean;
  job_id: string;
  status: string;
  pid?: number;
  message?: string;
}

export interface StatusResponse {
  ok: boolean;
  status: JobStatus;
}

export interface JobsListResponse {
  ok: boolean;
  jobs: JobStatus[];
  count: number;
}

export const trainingService = {
  /**
   * Create a new training job
   */
  async createJob(params: TrainingJobParams): Promise<CreateJobResponse> {
    try {
      const response = await axios.post(`${API_BASE}/api/training`, {
        epochs: params.epochs,
        batch_size: params.batchSize || params.batch_size,
        lr: params.learningRate || params.lr,
        dataset: params.datasetPath || params.dataset || 'test_data/sample_dataset.csv'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create training job');
    }
  },

  /**
   * Get status of a specific training job
   */
  async getJobStatus(jobId: string): Promise<StatusResponse> {
    try {
      const response = await axios.get(`${API_BASE}/api/training/status`, {
        params: { job_id: jobId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get job status');
    }
  },

  /**
   * Stop a running training job
   */
  async stopJob(jobId: string): Promise<{ ok: boolean; job_id: string; status: string; message: string }> {
    try {
      const response = await axios.post(`${API_BASE}/api/training/${jobId}/stop`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to stop job');
    }
  },

  /**
   * List all training jobs
   */
  async listJobs(): Promise<JobsListResponse> {
    try {
      const response = await axios.get(`${API_BASE}/api/training/jobs`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to list jobs');
    }
  },

  /**
   * Download trained model
   */
  async downloadModel(jobId: string): Promise<Blob> {
    try {
      const response = await axios.get(`${API_BASE}/api/training/${jobId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to download model');
    }
  },

  /**
   * Download model and trigger browser download
   */
  async downloadModelToFile(jobId: string): Promise<void> {
    try {
      const blob = await this.downloadModel(jobId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${jobId}.pt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to download model');
    }
  }
};
