import React from 'react';
import { clsx } from 'clsx';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 rounded-lg',
          'bg-[color:var(--c-bg-elevated)] text-[color:var(--c-text)]',
          'border border-[color:var(--c-border)]',
          'focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)] focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-[color:var(--c-danger)] focus:ring-[color:var(--c-danger)]',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';