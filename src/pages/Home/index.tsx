// src/pages/Home/index.tsx 수정
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// 잉크 버튼 SVG 경로 생성 유틸리티
const generateInkPath = () => {
  // 기본 원형에 약간의 불규칙성 추가
  const points = 12;
  const radius = 100;
  const variance = 8; // 불규칙성 정도
  
  let path = "M";
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius + (Math.random() * variance * 2 - variance);
    const x = Math.cos(angle) * r + 100;
    const y = Math.sin(angle) * r + 100;
    
    if (i === 0) path += `${x},${y}`;
    else path += ` L${x},${y}`;
  }
  path += " Z";
  return path;
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedButton, setSelectedButton] = useState<'chill' | 'freshhh' | null>(null);
  const [chillPath, setChillPath] = useState(generateInkPath());
  const [freshhhPath, setFreshhhPath] = useState(generateInkPath());
  
  // 주기적으로 잉크 경로 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setChillPath(generateInkPath());
      setFreshhhPath(generateInkPath());
    }, 5000); // 5초마다 경로 변경
    
    return () => clearInterval(interval);
  }, []);
  
  // 화면 터치 시 잉크 번짐 효과
  const handleScreenTouch = (e: React.MouseEvent<HTMLDivElement>) => {
    const splash = document.createElement('div');
    splash.className = 'ink-splash';
    splash.style.left = `${e.clientX}px`;
    splash.style.top = `${e.clientY}px`;
    document.body.appendChild(splash);
    
    // 애니메이션 시작
    setTimeout(() => {
      splash.classList.add('ink-splash-animate');
    }, 10);
    
    // 애니메이션 종료 후 요소 제거
    setTimeout(() => {
      splash.remove();
    }, 1000);
  };

  // 게임 선택 및 화면 전환
  const handleSelectGame = (gameType: 'chill' | 'freshhh') => {
    setSelectedButton(gameType);
    
    // 페이지 전환 효과
    const transition = document.createElement('div');
    transition.className = 'page-transition';
    document.body.appendChild(transition);
    
    // 애니메이션 시작
    setTimeout(() => {
      transition.classList.add('page-wipe-in');
    }, 10);
    
    // 애니메이션 종료 후 페이지 이동
    setTimeout(() => {
      navigate('/create', { 
        state: { 
          selectedGame: gameType,
          animateFrom: 'home'
        }
      });
    }, 600);
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-white"
      onClick={handleScreenTouch}
    >
      <motion.h1 
        className="text-7xl font-black mb-16 tracking-tight"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        CHILL & FRESH
      </motion.h1>
      
      <div className="grid grid-cols-1 gap-12 w-full max-w-md px-8 relative">
        {/* Chill 게임 버튼 */}
        <motion.div
          custom={selectedButton}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, scale: selectedButton === 'chill' ? 1.2 : 0.8 }}
          className="relative"
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <button
            onClick={() => handleSelectGame('chill')}
            disabled={selectedButton !== null}
            className="w-full aspect-square flex items-center justify-center text-5xl font-black tracking-tight text-white relative z-10 overflow-hidden"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <motion.svg 
              viewBox="0 0 200 200" 
              className="absolute inset-0 w-full h-full"
              initial={false}
              animate={{ 
                rotate: [0, 1, -1, 0],
                scale: [0.98, 1.02, 0.98],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 10,
                ease: "easeInOut" 
              }}
            >
              <motion.path 
                d={chillPath} 
                fill="black" 
                initial={false}
                animate={{ d: chillPath }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </motion.svg>
            
            <motion.span
              className="z-20 relative"
              animate={{ 
                y: [0, -5, 0],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                ease: "easeInOut" 
              }}
            >
              CHILL
            </motion.span>
          </button>
        </motion.div>

        {/* Freshhh 게임 버튼 */}
        <motion.div
          custom={selectedButton}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, scale: selectedButton === 'freshhh' ? 1.2 : 0.8 }}
          className="relative"
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <button
            onClick={() => handleSelectGame('freshhh')}
            disabled={selectedButton !== null}
            className="w-full aspect-square flex items-center justify-center text-5xl font-black tracking-tight text-black relative z-10 overflow-hidden"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <motion.svg 
              viewBox="0 0 200 200" 
              className="absolute inset-0 w-full h-full"
              initial={false}
              animate={{ 
                rotate: [0, -1, 1, 0],
                scale: [0.98, 1.02, 0.98],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 10,
                ease: "easeInOut" 
              }}
            >
              <motion.path 
                d={freshhhPath} 
                fill="white" 
                stroke="black"
                strokeWidth="1"
                initial={false}
                animate={{ d: freshhhPath }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </motion.svg>
            
            <motion.span
              className="z-20 relative"
              animate={{ 
                y: [0, -5, 0],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                ease: "easeInOut" 
              }}
            >
              FRESHHH
            </motion.span>
          </button>
        </motion.div>
      </div>
      
      <motion.div
        className="mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <p className="text-sm font-medium uppercase tracking-widest">
          탭하여 게임을 선택하세요
        </p>
      </motion.div>
      
      {/* SVG 필터 정의 */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="ink-distort">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" seed="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default Home;