// ============================================================
// Concord — Theme System
// Maps theme palettes → CSS custom properties → Tailwind colors
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'dark' | 'midnight' | 'light' | 'forest' | 'sunset' | 'ocean' | 'rose' | 'cyberpunk' | 'nord' | 'dracula';

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
  ocean: {
    surface: {
      '50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd',
      '300': '#7dd3fc', '400': '#38bdf8', '500': '#0ea5e9',
      '600': '#1e5a7e', '700': '#164060', '800': '#0f2e47',
      '850': '#0b243a', '900': '#081c2f', '950': '#041220',
    },
    brand: {
      '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc',
      '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4',
      '600': '#0891b2', '700': '#0e7490', '800': '#155e75',
      '900': '#164e63', '950': '#083344',
    },
  },
  rose: {
    surface: {
      '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3',
      '300': '#fda4af', '400': '#fb7185', '500': '#a06070',
      '600': '#7a4050', '700': '#5a3040', '800': '#361c28',
      '850': '#2c1622', '900': '#22101a', '950': '#160a10',
    },
    brand: {
      '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3',
      '300': '#fda4af', '400': '#fb7185', '500': '#f43f5e',
      '600': '#e11d48', '700': '#be123c', '800': '#9f1239',
      '900': '#881337', '950': '#4c0519',
    },
  },
  cyberpunk: {
    surface: {
      '50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe',
      '300': '#f0abfc', '400': '#e879f9', '500': '#a855f7',
      '600': '#5a2d6a', '700': '#3d1e4a', '800': '#291436',
      '850': '#210f2e', '900': '#1a0b24', '950': '#0f0516',
    },
    brand: {
      '50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe',
      '300': '#e879f9', '400': '#d946ef', '500': '#c026d3',
      '600': '#a21caf', '700': '#86198f', '800': '#701a75',
      '900': '#581c87', '950': '#3b0764',
    },
  },
  nord: {
    surface: {
      '50': '#eceff4', '100': '#e5e9f0', '200': '#d8dee9',
      '300': '#aab4c5', '400': '#7b88a1', '500': '#616e88',
      '600': '#4c566a', '700': '#434c5e', '800': '#3b4252',
      '850': '#353c4a', '900': '#2e3440', '950': '#242933',
    },
    brand: {
      '50': '#edf5fd', '100': '#dbeafb', '200': '#b8d5f7',
      '300': '#88c0d0', '400': '#81a1c1', '500': '#5e81ac',
      '600': '#4c6e96', '700': '#3b5b80', '800': '#2e4a6a',
      '900': '#243d58', '950': '#1a2e42',
    },
  },
  dracula: {
    surface: {
      '50': '#f8f8f2', '100': '#e8e8e0', '200': '#d0d0c8',
      '300': '#b0b0a8', '400': '#8a8a80', '500': '#6c6c66',
      '600': '#565660', '700': '#44475a', '800': '#363848',
      '850': '#2e3040', '900': '#282a36', '950': '#1e1f29',
    },
    brand: {
      '50': '#fff0ff', '100': '#ffe0ff', '200': '#ffb8ff',
      '300': '#ff79c6', '400': '#ff55bd', '500': '#bd93f9',
      '600': '#9e6fe0', '700': '#7e50c0', '800': '#6040a0',
      '900': '#483080', '950': '#302060',
    },
  },
};

interface ThemeStore {
  theme: ThemeName;
  wallpaper: string; // URL for custom background wallpaper
  setTheme: (theme: ThemeName) => void;
  setWallpaper: (url: string) => void;
  cycleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      wallpaper: '',
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      setWallpaper: (url) => {
        set({ wallpaper: url });
        applyWallpaper(url);
      },
      cycleTheme: () => {
        const names: ThemeName[] = ['dark', 'midnight', 'light', 'forest', 'sunset', 'ocean', 'rose', 'cyberpunk', 'nord', 'dracula'];
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

export function applyWallpaper(url: string) {
  const root = document.documentElement;
  if (url) {
    root.style.setProperty('--wallpaper-url', `url(${url})`);
    root.setAttribute('data-wallpaper', 'true');
  } else {
    root.style.removeProperty('--wallpaper-url');
    root.removeAttribute('data-wallpaper');
  }
}

export function initTheme() {
  const stored = localStorage.getItem('concord-theme');
  let theme: ThemeName = 'dark';
  let wallpaper = '';
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      theme = parsed.state?.theme ?? 'dark';
      wallpaper = parsed.state?.wallpaper ?? '';
    } catch {
      // ignore
    }
  }
  applyTheme(theme);
  applyWallpaper(wallpaper);
}
