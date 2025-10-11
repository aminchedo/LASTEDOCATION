import React from 'react';
import { cn } from '../../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: string;
  height?: number;
}

export function Skeleton({ className, height, ...props }: SkeletonProps) {
  const style = height ? { height: `${height}px` } : {};
  return (
    <div
      className={cn('animate-pulse bg-gray-200 dark:bg-gray-700 rounded', className)}
      style={style}
      {...props}
    />
  );
}
