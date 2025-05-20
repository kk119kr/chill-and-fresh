import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeContextType = {
  highContrast: boolean;
  toggleHighContrast: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  highContrast: false,
  toggleHighContrast: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  
  // 로컬 스토리지에서 설정 로드
  useEffect(() => {
    const savedPreference = localStorage.getItem('highContrast');
    if (savedPreference) {
      setHighContrast(savedPreference === 'true');
    }
  }, []);
  
  // 고대비 모드 전환
  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('highContrast', String(newValue));
    
    // 문서에 데이터 속성 추가하여 CSS에서 활용
    document.documentElement.setAttribute('data-high-contrast', String(newValue));
  };
  
  return (
    <ThemeContext.Provider value={{ highContrast, toggleHighContrast }}>
      {children}
      
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
            
            .text-gray-500, .text-gray-400 {
              color: #333333 !important;
            }
          `}
        </style>
      )}
    </ThemeContext.Provider>
  );
};