import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'error' | 'info' | 'primary';
    children: React.ReactNode;
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
    const variants = {
        default: 'bg-primary text-primary-foreground',
        primary: 'bg-blue-600 text-white',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input',
        success: 'bg-green-500 text-white',
        warning: 'bg-yellow-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white',
    };

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
