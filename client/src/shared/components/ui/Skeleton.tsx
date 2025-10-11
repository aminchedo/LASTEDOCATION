import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'text', width, height, className, style, ...props }, ref) => {
    const variantStyles = {
      text: 'rounded h-4',
      rectangular: 'rounded-lg',
      circular: 'rounded-full'
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'animate-pulse bg-gray-200 dark:bg-gray-700',
          variantStyles[variant],
          className
        )}
        style={{
          width,
          height,
          ...style
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
