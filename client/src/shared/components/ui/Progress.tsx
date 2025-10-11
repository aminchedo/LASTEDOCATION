import React from 'react';
import { clsx } from 'clsx';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      size = 'md',
      variant = 'default',
      showLabel = false,
      className,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeStyles = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    };

    const variantStyles = {
      default: 'bg-[color:var(--c-primary)]',
      success: 'bg-[color:var(--c-success)]',
      warning: 'bg-[color:var(--c-warning)]',
      danger: 'bg-[color:var(--c-danger)]'
    };

    return (
      <div ref={ref} className={clsx('w-full', className)} {...props}>
        <div
          className={clsx(
            'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
            sizeStyles[size]
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={clsx(
              'h-full transition-all duration-300 ease-out rounded-full',
              variantStyles[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="text-xs text-[color:var(--c-text-muted)] mt-1 text-end">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';
