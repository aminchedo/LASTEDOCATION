import { apiGet, apiPost } from './api';
import type { ModelType } from '@/types/settings';

export interface CustomApiConfig {
  baseUrl: string;
  apiKey?: string;
  model?: string;
}

export async function testCustomApi(config: CustomApiConfig): Promise<boolean> {
  try {
    // Test the custom API endpoint
    const response = await fetch(`${config.baseUrl}/health`, {
      method: 'GET',
      headers: config.apiKey
        ? {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          }
        : { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch (error) {
    console.error('Custom API test failed:', error);
    return false;
  }
}

export async function testApiConnection(config: CustomApiConfig): Promise<boolean> {
  return testCustomApi(config);
}

export async function listCustomApiModels(config: CustomApiConfig): Promise<string[]> {
  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      method: 'GET',
      headers: config.apiKey
        ? {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          }
        : { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Failed to list custom API models:', error);
    return [];
  }
}

export function validateApiUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

export function sanitizeApiKey(key: string): string {
  return key.trim();
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function clearClipboardAfterDelay(delay: number = 5000): Promise<void> {
  setTimeout(async () => {
    try {
      await navigator.clipboard.writeText('');
    } catch {
      // Ignore errors
    }
  }, delay);
}

export function getModelTypeLabel(type: ModelType): string {
  const labels: Record<ModelType, string> = {
    stt: 'Speech-to-Text',
    tts: 'Text-to-Speech',
    llm: 'Language Model',
    custom: 'Custom',
  };
  return labels[type] || 'Unknown';
}

export function getModelTypeOptions(): Array<{ value: ModelType; label: string }> {
  return [
    { value: 'stt', label: 'Speech-to-Text' },
    { value: 'tts', label: 'Text-to-Speech' },
    { value: 'llm', label: 'Language Model' },
    { value: 'custom', label: 'Custom' },
  ];
}

export function isCustomApiEnabled(settings: any): boolean {
  return settings?.customApi?.enabled === true;
}
