import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: 'default' | 'bordered' | 'elevated';
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ className, children, variant = 'default', ...props }: CardProps) {
    const variantClasses = {
        default: 'rounded-lg border bg-card text-card-foreground shadow-sm',
        bordered: 'rounded-lg border-2 bg-card text-card-foreground',
        elevated: 'rounded-lg bg-card text-card-foreground shadow-lg',
    };

    return (
        <div
            className={cn(
                variantClasses[variant],
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
