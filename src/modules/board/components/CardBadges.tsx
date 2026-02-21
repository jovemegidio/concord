import React from 'react';
import { CheckSquare } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PRIORITY_CONFIG } from '@/types';
import type { Priority, Label } from '@/types';

export const PriorityBadge: React.FC<{ priority: Priority; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'sm',
}) => {
  if (priority === 'none') return null;
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
      )}
      style={{ backgroundColor: `${config.color}18`, color: config.color }}
    >
      {config.icon} {config.label}
    </span>
  );
};

export const LabelBadge: React.FC<{ label: Label }> = ({ label }) => (
  <span
    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
    style={{ backgroundColor: label.color }}
  >
    {label.name}
  </span>
);

export const ChecklistProgress: React.FC<{ items: { isCompleted: boolean }[] }> = ({ items }) => {
  if (items.length === 0) return null;
  const done = items.filter((i) => i.isCompleted).length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-surface-400">
      <CheckSquare size={10} />
      <div className="w-12 h-1 bg-surface-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-green-500' : 'bg-brand-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span>{done}/{items.length}</span>
    </div>
  );
};
