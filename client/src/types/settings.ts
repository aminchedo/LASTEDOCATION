// Settings types
export type ModelType = 'openai' | 'anthropic' | 'custom' | string;

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto' | 'system';
  direction: 'ltr' | 'rtl';
  fontSize: number | string;
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
  customApi?: CustomApiSettings;
}

export interface CustomApiSettings {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  modelType: string;
  modelName: string;
}
