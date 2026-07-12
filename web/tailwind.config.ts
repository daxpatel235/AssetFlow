import type { Config } from 'tailwindcss';

// Same semantic-token system as the hackathon kit: neutrals flip via CSS vars,
// brand stays constant. See src/app/globals.css.
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand = blue-600 (the "Wolf slate + blue" identity). Every component
        // references `brand`/`brand-*`, so changing these 10 values reskins the
        // entire app in one place — the generator and dark mode are unaffected.
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        // Secondary accent (violet) — complements the blue brand. Used sparingly
        // for personal/scheduling surfaces and secondary emphasis, never primary CTAs.
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          DEFAULT: '#7c3aed',
          dark: '#6d28d9',
        },
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      boxShadow: {
        // Soft, low-contrast elevation — cards stay mostly flat (border-led),
        // popovers/menus lift a little. Avoids the heavy drop-shadows that read
        // as "template".
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'card-hover': '0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.06)',
        pop: '0 12px 32px -12px rgb(15 23 42 / 0.28)',
        glow: '0 0 0 1px rgb(37 99 235 / 0.12), 0 8px 24px -8px rgb(37 99 235 / 0.35)',
      },
      transitionTimingFunction: {
        // Gentle "spring-out" easing for hovers & entrances — feels crafted,
        // not linear/templated.
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        'slide-in': { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'none' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.96) translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        'draw-up': { from: { transform: 'scaleY(0)' }, to: { transform: 'scaleY(1)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
