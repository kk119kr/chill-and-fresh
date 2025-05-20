import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';



const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedButton, setSelectedButton] = useState<'chill' | 'freshhh' | null>(null);
  
  // 게임 버튼 모션 제어
  const chillVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    tap: { scale: 0.98 },
    exit: (custom: string) => ({
      scale: custom === 'chill' ? 1.05 : 0.9,
      opacity: custom === 'chill' ? 1 : 0,
      y: custom === 'chill' ? -50 : 0,
      transition: { duration: 0.5 }
    })
  };

  const freshhhVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    tap: { scale: 0.98 },
    exit: (custom: string) => ({
      scale: custom === 'freshhh' ? 1.05 : 0.9,
      opacity: custom === 'freshhh' ? 1 : 0,
      y: custom === 'freshhh' ? -50 : 0,
      transition: { duration: 0.5 }
    })
  };

  // 게임 선택 및 화면 전환
  const handleSelectGame = (gameType: 'chill' | 'freshhh') => {
    setSelectedButton(gameType);
    
    // 애니메이션 효과를 위해 약간의 지연 후 전환
    setTimeout(() => {
      navigate('/create', { 
        state: { 
          selectedGame: gameType,
          animateFrom: 'home'
        }
      });
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <motion.h1 
        className="text-5xl font-thin mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Chill & Fresh
      </motion.h1>
      
      <div className="grid grid-cols-1 gap-8 w-full max-w-md px-4">
        {/* Chill 게임 버튼 */}
        <motion.div
          custom={selectedButton}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={chillVariants}
          whileTap="tap"
          className="relative"
          transition={{ duration: 0.6 }}
        >
          <button
            onClick={() => handleSelectGame('chill')}
            disabled={selectedButton !== null}
            className={`w-full aspect-square rounded-full flex items-center justify-center text-4xl font-light bg-black text-white relative z-10 shadow-lg ${
              selectedButton === 'chill' ? 'scale-105' : selectedButton ? 'opacity-50 scale-95' : ''
            } transition-all duration-300`}
          >
            <motion.span
              animate={{ 
                opacity: [0.9, 1, 0.9],
                scale: [0.99, 1.01, 0.99]
              }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "reverse", 
                duration: 3,
                ease: "easeInOut"
              }}
            >
              Chill
            </motion.span>
            
            {/* 유기적인 배경 효과 */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-full overflow-hidden"
              animate={{ 
                rotate: [0, 1, -1, 0],
                scale: [0.99, 1.01, 0.99]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 8,
                ease: "easeInOut"
              }}
            >
              <svg className="w-full h-full opacity-30" viewBox="0 0 200 200">
                <path fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" 
                  d="M46.5,-76.1C59.6,-69,69.2,-54.9,76.3,-39.6C83.4,-24.4,88,-7.9,85.8,7.7C83.6,23.3,74.5,37.9,63.3,49.2C52.1,60.5,38.7,68.5,24.1,73.2C9.5,77.9,-6.3,79.4,-21.6,75.9C-36.9,72.3,-51.8,63.9,-63.1,51.5C-74.4,39.1,-82.2,22.8,-83.3,5.8C-84.4,-11.2,-78.9,-28.9,-68.5,-42.1C-58.1,-55.3,-42.9,-64,-28,-69.3C-13.1,-74.5,1.4,-76.4,16.6,-76.9C31.9,-77.5,47.8,-76.7,59.1,-70.3Z" transform="translate(100 100)" />
              </svg>
            </motion.div>
          </button>
          
          {/* 물결 효과 */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={false}
            animate={{ scale: [0.97, 1.03, 0.97], opacity: [0.5, 0.7, 0.5] }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 3,
              ease: "easeInOut"
            }}
          >
            <div className="w-[102%] h-[102%] rounded-full border border-black border-opacity-20" />
          </motion.div>
        </motion.div>

        {/* Freshhh 게임 버튼 */}
        <motion.div
          custom={selectedButton}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={freshhhVariants}
          whileTap="tap"
          className="relative"
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <button
            onClick={() => handleSelectGame('freshhh')}
            disabled={selectedButton !== null}
            className={`w-full aspect-square rounded-full flex items-center justify-center text-4xl font-light bg-white border-2 border-gray-200 text-black relative z-10 shadow-lg ${
              selectedButton === 'freshhh' ? 'scale-105' : selectedButton ? 'opacity-50 scale-95' : ''
            } transition-all duration-300`}
          >
            <motion.span
              animate={{ 
                opacity: [0.9, 1, 0.9],
                scale: [0.99, 1.01, 0.99]
              }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "reverse", 
                duration: 3,
                ease: "easeInOut"
              }}
            >
              Freshhh
            </motion.span>
            
            {/* 유기적인 배경 효과 */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-full overflow-hidden"
              animate={{ 
                rotate: [0, -1, 1, 0],
                scale: [0.99, 1.01, 0.99]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 8,
                ease: "easeInOut"
              }}
            >
              <svg className="w-full h-full opacity-30" viewBox="0 0 200 200">
                <path fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" 
                  d="M46.5,-76.1C59.6,-69,69.2,-54.9,76.3,-39.6C83.4,-24.4,88,-7.9,85.8,7.7C83.6,23.3,74.5,37.9,63.3,49.2C52.1,60.5,38.7,68.5,24.1,73.2C9.5,77.9,-6.3,79.4,-21.6,75.9C-36.9,72.3,-51.8,63.9,-63.1,51.5C-74.4,39.1,-82.2,22.8,-83.3,5.8C-84.4,-11.2,-78.9,-28.9,-68.5,-42.1C-58.1,-55.3,-42.9,-64,-28,-69.3C-13.1,-74.5,1.4,-76.4,16.6,-76.9C31.9,-77.5,47.8,-76.7,59.1,-70.3Z" transform="translate(100 100)" />
              </svg>
            </motion.div>
          </button>
          
          {/* 물결 효과 */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={false}
            animate={{ scale: [0.97, 1.03, 0.97], opacity: [0.3, 0.5, 0.3] }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 3,
              ease: "easeInOut"
            }}
          >
            <div className="w-[102%] h-[102%] rounded-full border border-gray-300" />
          </motion.div>
        </motion.div>
      </div>
      
      <motion.div
        className="mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p className="text-sm text-gray-500">
          탭하여 게임을 선택하세요
        </p>
      </motion.div>
      
      {/* SVG 필터 정의 */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="ink-spread">
            <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="3" seed="0" stitchTiles="stitch" result="turbulence"/>
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="10" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default Home;  