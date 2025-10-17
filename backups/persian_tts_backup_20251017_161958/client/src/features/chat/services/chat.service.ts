import { apiPost } from '@/shared/utils/api';
import type { ChatMessage, ChatResponse } from '../types/chat.types';

export interface SendChatMessagePayload {
  message: string;
  history?: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
}

export async function sendChatMessage(
  payload: SendChatMessagePayload,
  signal?: AbortSignal
): Promise<ChatResponse> {
  try {
    const response = await apiPost<ChatResponse>(
      '/api/chat',
      {
        message: payload.message,
        history: payload.history || [],
        model: payload.model || 'gpt-4',
        temperature: payload.temperature ?? 0.7,
      },
      { signal }
    );

    return response;
  } catch (error: any) {
    // If request was aborted, throw specific error
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      throw new Error('Request was canceled');
    }

    // Handle network errors
    if (!error.response) {
      throw new Error('Network error - please check your connection');
    }

    // Handle API errors
    const status = error.response?.status;
    const message = error.response?.data?.error || error.message;

    if (status === 401) {
      throw new Error('Unauthorized - please check your API key in settings');
    }
    if (status === 429) {
      throw new Error('Rate limit exceeded - please try again later');
    }
    if (status === 500) {
      throw new Error('Server error - please try again later');
    }

    throw new Error(message || 'Failed to send message');
  }
}

export function formatMessagesForApi(messages: ChatMessage[]): Array<{ role: string; content: string }> {
  return messages
    .filter((msg) => msg.role !== 'system' || msg.metadata?.includeInHistory)
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
}

export function createMessage(
  role: ChatMessage['role'],
  content: string,
  metadata?: ChatMessage['metadata']
): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: Date.now(),
    metadata,
  };
}
