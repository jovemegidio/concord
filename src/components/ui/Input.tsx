import React from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, className, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100',
            'placeholder:text-surface-500 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
            'hover:border-surface-600',
            icon && 'pl-10',
            error && 'border-red-500 focus:ring-red-500/50',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

// ── Textarea ────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <div>
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100',
            'placeholder:text-surface-500 transition-colors duration-150 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
            error && 'border-red-500',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
