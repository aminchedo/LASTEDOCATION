// Settings types
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  direction: 'ltr' | 'rtl';
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
  models?: string[];
}

export interface CustomApiSettings {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  modelType: string;
}
