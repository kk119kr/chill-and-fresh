import React, { ButtonHTMLAttributes, useState } from 'react';
import { motion } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  className = '',
  disabled,
  isLoading = false,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // 기본 스타일
  const baseStyle = 'transition-colors font-medium rounded-full focus:outline-none flex items-center justify-center overflow-hidden relative';
  
  // 버튼 크기별 스타일
  const sizeStyles = {
    small: 'h-10 px-4 text-sm',
    medium: 'h-12 px-6 text-base',
    large: 'h-14 px-8 text-lg',
  };
  
  // 버튼 변형별 스타일 (흑백만 사용)
  const variantStyles = {
    primary: 'bg-white hover:bg-gray-50 shadow-sm text-gray-800 border border-gray-100',
    secondary: 'bg-gray-50 border border-gray-100 hover:bg-white text-gray-700',
  };
  
  // 너비 스타일
  const widthStyle = fullWidth ? 'w-full' : '';
  
  // 비활성화 스타일
  const disabledStyle = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';
  
  // 최종 클래스명 조합
  const buttonClass = `
    ${baseStyle} 
    ${sizeStyles[size]} 
    ${variantStyles[variant]} 
    ${widthStyle} 
    ${disabledStyle} 
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <motion.button
      className={buttonClass}
      disabled={disabled || isLoading}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      initial={{ y: 5, opacity: 0 }}
      animate={{ 
        y: 0, 
        opacity: 1,
        boxShadow: isHovered && !disabled ? 
          "0px 8px 15px rgba(0,0,0,0.05)" : 
          "0px 4px 10px rgba(0,0,0,0.03)"
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        opacity: { duration: 0.2 }
      }}
      {...props}
    >
      {/* 잉크 스플래시 효과 - 클릭 시 파장 효과 */}
      {!disabled && (
        <span className="ink-splash absolute inset-0 pointer-events-none rounded-full" />
      )}

      {isLoading ? (
        <>
          <span className="mr-2">
            <motion.svg 
              className="w-4 h-4 text-gray-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              viewBox="0 0 24 24"
            >
              <circle 
                cx="12" cy="12" r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
                strokeDasharray="60 30"
              />
            </motion.svg>
          </span>
          로딩 중...
        </>
      ) : children}

      {/* 스타일 추가 */}
      <style jsx>{`
        .ink-splash {
          background-position: center;
          transition: background 0.8s;
        }
        .ink-splash:active {
          background-color: rgba(0, 0, 0, 0.05);
          background-size: 100%;
          transition: background 0s;
          background-image: radial-gradient(circle, transparent 10%, rgba(0, 0, 0, 0.03) 10.01%);
        }
      `}</style>
    </motion.button>
  );
};

export default Button;