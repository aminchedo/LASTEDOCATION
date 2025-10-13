import React from 'react';
import { motion } from 'framer-motion';
import { Icons, IconName } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/lib/utils';
import { slideUp } from '@/shared/animations';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon = 'database',
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  const Icon = Icons[icon];

  return (
    <motion.div
      {...slideUp}
      className={cn('flex-center flex-col py-12 px-4 text-center', className)}
    >
      <div className="w-20 h-20 rounded-full bg-muted flex-center mb-4">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-h4 mb-2">{title}</h3>
      {description && (
        <p className="text-body text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="default">
          <Icons.plus className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
