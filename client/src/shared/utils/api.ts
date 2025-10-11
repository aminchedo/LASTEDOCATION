import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

let apiInstance: AxiosInstance | null = null;
let apiOverrides: { baseURL?: string; headers?: Record<string, string> } = {};

export function getApi(): AxiosInstance {
  if (!apiInstance) {
    const baseURL = apiOverrides.baseURL || import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    apiInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...apiOverrides.headers
      },
      timeout: 30000
    });

    // Request interceptor
    apiInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    apiInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  return apiInstance;
}

export function setApiOverrides(overrides: { baseURL?: string; headers?: Record<string, string> }): void {
  apiOverrides = { ...apiOverrides, ...overrides };
  resetApiInstance();
}

export function resetApiInstance(): void {
  apiInstance = null;
}

export async function apiGet<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await getApi().get<T>(url, config);
  return response.data;
}

export async function apiPost<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await getApi().post<T>(url, data, config);
  return response.data;
}

export async function apiPut<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await getApi().put<T>(url, data, config);
  return response.data;
}

export async function apiDelete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await getApi().delete<T>(url, config);
  return response.data;
}

export async function apiPatch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await getApi().patch<T>(url, data, config);
  return response.data;
}
