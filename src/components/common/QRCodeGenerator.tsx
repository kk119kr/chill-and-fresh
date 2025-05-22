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
        <div className="w-full h-full flex items-center justify-center bg-white">
          <motion.p 
            className="text-xs font-mono uppercase tracking-wider text-gray-500"
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
        {/* 심플한 QR 코드 - 테두리 없음 */}
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
      </motion.div>
      
      {/* 제목/설명 텍스트 (필요한 경우에만) */}
      {title && (
        <motion.p 
          className="mt-4 text-xs font-mono uppercase tracking-widest text-center text-gray-500 max-w-xs"
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