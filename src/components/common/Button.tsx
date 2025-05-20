import React from 'react';
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
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  fullWidth = false, 
  disabled = false,
  size = 'medium',
  className = '',
  isLoading = false
}) => {

  const baseClasses = `relative rounded-full flex items-center justify-center font-light transition-all duration-300 overflow-hidden ${
    fullWidth ? 'w-full' : ''
  } ${
    variant === 'primary' 
      ? 'bg-black text-white' 
      : 'bg-white border border-gray-200 text-black'
  } ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  }`;

  return (
    <div className="relative">
      {/* 유기적인 물결 효과 */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={false}
        animate={{ scale: [0.97, 1.03, 0.97], opacity: [0.4, 0.6, 0.4] }}
        transition={{ 
          repeat: Infinity, 
          repeatType: "reverse", 
          duration: 3,
          ease: "easeInOut"
        }}
      >
        <div className={`w-[102%] h-[102%] rounded-full border ${
          variant === 'primary' ? 'border-white opacity-20' : 'border-black opacity-10'
        }`} />
      </motion.div>
      
      <motion.button
        className={baseClasses}
        onClick={disabled ? undefined : onClick}
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        disabled={disabled}
      >
        {children}
        
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
    </div>
  );
};

export default Button;