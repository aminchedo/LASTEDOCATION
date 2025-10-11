import { useState, useRef, useEffect } from 'react';
import { Send, X, Trash2, Settings, Mic, Paperclip } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { useChat } from '@/features/chat/hooks/useChat';
import { useKeyboardShortcuts } from '@/features/chat/hooks/useKeyboardShortcuts';
import { ChatBubble } from '@/features/chat/components/ChatBubble';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import { useTheme } from '@/core/contexts/ThemeContext';
import toast from 'react-hot-toast';

interface SystemNoticeProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  onClose?: () => void;
}

function SystemNotice({ type, message, onClose }: SystemNoticeProps) {
  const typeStyles = {
    info: 'bg-[color:var(--c-info)]/10 border-[color:var(--c-info)] text-[color:var(--c-info)]',
    success: 'bg-[color:var(--c-success)]/10 border-[color:var(--c-success)] text-[color:var(--c-success)]',
    warning: 'bg-[color:var(--c-warning)]/10 border-[color:var(--c-warning)] text-[color:var(--c-warning)]',
    error: 'bg-[color:var(--c-danger)]/10 border-[color:var(--c-danger)] text-[color:var(--c-danger)]'
  };

  return (
    <div className={`p-3 rounded-lg border ${typeStyles[type]} mb-4`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            icon={<X className="w-4 h-4" />}
            onClick={onClose}
            className="h-6 w-6 p-0"
          />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const suggestions = [
    'سلام! چطور می‌تونم کمکت کنم؟',
    'یک داستان کوتاه بنویس',
    'کد Python برای مرتب‌سازی بنویس',
    'در مورد هوش مصنوعی توضیح بده'
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
      <div className="w-24 h-24 mb-6 rounded-full bg-[color:var(--c-primary)]/10 flex items-center justify-center">
        <span className="text-4xl font-bold text-[color:var(--c-primary)]">د</span>
      </div>
      <h2 className="text-2xl font-bold text-[color:var(--c-text)] mb-2">
        چت خود را شروع کنید
      </h2>
      <p className="text-[color:var(--c-text-muted)] mb-8 max-w-md">
        من یک دستیار هوش مصنوعی هستم که می‌توانم به سوالات شما پاسخ دهم و در کارهای مختلف کمکتان کنم.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto p-4 text-right justify-start hover:-translate-y-[1px] transition-all duration-200"
            onClick={() => {
              // This would be handled by the parent component
              console.log('Suggestion clicked:', suggestion);
            }}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ChatHeader({ 
  messageCount, 
  onClearChat, 
  onSettingsClick 
}: { 
  messageCount: number;
  onClearChat: () => void;
  onSettingsClick: () => void;
}) {
  const { settings } = useTheme();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearChat = () => {
    if (showClearConfirm) {
      onClearChat();
      setShowClearConfirm(false);
      toast.success('تاریخچه چت پاک شد');
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-[color:var(--c-border)] bg-[color:var(--c-surface)]">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-[color:var(--c-text)]">چت هوش مصنوعی</h1>
        {messageCount > 0 && (
          <Badge variant="secondary">{messageCount} پیام</Badge>
        )}
        <Badge variant={settings.api?.baseUrl?.includes('localhost') ? 'warning' : 'success'}>
          {settings.api?.baseUrl?.includes('localhost') ? 'محلی' : 'خارجی'}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 className="w-4 h-4" />}
          onClick={handleClearChat}
          aria-label={showClearConfirm ? 'تایید پاک کردن' : 'پاک کردن چت'}
          className={showClearConfirm ? 'text-[color:var(--c-danger)]' : ''}
        >
          {showClearConfirm ? 'تایید' : 'پاک کردن'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Settings className="w-4 h-4" />}
          onClick={onSettingsClick}
          aria-label="تنظیمات"
        />
      </div>
    </div>
  );
}

function Composer({ 
  value, 
  onChange, 
  onSend, 
  onCancel, 
  isLoading, 
  inputRef 
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const [isRecording, setIsRecording] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    toast(isRecording ? 'ضبط صدا متوقف شد' : 'ضبط صدا شروع شد', { icon: '🎤' });
  };

  const handleAttachClick = () => {
    toast('آپلود فایل (در حال توسعه)', { icon: '📎' });
  };

  return (
    <div className="p-4 border-t border-[color:var(--c-border)] bg-[color:var(--c-surface)]">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="پیام خود را بنویسید..."
            className="w-full min-h-[44px] max-h-[200px] p-3 border border-[color:var(--c-border)] rounded-xl bg-[color:var(--c-bg)] text-[color:var(--c-text)] placeholder:text-[color:var(--c-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)] resize-none transition-all duration-200"
            disabled={isLoading}
            aria-label="ورودی چت"
          />
          <div className="flex items-center justify-between mt-2 text-xs text-[color:var(--c-text-muted)]">
            <span>{value.length} کاراکتر</span>
            <div className="flex items-center gap-4">
              <span>Enter برای ارسال</span>
              <span>Shift+Enter برای خط جدید</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Mic className="w-4 h-4" />}
            onClick={handleMicClick}
            className={isRecording ? 'text-[color:var(--c-danger)]' : ''}
            aria-label={isRecording ? 'توقف ضبط' : 'شروع ضبط'}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Paperclip className="w-4 h-4" />}
            onClick={handleAttachClick}
            aria-label="پیوست فایل"
          />
          {isLoading ? (
            <Button
              variant="danger"
              size="sm"
              icon={<X className="w-4 h-4" />}
              onClick={onCancel}
              aria-label="لغو درخواست"
            >
              لغو
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              onClick={onSend}
              disabled={!value.trim()}
              aria-label="ارسال پیام"
            >
              ارسال
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function NewPersianChatPage() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    cancelRequest,
    clearChat,
    messagesEndRef,
  } = useChat();
  
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useKeyboardShortcuts({
    onSend: () => {
      if (input.trim()) {
        sendMessage({ content: input.trim() });
        setInput('');
      }
    },
    onClear: () => setInput(''),
  });

  // Show offline notice if there's an error
  useEffect(() => {
    if (error && error.includes('API')) {
      setShowOfflineNotice(true);
    }
  }, [error]);

  return (
    <div className="flex h-full flex-col bg-[color:var(--c-bg)]">
      <ChatHeader
        messageCount={messages.length}
        onClearChat={clearChat}
        onSettingsClick={() => {}}
      />

      {showOfflineNotice && (
        <SystemNotice
          type="warning"
          message="API در دسترس نیست - از حالت آفلاین استفاده می‌شود"
          onClose={() => setShowOfflineNotice(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6"
          aria-live="polite"
        >
          {messages.length === 0 && !isLoading ? (
            <EmptyState />
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <Card variant="elevated" className="max-w-[65ch]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[color:var(--c-primary)]/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-[color:var(--c-primary)]">د</span>
                        </div>
                        <TypingIndicator />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <Composer
          value={input}
          onChange={setInput}
          onSend={() => {
            if (input.trim()) {
              sendMessage({ content: input.trim() });
              setInput('');
            }
          }}
          onCancel={cancelRequest}
          isLoading={isLoading}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
}

// Default export for React.lazy compatibility
export default NewPersianChatPage;
