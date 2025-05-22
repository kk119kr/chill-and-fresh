import React, { useState } from 'react';
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
  layoutId?: string;
}

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
  const [ripples, setRipples] = useState<{x: number, y: number, id: number}[]>([]);
  const rippleCounter = React.useRef(0);
  
  // 버튼 크기 클래스 (기하학적 비율 기반)
  const sizeClass = 
    size === 'small' ? 'h-10 text-sm px-4' : 
    size === 'large' ? 'h-14 text-lg px-8' : 
    'h-12 text-base px-6';
  
  // 바우하우스 스타일 기본 클래스
  const baseClasses = `
    relative flex items-center justify-center font-mono font-light tracking-wider uppercase
    transition-all duration-300 overflow-hidden border
    ${fullWidth ? 'w-full' : ''}
    ${sizeClass}
    ${variant === 'primary' 
      ? 'bg-black text-white border-black' 
      : 'bg-white text-black border-black'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // 터치 지점에 기하학적 확산 효과
  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const id = rippleCounter.current++;
    setRipples(prev => [...prev, { x, y, id }]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  };

  return (
    <motion.div
      className={`relative ${fullWidth ? 'w-full' : ''}`}
      layoutId={layoutId}
    >
      {/* 메인 버튼 */}
      <motion.button
        className={baseClasses}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        onMouseDown={addRipple}
        whileHover={!disabled ? { 
          scale: 1.02,
          transition: { type: "spring", stiffness: 400, damping: 30 }
        } : undefined}
        whileTap={!disabled ? { 
          scale: 0.98,
          transition: { type: "spring", stiffness: 400, damping: 30 }
        } : undefined}
      >
        {/* 버튼 내용 */}
        <span className="relative z-10 flex items-center justify-center">
          {isLoading ? (
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div 
                  key={i}
                  className="w-1 h-1 bg-current"
                  animate={{ 
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    delay: i * 0.1
                  }}
                />
              ))}
            </div>
          ) : children}
        </span>
        
        {/* 기하학적 확산 효과 */}
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute bg-current pointer-events-none"
            style={{
              top: ripple.y,
              left: ripple.x,
              transformOrigin: 'center',
              opacity: variant === 'primary' ? 0.2 : 0.1
            }}
            initial={{ width: 0, height: 0, opacity: 0.5 }}
            animate={{ 
              width: 120, 
              height: 120, 
              opacity: 0, 
              x: -60, 
              y: -60 
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </motion.button>
    </motion.div>
  );
};

export default Button;