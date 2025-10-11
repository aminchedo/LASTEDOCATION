import { api } from './api';

export interface Source {
  id: string;
  name: string;
  type: 'model' | 'tts' | 'dataset';
  size?: string;
  description?: string;
  tags?: string[];
  language?: string;
  downloadUrls?: Record<string, string>;
  defaultDest?: string;
}

export interface DownloadJob {
  id: string;
  kind: string;
  repoId: string;
  repoType?: string;
  dest?: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress?: number;
  bytesDownloaded?: number;
  bytesTotal?: number;
  currentFile?: string;
  completedFiles?: string[];
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export const sourcesService = {
  async getCatalog(): Promise<Source[]> {
    const response = await api.get<any>('/api/sources/catalog');
    return response.data || response;
  },

  async getCatalogByType(type: 'model' | 'tts' | 'dataset'): Promise<Source[]> {
    const response = await api.get<any>(`/api/sources/catalog/type/${type}`);
    return response.data || response;
  },

  async searchCatalog(query: string, type?: string): Promise<Source[]> {
    let url = `/api/sources/catalog/search?q=${encodeURIComponent(query)}`;
    if (type) {
      url += `&type=${type}`;
    }
    const response = await api.get<any>(url);
    return response.data || response;
  },

  async getSourceById(id: string): Promise<Source> {
    const response = await api.get<any>(`/api/sources/catalog/${encodeURIComponent(id)}`);
    return response.data || response;
  },

  async startDownload(modelId: string, destination?: string): Promise<DownloadJob> {
    const response = await api.post<any>('/api/sources/download', {
      modelId,
      destination,
    });
    return response.data || response;
  },

  async getDownloads(): Promise<DownloadJob[]> {
    const response = await api.get<any>('/api/sources/downloads');
    return response.data || response;
  },

  async getDownloadStatus(jobId: string): Promise<DownloadJob> {
    const response = await api.get<any>(`/api/sources/download/${jobId}`);
    return response.data || response;
  },

  async cancelDownload(jobId: string): Promise<void> {
    await api.delete(`/api/sources/download/${jobId}`);
  },

  async getModelsAvailable(): Promise<Source[]> {
    const response = await api.get<any>('/api/sources/models/available');
    return response.data || response;
  },

  async getDatasetsAvailable(): Promise<Source[]> {
    const response = await api.get<any>('/api/sources/datasets/available');
    return response.data || response;
  },

  async getInstalled(): Promise<Source[]> {
    const response = await api.get<any>('/api/sources/installed');
    return response.data || response;
  },
};
