import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  className = '',
  id,
  ...props
}) => {
  // 입력 필드 ID 생성 (없는 경우)
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  // 기본 스타일
  const baseStyle = 'h-14 px-4 rounded-full border border-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-200';
  
  // 너비 스타일
  const widthStyle = fullWidth ? 'w-full' : '';
  
  // 에러 스타일
  const errorStyle = error ? 'border-red-200 focus:ring-red-200' : '';
  
  // 최종 클래스명 조합
  const inputClass = `
    ${baseStyle} 
    ${widthStyle} 
    ${errorStyle} 
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-light mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={inputClass}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;