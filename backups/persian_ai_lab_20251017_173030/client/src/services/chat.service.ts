// File: client/src/services/chat.service.ts
import { api } from './api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatResponse {
  reply: string;
  conversationId?: string;
}

export const chatService = {
  async sendMessage(message: string, conversationId?: string): Promise<ChatResponse> {
    return api.post<ChatResponse>('/api/chat', {
      message,
      conversationId,
    });
  },

  async getConversationHistory(conversationId: string): Promise<ChatMessage[]> {
    return api.get<ChatMessage[]>(`/api/chat/conversations/${conversationId}`);
  },

  async clearConversation(conversationId: string): Promise<void> {
    return api.delete(`/api/chat/conversations/${conversationId}`);
  },
};
