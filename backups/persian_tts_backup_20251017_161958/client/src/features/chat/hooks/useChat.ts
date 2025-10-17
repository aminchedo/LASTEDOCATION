import { useState, useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { APP_CONFIG } from '@/core/config/app.config';
import { getStorageItem, setStorageItem } from '@/shared/utils/storage';
import { sendChatMessage, formatMessagesForApi, createMessage } from '../services/chat.service';
import type { ChatMessage, ChatState, SendMessageOptions } from '../types/chat.types';

export function useChat() {
  const [state, setState] = useState<ChatState>(() => {
    const storedMessages = getStorageItem<ChatMessage[]>(APP_CONFIG.storage.chatHistoryKey, []);
    return {
      messages: storedMessages.slice(-APP_CONFIG.chat.maxHistorySize),
      isLoading: false,
      isTyping: false,
      error: null,
      abortController: null,
    };
  });

  const lastSendTimeRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist messages to localStorage
  useEffect(() => {
    if (state.messages.length > 0) {
      const toStore = state.messages.slice(-APP_CONFIG.chat.maxHistorySize);
      setStorageItem(APP_CONFIG.storage.chatHistoryKey, toStore);
    }
  }, [state.messages]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Add message
  const addMessage = useCallback((message: ChatMessage) => {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  // Send message
  const sendMessage = useCallback(
    async ({ content, role = 'user', metadata }: SendMessageOptions) => {
      // Throttle sends
      const now = Date.now();
      const timeSinceLastSend = now - lastSendTimeRef.current;
      if (timeSinceLastSend < APP_CONFIG.chat.throttleMs) {
        toast.error(`لطفا ${Math.ceil((APP_CONFIG.chat.throttleMs - timeSinceLastSend) / 1000)} ثانیه صبر کنید`);
        return;
      }

      // Validation
      const trimmed = content.trim();
      if (!trimmed) {
        toast.error('لطفا پیامی وارد کنید');
        return;
      }

      lastSendTimeRef.current = now;

      // Create abort controller
      const abortController = new AbortController();

      setState((prev) => ({
        ...prev,
        isLoading: true,
        isTyping: false,
        error: null,
        abortController,
      }));

      // Add user message
      const userMessage = createMessage(role, trimmed, metadata);
      addMessage(userMessage);

      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);

      try {
        // Show typing indicator
        setState((prev) => ({ ...prev, isTyping: true }));

        // Send to API
        const history = formatMessagesForApi(state.messages);
        const response = await sendChatMessage(
          {
            message: trimmed,
            history,
          },
          abortController.signal
        );

        // Hide typing indicator
        setState((prev) => ({ ...prev, isTyping: false }));

        // Add assistant message
        const assistantMessage = createMessage('assistant', response.message, {
          model: response.model,
          tokens: response.tokens,
        });
        addMessage(assistantMessage);

        // Scroll to bottom
        setTimeout(() => scrollToBottom(), 100);
      } catch (error: any) {
        setState((prev) => ({ ...prev, isTyping: false }));

        if (error.message === 'Request was canceled') {
          // User canceled - no error message needed
          return;
        }

        const errorMessage = error.message || 'خطا در ارسال پیام';
        setState((prev) => ({ ...prev, error: errorMessage }));

        // Add error message
        const errorMsg = createMessage('assistant', `⚠️ ${errorMessage}`, {
          error: true,
        });
        addMessage(errorMsg);

        toast.error(errorMessage);
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          abortController: null,
        }));
      }
    },
    [state.messages, addMessage, scrollToBottom]
  );

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (state.abortController) {
      state.abortController.abort();
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isTyping: false,
        abortController: null,
      }));
      toast.success('درخواست لغو شد');
    }
  }, [state.abortController]);

  // Clear chat
  const clearChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      isTyping: false,
      error: null,
      abortController: null,
    });
    setStorageItem(APP_CONFIG.storage.chatHistoryKey, []);
    toast.success('چت پاک شد');
  }, []);

  // Retry last message
  const retryLast = useCallback(() => {
    const lastUserMessage = [...state.messages]
      .reverse()
      .find((msg) => msg.role === 'user');

    if (lastUserMessage) {
      // Remove messages after the last user message
      setState((prev) => ({
        ...prev,
        messages: prev.messages.slice(
          0,
          prev.messages.findIndex((msg) => msg.id === lastUserMessage.id) + 1
        ),
      }));

      // Resend
      sendMessage({
        content: lastUserMessage.content,
        metadata: lastUserMessage.metadata,
      });
    }
  }, [state.messages, sendMessage]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isTyping: state.isTyping,
    error: state.error,
    sendMessage,
    cancelRequest,
    clearChat,
    retryLast,
    messagesEndRef,
    scrollToBottom,
  };
}
