import React, { InputHTMLAttributes, useState } from 'react';
import { motion } from 'framer-motion';

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
  const [isFocused, setIsFocused] = useState<boolean>(false);
  
  // 입력 필드 ID 생성 (없는 경우)
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  // 복사 기능
  const handleCopy = () => {
    if (props.value) {
      navigator.clipboard.writeText(String(props.value));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-8`}>
      {label && (
        <motion.label 
          htmlFor={inputId} 
          className="block text-sm font-mono font-light mb-3 tracking-wider uppercase"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {/* 기하학적 형태의 입력 필드 */}
        <motion.div
          className="relative"
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30
          }}
        >
          <input
            id={inputId}
            className={`
              w-full h-14 px-6 py-4
              bg-white border-2 border-black
              text-black font-mono font-medium
              placeholder:text-gray-400 placeholder:font-light
              focus:outline-none focus:border-black
              transition-all duration-200
              ${error ? 'border-red-500 bg-red-50' : ''}
              ${fullWidth ? 'w-full' : ''}
              ${className}
            `.trim().replace(/\s+/g, ' ')}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {/* 포커스 시 기하학적 강조 */}
          {isFocused && (
            <motion.div
              className="absolute inset-0 border-2 border-black pointer-events-none"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 0.3, scale: 1.02 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              style={{
                transform: 'translate(4px, 4px)',
                zIndex: -1
              }}
            />
          )}
        </motion.div>
        
        {/* 복사 버튼 */}
        {showCopy && props.value && (
          <motion.button
            type="button"
            onClick={handleCopy}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 
                       w-8 h-8 flex items-center justify-center
                       border border-gray-300 bg-white hover:bg-gray-50
                       transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="복사"
          >
            {copySuccess ? (
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 text-green-600" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </motion.svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            )}
          </motion.button>
        )}
      </div>
      
      {/* 에러 메시지 */}
      {error && (
        <motion.div
          className="mt-2 px-3 py-1 bg-red-50 border border-red-200"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-xs font-mono text-red-700 uppercase tracking-wide">{error}</p>
        </motion.div>
      )}
      
      {/* 도움말 텍스트 */}
      {helperText && !error && (
        <motion.p 
          className="mt-2 text-xs font-mono text-gray-500 uppercase tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          {helperText}
        </motion.p>
      )}
    </div>
  );
};

export default Input;