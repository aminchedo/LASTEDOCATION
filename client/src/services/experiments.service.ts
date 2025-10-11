import { api } from './api';

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  dataset?: string;
  model?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress?: number;
  startTime?: string;
  endTime?: string;
  metrics?: {
    accuracy?: number;
    loss?: number;
    [key: string]: any;
  };
  config?: Record<string, any>;
  notes?: string;
}

export const experimentsService = {
  async getExperiments(): Promise<Experiment[]> {
    return api.get<Experiment[]>('/api/experiments');
  },

  async createExperiment(experiment: Partial<Experiment>): Promise<Experiment> {
    return api.post<Experiment>('/api/experiments', experiment);
  },

  async startExperiment(id: string): Promise<void> {
    await api.post(`/api/experiments/${id}/start`);
  },

  async stopExperiment(id: string): Promise<void> {
    await api.post(`/api/experiments/${id}/stop`);
  },

  async deleteExperiment(id: string): Promise<void> {
    await api.delete(`/api/experiments/${id}`);
  },

  async downloadExperiment(id: string): Promise<Blob> {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/experiments/${id}/download`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  },
};
