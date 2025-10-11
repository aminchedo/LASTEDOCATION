import React from 'react';
import { clsx } from 'clsx';
import { Button, ButtonProps } from './Button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  } & Partial<ButtonProps>;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('flex flex-col items-center justify-center py-12 px-6 text-center', className)}
        {...props}
      >
        {icon && (
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-[color:var(--c-text-muted)]">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-[color:var(--c-text)] mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-[color:var(--c-text-muted)] mb-6 max-w-md">{description}</p>
        )}
        {action && (
          <Button
            variant={action.variant || 'primary'}
            onClick={action.onClick}
            {...action}
          >
            {action.label}
          </Button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
