import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type ThemeContextType = {
  highContrast: boolean;
  reducedMotion: boolean;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  highContrast: false,
  reducedMotion: false,
  toggleHighContrast: () => {},
  toggleReducedMotion: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // 로컬 스토리지에서 설정 로드
  useEffect(() => {
    const savedContrastPreference = localStorage.getItem('highContrast');
    if (savedContrastPreference) {
      setHighContrast(savedContrastPreference === 'true');
    }
    
    const savedMotionPreference = localStorage.getItem('reducedMotion');
    if (savedMotionPreference) {
      setReducedMotion(savedMotionPreference === 'true');
    } else {
      // 시스템 설정 감지 - prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setReducedMotion(true);
        localStorage.setItem('reducedMotion', 'true');
      }
    }
  }, []);
  
  // 설정 변경 시 문서에 데이터 속성 추가
  useEffect(() => {
    document.documentElement.setAttribute('data-high-contrast', String(highContrast));
    document.documentElement.setAttribute('data-reduced-motion', String(reducedMotion));
  }, [highContrast, reducedMotion]);
  
  // 고대비 모드 전환
  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('highContrast', String(newValue));
  };
  
  // 모션 축소 모드 전환
  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    localStorage.setItem('reducedMotion', String(newValue));
  };

  return (
    <ThemeContext.Provider value={{ 
      highContrast, 
      reducedMotion, 
      toggleHighContrast, 
      toggleReducedMotion 
    }}>
      {children}
      
      {/* 토글 버튼들 - 화면 우측 하단에 위치 */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
        <motion.button
          onClick={toggleHighContrast}
          className={`flex items-center justify-center w-10 h-10 rounded-full shadow-lg ${
            highContrast 
              ? 'bg-ink-black text-ink-white' 
              : 'bg-ink-white text-ink-black border border-ink-gray-200'
          }`}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          aria-label={highContrast ? "고대비 모드 끄기" : "고대비 모드 켜기"}
          title={highContrast ? "고대비 모드 끄기" : "고대비 모드 켜기"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        </motion.button>
        
        <motion.button
          onClick={toggleReducedMotion}
          className={`flex items-center justify-center w-10 h-10 rounded-full shadow-lg ${
            reducedMotion 
              ? 'bg-ink-black text-ink-white' 
              : 'bg-ink-white text-ink-black border border-ink-gray-200'
          }`}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          aria-label={reducedMotion ? "애니메이션 복원" : "애니메이션 축소"}
          title={reducedMotion ? "애니메이션 복원" : "애니메이션 축소"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
          </svg>
        </motion.button>
      </div>
      
      {/* 고대비 모드 적용 스타일 */}
      {highContrast && (
        <style>
          {`
            body {
              color: #000000 !important;
              background-color: #ffffff !important;
            }
            
            button, input, .bg-white, .bg-gray-50, .bg-gray-100 {
              border: 2px solid #000000 !important;
            }
            
            h1, h2, h3, p {
              color: #000000 !important;
            }
            
            .text-gray-500, .text-gray-400, .text-ink-gray-500, .text-ink-gray-400 {
              color: #333333 !important;
            }
            
            /* 모든 SVG 패스의 색상 대비 강화 */
            svg path {
              stroke-width: 2px !important;
            }
            
            /* 버튼 포커스 표시 강화 */
            button:focus, input:focus {
              outline: 3px solid #000000 !important;
              outline-offset: 2px !important;
            }
          `}
        </style>
      )}
      
      {/* 애니메이션 축소 모드 적용 스타일 */}
      {reducedMotion && (
        <style>
          {`
            *, *::before, *::after {
              animation-duration: 0.001s !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.001s !important;
              scroll-behavior: auto !important;
            }
            
            /* 필수적이지 않은 애니메이션 완전히 제거 */
            .ink-element, .breathing, .ripple-effect {
              animation: none !important;
            }
            
            /* 필수적인 애니메이션은 유지하되 지속 시간 크게 감소 */
            .page-transition, .loading-dot {
              animation-duration: 0.1s !important;
            }
          `}
        </style>
      )}
    </ThemeContext.Provider>
  );
};