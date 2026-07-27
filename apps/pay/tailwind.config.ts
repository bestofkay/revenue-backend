import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#081A30',
          50: '#F0F4F8',
          100: '#D9E3EF',
          500: '#081A30',
          700: '#04101F',
        },
        accent: {
          DEFAULT: '#0C6B45',
          50: '#E8F6EF',
          100: '#C5E8D6',
          300: '#4FB885',
          500: '#0C6B45',
          600: '#0A5638',
          700: '#08412B',
        },
        brass: {
          DEFAULT: '#B89A4F',
          soft: '#D4BC78',
          deep: '#8A7033',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-source-serif)', 'Georgia', 'serif'],
      },
      boxShadow: {
        panel: '0 1px 3px rgba(8, 26, 48, 0.08), 0 12px 28px rgba(8, 26, 48, 0.08)',
        lift: '0 8px 30px rgba(8, 26, 48, 0.12)',
        seal: '0 0 0 1px rgba(184, 154, 79, 0.4), 0 8px 24px rgba(8, 26, 48, 0.12)',
      },
      transitionTimingFunction: {
        agency: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
