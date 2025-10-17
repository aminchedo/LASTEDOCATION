import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { APP_CONFIG } from '../config/app.config';

export type Theme = 'light' | 'dark' | 'auto';
export type Direction = 'rtl' | 'ltr';

export interface AppSettings {
  theme: Theme;
  direction: Direction;
  fontSize: number;
  accentColor: string;
  api: {
    baseUrl: string;
    key: string;
  };
  voice: {
    enabled: boolean;
    autoPlay: boolean;
  };
  aiModel: string;
  models: {
    customFolders: string[];
    autoScan: boolean;
    scanDepth: number;
  };
  training?: {
    autoSave?: boolean;
    checkpointInterval?: number;
    maxCheckpoints?: number;
    useGpu?: boolean;
    gpuMemoryFraction?: number;
    defaultEpochs?: number;
    defaultSteps?: number;
    defaultLearningRate?: number;
    defaultBatchSize?: number;
    defaultSaveEverySteps?: number;
  };
}

interface ThemeContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resolvedTheme: 'light' | 'dark';
}

const defaultSettings: AppSettings = {
  theme: 'auto',
  direction: 'rtl',
  fontSize: 16,
  accentColor: '#6366f1',
  api: {
    baseUrl: APP_CONFIG.API_BASE_URL,
    key: '',
  },
  voice: {
    enabled: true,
    autoPlay: false,
  },
  aiModel: 'gpt-4',
  models: {
    customFolders: [],
    autoScan: true,
    scanDepth: 3,
  },
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        return { ...defaultSettings, ...JSON.parse(savedSettings) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Initial check
    updateSystemTheme(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', updateSystemTheme);
    
    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme);
    };
  }, []);

  // Resolve the actual theme to use
  const resolvedTheme = settings.theme === 'auto' ? systemTheme : settings.theme;

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.setAttribute('data-theme', resolvedTheme);
    
    // Apply direction
    root.setAttribute('dir', settings.direction);
    
    // Apply font size
    root.style.fontSize = `${settings.fontSize}px`;
    
    // Apply accent color
    root.style.setProperty('--accent-color', settings.accentColor);
  }, [resolvedTheme, settings.direction, settings.fontSize, settings.accentColor]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      localStorage.setItem('app-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value: ThemeContextValue = {
    settings,
    updateSettings,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Export a custom hook for common theme operations
export function useThemeActions() {
  const { settings, updateSettings, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(settings.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    updateSettings({ theme: themes[nextIndex] });
  };

  const toggleDirection = () => {
    updateSettings({ 
      direction: settings.direction === 'rtl' ? 'ltr' : 'rtl' 
    });
  };

  const setFontSize = (size: number) => {
    updateSettings({ fontSize: Math.max(12, Math.min(24, size)) });
  };

  const setAccentColor = (color: string) => {
    updateSettings({ accentColor: color });
  };

  return {
    settings,
    resolvedTheme,
    toggleTheme,
    toggleDirection,
    setFontSize,
    setAccentColor,
    updateSettings,
  };
}