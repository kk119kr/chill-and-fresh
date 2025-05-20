import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "onClick"> {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  isLoading?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  isLoading = false,
  className = '',
  ...props
}) => {
  // 기본 스타일
  const baseStyle = 'rounded-full font-medium transition-all duration-300 focus:outline-none';
  
  // 크기 스타일
  const sizeStyle = {
    small: 'py-1.5 px-4 text-sm',
    medium: 'py-2 px-6 text-base',
    large: 'py-3 px-8 text-lg h-14',
  }[size];
  
  // 변형 스타일
  const variantStyle = {
    primary: 'bg-black text-white hover:bg-gray-800 active:bg-gray-900',
    secondary: 'bg-white border border-gray-200 text-black hover:bg-gray-50 active:bg-gray-100',
  }[variant];
  
  // 너비 스타일
  const widthStyle = fullWidth ? 'w-full' : '';
  
  // 로딩 스타일
  const loadingStyle = isLoading ? 'opacity-70 cursor-wait' : '';
  
  // 최종 클래스명 조합
  const buttonClass = `
    ${baseStyle} 
    ${sizeStyle} 
    ${variantStyle} 
    ${widthStyle} 
    ${loadingStyle} 
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const handleClick = onClick ? () => {
    if (!isLoading && !props.disabled) {
      onClick();
    }
  } : undefined;

  return (
    <motion.button
      className={buttonClass}
      onClick={handleClick}
      whileTap={!isLoading && !props.disabled ? { scale: 0.98 } : undefined}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
          <span>{children}</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default Button;