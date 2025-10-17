import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/shared/components/icons';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'skeleton' | 'pulse';
  className?: string;
}

export function LoadingState({ 
  message = 'در حال بارگذاری...', 
  size = 'md',
  variant = 'spinner',
  className 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (variant === 'spinner') {
    return (
      <div className={cn('flex-center flex-col gap-3', className)}>
        <Icons.spinner className={cn('animate-spin text-primary', sizeClasses[size])} />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      </div>
    );
  }

  // pulse variant
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
      className={cn('flex-center flex-col gap-3', className)}
    >
      <Icons.loader className={cn('text-primary', sizeClasses[size])} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </motion.div>
  );
}

// Inline spinner for buttons
export function ButtonSpinner({ className }: { className?: string }) {
  return <Icons.spinner className={cn('w-4 h-4 animate-spin', className)} />;
}

// Full page loader
export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex-center bg-background/80 backdrop-blur-sm z-50">
      <LoadingState message={message} size="lg" />
    </div>
  );
}
