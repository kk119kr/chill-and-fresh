// 바우하우스 "Form Follows Function" Tailwind Configuration
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // 기본 색상 시스템 완전 오버라이드
    colors: {
      // 바우하우스 순수 흑백 팔레트
      black: '#000000',
      white: '#FFFFFF',
      
      // 기능적 회색 (매우 제한적 사용)
      gray: {
        500: '#6B7280', // 보조 텍스트용만
      },
      
      // 상태 표시용 (기능적 목적)
      transparent: 'transparent',
      current: 'currentColor',
    },
    
    // Monospace 폰트 시스템
    fontFamily: {
      mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
    },
    
    // 기하학적 폰트 웨이트
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      bold: '700',
      black: '800',
    },
    
    // 그리드 기반 spacing 시스템
    spacing: {
      0: '0px',
      1: '4px',   // 0.25rem
      2: '8px',   // 0.5rem  
      3: '12px',  // 0.75rem
      4: '16px',  // 1rem
      6: '24px',  // 1.5rem
      8: '32px',  // 2rem
      12: '48px', // 3rem
      16: '64px', // 4rem
      20: '80px', // 5rem
      24: '96px', // 6rem
      32: '128px',// 8rem
      48: '192px',// 12rem
      64: '256px',// 16rem
    },
    
    // 기하학적 border radius
    borderRadius: {
      none: '0px',
      full: '9999px', // 완전한 원형만
    },
    
    extend: {
      // 바우하우스 애니메이션 시스템
      animation: {
        // 기하학적 변형
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'scale-out': 'scaleOut 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        
        // 드래그 인터랙션
        'drag-hint': 'dragHint 2s ease-in-out infinite',
        'elastic': 'elastic 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        
        // 상태 표시
        'pulse-geometric': 'pulseGeometric 1.5s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
      },
      
      keyframes: {
        // 기본 변형
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.8)', opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        
        // 드래그 힌트
        dragHint: {
          '0%, 100%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-4px)' },
          '75%': { transform: 'translateY(4px)' },
        },
        
        // 탄성 효과
        elastic: {
          '0%': { transform: 'scale(1)' },
          '20%': { transform: 'scale(1.1)' },
          '40%': { transform: 'scale(0.95)' },
          '60%': { transform: 'scale(1.05)' },
          '80%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
        
        // 기하학적 펄스
        pulseGeometric: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        
        // 깜빡임
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
      
      // 바우하우스 트랜지션
      transitionTimingFunction: {
        'bauhaus': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'linear-precise': 'linear',
      },
      
      // 그리드 시스템
      gridTemplateColumns: {
        'bauhaus': 'repeat(auto-fit, minmax(96px, 1fr))',
      },
      
      // 기하학적 그림자 (매우 제한적)
      boxShadow: {
        'geometric': '0 0 0 1px #000000',
        'geometric-inset': 'inset 0 0 0 1px #000000',
      },
      
      // 드래그 임계값
      translate: {
        'drag-threshold': '60px',
        'hint-threshold': '30px',
      },
      
      // 바우하우스 비율
      aspectRatio: {
        'square': '1 / 1',
        'golden': '1.618 / 1',
      },
    },
  },
  
  // 플러그인은 사용하지 않음 (바우하우스 순수주의)
  plugins: [],
}