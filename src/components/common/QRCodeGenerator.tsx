import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  title?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  value, 
  size = 200, 
  bgColor = '#ffffff',
  fgColor = '#000000',
  level = 'H', 
  includeMargin = true,
  title
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // 컴포넌트가 마운트된 후 로딩 상태 변경
  useEffect(() => {
    if (value) {
      setTimeout(() => setIsLoaded(true), 200);
    } else {
      setIsLoaded(false);
    }
  }, [value]);

  if (!value) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-full h-full flex items-center justify-center bg-bauhaus-white border border-bauhaus-black">
          <motion.p 
            className="text-xs font-mono uppercase tracking-wider text-bauhaus-gray"
            animate={{ 
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2
            }}
          >
            Generating...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: isLoaded ? 1 : 0,
          scale: isLoaded ? 1 : 0.9
        }}
        transition={{ 
          duration: 0.3, 
          ease: "easeOut"
        }}
      >
        {/* 바우하우스 스타일 컨테이너 - 정사각형 그리드 */}
        <div className="relative p-6 bg-bauhaus-white border-2 border-bauhaus-black">
          {/* 내부 정사각형 가이드 라인 */}
          <div className="absolute inset-4 border border-bauhaus-gray opacity-20 pointer-events-none" />
          
          {/* 실제 QR 코드 */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ 
              scale: [0.98, 1.02, 0.98]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 6,
              ease: "easeInOut"
            }}
          >
            <QRCodeSVG
              value={value} 
              size={size} 
              bgColor={bgColor}
              fgColor={fgColor}
              level={level}
              includeMargin={includeMargin}
            />
          </motion.div>
          
          {/* 모서리 표시 - 바우하우스 스타일 기하학적 요소 */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-bauhaus-black" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-bauhaus-black" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-bauhaus-black" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-bauhaus-black" />
        </div>
        
        {/* 기하학적 그림자 효과 */}
        <motion.div
          className="absolute top-1 left-1 w-full h-full bg-bauhaus-black opacity-20 -z-10"
          initial={false}
          animate={{ 
            x: [0, 2, 0],
            y: [0, 2, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 8, 
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {/* 제목/설명 텍스트 - 바우하우스 타이포그래피 */}
      {title && (
        <motion.p 
          className="mt-4 text-xs font-mono uppercase tracking-widest text-center text-bauhaus-gray max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0, 
            y: isLoaded ? 0 : 10 
          }}
          transition={{ 
            delay: 0.2, 
            duration: 0.3
          }}
        >
          {title}
        </motion.p>
      )}
    </div>
  );
};

export default QRCodeGenerator;