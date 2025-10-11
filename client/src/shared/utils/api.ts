let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
let API_KEY_OVERRIDE: string | undefined;

export interface ApiOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export function setApiOverrides(baseUrl?: string, apiKey?: string): void {
  if (baseUrl) {
    API_BASE_URL = baseUrl;
  }
  API_KEY_OVERRIDE = apiKey;
}

export async function apiGet<T>(endpoint: string, options?: ApiOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export async function apiPost<T>(
  endpoint: string,
  data?: any,
  options?: ApiOptions
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export async function apiPut<T>(
  endpoint: string,
  data?: any,
  options?: ApiOptions
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export async function apiDelete<T>(endpoint: string, options?: ApiOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export function getApi() {
  return {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete,
  };
}

export function resetApiInstance() {
  // Reset API configuration to defaults
  API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  API_KEY_OVERRIDE = undefined;
}
