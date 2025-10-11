// File: client/src/services/models.service.ts
import { api } from './api';

interface Model {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
  size?: string;
  description?: string;
  downloadedAt?: string;
}

export const modelsService = {
  async getModels(): Promise<Model[]> {
    return api.get<Model[]>('/api/models');
  },

  async getDetectedModels(): Promise<Model[]> {
    return api.get<Model[]>('/api/models/detected');
  },

  async activateModel(modelId: string): Promise<any> {
    return api.post(`/api/models/${modelId}/activate`);
  },

  async downloadModel(modelId: string): Promise<any> {
    return api.post(`/api/models/${modelId}/download`);
  },

  async deleteModel(modelId: string): Promise<any> {
    return api.delete(`/api/models/${modelId}`);
  },
};
