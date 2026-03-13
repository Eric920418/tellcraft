import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          dark: '#2b2d42',
          'dark-light': '#3a3d5c',
          gold: '#ffd700',
          'gold-light': '#ffed4e',
          'gold-dark': '#ccac00',
          accent: '#4a90e2',
          danger: '#e63946',
        },
        primary: {
          50: '#fffef0',
          100: '#fffbd6',
          200: '#fff7ad',
          300: '#fff184',
          400: '#ffeb5b',
          500: '#ffd700',
          600: '#e6c200',
          700: '#ccac00',
          800: '#b39700',
          900: '#998200',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'game': '0 4px 12px rgba(255, 215, 0, 0.25)',
        'game-hover': '0 8px 24px rgba(255, 215, 0, 0.35)',
        'card': '0 6px 16px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 10px 28px rgba(0, 0, 0, 0.12)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
        'gradient-dark': 'linear-gradient(135deg, #2b2d42 0%, #3a3d5c 100%)',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': {
            boxShadow: '0 4px 12px rgba(255, 215, 0, 0.25)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 8px 24px rgba(255, 215, 0, 0.45)',
            transform: 'scale(1.02)',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
