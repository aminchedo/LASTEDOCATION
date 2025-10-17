import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, User } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedToken = AuthService.getToken();
    const storedUser = AuthService.getUser();

    if (storedToken && storedUser && AuthService.isAuthenticated()) {
      setToken(storedToken);
      setUser(storedUser);
    } else {
      // Clear invalid tokens
      AuthService.clearTokens();
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await AuthService.login(email, password);
    setToken(response.token);
    setUser(response.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await AuthService.register(email, password, name);
    setToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    AuthService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
