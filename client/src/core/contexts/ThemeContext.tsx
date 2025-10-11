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
}

interface ThemeContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resolvedTheme: 'light' | 'dark';
}

const defaultSettings: AppSettings = {
  theme: APP_CONFIG.theme.defaultTheme,
  direction: APP_CONFIG.theme.defaultDirection,
  fontSize: 16,
  accentColor: APP_CONFIG.theme.availableAccents[0].value,
  api: {
    baseUrl: APP_CONFIG.api.defaultBaseUrl,
    key: '',
  },
  voice: {
    enabled: false,
    autoPlay: false,
  },
  aiModel: 'gpt-4',
  models: {
    customFolders: [],
    autoScan: true,
    scanDepth: 2,
  },
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(APP_CONFIG.storage.settingsKey);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return defaultSettings;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Resolve theme based on settings and system preference
  const resolveTheme = useCallback((theme: Theme): 'light' | 'dark' => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, []);

  // Apply theme and direction to DOM
  useEffect(() => {
    const html = document.documentElement;
    const resolved = resolveTheme(settings.theme);
    setResolvedTheme(resolved);

    // Apply dark class
    html.classList.toggle('dark', resolved === 'dark');

    // Apply direction
    html.dir = settings.direction;

    // Apply accent color
    html.style.setProperty('--c-primary', settings.accentColor);

    // Calculate hover color (slightly darker/lighter)
    const adjustBrightness = (color: string, amount: number) => {
      const hex = color.replace('#', '');
      const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
      const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
      const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    html.style.setProperty(
      '--c-primary-hover',
      adjustBrightness(settings.accentColor, resolved === 'dark' ? -20 : -30)
    );

    // Apply font size
    html.style.fontSize = `${settings.fontSize}px`;

    // Save to localStorage
    try {
      localStorage.setItem(APP_CONFIG.storage.settingsKey, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings, resolveTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = resolveTheme('auto');
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [settings.theme, resolveTheme]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated: AppSettings = { ...prev };

      // Handle nested objects properly
      if (partial.api) {
        updated.api = { ...prev.api, ...partial.api };
      }
      if (partial.voice) {
        updated.voice = { ...prev.voice, ...partial.voice };
      }
      if (partial.models) {
        updated.models = { ...prev.models, ...partial.models };
      }

      // Handle other properties
      if (partial.theme !== undefined) updated.theme = partial.theme;
      if (partial.direction !== undefined) updated.direction = partial.direction;
      if (partial.fontSize !== undefined) updated.fontSize = partial.fontSize;
      if (partial.accentColor !== undefined) updated.accentColor = partial.accentColor;
      if (partial.aiModel !== undefined) updated.aiModel = partial.aiModel;

      return updated;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
