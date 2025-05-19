import React, { ButtonHTMLAttributes } from 'react';

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
  // 기본 스타일
  const baseStyle = 'transition-colors font-medium rounded-full focus:outline-none flex items-center justify-center';
  
  // 버튼 크기별 스타일
  const sizeStyles = {
    small: 'h-10 px-4 text-sm',
    medium: 'h-12 px-6 text-base',
    large: 'h-14 px-8 text-lg',
  };
  
  // 버튼 변형별 스타일
  const variantStyles = {
    primary: 'bg-gray-50 hover:bg-gray-100 shadow-sm text-gray-800',
    secondary: 'bg-white border border-gray-100 hover:bg-gray-50 text-gray-700',
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
    <button
      className={buttonClass}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="mr-2">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          로딩 중...
        </>
      ) : children}
    </button>
  );
};

export default Button;