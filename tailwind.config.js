// 서브스턴스 스타일 Tailwind Configuration
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // 기본 색상 시스템
    colors: {
      // 순수 흑백 팔레트
      black: '#000000',
      white: '#FFFFFF',
      
      // 기능적 회색
      gray: {
        50: '#f9fafb',
        200: '#e5e7eb',
        500: '#6B7280',
      },
      
      // 상태 표시용
      transparent: 'transparent',
      current: 'currentColor',
    },
    
    // 서브스턴스 스타일 폰트 시스템
    fontFamily: {
      'title': ['Bebas Neue', 'Anton', 'Arial Black', 'sans-serif'], // 메인 타이틀용
      'display': ['Anton', 'Arial Black', 'sans-serif'], // 디스플레이용
      'sans': ['Oswald', 'Arial', 'sans-serif'], // 기본 텍스트
      'mono': ['Oswald', 'monospace'], // 모노스페이스 대신 Oswald 사용
    },
    
    // 굵고 간결한 폰트 웨이트
    fontWeight: {
      light: '300',
      normal: '400',
      semibold: '600',
      bold: '700',
      black: '900',
    },
    
    // 최소한의 spacing 시스템
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px',
      16: '64px',
      20: '80px',
      24: '96px',
      32: '128px',
    },
    
    // 직각만 사용
    borderRadius: {
      none: '0px',
      full: '9999px',
    },
    
    // 텍스트 크기 - 서브스턴스 스타일에 맞게 조정
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1.2' }],
      'sm': ['0.875rem', { lineHeight: '1.2' }],
      'base': ['1rem', { lineHeight: '1.2' }],
      'lg': ['1.125rem', { lineHeight: '1.2' }],
      'xl': ['1.25rem', { lineHeight: '1.1' }],
      '2xl': ['1.5rem', { lineHeight: '1.1' }],
      '3xl': ['1.875rem', { lineHeight: '1' }],
      '4xl': ['2.25rem', { lineHeight: '1' }],
      '5xl': ['3rem', { lineHeight: '0.9' }],
      '6xl': ['3.75rem', { lineHeight: '0.8' }],
      '7xl': ['4.5rem', { lineHeight: '0.8' }],
      '8xl': ['6rem', { lineHeight: '0.8' }],
    },
    
    // 좁은 자간 (서브스턴스 스타일)
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
    
    extend: {
      // 서브스턴스 스타일 애니메이션
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      // 빠른 전환
      transitionTimingFunction: {
        'substance': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      
      // 그림자 없음 (미니멀)
      boxShadow: {
        'none': 'none',
      },
    },
  },
  
  plugins: [],
}