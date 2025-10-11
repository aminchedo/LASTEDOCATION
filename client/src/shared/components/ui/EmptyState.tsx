import React from 'react';

interface EmptyStateProps {
  message?: string;
  children?: React.ReactNode;
  icon?: any;
  title?: string;
  description?: string;
  illustration?: string;
  size?: string;
}

export function EmptyState({ message = 'No data available', children, icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      {Icon && <Icon className="w-12 h-12 mx-auto mb-4" />}
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {description && <p className="mb-4">{description}</p>}
      {children || <p>{message}</p>}
    </div>
  );
}
