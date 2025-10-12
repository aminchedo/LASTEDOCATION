// File: client/src/pages/Chat/ChatPage.tsx
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/components/ui/card';
import { chatService } from '../../services/chat.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await chatService.sendMessage(input);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.reply,
      }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 h-[calc(100vh-100px)] flex flex-col">
      <h1 className="text-2xl font-bold mb-4">گفتگو با هوش مصنوعی</h1>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'self-end bg-blue-100 dark:bg-blue-900'
                  : 'self-start bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <Input
            placeholder="پیام خود را بنویسید..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button
            variant="primary"
            icon={<Send size={20} />}
            onClick={handleSend}
            loading={loading}
            disabled={loading}
          >
            ارسال
          </Button>
        </div>
      </Card>
    </div>
  );
};
