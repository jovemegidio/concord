// ============================================================
// Concord — Theme System
// Maps theme palettes → CSS custom properties → Tailwind colors
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'dark' | 'midnight' | 'light' | 'forest' | 'sunset';

interface ThemePalette {
  surface: Record<string, string>;
  brand: Record<string, string>;
}

const PALETTES: Record<ThemeName, ThemePalette> = {
  dark: {
    surface: {
      '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0',
      '300': '#cbd5e1', '400': '#94a3b8', '500': '#64748b',
      '600': '#475569', '700': '#334155', '800': '#1e293b',
      '850': '#172033', '900': '#0f172a', '950': '#020617',
    },
    brand: {
      '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe',
      '300': '#a5b4fc', '400': '#818cf8', '500': '#6366f1',
      '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3',
      '900': '#312e81', '950': '#1e1b4b',
    },
  },
  midnight: {
    surface: {
      '50': '#fafafa', '100': '#f4f4f5', '200': '#e4e4e7',
      '300': '#d4d4d8', '400': '#a1a1aa', '500': '#71717a',
      '600': '#52525b', '700': '#3f3f46', '800': '#27272a',
      '850': '#1f1f23', '900': '#18181b', '950': '#09090b',
    },
    brand: {
      '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe',
      '300': '#c4b5fd', '400': '#a78bfa', '500': '#8b5cf6',
      '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6',
      '900': '#4c1d95', '950': '#2e1065',
    },
  },
  light: {
    surface: {
      // Inverted: lighter shades map to higher numbers
      '50': '#020617', '100': '#0f172a', '200': '#1e293b',
      '300': '#334155', '400': '#475569', '500': '#64748b',
      '600': '#94a3b8', '700': '#cbd5e1', '800': '#e2e8f0',
      '850': '#e8ecf1', '900': '#f1f5f9', '950': '#f8fafc',
    },
    brand: {
      '50': '#1e1b4b', '100': '#312e81', '200': '#3730a3',
      '300': '#4338ca', '400': '#4f46e5', '500': '#6366f1',
      '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3',
      '900': '#312e81', '950': '#1e1b4b',
    },
  },
  forest: {
    surface: {
      '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0',
      '300': '#86efac', '400': '#4ade80', '500': '#22c55e',
      '600': '#2d5a3d', '700': '#1a3a25', '800': '#132e1c',
      '850': '#0f2516', '900': '#0b1d10', '950': '#06120a',
    },
    brand: {
      '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0',
      '300': '#86efac', '400': '#4ade80', '500': '#22c55e',
      '600': '#16a34a', '700': '#15803d', '800': '#166534',
      '900': '#14532d', '950': '#052e16',
    },
  },
  sunset: {
    surface: {
      '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa',
      '300': '#fdba74', '400': '#fb923c', '500': '#b07060',
      '600': '#7a4a3d', '700': '#5a3d33', '800': '#33201b',
      '850': '#291a15', '900': '#1f1210', '950': '#140b08',
    },
    brand: {
      '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa',
      '300': '#fdba74', '400': '#fb923c', '500': '#f97316',
      '600': '#ea580c', '700': '#c2410c', '800': '#9a3412',
      '900': '#7c2d12', '950': '#431407',
    },
  },
};

interface ThemeStore {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  cycleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      cycleTheme: () => {
        const names: ThemeName[] = ['dark', 'midnight', 'light', 'forest', 'sunset'];
        const current = names.indexOf(get().theme);
        const next = names[(current + 1) % names.length];
        set({ theme: next });
        applyTheme(next);
      },
    }),
    { name: 'concord-theme' },
  ),
);

export function applyTheme(themeName: ThemeName) {
  const palette = PALETTES[themeName];
  const root = document.documentElement;

  // Set surface-* CSS variables
  Object.entries(palette.surface).forEach(([shade, value]) => {
    root.style.setProperty(`--surface-${shade}`, value);
  });

  // Set brand-* CSS variables
  Object.entries(palette.brand).forEach(([shade, value]) => {
    root.style.setProperty(`--brand-${shade}`, value);
  });

  // Set data attribute
  root.setAttribute('data-theme', themeName);

  // Toggle light/dark for Tailwind dark: modifier
  if (themeName === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }
}

export function initTheme() {
  const stored = localStorage.getItem('concord-theme');
  let theme: ThemeName = 'dark';
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      theme = parsed.state?.theme ?? 'dark';
    } catch {
      // ignore
    }
  }
  applyTheme(theme);
}
