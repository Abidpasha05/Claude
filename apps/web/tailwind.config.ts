import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Brand primary = navy. Used for chrome (headers, sidebars, primary
        // headings) and the on-light secondary button.
        brand: {
          50: '#f8fafc',
          100: '#e2e8f0',
          500: '#1e293b',
          600: '#0f172a',
          700: '#020617',
          900: '#020617',
        },
        // Accent = amber. CTAs, highlights, the crossbar in the mark, badges.
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
