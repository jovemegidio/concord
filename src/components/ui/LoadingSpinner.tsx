import React from 'react';
import { cn } from '@/lib/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className, label }) => (
  <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
    <div className={cn('border-2 border-surface-600 border-t-brand-500 rounded-full animate-spin', sizeMap[size])} />
    {label && <p className="text-xs text-surface-500">{label}</p>}
  </div>
);
