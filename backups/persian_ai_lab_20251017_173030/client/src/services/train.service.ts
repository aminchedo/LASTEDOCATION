// File: client/src/services/train.service.ts
import { api } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface TrainingConfig {
  datasetId: string;
  epochs?: number;
  batchSize?: number;
  learningRate?: number;
}

interface TrainingStatus {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  progress?: number;
  epoch?: number;
  loss?: number;
  message?: string;
}

interface TrainingEvent {
  type: 'progress' | 'complete' | 'error' | 'info';
  data?: any;
  message?: string;
}

export const trainService = {
  async startTraining(config: TrainingConfig): Promise<any> {
    return api.post('/api/train/start', config);
  },

  async getStatus(): Promise<TrainingStatus> {
    return api.get<TrainingStatus>('/api/train/status');
  },

  async stopTraining(): Promise<any> {
    return api.post('/api/train/stop');
  },

  async pauseTraining(): Promise<any> {
    return api.post('/api/train/pause');
  },

  async resumeTraining(): Promise<any> {
    return api.post('/api/train/resume');
  },

  // Server-Sent Events for real-time training updates
  connectToTrainingStream(onEvent: (event: TrainingEvent) => void): EventSource {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/api/train/stream?token=${token}`;
    
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data);
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      onEvent({
        type: 'error',
        message: 'Connection to training stream lost',
      });
    };

    return eventSource;
  },
};
