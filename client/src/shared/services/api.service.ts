import { getApi } from '@/shared/utils/api';

export const apiService = {
  // Health check
  async healthCheck() {
    return getApi().get('/health');
  },

  // Datasets
  async getDatasets() {
    return getApi().get('/api/datasets');
  },

  async getDataset(id: string) {
    return getApi().get(`/api/datasets/${id}`);
  },

  // Training
  async startTraining(config: unknown) {
    return getApi().post('/api/train/start', config);
  },

  async getTrainingStatus() {
    return getApi().get('/api/train/status');
  },

  async stopTraining() {
    return getApi().post('/api/train/stop');
  },

  // Metrics
  async getMetrics() {
    return getApi().get('/api/metrics');
  },

  // Models
  async getModels() {
    return getApi().get('/api/models');
  },

  async getModel(id: string) {
    return getApi().get(`/api/models/${id}`);
  },

  // Chat
  async sendMessage(message: string, conversationId?: string) {
    return getApi().post('/api/chat', { message, conversationId });
  },

  // Monitoring
  async getSystemStatus() {
    return getApi().get('/api/monitoring/status');
  },

  async getSystemMetrics() {
    return getApi().get('/api/monitoring/metrics');
  },

  // Downloads
  async getDownloads() {
    return getApi().get('/api/downloads');
  },

  async startDownload(url: string, filename: string) {
    return getApi().post('/api/downloads/start', { url, filename });
  },

  async cancelDownload(id: string) {
    return getApi().post(`/api/downloads/${id}/cancel`);
  }
};
