import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // 드래그 임계값
  const DRAG_THRESHOLD = 60;
  
  // 게임 선택 및 화면 전환
  const handleSelectGame = (gameType: 'chill' | 'freshhh') => {
    // 애니메이션 후 페이지 이동
    setTimeout(() => {
      navigate('/create', { 
        state: { 
          selectedGame: gameType,
          animateFrom: 'home'
        }
      });
    }, 400);
  };

  // 드래그 핸들러
  const handleDrag = (_: any, info: any) => {
    setDragY(info.offset.y);
    setIsDragging(true);
  };

  const handleDragEnd = (_: any, info: any) => {
    const dragDistance = info.offset.y;
    setIsDragging(false);
    setDragY(0);
    
    if (Math.abs(dragDistance) > DRAG_THRESHOLD) {
      if (dragDistance < -DRAG_THRESHOLD) {
        // 위로 드래그 - Chill 선택
        handleSelectGame('chill');
      } else if (dragDistance > DRAG_THRESHOLD) {
        // 아래로 드래그 - Freshhh 선택
        handleSelectGame('freshhh');
      }
    }
  };

  const handleGameSelection = (gameType: 'chill' | 'freshhh') => {
    handleSelectGame(gameType);
  };

  return (
    <motion.div 
      className="min-h-screen bg-white relative overflow-hidden flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      
      {/* 상단 절반 - CHILL */}
      <motion.div 
        className={`flex-1 flex items-center justify-center cursor-pointer transition-all duration-300 relative min-h-[50vh]
          ${dragY < -30 || isDragging && dragY < 0 ? 'bg-black text-white' : 'bg-white text-black'}
        `}
        onClick={() => handleGameSelection('chill')}
        whileHover={{ backgroundColor: dragY < -30 ? undefined : '#f9fafb' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* 위쪽 슬라이드 가이드 */}
        <motion.div
          className="absolute top-8 left-1/2 transform -translate-x-1/2 opacity-20"
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            y: [0, -5, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: "easeInOut"
          }}
        >
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-0.5 bg-current"></div>
            <div className="w-6 h-0.5 bg-current"></div>
            <div className="w-4 h-0.5 bg-current"></div>
          </div>
        </motion.div>
        
        <h2 className="text-[8rem] md:text-[12rem] font-black tracking-tight font-title uppercase">
          CHILL
        </h2>
      </motion.div>
      
      {/* 중앙 다이아몬드 버튼 - 절대 위치로 정확히 중앙에 배치 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* 슬라이드 경로 가이드 - 세로 라인 */}
          <motion.div
            className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-32 bg-gray-300 opacity-30"
            style={{ top: '-140px' }}
            animate={{ 
              opacity: [0.2, 0.4, 0.2],
              scaleY: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-32 bg-gray-300 opacity-30"
            style={{ bottom: '-140px' }}
            animate={{ 
              opacity: [0.2, 0.4, 0.2],
              scaleY: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3,
              ease: "easeInOut",
              delay: 1.5
            }}
          />
          
          <motion.div
            className="w-20 h-20 bg-black border-2 border-black cursor-grab active:cursor-grabbing
                       flex items-center justify-center relative overflow-hidden shadow-lg"
            style={{ transform: 'rotate(45deg)' }}
            drag="y"
            dragElastic={0.2}
            dragConstraints={{ top: -100, bottom: 100 }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1 }}
            layoutId="main-game-element"
          >
            {/* SLIDE 텍스트 */}
            <motion.span 
              className="text-white font-mono font-black text-sm tracking-widest uppercase"
              style={{ transform: 'rotate(-45deg)' }}
              animate={{
                opacity: isDragging ? 0.7 : 1
              }}
            >
              SLIDE!
            </motion.span>
            
            {/* 드래그 방향 표시 화살표 */}
            {isDragging && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center text-white"
                style={{ transform: 'rotate(-45deg)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {dragY < -30 && (
                  <motion.div
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                    className="text-3xl"
                  >
                    ↑
                  </motion.div>
                )}
                {dragY > 30 && (
                  <motion.div
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    className="text-3xl"
                  >
                    ↓
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
      
      {/* 하단 절반 - FRESHHH */}
      <motion.div 
        className={`flex-1 flex items-center justify-center cursor-pointer transition-all duration-300 relative min-h-[50vh]
          ${dragY > 30 || isDragging && dragY > 0 ? 'bg-black text-white' : 'bg-white text-black'}
        `}
        onClick={() => handleGameSelection('freshhh')}
        whileHover={{ backgroundColor: dragY > 30 ? undefined : '#f9fafb' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* 아래쪽 슬라이드 가이드 */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-20"
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            y: [0, 5, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <div className="flex flex-col items-center space-y-1">
            <div className="w-4 h-0.5 bg-current"></div>
            <div className="w-6 h-0.5 bg-current"></div>
            <div className="w-8 h-0.5 bg-current"></div>
          </div>
        </motion.div>
        
        <h2 className="text-[8rem] md:text-[12rem] font-black tracking-tight font-title uppercase">
          FRESHHH
        </h2>
      </motion.div>
      
      {/* 안내 텍스트 */}
      <motion.div
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <p className="text-xs font-mono text-gray-500 tracking-widest uppercase text-center">
          DRAG OR TAP TO SELECT
        </p>
      </motion.div>
      
      {/* 선택 피드백 표시 */}
      {isDragging && Math.abs(dragY) > 30 && (
        <motion.div
          className="fixed top-8 left-1/2 transform -translate-x-1/2 z-30
                     bg-black text-white px-6 py-2 font-mono text-sm tracking-widest uppercase"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {dragY < -30 ? 'CHILL SELECTED' : 'FRESHHH SELECTED'}
        </motion.div>
      )}
      
      {/* 기하학적 장식 요소들 */}
      <motion.div
        className="absolute top-16 right-16 w-4 h-4 bg-black opacity-20"
        style={{ transform: 'rotate(45deg)' }}
        animate={{
          rotate: [45, 135, 225, 315, 405]
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "linear"
        }}
      />
      
      <motion.div
        className="absolute bottom-32 left-12 w-8 h-2 bg-black opacity-20"
        animate={{
          x: [0, 20, 0],
          scaleX: [1, 1.5, 1]
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute top-1/3 left-8 w-6 h-6 border-2 border-black opacity-20"
        style={{ transform: 'rotate(45deg)' }}
        animate={{
          rotate: [45, 90, 135, 180, 225, 270, 315, 360, 405],
          scale: [1, 1.1, 1]
        }}
        transition={{
          repeat: Infinity,
          duration: 10,
          ease: "linear"
        }}
      />
    </motion.div>
  );
};

export default Home;