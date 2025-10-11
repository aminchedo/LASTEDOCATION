import { api } from './api';

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  size?: number;
  format?: string;
  tags?: string[];
  source?: string;
  lastModified?: string;
  samples?: number;
  language?: string;
}

export const datasetsService = {
  async getAvailableDatasets(): Promise<Dataset[]> {
    return api.get<Dataset[]>('/api/sources/datasets/available');
  },

  async getLocalDatasets(): Promise<Dataset[]> {
    return api.get<Dataset[]>('/api/datasets/local');
  },

  async getCatalogDatasets(): Promise<Dataset[]> {
    const response = await api.get<any>('/api/sources/catalog/type/dataset');
    return response.data || response;
  },

  async searchDatasets(query: string): Promise<Dataset[]> {
    const response = await api.get<any>(`/api/sources/catalog/search?q=${encodeURIComponent(query)}&type=dataset`);
    return response.data || response;
  },

  async getDatasetById(id: string): Promise<Dataset> {
    return api.get<Dataset>(`/api/sources/catalog/${encodeURIComponent(id)}`);
  },
};
