import React, { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  message?: string;
  children?: ReactNode;
  icon?: any;
  title?: string;
  description?: string;
  illustration?: string;
  size?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  message = 'No data available', 
  children, 
  icon: Icon, 
  title, 
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400 ${className}`}>
      {Icon && (
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <Icon className="w-12 h-12 text-gray-400" />
        </div>
      )}
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>}
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">{description}</p>}
      {children || <p>{message}</p>}
      {action && (
        <Button onClick={action.onClick} variant="primary" className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
