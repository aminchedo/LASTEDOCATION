import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles = {
      primary: 'bg-[color:var(--c-primary)] text-white hover:bg-[color:var(--c-primary-600)] focus-visible:ring-[color:var(--c-primary)]',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
      outline: 'border-2 border-[color:var(--c-primary)] text-[color:var(--c-primary)] hover:bg-[color:var(--c-primary-50)] dark:hover:bg-[color:var(--c-primary-700)]',
      ghost: 'text-[color:var(--c-text)] hover:bg-gray-100 dark:hover:bg-gray-800',
      danger: 'bg-[color:var(--c-danger)] text-white hover:bg-red-600 focus-visible:ring-red-500'
    };
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm min-h-[36px]',
      md: 'px-4 py-2 text-base min-h-[44px]',
      lg: 'px-6 py-3 text-lg min-h-[48px]'
    };

    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          loading && 'pointer-events-none opacity-70',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
