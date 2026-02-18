import { type ClassValue, clsx } from 'clsx';

/** Merge Tailwind classes with conflict resolution */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
