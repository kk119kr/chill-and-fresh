import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white overflow-hidden relative">
      {/* 배경 유기적 요소 */}
      <BackgroundElements />
      
      <motion.div
        className="z-10 w-full flex flex-col items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1 
          className="text-5xl font-light mb-16 tracking-tight text-black"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            type: "spring",
            damping: 20,
            stiffness: 90,
            delay: 0.2 
          }}
        >
          <span className="relative">
            Chill & Fresh
            <motion.div 
              className="absolute -bottom-2 left-0 right-0 h-px bg-black bg-opacity-20"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
            />
          </span>
        </motion.h1>
        
        <motion.div 
          className="w-full max-w-sm flex flex-col gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
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
          className="text-xs text-black text-opacity-50 mt-16 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          © 2025 Chill & Fresh - 로컬 네트워크 기반 소셜 게임
          <motion.span 
            className="absolute -bottom-1 left-0 right-0 h-px bg-black bg-opacity-10"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          />
        </motion.p>
      </motion.div>
    </div>
  );
};

// 배경 유기적 모션 요소
const BackgroundElements: React.FC = () => {
  return (
    <>
      {/* 큰 유기적 블럽 모양 */}
      <motion.div 
        className="fixed top-0 right-0 w-4/5 h-4/5 pointer-events-none opacity-[0.03] z-0"
        animate={{ 
          scale: [1, 1.02, 1],
          rotate: [0, 1, 0],
          x: [0, 5, 0],
          y: [0, -5, 0],
        }}
        transition={{ 
          repeat: Infinity,
          repeatType: "reverse",
          duration: 15,
          ease: "easeInOut"
        }}
      >
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path 
            fill="#000" 
            d="M43.2,-68.1C54.9,-61.5,62.6,-47.1,64.5,-33.3C66.4,-19.5,62.4,-6.3,60.8,7.7C59.2,21.7,59.9,36.5,52.7,45.4C45.4,54.3,30.1,57.3,15.5,59.9C0.9,62.5,-13.1,64.8,-27.8,62.1C-42.6,59.5,-58.1,51.9,-63.2,39.6C-68.2,27.3,-62.9,10.2,-58.9,-4.6C-54.9,-19.5,-52.2,-32.1,-44.9,-39.8C-37.5,-47.4,-25.6,-50.1,-13.2,-56.3C-0.8,-62.5,12.1,-72.1,25.6,-73.9C39.1,-75.7,54.1,-69.7,43.2,-68.1Z" 
            transform="translate(100 100)" 
          />
        </svg>
      </motion.div>
      
      {/* 작은 유기적 형태들 */}
      <motion.div 
        className="fixed bottom-1/4 left-1/3 w-32 h-32 pointer-events-none opacity-[0.02]"
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, -15, 0],
          y: [0, 10, 0]
        }}
        transition={{ 
          repeat: Infinity,
          repeatType: "reverse",
          duration: 20,
          ease: "easeInOut"
        }}
      >
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path 
            fill="#000" 
            d="M41.7,-62.5C50.9,-59.3,53.3,-41.2,58.5,-25.6C63.7,-10,71.7,3.2,70.7,15.5C69.7,27.8,59.8,39.2,47.8,43.9C35.8,48.7,21.9,46.7,9.4,48.2C-3,49.7,-14,54.7,-26.7,54.3C-39.5,53.9,-54,48.2,-63.2,37.4C-72.5,26.7,-76.5,10.8,-76.3,-5.1C-76.1,-21,-71.8,-37,-61.7,-47.9C-51.6,-58.9,-35.8,-65,-21.1,-62.4C-6.3,-59.8,7.5,-48.5,22.4,-51.9C37.3,-55.4,53.1,-73.5,41.7,-62.5Z" 
            transform="translate(100 100)" 
          />
        </svg>
      </motion.div>
      
      {/* 미니멀 점 패턴 */}
      <div className="fixed inset-0 bg-[#000000] opacity-[0.015] z-0 pattern-dots pattern-size-2 pattern-opacity-100"></div>
      
      {/* 상단 장식 요소 */}
      <motion.div 
        className="absolute top-10 left-1/2 transform -translate-x-1/2 w-16 h-px bg-black opacity-20"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      />
      
      {/* 바닥 장식 요소 */}
      <motion.div 
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-32 h-px bg-black opacity-10"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      />
      
      {/* 유기적 흐름 라인 */}
      <svg className="absolute w-full h-full top-0 left-0 opacity-[0.02] pointer-events-none" 
           xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
        <motion.path 
          d="M0,500 C200,400 300,300 500,300 C700,300 800,400 1000,500 C800,600 700,700 500,700 C300,700 200,600 0,500 Z" 
          fill="none" 
          stroke="#000" 
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1 }}
        />
      </svg>
    </>
  );
};

export default Home;