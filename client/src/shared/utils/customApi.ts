// Custom API utilities
export const customApiUtils = {};

export function validateApiUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function clearClipboardAfterDelay(delay: number = 30000): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, delay));
  await navigator.clipboard.writeText('');
}

export async function testApiConnection(settings: { baseUrl: string; apiKey?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {};
    if (settings.apiKey) {
      headers.Authorization = `Bearer ${settings.apiKey}`;
    }
    const response = await fetch(`${settings.baseUrl}/health`, { headers });
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Connection failed' };
  }
}

export function getModelTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    custom: 'Custom'
  };
  return labels[type] || type;
}

export function getModelTypeOptions(): Array<{value: string; label: string}> {
  return [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'custom', label: 'Custom' }
  ];
}

export function sanitizeApiKey(key: string): string {
  return key.trim();
}

export function isCustomApiEnabled(settings: any): boolean {
  return settings?.api?.baseUrl && settings?.api?.key;
}
piKey(key: string): string {
  return key.trim();
}

export function isCustomApiEnabled(settings: any): boolean {
  return settings?.api?.baseUrl && settings?.api?.key;
}
