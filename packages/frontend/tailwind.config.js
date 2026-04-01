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
        'glow-lg': '0 0 80px rgba(201, 139, 63, 0.18), 0 0 32px rgba(201, 139, 63, 0.08)',
        elevated: '0 12px 48px rgba(0,0,0,0.08)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.06)',
        'celestial': '0 0 60px rgba(74, 93, 138, 0.08), 0 0 120px rgba(184, 151, 154, 0.06)',
        'planet': '0 4px 20px rgba(74, 93, 138, 0.15), 0 0 40px rgba(74, 93, 138, 0.05)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(180deg, #FAFAF9 0%, #F2E8E9 35%, #EDE5E6 50%, #F0F2F7 70%, #FAFAF9 100%)',
        'section-alt': 'linear-gradient(180deg, #F0EDEA 0%, #FAFAF9 100%)',
        'subtle-radial': 'radial-gradient(ellipse at 50% 0%, rgba(74,93,138,0.04) 0%, transparent 70%)',
        'celestial-radial': 'radial-gradient(ellipse at 50% 30%, rgba(74,93,138,0.06) 0%, rgba(184,151,154,0.03) 40%, transparent 70%)',
        'orb-glow': 'radial-gradient(circle, rgba(201,139,63,0.08) 0%, transparent 70%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-delay': 'float 7s ease-in-out 2s infinite',
        'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
        'spin-slow': 'spin 30s linear infinite',
        'spin-slower': 'spin 60s linear infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'twinkle-delay': 'twinkle 3s ease-in-out 1.5s infinite',
        'orbit': 'orbit 20s linear infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
