import { AuthService } from '@/services/auth.service';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

let apiOverrides: any = {};

export function setApiOverrides(overrides: any) {
  apiOverrides = overrides;
}

// Return the apiService instance instead of plain object
export function getApi() {
  return apiService;
}

export function resetApiInstance() {
  apiOverrides = {};
}

interface ApiRequestOptions extends RequestInit {
  signal?: AbortSignal;
  skipAuth?: boolean;
}

interface APIResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

class APIService {
  private isRefreshing = false;
  private refreshQueue: Array<(token: string) => void> = [];

  private async makeRequest<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<APIResponse<T>> {
    const { skipAuth = false, ...fetchOptions } = options;

    // Add authentication header if not skipped
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (!skipAuth) {
      const token = AuthService.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 with token refresh
    if (response.status === 401 && !skipAuth) {
      if (this.isRefreshing) {
        return new Promise((resolve) => {
          this.refreshQueue.push((token: string) => {
            headers.Authorization = `Bearer ${token}`;
            resolve(this.makeRequest(endpoint, { ...options, skipAuth: true }));
          });
        });
      }

      this.isRefreshing = true;

      try {
        const refreshed = await AuthService.refreshAuth();
        if (refreshed) {
          // Process queued requests
          this.refreshQueue.forEach((callback) => callback(AuthService.getToken()!));
          this.refreshQueue = [];

          // Retry original request
          headers.Authorization = `Bearer ${AuthService.getToken()}`;
          return this.makeRequest(endpoint, { ...options, skipAuth: true });
        } else {
          AuthService.logout();
          throw new Error('Authentication failed');
        }
      } catch (refreshError) {
        AuthService.logout();
        throw refreshError;
      } finally {
        this.isRefreshing = false;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async get<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiService = new APIService();

// Legacy functions for backward compatibility
export async function apiGet<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
  const response = await apiService.get<T>(endpoint, options);
  return response.data;
}

export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options?: ApiRequestOptions
): Promise<T> {
  const response = await apiService.post<T>(endpoint, data, options);
  return response.data;
}

export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options?: ApiRequestOptions
): Promise<T> {
  const response = await apiService.put<T>(endpoint, data, options);
  return response.data;
}

export async function apiDelete<T = any>(
  endpoint: string,
  options?: ApiRequestOptions
): Promise<T> {
  const response = await apiService.delete<T>(endpoint, options);
  return response.data;
}

// Export the api object for backward compatibility
export const api = apiService;
