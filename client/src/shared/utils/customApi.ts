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

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export async function clearClipboardAfterDelay(delay: number = 30000): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, delay));
  await navigator.clipboard.writeText('');
}

export async function testApiConnection(baseUrl: string, apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    return response.ok;
  } catch {
    return false;
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
