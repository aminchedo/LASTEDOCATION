import React from 'react';
import { motion } from 'framer-motion';
import { Icons, IconName } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/shared/animations';

interface QuickAction {
  id: string;
  icon: IconName;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={cn('flex flex-wrap gap-3', className)}
    >
      {actions.map((action) => {
        const Icon = Icons[action.icon];
        return (
          <motion.div key={action.id} variants={staggerItem}>
            <Button
              onClick={action.onClick}
              variant={action.variant || 'outline'}
              className="gap-2"
              disabled={action.disabled}
            >
              <Icon className="w-4 h-4" />
              <span>{action.label}</span>
            </Button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
