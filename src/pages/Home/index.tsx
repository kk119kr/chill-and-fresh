import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 overflow-hidden">
      {/* 배경 유기적 요소 */}
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%" className="opacity-5">
          <filter id="inkNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="5" seed="1" />
            <feDisplacementMap in="SourceGraphic" scale="10" />
          </filter>
          <rect width="100%" height="100%" filter="url(#inkNoise)" fill="none" stroke="#000" strokeWidth="0.5" />
        </svg>
      </div>
      
      <motion.h1 
        className="text-4xl font-thin mb-12 relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 1,
          type: "spring",
          damping: 20
        }}
      >
        <span className="relative z-10">Chill & Fresh</span>
        <motion.div 
          className="absolute -bottom-2 left-0 right-0 h-1 bg-black opacity-10 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />
      </motion.h1>
      
      <motion.div 
        className="flex flex-col gap-4 w-full max-w-md relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <Button 
          onClick={() => navigate('/create')} 
          variant="primary"
          size="large"
          fullWidth
        >
          방 만들기
        </Button>
        
        <Button 
          onClick={() => navigate('/join')} 
          variant="secondary"
          size="large"
          fullWidth
        >
          참여하기
        </Button>
      </motion.div>
      
      <motion.p 
        className="text-xs text-gray-400 mt-12 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        © 2025 Chill & Fresh - 로컬 네트워크 기반 소셜 게임
        <motion.span 
          className="absolute -bottom-1 left-0 right-0 h-px bg-gray-200"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        />
      </motion.p>
    </div>
  );
};

export default Home;