// File: client/src/components/atoms/Card.tsx
import React from 'react';
import styled, { css } from 'styled-components';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardElevation = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  elevation?: CardElevation;
  hoverable?: boolean;
}

const StyledCard = styled.div<{
  $padding: CardPadding;
  $elevation: CardElevation;
  $hoverable: boolean;
}>`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  transition: all ${({ theme }) => theme.transitions.base};
  
  ${({ $padding, theme }) => {
    switch ($padding) {
      case 'none':
        return css`padding: 0;`;
      case 'sm':
        return css`padding: ${theme.spacing(1.5)};`;
      case 'lg':
        return css`padding: ${theme.spacing(3)};`;
      default:
        return css`padding: ${theme.spacing(2)};`;
    }
  }}
  
  ${({ $elevation, theme }) => {
    switch ($elevation) {
      case 'none':
        return css`box-shadow: none;`;
      case 'sm':
        return css`box-shadow: ${theme.shadows.sm};`;
      case 'lg':
        return css`box-shadow: ${theme.shadows.lg};`;
      default:
        return css`box-shadow: ${theme.shadows.md};`;
    }
  }}
  
  ${({ $hoverable, theme }) => $hoverable && css`
    cursor: pointer;
    
    &:hover {
      box-shadow: ${theme.shadows.xl};
      transform: translateY(-2px);
    }
  `}
`;

export const Card: React.FC<CardProps> = ({
  padding = 'md',
  elevation = 'md',
  hoverable = false,
  children,
  ...props
}) => {
  return (
    <StyledCard
      $padding={padding}
      $elevation={elevation}
      $hoverable={hoverable}
      {...props}
    >
      {children}
    </StyledCard>
  );
};
