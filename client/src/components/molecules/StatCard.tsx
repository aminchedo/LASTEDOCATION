// File: client/src/components/molecules/StatCard.tsx
import React from 'react';
import styled from 'styled-components';
import { Card } from '../atoms/Card';

type StatColor = 'primary' | 'success' | 'warning' | 'error' | 'info';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: StatColor;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

const CardContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const IconWrapper = styled.div<{ $color: StatColor }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ $color, theme }) => {
    const colorMap = {
      primary: theme.colors.primary.main,
      success: theme.colors.success.main,
      warning: theme.colors.warning.main,
      error: theme.colors.error.main,
      info: theme.colors.info.main,
    };
    return `${colorMap[$color]}20`;
  }};
  color: ${({ $color, theme }) => {
    const colorMap = {
      primary: theme.colors.primary.main,
      success: theme.colors.success.main,
      warning: theme.colors.warning.main,
      error: theme.colors.error.main,
      info: theme.colors.info.main,
    };
    return colorMap[$color];
  }};
`;

const ContentWrapper = styled.div`
  flex: 1;
`;

const Title = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

const Value = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Trend = styled.div<{ $isPositive: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ $isPositive, theme }) => 
    $isPositive ? theme.colors.success.main : theme.colors.error.main};
  margin-top: ${({ theme }) => theme.spacing(0.5)};
`;

const SkeletonValue = styled.div`
  height: 32px;
  width: 80px;
  background: ${({ theme }) => theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  loading = false,
}) => {
  return (
    <Card padding="lg" elevation="md">
      <CardContent>
        {icon && <IconWrapper $color={color}>{icon}</IconWrapper>}
        <ContentWrapper>
          <Title>{title}</Title>
          {loading ? (
            <SkeletonValue />
          ) : (
            <>
              <Value>{value}</Value>
              {trend && (
                <Trend $isPositive={trend.isPositive}>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </Trend>
              )}
            </>
          )}
        </ContentWrapper>
      </CardContent>
    </Card>
  );
};
