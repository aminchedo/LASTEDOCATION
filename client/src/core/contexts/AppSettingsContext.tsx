import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, CustomApiSettings } from '@/types/settings';

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateCustomApi: (customApi: CustomApiSettings) => void;
  resetCustomApi: () => void;
  resetAllSettings: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'persian_chat_appconst defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 'medium',
  direction: 'rtl',
  accentColor: '#3B82F6',
  api: {
    baseUrl: 'http://localhost:3001',
    key: '',
  },
  voice: {
    enabled: false,
    autoPlay: false,
  },
  aiModel: 'gpt-4',
};Size: 'medium',
};

interface AppSettingsProviderProps {
  children: ReactNode;
}

export function AppSettingsProvider({ children }: AppSettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
      setSettings(defaultSettings);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updateCustomApi = (customApi: CustomApiSettings) => {
    setSettings(prev => ({ ...prev, customApi }));
  };

  const resetCustomApi = () => {
    setSettings(prev => {
      const { customApi, ...rest } = prev;
      return rest;
    });
  };

  const resetAllSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: AppSettingsContextType = {
    settings,
    updateSettings,
    updateCustomApi,
    resetCustomApi,
    resetAllSettings,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}
