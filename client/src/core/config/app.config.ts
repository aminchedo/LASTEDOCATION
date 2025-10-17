export const APP_CONFIG = {
  name: 'AI Chat & Monitoring',
  version: '1.0.0',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  api: {
    defaultBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 30000,
    retryAttempts: 3,
  },
  chat: {
    maxHistorySize: 100,
    throttleMs: 500,
    enableMarkdown: true,
    enableCodeHighlight: true,
  },
  monitoring: {
    refreshInterval: 5000,
    maxLogEntries: 50,
  },
  storage: {
    settingsKey: 'app-settings',
    chatHistoryKey: 'chat-history',
  },
  theme: {
    defaultTheme: 'auto' as 'light' | 'dark' | 'auto',
    defaultDirection: 'rtl' as 'rtl' | 'ltr',
    availableAccents: [
      { name: 'Blue', value: '#3B82F6' },
      { name: 'Purple', value: '#8B5CF6' },
      { name: 'Green', value: '#10B981' },
      { name: 'Orange', value: '#F59E0B' },
      { name: 'Pink', value: '#EC4899' },
      { name: 'Teal', value: '#14B8A6' },
    ],
  },
} as const;

export type AppConfig = typeof APP_CONFIG;