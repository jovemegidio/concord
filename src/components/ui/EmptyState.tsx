import React from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => (
  <div className={cn('flex-1 flex items-center justify-center', className)}>
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-surface-200 mb-2">{title}</h3>
      {description && <p className="text-sm text-surface-500 mb-4">{description}</p>}
      {action}
    </div>
  </div>
);
