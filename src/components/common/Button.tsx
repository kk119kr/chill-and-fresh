import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, onClick, variant = 'primary', fullWidth, disabled }) => {
  // 유기적인 움직임을 위한 애니메이션 값
  const buttonVariants = {
    idle: {
      scale: 1,
      transition: { duration: 0.3 }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.3 }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.3 }
    }
  };

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