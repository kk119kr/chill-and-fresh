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

  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen bg-white px-8 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      
      {/* 메인 타이틀 */}
      <motion.h1 
        className="text-6xl font-black mb-16 tracking-tight font-mono uppercase"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        GAME
      </motion.h1>
      
      {/* 3단 구조 레이아웃 */}
      <div className="flex flex-col items-center space-y-8 w-full max-w-sm">
        
        {/* 상단: CHILL 카드 */}
        <motion.div
          className={`w-full h-20 border-2 border-black bg-white flex items-center justify-center
                     font-mono font-bold text-xl tracking-widest uppercase cursor-pointer
                     ${dragY < -30 ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelectGame('chill')}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          CHILL
        </motion.div>
        
        {/* 중앙: 드래그 가능한 START 버튼 */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.div
            className="w-24 h-24 bg-black border-2 border-black cursor-grab active:cursor-grabbing
                       flex items-center justify-center relative overflow-hidden"
            drag="y"
            dragElastic={0.2}
            dragConstraints={{ top: -100, bottom: 100 }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1 }}
            layoutId="main-game-element"
          >
            {/* START 텍스트 */}
            <motion.span 
              className="text-white font-mono font-black text-xs tracking-widest uppercase"
              animate={{
                opacity: isDragging ? 0.7 : 1
              }}
            >
              START
            </motion.span>
            
            {/* 드래그 방향 표시 화살표 */}
            {isDragging && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {dragY < -30 && (
                  <motion.div
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                    className="text-2xl"
                  >
                    ↑
                  </motion.div>
                )}
                {dragY > 30 && (
                  <motion.div
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    className="text-2xl"
                  >
                    ↓
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
        
        {/* 하단: RANDOM 카드 */}
        <motion.div
          className={`w-full h-20 border-2 border-black bg-white flex items-center justify-center
                     font-mono font-bold text-xl tracking-widest uppercase cursor-pointer
                     ${dragY > 30 ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelectGame('freshhh')}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          RANDOM
        </motion.div>
      </div>
      
      {/* 안내 텍스트 */}
      <motion.p
        className="text-xs font-mono text-gray-500 mt-12 tracking-widest uppercase text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        DRAG TO SELECT
      </motion.p>
      
      {/* 선택 피드백 표시 */}
      {isDragging && Math.abs(dragY) > 30 && (
        <motion.div
          className="fixed top-8 left-1/2 transform -translate-x-1/2 
                     bg-black text-white px-6 py-2 font-mono text-sm tracking-widest uppercase"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {dragY < -30 ? 'CHILL SELECTED' : 'RANDOM SELECTED'}
        </motion.div>
      )}
      
      {/* 기하학적 장식 요소들 */}
      <motion.div
        className="absolute top-16 right-16 w-4 h-4 bg-black"
        animate={{
          rotate: [0, 90, 180, 270, 360]
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "linear"
        }}
      />
      
      <motion.div
        className="absolute bottom-20 left-12 w-8 h-2 bg-black"
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
        className="absolute top-1/3 left-8 w-6 h-6 border-2 border-black"
        animate={{
          rotate: [0, 45, 90, 135, 180, 225, 270, 315, 360],
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