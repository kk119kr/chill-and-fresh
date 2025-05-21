// tailwind.config.js - 흑백 팔레트와 애니메이션 설정
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ink-black': '#000000',
        'ink-white': '#ffffff',
        'ink-gray': {
          100: '#f7f7f7',
          200: '#e6e6e6',
          300: '#d1d1d1',
          400: '#a0a0a0',
          500: '#717171',
          600: '#5a5a5a',
          700: '#4a4a4a',
          800: '#2e2e2e',
          900: '#1a1a1a',
        },
        state: {
          success: '#F2FFFC',
          error: '#FFF5F5',
          neutral: '#F7FAFF',
          highlight: '#FFFDF2',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif']
      },
      animation: {
        'ink-flow': 'ink-flow 8s ease-in-out infinite',
        'breathing': 'breathing 4s ease-in-out infinite',
        'ripple': 'ripple 1.5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        'loading-dot': 'loading-dot 1.5s ease-in-out infinite',
        'page-wipe-in': 'page-wipe-in 0.6s cubic-bezier(0.77, 0, 0.175, 1) forwards',
        'page-wipe-out': 'page-wipe-out 0.6s cubic-bezier(0.77, 0, 0.175, 1) forwards',
      },
      keyframes: {
        'ink-flow': {
          '0%, 100%': { transform: 'scale(0.98) rotate(-0.5deg)' },
          '50%': { transform: 'scale(1.02) rotate(0.5deg)' },
        },
        'breathing': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        'ripple': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'loading-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.5' },
          '50%': { transform: 'scale(1.5)', opacity: '1' },
        },
        'page-wipe-in': {
          'from': { transform: 'scaleX(0)' },
          'to': { transform: 'scaleX(1)' },
        },
        'page-wipe-out': {
          'from': { transform: 'scaleX(1)' },
          'to': { transform: 'scaleX(0)' },
        }
      },
      boxShadow: {
        'ink': '0 4px 14px rgba(0, 0, 0, 0.1)',
        'ink-hover': '0 6px 20px rgba(0, 0, 0, 0.15)',
        'ink-active': '0 2px 10px rgba(0, 0, 0, 0.2), 0 0 4px rgba(0, 0, 0, 0.3) inset',
        'ink-glow': '0 0 20px rgba(255, 255, 255, 0.8)',
        'inner-emboss': 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
      },
      borderRadius: {
        'blob': '30% 70% 70% 30% / 30% 30% 70% 70%'
      },
      transitionTimingFunction: {
        'ink-flow': 'cubic-bezier(0.22, 0.61, 0.36, 1)'
      },
      backgroundImage: {
        'paper-texture': "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\" opacity=\"0.03\"/%3E%3C/svg%3E')"
      }
    },
  },
  plugins: [],
}