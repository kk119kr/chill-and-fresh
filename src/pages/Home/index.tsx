import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedButton, setSelectedButton] = useState<'chill' | 'freshhh' | null>(null);
  
  // 게임 선택 및 화면 전환
  const handleSelectGame = (gameType: 'chill' | 'freshhh') => {
    setSelectedButton(gameType);
    
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
      <motion.h1 
        className="text-4xl font-medium mb-12 tracking-tight"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Chill & Fresh
      </motion.h1>
      
      <div className="w-full max-w-md space-y-6">
        {/* Chill 게임 버튼 */}
        <motion.button
          onClick={() => handleSelectGame('chill')}
          disabled={selectedButton !== null}
          className="w-full py-4 px-6 rounded-xl bg-gray-50 text-black border border-gray-100 shadow-sm flex items-center justify-between"
          whileHover={{ scale: 1.02, backgroundColor: '#f9f9f9' }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <span className="text-xl font-medium">Chill</span>
          <span className="text-sm text-gray-500">랜덤 당첨 게임</span>
        </motion.button>

        {/* Freshhh 게임 버튼 */}
        <motion.button
          onClick={() => handleSelectGame('freshhh')}
          disabled={selectedButton !== null}
          className="w-full py-4 px-6 rounded-xl bg-black text-white flex items-center justify-between"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <span className="text-xl font-medium">Freshhh</span>
          <span className="text-sm text-gray-300">눈치 게임</span>
        </motion.button>
      </div>
      
      <motion.p
        className="text-xs text-gray-400 mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        탭하여 게임을 선택하세요
      </motion.p>
    </div>
  );
};

export default Home;