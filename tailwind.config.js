// tailwind.config.js 수정
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
      },
      keyframes: {
        'ink-flow': {
          '0%, 100%': { transform: 'scale(0.98) rotate(-0.5deg)' },
          '50%': { transform: 'scale(1.02) rotate(0.5deg)' },
        }
      }
    },
  },
  plugins: [],
}