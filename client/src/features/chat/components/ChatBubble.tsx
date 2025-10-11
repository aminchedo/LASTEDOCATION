import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useTheme } from '@/core/contexts/ThemeContext';
import { Button } from '@/shared/components/ui/Button';
import type { ChatMessage } from '../types/chat.types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const { resolvedTheme } = useTheme();
  const isUser = message.role === 'user';
  const isError = message.metadata?.error;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-[fadeSlideUp_.25s_ease-out_both]`}
      role="article"
      aria-label={`${isUser ? 'پیام شما' : 'پاسخ دستیار'}`}
    >
      <div
        className={`
          max-w-[65ch] rounded-2xl p-4 sm:p-5
          ${
            isUser
              ? 'bg-[color:var(--c-primary)] text-white shadow-[var(--shadow-2)]'
              : isError
              ? 'bg-[color:var(--c-error)] text-white border border-[color:var(--c-error)] shadow-[var(--shadow-2)]'
              : 'bg-[color:var(--c-surface)] border border-[color:var(--c-border)] text-[color:var(--c-text)] shadow-[var(--shadow-2)]'
          }
        `}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        ) : (
          <div className="markdown-content prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code(props) {
                  const { node, inline, className, children, ...rest } = props as any;
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const code = String(children).replace(/\n$/, '');

                  if (!inline && language) {
                    return (
                      <CodeBlock
                        code={code}
                        language={language}
                        theme={resolvedTheme}
                      />
                    );
                  }

                  return (
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Metadata */}
        {message.metadata?.model && !isError && (
          <div className="mt-3 pt-3 border-t border-current/10 text-xs opacity-70 flex items-center gap-2">
            <span>{message.metadata.model}</span>
            {message.metadata.tokens && (
              <>
                <span>•</span>
                <span>{message.metadata.tokens} tokens</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
  theme: 'light' | 'dark';
}

function CodeBlock({ code, language, theme }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden shadow-[var(--shadow-1)]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[color:var(--c-surface)] border-b border-[color:var(--c-border)]">
        <span className="text-xs font-medium text-[color:var(--c-muted)] uppercase tracking-wide">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          aria-label="کپی کد"
          className="opacity-70 group-hover:opacity-100 transition-opacity min-h-8 px-3 py-1.5"
        >
          <span className="text-xs">{copied ? 'کپی شد' : 'کپی'}</span>
        </Button>
      </div>
      <div className="overflow-x-auto border border-t-0 border-[color:var(--c-border)]">
        <SyntaxHighlighter
          language={language}
          style={theme === 'dark' ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            background: 'var(--c-surface)',
            fontSize: '0.875rem',
            padding: '1rem',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'Fira Code, monospace',
              fontSize: '0.875rem',
              lineHeight: '1.6',
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
