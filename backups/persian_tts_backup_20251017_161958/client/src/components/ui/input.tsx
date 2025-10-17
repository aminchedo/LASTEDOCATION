import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    label?: string;
    helperText?: string;
}

export function Input({ className, type, icon, label, helperText, ...props }: InputProps) {
    const inputElement = icon ? (
        <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {icon}
            </div>
            <input
                type={type}
                className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
                {...props}
            />
        </div>
    ) : (
        <input
            type={type}
            className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            {...props}
        />
    );

    if (label || helperText) {
        return (
            <div className="space-y-2">
                {label && (
                    <label className="block text-sm font-medium text-[color:var(--c-text)]">
                        {label}
                    </label>
                )}
                {inputElement}
                {helperText && (
                    <p className="text-xs text-[color:var(--c-text-muted)]">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }

    return inputElement;
}
