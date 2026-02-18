/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--brand-50, #eef2ff)',
          100: 'var(--brand-100, #e0e7ff)',
          200: 'var(--brand-200, #c7d2fe)',
          300: 'var(--brand-300, #a5b4fc)',
          400: 'var(--brand-400, #818cf8)',
          500: 'var(--brand-500, #6366f1)',
          600: 'var(--brand-600, #4f46e5)',
          700: 'var(--brand-700, #4338ca)',
          800: 'var(--brand-800, #3730a3)',
          900: 'var(--brand-900, #312e81)',
          950: 'var(--brand-950, #1e1b4b)',
        },
        surface: {
          50: 'var(--surface-50, #f8fafc)',
          100: 'var(--surface-100, #f1f5f9)',
          200: 'var(--surface-200, #e2e8f0)',
          300: 'var(--surface-300, #cbd5e1)',
          400: 'var(--surface-400, #94a3b8)',
          500: 'var(--surface-500, #64748b)',
          600: 'var(--surface-600, #475569)',
          700: 'var(--surface-700, #334155)',
          800: 'var(--surface-800, #1e293b)',
          850: 'var(--surface-850, #172033)',
          900: 'var(--surface-900, #0f172a)',
          950: 'var(--surface-950, #020617)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
};
