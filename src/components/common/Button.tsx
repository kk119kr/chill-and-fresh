import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // 기본 스타일
  const baseStyle = 'transition-colors font-medium rounded-full focus:outline-none';
  
  // 버튼 크기별 스타일
  const sizeStyles = {
    small: 'h-10 px-4 text-sm',
    medium: 'h-12 px-6 text-base',
    large: 'h-14 px-8 text-lg',
  };
  
  // 버튼 변형별 스타일
  const variantStyles = {
    primary: 'bg-gray-50 hover:bg-gray-100 shadow-sm',
    secondary: 'bg-white border border-gray-100 hover:bg-gray-50',
  };
  
  // 너비 스타일
  const widthStyle = fullWidth ? 'w-full' : '';
  
  // 비활성화 스타일
  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
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
    <button
      className={buttonClass}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;