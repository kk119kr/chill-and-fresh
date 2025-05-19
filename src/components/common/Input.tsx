import React, { InputHTMLAttributes, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  showCopy?: boolean;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  className = '',
  id,
  showCopy = false,
  helperText,
  ...props
}) => {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  
  // 입력 필드 ID 생성 (없는 경우)
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  // 기본 스타일
  const baseStyle = 'h-14 px-4 rounded-full border border-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-200';
  
  // 너비 스타일
  const widthStyle = fullWidth ? 'w-full' : '';
  
  // 에러 스타일
  const errorStyle = error ? 'border-red-200 focus:ring-red-200 bg-red-50' : '';
  
  // 최종 클래스명 조합
  const inputClass = `
    ${baseStyle} 
    ${widthStyle} 
    ${errorStyle} 
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const handleCopy = () => {
    if (props.value) {
      navigator.clipboard.writeText(String(props.value));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

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
      <div className="relative">
        <input
          id={inputId}
          className={inputClass}
          {...props}
        />
        {showCopy && props.value && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="복사"
          >
            {copySuccess ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;