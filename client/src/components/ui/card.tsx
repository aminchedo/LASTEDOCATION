import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: string; // Optional variant prop for compatibility
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ className, children, variant, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-lg border bg-card text-card-foreground shadow-sm',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
    return (
        <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
            {children}
        </div>
    );
}

export function CardContent({ className, children, ...props }: CardContentProps) {
    return (
        <div className={cn('p-6 pt-0', className)} {...props}>
            {children}
        </div>
    );
}
