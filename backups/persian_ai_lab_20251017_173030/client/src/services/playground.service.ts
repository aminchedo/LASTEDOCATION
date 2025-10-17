import { api } from './api';

export interface PlaygroundRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface PlaygroundResponse {
  response: string;
  tokens: number;
  latency: number;
  model: string;
}

export const playgroundService = {
  async generate(request: PlaygroundRequest): Promise<PlaygroundResponse> {
    const startTime = Date.now();
    
    const response = await api.post<any>('/api/chat', {
      message: request.prompt,
      model: request.model,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      frequency_penalty: request.frequencyPenalty,
      presence_penalty: request.presencePenalty,
    });

    const latency = Date.now() - startTime;

    return {
      response: response.response || response.message || '',
      tokens: response.tokens || 0,
      latency,
      model: request.model || 'default',
    };
  },

  async streamGenerate(
    request: PlaygroundRequest,
    onChunk: (chunk: string) => void,
    onComplete: (response: PlaygroundResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: request.prompt,
          model: request.model,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (!reader) {
        throw new Error('No response stream');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullResponse += chunk;
        onChunk(chunk);
      }

      onComplete({
        response: fullResponse,
        tokens: 0,
        latency: 0,
        model: request.model || 'default',
      });
    } catch (error) {
      onError(error as Error);
    }
  },
};
