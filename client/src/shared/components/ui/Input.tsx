import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      fullWidth = false,
      error = false,
      leftIcon,
      rightIcon,
      label,
      helperText,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[color:var(--c-text)]"
          >
            {label}
          </label>
        )}
        <div className="relative inline-flex items-center">
          {leftIcon && (
            <span className="absolute start-3 flex items-center pointer-events-none text-[color:var(--c-text-muted)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full px-4 py-2.5 text-base rounded-lg transition-all',
              'bg-[color:var(--c-bg)] text-[color:var(--c-text)]',
              'border border-[color:var(--c-border)]',
              'placeholder:text-[color:var(--c-text-muted)]',
              'hover:border-[color:var(--c-primary-600)]',
              'focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)] focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800',
              'min-h-[44px]',
              leftIcon && 'ps-10',
              rightIcon && 'pe-10',
              error && 'border-[color:var(--c-danger)] focus:ring-[color:var(--c-danger)]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute end-3 flex items-center pointer-events-none text-[color:var(--c-text-muted)]">
              {rightIcon}
            </span>
          )}
        </div>
        {helperText && (
          <p className={clsx(
            'text-sm',
            error ? 'text-[color:var(--c-danger)]' : 'text-[color:var(--c-text-muted)]'
          )}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
