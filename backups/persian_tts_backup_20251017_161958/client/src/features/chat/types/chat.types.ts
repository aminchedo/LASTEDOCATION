export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    tokens?: number;
    error?: boolean;
    [key: string]: any;
  };
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  abortController: AbortController | null;
}

export interface SendMessageOptions {
  content: string;
  role?: 'user' | 'system';
  metadata?: ChatMessage['metadata'];
}

export interface ChatResponse {
  message: string;
  model?: string;
  tokens?: number;
  [key: string]: any;
}
