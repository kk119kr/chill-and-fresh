import React, { useState, useRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
  const [ripple, setRipple] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 클릭 위치 기반 물결 효과
  const handleRippleEffect = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setRipple({ x, y, visible: true });
      
      // 물결 효과 종료
      setTimeout(() => {
        setRipple({ x: 0, y: 0, visible: false });
      }, 600);
    }
  };
  
  // 버튼 크기별 스타일
  const sizeStyles = {
    small: 'h-10 px-4 text-sm',
    medium: 'h-12 px-6 text-base',
    large: 'h-14 px-8 text-lg',
  };
  
  // 버튼 변형별 스타일 (흑백만 사용)
  const variantStyles = {
    primary: 'bg-black text-white border-transparent',
    secondary: 'bg-white text-black border border-black',
  };
  
  // 너비 스타일
  const widthStyle = fullWidth ? 'w-full' : '';
  
  // 비활성화 스타일
  const disabledStyle = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';
  
  // 최종 클래스명 조합
  const buttonClass = `
    relative overflow-hidden transition-all rounded-full flex items-center justify-center font-normal
    transform translate-y-0 shadow-md
    ${sizeStyles[size]} 
    ${variantStyles[variant]} 
    ${widthStyle} 
    ${disabledStyle} 
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <motion.button
      ref={buttonRef}
      className={buttonClass}
      disabled={disabled || isLoading}
      whileHover={!disabled ? { 
        scale: 1.01, 
        y: -2,
        boxShadow: "0px 6px 10px rgba(0,0,0,0.15)"
      } : {}}
      whileTap={!disabled ? { 
        scale: 0.98, 
        y: 1,
        boxShadow: "0px 2px 3px rgba(0,0,0,0.1)"
      } : {}}
      initial={{ y: 5, opacity: 0 }}
      animate={{ 
        y: 0, 
        opacity: 1,
        boxShadow: !disabled ? "0px 4px 8px rgba(0,0,0,0.1)" : "none"
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        opacity: { duration: 0.2 }
      }}
      onClick={(e) => {
        if (!disabled && !isLoading) {
          handleRippleEffect(e);
          props.onClick?.(e as any);
        }
      }}
      {...props as HTMLMotionProps<"button">}
    >
      {/* 물결 효과 */}
      {ripple.visible && (
        <motion.span
          className={`absolute rounded-full ${variant === 'primary' ? 'bg-white' : 'bg-black'} opacity-20`}
          initial={{ width: 0, height: 0, x: ripple.x, y: ripple.y }}
          animate={{ 
            width: 500, 
            height: 500, 
            x: ripple.x - 250, 
            y: ripple.y - 250,
            opacity: 0 
          }}
          transition={{ duration: 0.5 }}
        />
      )}

      {isLoading ? (
        <>
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <motion.div 
              className={`w-5 h-5 rounded-full border-2 border-t-transparent ${
                variant === 'primary' ? 'border-white' : 'border-black'
              }`}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
          <span className="opacity-0">{children}</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default Button;