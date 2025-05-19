/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 문서에 명시된 색상 팔레트
        text: {
          primary: '#353535',
          secondary: '#A0AEC0',
        },
        border: '#F0F0F0',
        state: {
          success: '#F2FFFC',
          error: '#FFF5F5',
          neutral: '#F7FAFF',
          highlight: '#FFFDF2',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}