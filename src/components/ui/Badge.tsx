import React from 'react';
import { cn } from '@/lib/cn';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'outline' | 'soft';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color,
  variant = 'soft',
  size = 'sm',
  className,
}) => {
  const baseClasses = cn(
    'inline-flex items-center font-medium rounded-full',
    size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
  );

  if (color && variant === 'soft') {
    return (
      <span
        className={cn(baseClasses, 'text-white/90', className)}
        style={{ backgroundColor: `${color}30`, color }}
      >
        {children}
      </span>
    );
  }

  if (color && variant === 'outline') {
    return (
      <span
        className={cn(baseClasses, 'border', className)}
        style={{ borderColor: `${color}60`, color }}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(baseClasses, 'text-white', className)}
      style={{ backgroundColor: color || '#6366f1' }}
    >
      {children}
    </span>
  );
};

// ── Tooltip ─────────────────────────────────────────────────
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={cn(
          'absolute z-50 hidden group-hover:block',
          'px-2 py-1 text-xs font-medium text-white bg-surface-800 rounded-md shadow-lg',
          'whitespace-nowrap border border-surface-700',
          'animate-fade-in',
          positionClasses[position],
        )}
      >
        {content}
      </div>
    </div>
  );
};
