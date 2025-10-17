import { useState, useCallback } from 'react';
import { apiService } from '@/shared/utils/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatResponse {
  message: string;
  model?: string;
  tokens?: number;
}

export function useChatAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, fileUrls?: string[]): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.post<ChatResponse>('/api/chat', {
        message: content,
        files: fileUrls,
      });

      if (response.success) {
        return response.data.message;
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiService.post<{ url: string }>('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.success) {
        return response.data.url;
      } else {
        throw new Error(response.error || 'Failed to upload file');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload file';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { 
    sendMessage, 
    uploadFile, 
    isLoading, 
    error 
  };
}
