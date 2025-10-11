import { useState, useRef, useEffect } from 'react';
import { Send, X, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '../hooks/useChat';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';

export function ChatContainer() {
  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    cancelRequest,
    messagesEndRef,
    scrollToBottom,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // Detect scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    sendMessage({ content: trimmed });
    setInputValue('');
  };

  const handleCancel = () => {
    if (isLoading) {
      cancelRequest();
    } else {
      setInputValue('');
      textareaRef.current?.focus();
    }
  };

  useKeyboardShortcuts({
    onSend: handleSend,
    onCancel: handleCancel,
    enabled: true,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6"
        role="log"
        aria-live="polite"
        aria-label="محتوای چت"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {isTyping && (
              <div className="flex justify-start animate-[fadeSlideUp_.25s_ease-out_both]">
                <div className="bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded-2xl px-5 py-3 shadow-[var(--shadow-2)]">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowDown className="w-4 h-4" />}
            onClick={() => scrollToBottom('smooth')}
            className="shadow-[var(--shadow-3)] animate-[fadeSlideUp_.25s_ease-out_both]"
            aria-label="اسکرول به پایین"
          >
            پیام جدید
          </Button>
        </div>
      )}

      {/* Input Bar */}
      <div className="sticky bottom-0 bg-[color:var(--c-bg)] border-t border-[color:var(--c-border)] px-4 sm:px-6 py-4 shadow-[var(--shadow-2)]">
        <div className="max-w-4xl mx-auto">
          <div 
            className="flex items-end gap-2 bg-[color:var(--c-surface)] border border-[color:var(--c-border)] rounded-2xl p-2 shadow-[var(--shadow-1)] transition-all duration-200 focus-within:ring-2 focus-within:ring-[color:var(--c-primary)] focus-within:border-transparent"
            role="group"
            aria-label="ناحیه ورودی پیام"
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="پیام خود را بنویسید... (Enter برای ارسال، Shift+Enter برای خط جدید)"
              className="flex-1 bg-transparent px-3 py-2 text-[color:var(--c-text)] placeholder:text-[color:var(--c-muted)] resize-none focus:outline-none min-h-[44px]"
              rows={1}
              disabled={isLoading}
              aria-label="ورودی پیام"
            />
            <div className="flex items-center gap-1">
              {(isLoading || inputValue.trim()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-5 h-5" />}
                  onClick={handleCancel}
                  aria-label={isLoading ? 'لغو درخواست' : 'پاک کردن ورودی'}
                  title={isLoading ? 'لغو' : 'پاک کردن'}
                  className="min-h-11 min-w-11"
                />
              )}
              <Button
                variant="primary"
                size="sm"
                icon={<Send className="w-5 h-5" />}
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                loading={isLoading}
                aria-label="ارسال پیام"
                title="ارسال (Enter)"
                className="min-h-11 min-w-11"
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2.5 text-xs text-[color:var(--c-muted)]">
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-[color:var(--c-border)] rounded text-xs font-medium">Enter</kbd>
              ارسال
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-[color:var(--c-border)] rounded text-xs font-medium">Shift+Enter</kbd>
              خط جدید
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-[color:var(--c-border)] rounded text-xs font-medium">Esc</kbd>
              لغو
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="max-w-md space-y-6 animate-[fadeSlideUp_.3s_ease-out_both]">
        <div className="w-20 h-20 mx-auto bg-[color:var(--c-primary)]/10 rounded-2xl flex items-center justify-center">
          <Send className="w-10 h-10 text-[color:var(--c-primary)]" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[color:var(--c-text)]">
            به چت هوش مصنوعی خوش آمدید
          </h2>
          <p className="text-base text-[color:var(--c-muted)] leading-relaxed">
            پیام خود را در پایین تایپ کنید و با هوش مصنوعی گفتگو کنید. از Markdown و
            قالب‌بندی کد پشتیبانی می‌شود.
          </p>
        </div>
      </div>
    </div>
  );
}
