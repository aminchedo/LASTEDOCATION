import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-[color:var(--c-surface)] border border-[color:var(--c-border)]',
      elevated: 'bg-[color:var(--c-surface)] shadow-lg',
      outlined: 'bg-transparent border-2 border-[color:var(--c-border)]'
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-lg transition-shadow',
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, actions, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('px-6 py-4 border-b border-[color:var(--c-border)]', className)}
        {...props}
      >
        {children || (
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-[color:var(--c-text)]">{title}</h3>}
              {subtitle && <p className="text-sm text-[color:var(--c-text-muted)] mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('px-6 py-4', className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('px-6 py-4 border-t border-[color:var(--c-border)]', className)}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';
