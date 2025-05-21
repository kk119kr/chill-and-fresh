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

// 유기적인 잉크 경로 생성
const generateInkPath = () => {
  const points = 16;
  const radius = 60;
  const variance = 4; // 변형 정도
  
  let path = "M";
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius + (Math.random() * variance * 2 - variance);
    const x = Math.cos(angle) * r + 60;
    const y = Math.sin(angle) * r + 60;
    
    if (i === 0) path += `${x},${y}`;
    else path += ` L${x},${y}`;
  }
  path += " Z";
  return path;
};

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  value, 
  size = 200, 
  bgColor = '#ffffff',
  fgColor = '#000000',
  level = 'H', 
  includeMargin = true,
  title
}) => {
  const [inkPath, setInkPath] = useState(generateInkPath());
  const [isLoaded, setIsLoaded] = useState(false);
  
  // 컴포넌트가 마운트된 후 로딩 상태 변경
  useEffect(() => {
    if (value) {
      setTimeout(() => setIsLoaded(true), 300);
    } else {
      setIsLoaded(false);
    }
  }, [value]);
  
  // 주기적으로 잉크 형태 변경 (미세하게 움직이는 효과)
  useEffect(() => {
    if (isLoaded) {
      const interval = setInterval(() => {
        setInkPath(generateInkPath());
      }, 6000);
      
      return () => clearInterval(interval);
    }
  }, [isLoaded]);

  if (!value) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-full h-full flex items-center justify-center bg-ink-gray-100 rounded-lg overflow-hidden">
          <motion.p 
            className="text-sm text-ink-gray-500"
            animate={{ 
              opacity: [0.7, 0.5, 0.7]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5 
            }}
          >
            QR 코드 생성 준비 중...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isLoaded ? 1 : 0,
          scale: isLoaded ? 1 : 0.95
        }}
        transition={{ 
          duration: 0.4, 
          ease: "easeOut"
        }}
      >
        {/* 종이 질감 배경 효과 */}
        <motion.div
          className="absolute inset-0 bg-ink-white rounded-lg"
          style={{ 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        />
        
        {/* QR 코드 배경 유기적 형태 - 잉크 번짐 효과 */}
        <motion.svg
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          viewBox="0 0 120 120"
          width={size + 40}
          height={size + 40}
          initial={false}
          animate={{ 
            rotate: [0, 0.3, -0.3, 0],
            scale: [0.99, 1.01, 0.99]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 8,
            ease: "easeInOut"
          }}
        >
          <defs>
            <filter id="qr-ink-filter">
              <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
              <feGaussianBlur stdDeviation="0.5" />
            </filter>
          </defs>
          <motion.path
            d={inkPath}
            fill="rgba(0, 0, 0, 0.02)"
            filter="url(#qr-ink-filter)"
            initial={false}
            animate={{ d: inkPath }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
        </motion.svg>
        
        {/* 종이 질감 효과 */}
        <div className="relative p-6 bg-ink-white rounded-lg overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{ 
              backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\" opacity=\"0.5\"/%3E%3C/svg%3E')",
            }}
          />
          
          {/* 실제 QR 코드 */}
          <motion.div
            initial={false}
            animate={{ 
              scale: [0.995, 1.005, 0.995]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 4,
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
        </div>
        
        {/* 외곽 그림자 효과 - 보일듯 말듯한 미세한 그림자 */}
        <motion.div
          className="absolute -inset-2 rounded-xl opacity-10 pointer-events-none"
          initial={false}
          animate={{ 
            opacity: [0.06, 0.1, 0.06],
            scale: [0.98, 1.02, 0.98]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 5, 
            ease: "easeInOut"
          }}
          style={{ 
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(8px)',
            zIndex: -1
          }}
        />
      </motion.div>
      
      {/* 제목/설명 텍스트 */}
      {title && (
        <motion.p 
          className="mt-4 text-sm text-ink-gray-600 text-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0, 
            y: isLoaded ? 0 : 5 
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