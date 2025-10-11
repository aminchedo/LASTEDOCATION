const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

let apiOverrides: any = {};

export function setApiOverrides(overrides: any) {
  apiOverrides = overrides;
}

export function getApi() {
  return { baseUrl: apiOverrides.baseUrl || API_BASE_URL, ...apiOverrides };
}

interface ApiRequestOptions extends RequestInit {
  signal?: AbortSignal;
}

export async function apiGet<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options?: ApiRequestOptions
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options?: ApiRequestOptions
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function apiDelete<T = any>(
  endpoint: string,
  options?: ApiRequestOptions
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
