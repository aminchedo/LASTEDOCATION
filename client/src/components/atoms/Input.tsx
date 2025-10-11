// File: client/src/components/atoms/Input.tsx
import React from 'react';
import styled, { css } from 'styled-components';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const InputWrapper = styled.div<{ $fullWidth: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  
  ${({ $fullWidth }) => $fullWidth && css`
    width: 100%;
  `}
`;

const StyledInput = styled.input<{ 
  $error: boolean; 
  $hasLeftIcon: boolean; 
  $hasRightIcon: boolean;
}>`
  width: 100%;
  padding: ${({ theme }) => theme.spacing(1.25)} ${({ theme }) => theme.spacing(1.5)};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.background.default};
  border: 1px solid ${({ theme }) => theme.colors.border.main};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  ${({ $hasLeftIcon, theme }) => $hasLeftIcon && css`
    padding-left: ${theme.spacing(5)};
  `}
  
  ${({ $hasRightIcon, theme }) => $hasRightIcon && css`
    padding-right: ${theme.spacing(5)};
  `}
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.disabled};
  }
  
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.border.dark};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
  
  &:disabled {
    background: ${({ theme }) => theme.colors.neutral[100]};
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${({ $error, theme }) => $error && css`
    border-color: ${theme.colors.error.main};
    
    &:focus {
      border-color: ${theme.colors.error.main};
      box-shadow: 0 0 0 3px ${theme.colors.error.main}20;
    }
  `}
`;

const IconContainer = styled.span<{ $position: 'left' | 'right' }>`
  position: absolute;
  ${({ $position }) => $position}: ${({ theme }) => theme.spacing(1.5)};
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  pointer-events: none;
`;

export const Input: React.FC<InputProps> = ({
  fullWidth = false,
  error = false,
  leftIcon,
  rightIcon,
  ...props
}) => {
  return (
    <InputWrapper $fullWidth={fullWidth}>
      {leftIcon && <IconContainer $position="left">{leftIcon}</IconContainer>}
      <StyledInput
        $error={error}
        $hasLeftIcon={!!leftIcon}
        $hasRightIcon={!!rightIcon}
        {...props}
      />
      {rightIcon && <IconContainer $position="right">{rightIcon}</IconContainer>}
    </InputWrapper>
  );
};
