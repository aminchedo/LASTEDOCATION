// File: client/src/components/molecules/FormField.tsx
import React from 'react';
import styled from 'styled-components';
import { Input } from '../atoms/Input';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const Label = styled.label<{ $required: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  
  ${({ $required }) => $required && `
    &::after {
      content: ' *';
      color: #EF4444;
    }
  `}
`;

const HelperText = styled.span<{ $error: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ $error, theme }) => 
    $error ? theme.colors.error.main : theme.colors.text.secondary};
`;

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  error,
  helperText,
  required = false,
  ...inputProps
}) => {
  return (
    <FieldWrapper>
      <Label htmlFor={name} $required={required}>
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        error={!!error}
        required={required}
        {...inputProps}
      />
      {(error || helperText) && (
        <HelperText $error={!!error}>
          {error || helperText}
        </HelperText>
      )}
    </FieldWrapper>
  );
};
