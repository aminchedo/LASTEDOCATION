// File: client/src/pages/Auth/LoginPage.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { FormField } from '../../components/molecules/FormField';
import { Card } from '../../components/atoms/Card';
import { authService } from '../../services/auth.service';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background.paper};
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing(3)};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authService.login(credentials);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageContainer>
      <LoginCard padding="lg" elevation="lg">
        <Title>ورود به سیستم</Title>
        <Form onSubmit={handleSubmit}>
          <FormField
            name="username"
            label="نام کاربری"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            required
          />
          <FormField
            name="password"
            label="رمز عبور"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            error={error}
            required
          />
          <Button
            type="submit"
            variant="primary"
            leftIcon={<LogIn size={20} />}
            loading={loading}
            fullWidth
          >
            ورود
          </Button>
        </Form>
      </LoginCard>
    </PageContainer>
  );
};
