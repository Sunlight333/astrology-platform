/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        celestial: {
          50: '#f0f0ff',
          100: '#e0dfff',
          200: '#c4bfff',
          300: '#9f94ff',
          400: '#7c5fff',
          500: '#6a3bff',
          600: '#5e16ff',
          700: '#5110e0',
          800: '#420fb7',
          900: '#371095',
          950: '#0d0326',
        },
        cosmic: {
          dark: '#070114',
          deeper: '#0d0326',
          deep: '#130538',
          medium: '#1a074a',
          light: '#2a0f6e',
        },
        star: {
          gold: '#ffd700',
          silver: '#c0c0d0',
          blue: '#4fc3f7',
          red: '#ef5350',
          green: '#66bb6a',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'starfield': 'radial-gradient(2px 2px at 20px 30px, #eee, transparent), radial-gradient(2px 2px at 40px 70px, #fff, transparent), radial-gradient(1px 1px at 90px 40px, #ddd, transparent)',
      },
    },
  },
  plugins: [],
};
