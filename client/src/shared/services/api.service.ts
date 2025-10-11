import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

class ApiService {
  async get<T>(endpoint: string, options?: { signal?: AbortSignal }): Promise<T> {
    return apiGet<T>(endpoint, options);
  }

  async post<T>(endpoint: string, data?: any, options?: { signal?: AbortSignal }): Promise<T> {
    return apiPost<T>(endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: any, options?: { signal?: AbortSignal }): Promise<T> {
    return apiPut<T>(endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: { signal?: AbortSignal }): Promise<T> {
    return apiDelete<T>(endpoint, options);
  }

  async getTrainingStatus(): Promise<any> {
    return this.get('/api/training/status');
  }
}

export const apiService = new ApiService();
