import React from 'react';
import { cn } from '../../lib/utils';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'destructive';
    children: React.ReactNode;
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children: React.ReactNode;
}

export function Alert({ className, variant = 'default', children, ...props }: AlertProps) {
    const variants = {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
    };

    return (
        <div
            role="alert"
            className={cn(
                'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function AlertDescription({ className, children, ...props }: AlertDescriptionProps) {
    return (
        <div
            className={cn('text-sm [&_p]:leading-relaxed', className)}
            {...props}
        >
            {children}
        </div>
    );
}
