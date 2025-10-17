import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface Dataset {
  id: string;
  name: string;
  filename: string;
  path: string;
  size: number;
  type: string;
  uploaded_at: string;
  description?: string;
  tags?: string[];
  source?: string;
  samples?: number;
  language?: string;
}

export const datasetsService = {
  /**
   * Upload a new dataset
   */
  async upload(file: File, name?: string): Promise<Dataset> {
    const formData = new FormData();
    formData.append('file', file);
    if (name) {
      formData.append('name', name);
    }

    try {
      const response = await axios.post(`${API_BASE}/api/datasets/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.dataset;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to upload dataset');
    }
  },

  /**
   * List all datasets
   */
  async list(): Promise<Dataset[]> {
    try {
      const response = await axios.get(`${API_BASE}/api/datasets`);
      return response.data.datasets || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to list datasets');
    }
  },

  /**
   * Get dataset by ID
   */
  async get(id: string): Promise<Dataset> {
    try {
      const response = await axios.get(`${API_BASE}/api/datasets/${id}`);
      return response.data.dataset;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get dataset');
    }
  },

  /**
   * Delete dataset
   */
  async delete(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/api/datasets/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete dataset');
    }
  },

  // Legacy methods for backward compatibility
  async getAvailableDatasets(): Promise<Dataset[]> {
    return this.list();
  },

  async getLocalDatasets(): Promise<Dataset[]> {
    return this.list();
  },

  async getCatalogDatasets(): Promise<Dataset[]> {
    try {
      const response = await axios.get(`${API_BASE}/api/sources/catalog/type/dataset`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  },

  async searchDatasets(query: string): Promise<Dataset[]> {
    try {
      const response = await axios.get(`${API_BASE}/api/sources/catalog/search?q=${encodeURIComponent(query)}&type=dataset`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  },

  async getDatasetById(id: string): Promise<Dataset> {
    return this.get(id);
  },
};
