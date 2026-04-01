/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAFAF9',
        foreground: '#1A1A2E',
        card: '#FFFFFF',
        border: '#E8E4DF',
        input: '#E8E4DF',
        ring: '#5B6FA3',
        primary: {
          DEFAULT: '#4A5D8A',
          foreground: '#FFFFFF',
          dark: '#3A4D7A',
          light: '#7B8DB5',
          50: '#F0F2F7',
          100: '#D9DEE9',
        },
        secondary: {
          DEFAULT: '#B8979A',
          foreground: '#1A1A2E',
          light: '#EDE5E6',
        },
        muted: {
          DEFAULT: '#F0EDEA',
          foreground: '#7A7F8E',
        },
        gold: {
          DEFAULT: '#C98B3F',
          light: '#E8C88A',
          50: '#FDF8F0',
        },
        rose: {
          light: '#F2E8E9',
          DEFAULT: '#B8979A',
        },
        cream: {
          DEFAULT: '#FAFAF9',
          dark: '#F0EDEA',
        },
        success: '#3B9E6F',
        destructive: '#D94F4F',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['2.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-md': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
        card: '0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.06)',
        glow: '0 0 48px rgba(201, 139, 63, 0.12)',
        elevated: '0 12px 48px rgba(0,0,0,0.08)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(180deg, #FAFAF9 0%, #F2E8E9 40%, #EDE5E6 60%, #FAFAF9 100%)',
        'section-alt': 'linear-gradient(180deg, #F0EDEA 0%, #FAFAF9 100%)',
        'subtle-radial': 'radial-gradient(ellipse at 50% 0%, rgba(74,93,138,0.04) 0%, transparent 70%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
