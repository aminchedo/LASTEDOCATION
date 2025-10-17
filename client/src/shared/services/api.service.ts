import { apiGet, apiPost } from '@/shared/utils/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  async getMetrics(): Promise<ApiResponse> {
    try {
      return await apiGet('/api/monitoring/metrics');
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getTrainingStatus(): Promise<ApiResponse> {
    try {
      return await apiGet('/api/train/status');
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getTrainingJobs(): Promise<ApiResponse> {
    try {
      return await apiGet('/api/train/jobs');
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getInstalledSources(): Promise<ApiResponse> {
    try {
      return await apiGet('/api/sources/installed');
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getDataSources(): Promise<ApiResponse> {
    try {
      return await apiGet('/api/sources/catalog');
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getDatasets(): Promise<ApiResponse> {
    try {
      return await apiGet('/api/sources/datasets/available');
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getTimeSeriesData(): Promise<ApiResponse> {
    try {
      return await apiGet('/api/monitoring/timeseries');
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getModelBreakdown(): Promise<ApiResponse> {
    try {
      return await apiGet('/api/monitoring/models');
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getPercentiles(): Promise<ApiResponse> {
    try {
      return await apiGet('/api/monitoring/percentiles');
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async startTraining(config: any): Promise<ApiResponse> {
    try {
      return await apiPost('/api/train/start', config);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async stopTraining(): Promise<ApiResponse> {
    try {
      return await apiPost('/api/train/stop');
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export const apiService = new ApiService();
