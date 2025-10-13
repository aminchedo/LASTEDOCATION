// File: client/src/services/auth.service.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface LoginResponse {
  ok: boolean;
  token: string;
  user: User;
}

interface RegisterResponse {
  ok: boolean;
  token: string;
  user: User;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'token';
  private static readonly USER_KEY = 'user';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  static getUser(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password
      });

      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  static async register(email: string, password: string, name: string): Promise<RegisterResponse> {
    try {
      const response = await axios.post(`${API_BASE}/api/auth/register`, {
        email,
        password,
        name
      });

      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }

  static logout(): void {
    this.clearTokens();
  }

  static async refreshAuth(): Promise<boolean> {
    // Token refresh not implemented yet
    return false;
  }

  static async getCurrentUser(): Promise<User> {
    try {
      const response = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      });
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get user info');
    }
  }
}

// Axios interceptor to add token to all requests
axios.interceptors.request.use(config => {
  const token = AuthService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios interceptor to handle 401 errors (token expired)
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      AuthService.clearTokens();
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Legacy export for backward compatibility
export const authService = AuthService;
