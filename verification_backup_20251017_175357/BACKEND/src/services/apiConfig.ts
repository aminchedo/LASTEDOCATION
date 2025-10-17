import { ENV } from '../config/env';

export type ApiSource = 'local' | 'external';

export function getApiSource(): ApiSource {
  return ENV.CUSTOM_API_ENDPOINT && ENV.CUSTOM_API_KEY ? 'external' : 'local';
}

export function getActiveEndpoint(): { source: ApiSource; baseUrl: string; apiKey?: string } {
  const source = getApiSource();
  if (source === 'external') {
    return {
      source,
      baseUrl: ENV.CUSTOM_API_ENDPOINT,
      apiKey: ENV.CUSTOM_API_KEY,
    };
  }
  // Local fallback: our own backend handles the chat logic (or delegates)
  return {
    source: 'local',
    baseUrl: 'http://localhost:3001', // self
  };
}