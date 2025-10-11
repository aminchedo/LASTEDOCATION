// File: client/src/components/atoms/Badge.tsx
import React from 'react';
import styled, { css } from 'styled-components';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const StyledBadge = styled.span<{ $variant: BadgeVariant; $dot: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  white-space: nowrap;
  
  ${({ $variant, theme }) => {
    const variantColors = {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      success: theme.colors.success,
      warning: theme.colors.warning,
      error: theme.colors.error,
      info: theme.colors.info,
    };
    
    const colors = variantColors[$variant];
    
    return css`
      background: ${colors.main}20;
      color: ${colors.dark};
    `;
  }}
`;

const Dot = styled.span<{ $variant: BadgeVariant }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  
  ${({ $variant, theme }) => {
    const variantColors = {
      primary: theme.colors.primary.main,
      secondary: theme.colors.secondary.main,
      success: theme.colors.success.main,
      warning: theme.colors.warning.main,
      error: theme.colors.error.main,
      info: theme.colors.info.main,
    };
    
    return css`
      background: ${variantColors[$variant]};
    `;
  }}
`;

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  dot = false,
  children,
  ...props
}) => {
  return (
    <StyledBadge $variant={variant} $dot={dot} {...props}>
      {dot && <Dot $variant={variant} />}
      {children}
    </StyledBadge>
  );
};
