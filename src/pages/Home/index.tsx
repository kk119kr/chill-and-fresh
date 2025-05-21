import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { highContrast } = useTheme();
  const [selectedGame, setSelectedGame] = useState<'chill' | 'freshhh' | null>(null);
  const [inkBlobs, setInkBlobs] = useState<Array<{id: number, path: string}>>([]);
  
  // 배경 잉크 효과 생성
  useEffect(() => {
    // 초기 잉크 효과 생성
    const initialBlobs = Array(3).fill(0).map((_, i) => ({
      id: i,
      path: generateInkPath(i * 2)
    }));
    setInkBlobs(initialBlobs);
    
    // 주기적으로 잉크 형태 변경
    const interval = setInterval(() => {
      setInkBlobs(prev => 
        prev.map(blob => ({
          ...blob,
          path: generateInkPath(blob.id * 2)
        }))
      );
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);
  
  // 잉크 형태 경로 생성
  const generateInkPath = (seed: number) => {
    const points = 8 + Math.floor(seed % 4);
    const radius = 30 + (seed * 10);
    const variance = 15 + (seed * 2);
    
    let path = "M";
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = radius + (Math.random() * variance * 2 - variance);
      const x = Math.cos(angle) * r + 50; // 중심점 50,50
      const y = Math.sin(angle) * r + 50;
      
      if (i === 0) path += `${x},${y}`;
      else path += ` L${x},${y}`;
    }
    path += " Z";
    return path;
  };
  
  // 게임 선택 및 화면 전환
  const handleSelectGame = (gameType: 'chill' | 'freshhh') => {
    setSelectedGame(gameType);
    
    // 애니메이션 후 페이지 이동
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
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen bg-ink-white px-6 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 배경 잉크 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {inkBlobs.map((blob, index) => (
          <motion.svg
            key={blob.id}
            className="absolute"
            viewBox="0 0 100 100"
            style={{
              top: `${10 + (index * 30)}%`,
              left: `${20 + (index * 25)}%`,
              width: `${20 + (index * 5)}vw`,
              height: `${20 + (index * 5)}vw`,
              opacity: 0.03
            }}
            initial={false}
            animate={{
              x: [0, 10, -5, 0], 
              y: [0, -8, 5, 0],
              rotate: [0, 3, -2, 0],
              scale: [1, 1.05, 0.98, 1]
            }}
            transition={{
              repeat: Infinity,
              duration: 20 + (index * 5),
              ease: "easeInOut"
            }}
          >
            <motion.path
              d={blob.path}
              fill="#000000"
              animate={{ d: blob.path }}
              transition={{ duration: 8, ease: "easeInOut" }}
            />
          </motion.svg>
        ))}
      </div>
      
      {/* 메인 타이틀 */}
      <motion.h1 
        className="text-5xl font-black mb-16 tracking-tight relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.6 }}
      >
        <span className="text-ink-black relative z-10">
          Chill <span className="text-ink-gray-400">&</span> Fresh
        </span>
        {/* 타이틀 그림자 효과 */}
        <span className="absolute inset-0 text-ink-black blur-[2px] opacity-10 z-0 transform translate-x-[2px] translate-y-[2px]">
          Chill & Fresh
        </span>
      </motion.h1>
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Chill 게임 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: selectedGame === 'chill' ? 1 : 0, y: selectedGame === 'chill' ? 0 : 10 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Button
            onClick={() => handleSelectGame('chill')}
            disabled={selectedGame !== null}
            variant="primary"
            fullWidth
            size="large"
            layoutId="chill-button"
            className="group h-16"
          >
            <motion.div className="flex w-full justify-between items-center px-2">
              <motion.span 
                className="text-xl font-bold"
                initial={false}
                animate={{ x: selectedGame === 'chill' ? -20 : 0 }}
                transition={{ duration: 0.4 }}
              >
                Chill
              </motion.span>
              
              <motion.span 
                className="text-sm text-ink-gray-300 group-hover:text-ink-gray-200 transition-colors"
                initial={false}
                animate={{ 
                  opacity: selectedGame === 'chill' ? 0 : 1,
                  x: selectedGame === 'chill' ? 20 : 0
                }}
                transition={{ duration: 0.4 }}
              >
                랜덤 당첨 게임
              </motion.span>
            </motion.div>
          </Button>
        </motion.div>

        {/* Freshhh 게임 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: selectedGame === 'freshhh' ? 1 : 0, y: selectedGame === 'freshhh' ? 0 : 10 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button
            onClick={() => handleSelectGame('freshhh')}
            disabled={selectedGame !== null}
            variant="secondary"
            fullWidth
            size="large"
            layoutId="freshhh-button"
            className="group h-16"
          >
            <motion.div className="flex w-full justify-between items-center px-2">
              <motion.span 
                className="text-xl font-bold"
                initial={false}
                animate={{ x: selectedGame === 'freshhh' ? -20 : 0 }}
                transition={{ duration: 0.4 }}
              >
                Freshhh
              </motion.span>
              
              <motion.span 
                className="text-sm text-ink-gray-500 group-hover:text-ink-gray-700 transition-colors"
                initial={false}
                animate={{ 
                  opacity: selectedGame === 'freshhh' ? 0 : 1,
                  x: selectedGame === 'freshhh' ? 20 : 0
                }}
                transition={{ duration: 0.4 }}
              >
                눈치 게임
              </motion.span>
            </motion.div>
          </Button>
        </motion.div>
      </div>
      
      {/* 안내 텍스트 */}
      <motion.p
        className="text-xs text-ink-gray-400 mt-12 tracking-wider uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        탭하여 게임을 선택하세요
      </motion.p>
      
      {/* 접근성 버튼 - 고대비 토글 */}
      {highContrast && (
        <motion.div
          className="absolute bottom-4 right-4 text-xs text-ink-gray-400 bg-ink-gray-100 py-1 px-3 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5 }}
        >
          고대비 모드 활성화됨
        </motion.div>
      )}
    </motion.div>
  );
};

export default Home;