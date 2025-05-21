import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  isLoading?: boolean;
  layoutId?: string; // 애니메이션 전환용 ID 추가
}

// 유기적인 잉크 형태 SVG 경로 생성
const generateInkPath = (complexity = 0) => {
  const points = 12;
  const radius = 100;
  // complexity가 높을수록 더 불규칙한 형태
  const variance = 5 + (complexity * 0.7); 
  
  let path = "M";
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius + (Math.random() * variance * 2 - variance);
    const x = Math.cos(angle) * r + 100;
    const y = Math.sin(angle) * r + 100;
    
    if (i === 0) path += `${x},${y}`;
    else path += ` L${x},${y}`;
  }
  path += " Z";
  return path;
};

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  fullWidth = false, 
  disabled = false,
  size = 'medium',
  className = '',
  isLoading = false,
  layoutId
}) => {
  const [inkPath, setInkPath] = useState(generateInkPath(0));
  const [ripples, setRipples] = useState<{x: number, y: number, id: number}[]>([]);
  const rippleCounter = React.useRef(0);
  
  // 시간이 지남에 따라 잉크 형태 변화
  useEffect(() => {
    // 불규칙한 시간 간격으로 잉크 형태 변경 (4-6초 사이)
    const interval = setInterval(() => {
      setInkPath(generateInkPath(Math.random() * 3));
    }, 4000 + Math.random() * 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // 버튼 크기 클래스 결정
  const sizeClass = 
    size === 'small' ? 'h-10 text-sm px-4' : 
    size === 'large' ? 'h-14 text-lg px-8' : 
    'h-12 text-base px-6';
  
  // 버튼 기본 스타일 클래스
  const baseClasses = `relative rounded-full flex items-center justify-center font-light transition-all duration-300 overflow-hidden ${
    fullWidth ? 'w-full' : ''
  } ${
    sizeClass
  } ${
    variant === 'primary' 
      ? 'bg-ink-black text-ink-white' 
      : 'bg-ink-white border border-ink-gray-200 text-ink-black'
  } ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  } ${className}`;

  // 터치 지점에 물결 효과 추가
  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const id = rippleCounter.current++;
    setRipples(prev => [...prev, { x, y, id }]);
    
    // 1초 후 물결 효과 제거
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 1000);
  };

  return (
    <motion.div
      className={`relative ${fullWidth ? 'w-full' : ''}`}
      layoutId={layoutId}
    >
      {/* 유기적인 물결 효과 배경 */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={false}
        animate={{ 
          scale: [0.97, 1.03, 0.97], 
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ 
          repeat: Infinity, 
          repeatType: "reverse", 
          duration: 3,
          ease: "easeInOut"
        }}
      >
        <div className={`w-[102%] h-[102%] rounded-full border ${
          variant === 'primary' ? 'border-ink-white opacity-20' : 'border-ink-black opacity-10'
        }`} />
      </motion.div>
      
      {/* 메인 버튼 */}
      <motion.button
        className={baseClasses}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        onMouseDown={addRipple}
        whileHover={!disabled ? { 
          scale: 1.02,
          boxShadow: variant === 'primary' 
            ? '0 6px 20px rgba(0, 0, 0, 0.25)' 
            : '0 6px 20px rgba(0, 0, 0, 0.1)' 
        } : undefined}
        whileTap={!disabled ? { 
          scale: 0.98, 
          boxShadow: variant === 'primary'
            ? '0 2px 8px rgba(0, 0, 0, 0.2)'
            : '0 2px 8px rgba(0, 0, 0, 0.05)'
        } : undefined}
        transition={{
          type: "spring",
          stiffness: 400, 
          damping: 17
        }}
      >
        {/* 버튼 내부 SVG 형태 */}
        {variant === 'primary' && (
          <motion.div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <motion.svg 
              viewBox="0 0 200 200"
              className="absolute w-full h-full"
              style={{
                top: '-50%', 
                left: '-50%', 
                width: '200%', 
                height: '200%',
                opacity: 0.15
              }}
            >
              <motion.path 
                d={inkPath}
                fill="#ffffff"
                animate={{ d: inkPath }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </motion.svg>
          </motion.div>
        )}
        
        {/* 버튼 내용 */}
        <span className="relative z-10 flex items-center justify-center">
          {isLoading ? (
            <div className="flex space-x-1">
              <motion.div 
                className="w-2 h-2 rounded-full bg-current loading-dot"
              />
              <motion.div 
                className="w-2 h-2 rounded-full bg-current loading-dot"
              />
              <motion.div 
                className="w-2 h-2 rounded-full bg-current loading-dot"
              />
            </div>
          ) : children}
        </span>
        
        {/* 잉크 물결 효과 */}
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-current pointer-events-none"
            style={{
              top: ripple.y,
              left: ripple.x,
              transformOrigin: 'center',
              opacity: variant === 'primary' ? 0.2 : 0.1
            }}
            initial={{ width: 0, height: 0, opacity: 0.5 }}
            animate={{ 
              width: 300, 
              height: 300, 
              opacity: 0, 
              x: -150, 
              y: -150 
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        ))}
        
        {/* 잉크 효과 오버레이 */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
          viewBox="0 0 200 200" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="ink-distort">
              <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1" filter="url(#ink-distort)" />
        </svg>
      </motion.button>
    </motion.div>
  );
};

export default Button;