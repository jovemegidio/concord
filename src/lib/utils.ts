import { nanoid } from 'nanoid';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ID, Timestamp } from '@/types';

// ── ID Generation ───────────────────────────────────────────
export const generateId = (): ID => nanoid(12);

// ── Date Formatting ─────────────────────────────────────────
export function formatRelativeTime(timestamp: Timestamp): string {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: ptBR,
  });
}

export function formatMessageTime(timestamp: Timestamp): string {
  const date = new Date(timestamp);
  if (isToday(date)) return `Hoje às ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `Ontem às ${format(date, 'HH:mm')}`;
  return format(date, "dd/MM/yyyy 'às' HH:mm");
}

export function formatShortTime(timestamp: Timestamp): string {
  return format(new Date(timestamp), 'HH:mm');
}

export function formatRelativeDate(timestamp: Timestamp): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ptBR });
}

// ── String Utilities ────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

// ── Array Utilities ─────────────────────────────────────────
export function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export function groupBy<T, K extends string>(arr: T[], fn: (item: T) => K): Record<K, T[]> {
  return arr.reduce(
    (acc, item) => {
      const key = fn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

// ── Color Utilities ─────────────────────────────────────────
const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
