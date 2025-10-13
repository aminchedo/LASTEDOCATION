// File: client/src/services/auth.service.ts
import { api } from './api';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

interface AuthService {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => void;
  isAuthenticated: () => boolean;
  getUser: () => any;
  getToken: () => string | null;
  setToken: (token: string) => void;
  getRefreshToken: () => string | null;
  setRefreshToken: (token: string) => void;
  clearTokens: () => void;
  refreshAuth: () => Promise<boolean>;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'authToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly USER_KEY = 'user';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
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

  static getUser(): any {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/auth/login', credentials);
    
    // Store token and user in localStorage
    this.setToken(response.token);
    if (response.refreshToken) {
      this.setRefreshToken(response.refreshToken);
    }
    this.setUser(response.user);
    
    return response;
  }

  static logout(): void {
    this.clearTokens();
    window.location.href = '/login';
  }

  static async refreshAuth(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await api.post<{ token: string }>('/api/auth/refresh', {
        refreshToken,
      });

      this.setToken(response.token);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }
}

// Legacy export for backward compatibility
export const authService = AuthService;
