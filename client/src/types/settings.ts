export type Theme = 'light' | 'dark' | 'auto';
export type Direction = 'ltr' | 'rtl';
export type ModelType = 'stt' | 'tts' | 'llm' | 'custom';

export interface ApiSettings {
  baseUrl: string;
  key: string;
}

export interface VoiceSettings {
  enabled: boolean;
  autoPlay: boolean;
}

export interface ModelSettings {
  stt: string[];
  tts: string[];
  llm: string[];
}

export interface CustomApiSettings {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model?: string;
  type?: ModelType;
}

export interface AppSettings {
  theme: Theme;
  direction: Direction;
  fontSize: number;
  accentColor: string;
  api: ApiSettings;
  voice: VoiceSettings;
  aiModel: string;
  models: ModelSettings;
  customApi?: CustomApiSettings;
  training?: {
    autoSave: boolean;
    checkpointInterval: number;
    maxCheckpoints: number;
    enableTensorBoard: boolean;
    saveOptimizer: boolean;
  };
}

export const defaultSettings: AppSettings = {
  theme: 'auto',
  direction: 'rtl',
  fontSize: 16,
  accentColor: '#3b82f6',
  api: {
    baseUrl: 'http://localhost:3000',
    key: '',
  },
  voice: {
    enabled: false,
    autoPlay: false,
  },
  aiModel: 'gpt-4',
  models: {
    stt: [],
    tts: [],
    llm: [],
  },
  customApi: {
    enabled: false,
    baseUrl: '',
    apiKey: '',
  },
  training: {
    autoSave: true,
    checkpointInterval: 1000,
    maxCheckpoints: 5,
    enableTensorBoard: false,
    saveOptimizer: true,
  },
};
