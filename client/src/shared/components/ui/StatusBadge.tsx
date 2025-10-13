import React from 'react';
import { Icons } from '@/shared/components/icons';
import { cn } from '@/lib/utils';

type Status = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface StatusBadgeProps {
  status: Status;
  label: string;
  animated?: boolean;
  className?: string;
}

const statusConfig = {
  success: {
    icon: Icons.success,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  error: {
    icon: Icons.error,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
  warning: {
    icon: Icons.warning,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  },
  info: {
    icon: Icons.info,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  },
  loading: {
    icon: Icons.spinner,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  },
};

export function StatusBadge({ status, label, animated = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isLoading = status === 'loading';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className={cn('w-3.5 h-3.5', isLoading && animated && 'animate-spin')} />
      <span>{label}</span>
    </div>
  );
}
