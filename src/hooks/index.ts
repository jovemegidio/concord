import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// ── useDebounce ─────────────────────────────────────────────
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ── useClickOutside ─────────────────────────────────────────
export function useClickOutside<T extends HTMLElement>(
  callback: () => void,
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);

  return ref;
}

// ── useLocalStorage ─────────────────────────────────────────
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        localStorage.setItem(key, JSON.stringify(nextValue));
        return nextValue;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}

// ── useAutoScroll ───────────────────────────────────────────
export function useAutoScroll<T extends HTMLElement>(
  deps: unknown[],
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

// ── useKeyboard ─────────────────────────────────────────────
export function useKeyboard(
  key: string,
  callback: (e: KeyboardEvent) => void,
  modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean },
): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== key) return;
      if (modifiers?.ctrl && !e.ctrlKey && !e.metaKey) return;
      if (modifiers?.shift && !e.shiftKey) return;
      if (modifiers?.alt && !e.altKey) return;
      callback(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, modifiers]);
}

// ── useToggle ───────────────────────────────────────────────
export function useToggle(
  initialValue = false,
): [boolean, () => void, (v: boolean) => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}

// ── useSearch ───────────────────────────────────────────────
export function useSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);

  const filteredItems = useMemo(
    () =>
      debouncedQuery
        ? items.filter((item) => searchFn(item, debouncedQuery.toLowerCase()))
        : items,
    [items, debouncedQuery, searchFn],
  );

  return { query, setQuery, filteredItems, isFiltering: debouncedQuery.length > 0 };
}
