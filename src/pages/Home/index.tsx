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
          className="absolute top-8 left-1/2 transform -translate-x-1/2"
          animate={{ 
            opacity: [0.2, 0.5, 0.2],
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
        
        <h2 className="text-[8rem] md:text-[12rem] font-black tracking-tight font-title uppercase" style={{ transform: 'rotate(0deg)' }}>
          CHILL
        </h2>
      </motion.div>
      
      {/* 애니메이션 도트 가이드라인 */}
      {/* 위쪽 도트 가이드 */}
      <div className="absolute top-1/2 left-1/2 z-5 pointer-events-none" style={{ transform: 'translate(-50%, -50%)' }}>
        {/* 위쪽으로 올라가는 도트들 */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`up-${i}`}
            className="absolute w-2 h-2 bg-gray-400 rounded-full"
            style={{
              left: '-4px',
              top: `-${80 + (i * 20)}px`,
            }}
            animate={{
              opacity: [0, 0.3, 0.7, 0.3, 0],
              scale: [0.5, 1, 0.5],
              y: [-10, 0, 10]
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* 아래쪽으로 내려가는 도트들 */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`down-${i}`}
            className="absolute w-2 h-2 bg-gray-400 rounded-full"
            style={{
              left: '-4px',
              top: `${80 + (i * 20)}px`,
            }}
            animate={{
              opacity: [0, 0.3, 0.7, 0.3, 0],
              scale: [0.5, 1, 0.5],
              y: [10, 0, -10]
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              delay: i * 0.2 + 1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* 중앙 원형 버튼 */}
      <div className="absolute top-1/2 left-1/2 z-10" style={{ transform: 'translate(-50%, -50%)' }}>
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* 완전한 원형 버튼 */}
          <motion.div
            className="relative cursor-grab active:cursor-grabbing rounded-full bg-black flex items-center justify-center"
            drag="y"
            dragElastic={0.1}
            dragConstraints={{ top: -150, bottom: 150 }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ 
              scale: 1.1,
              transition: { duration: 0.1 }
            }}
            layoutId="main-game-element"
            animate={{
              rotate: isDragging ? [0, 1, -1, 0.5, -0.5, 0] : 0,
              x: isDragging ? [0, -0.5, 0.5, -0.3, 0.3, 0] : 0,
            }}
            transition={{
              rotate: {
                repeat: isDragging ? Infinity : 0,
                duration: 0.15,
                ease: "easeInOut"
              },
              x: {
                repeat: isDragging ? Infinity : 0,
                duration: 0.2,
                ease: "easeInOut"
              }
            }}
            style={{
              width: '64px',
              height: '64px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* SLIDE 텍스트 */}
            <motion.span 
              className="text-white font-mono font-black text-xs tracking-widest uppercase"
              style={{
                textAlign: 'center'
              }}
              animate={{
                opacity: isDragging ? 0.7 : 1
              }}
            >
              SLIDE!
            </motion.span>
            
            {/* 드래그 방향 표시 화살표 */}
            {isDragging && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center text-white text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {dragY < -30 && (
                  <motion.div
                    initial={{ y: 5 }}
                    animate={{ y: 0 }}
                  >
                    ↑
                  </motion.div>
                )}
                {dragY > 30 && (
                  <motion.div
                    initial={{ y: -5 }}
                    animate={{ y: 0 }}
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
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ 
            opacity: [0.2, 0.5, 0.2],
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
        
        <h2 className="text-[8rem] md:text-[12rem] font-black tracking-tight font-title uppercase" style={{ transform: 'rotate(0deg)' }}>
          FRESHHH
        </h2>
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