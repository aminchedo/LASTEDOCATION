// File: client/src/pages/Chat/ChatPage.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { Send } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '../../components/atoms/Input';
import { Card } from '../../components/atoms/Card';
import { chatService } from '../../services/chat.service';

const PageContainer = styled.div`
  padding: ${({ theme }) => theme.spacing(3)};
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
`;

const ChatContainer = styled(Card)`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing(2)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Message = styled.div<{ $isUser: boolean }>`
  max-width: 70%;
  padding: ${({ theme }) => theme.spacing(1.5)};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  align-self: ${({ $isUser }) => $isUser ? 'flex-end' : 'flex-start'};
  background: ${({ $isUser, theme }) => 
    $isUser ? theme.colors.primary[100] : theme.colors.neutral[100]};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const InputArea = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(2)};
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
`;

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
    <PageContainer>
      <h1>گفتگو با هوش مصنوعی</h1>
      <ChatContainer padding="none" elevation="md">
        <MessagesArea>
          {messages.map((msg, idx) => (
            <Message key={idx} $isUser={msg.role === 'user'}>
              {msg.content}
            </Message>
          ))}
        </MessagesArea>
        <InputArea>
          <Input
            placeholder="پیام خود را بنویسید..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            fullWidth
          />
          <Button
            variant="primary"
            leftIcon={<Send size={20} />}
            onClick={handleSend}
            loading={loading}
          >
            ارسال
          </Button>
        </InputArea>
      </ChatContainer>
    </PageContainer>
  );
};
