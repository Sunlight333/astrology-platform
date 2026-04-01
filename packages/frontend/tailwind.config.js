/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f7f4f2',
        foreground: '#2c3952',
        card: '#faf9f8',
        border: '#e4e0db',
        input: '#e4e0db',
        ring: '#5b75a3',
        primary: {
          DEFAULT: '#5b75a3',
          foreground: '#ffffff',
          dark: '#3e5274',
          light: '#9fadc5',
        },
        secondary: {
          DEFAULT: '#c9a5a8',
          foreground: '#2c3952',
          light: '#e6dadb',
        },
        muted: {
          DEFAULT: '#edeae7',
          foreground: '#6c7992',
        },
        gold: {
          DEFAULT: '#d19747',
          light: '#dfc49f',
        },
        rose: {
          light: '#e6dadb',
          DEFAULT: '#c9a5a8',
        },
        cream: {
          DEFAULT: '#f7f4f2',
          dark: '#e9e5e1',
        },
        destructive: '#ee4444',
      },
      fontFamily: {
        display: ['Heebo', 'sans-serif'],
        body: ['Kollektif', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(91, 117, 163, 0.1)',
        glow: '0 0 40px rgba(209, 151, 71, 0.15)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(180deg, #f7f4f2 0%, #e6dadb 50%, #f7f4f2 100%)',
        'section-alt': 'linear-gradient(180deg, #e9e5e1 0%, #f7f4f2 100%)',
      },
    },
  },
  plugins: [],
};
