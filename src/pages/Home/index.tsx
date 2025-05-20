import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ChillButtonProps {
  number: number;
  isActive: boolean;
  isWinner: boolean;
  gameState: 'waiting' | 'spinning' | 'result';
  userTapped: boolean;
  onTap: () => void;
}

interface ChillGameProps {
  participants: { id: string; nickname: string }[];
  participantNumber: number; // 현재 사용자의 번호
  isHost: boolean;
  onGameEnd: (winnerNumber: number) => void;
}

const ChillGame: React.FC<ChillGameProps> = ({
  participants,
  participantNumber,
  isHost,
  onGameEnd,
}) => {
  const [gameState, setGameState] = useState<'waiting' | 'spinning' | 'result'>('waiting');
  const [allReady, setAllReady] = useState(false);
  const [activeNumber, setActiveNumber] = useState<number | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const [userTapped, setUserTapped] = useState(false);

  // 호스트가 모든 사용자의 준비 상태를 관리 (실제로는 소켓을 통해 관리)
  const [tappedParticipants, setTappedParticipants] = useState<number[]>([]);

  // 버튼 탭 처리
  const handleTap = () => {
    if (gameState !== 'waiting' || userTapped) return;
    
    setUserTapped(true);
    
    // 실제 구현에서는 소켓으로 준비 상태 전송
    console.log(`참가자 ${participantNumber}이(가) 준비 완료`);
    
    // 호스트인 경우 tappedParticipants 업데이트 (실제론 서버에서 관리)
    if (isHost) {
      setTappedParticipants(prev => {
        const updated = [...prev, participantNumber];
        // 모든 참가자가 준비되었는지 확인
        if (updated.length === participants.length) {
          setAllReady(true);
        }
        return updated;
      });
    }
  };

  // 게임 시작 (호스트만 가능)
  const startGame = () => {
    if (!isHost || !allReady) return;
    
    setGameState('spinning');
    
    // 랜덤 회전 횟수 (3-6바퀴 사이)
    const rounds = 3 + Math.floor(Math.random() * 3);
    const totalParticipants = participants.length;
    
    // 회전 효과 구현
    let currentNumber = 1;
    let rotations = 0;
    const rotationInterval = setInterval(() => {
      setActiveNumber(currentNumber);
      
      currentNumber++;
      if (currentNumber > totalParticipants) {
        currentNumber = 1;
        rotations++;
      }
      
      // 정해진 회전 수에 도달하면 결과 표시
      if (rotations >= rounds && Math.random() < 0.3) {
        clearInterval(rotationInterval);
        
        // 마지막으로 활성화된 번호가 당첨
        setWinner(currentNumber - 1 || totalParticipants);
        setGameState('result');
        
        // 당첨 결과 콜백 호출
        onGameEnd(currentNumber - 1 || totalParticipants);
      }
    }, 300 - Math.min(150, participants.length * 15)); // 참가자가 많을수록 빨라짐
  };

  // 준비 상태가 변경될 때 (실제로는 소켓 이벤트로 처리)
  useEffect(() => {
    if (isHost && allReady) {
      // 잠시 대기 후 게임 시작
      const timer = setTimeout(() => {
        startGame();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [allReady, isHost]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-5xl font-light mb-8">Chill</h1>
      
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {gameState === 'waiting' && (
          <p className="text-sm text-gray-500">
            {userTapped 
              ? `다른 참가자를 기다리는 중... (${tappedParticipants.length}/${participants.length})` 
              : '버튼을 탭하세요'}
          </p>
        )}
        
        {gameState === 'result' && (
          <motion.p 
            className="text-xl font-light"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 17 
            }}
          >
            {winner === participantNumber 
              ? '당첨되었습니다! 🎉' 
              : '아쉽게도 당첨되지 않았습니다'}
          </motion.p>
        )}
      </motion.div>
      
      {/* 살아있는 유기적인 버튼 */}
      <ChillButton 
        number={participantNumber}
        isActive={activeNumber === participantNumber}
        isWinner={winner === participantNumber}
        gameState={gameState}
        userTapped={userTapped}
        onTap={handleTap}
      />
      
      {gameState === 'result' && isHost && (
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <button 
            className="px-8 py-3 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-black"
            onClick={() => window.location.reload()}
          >
            다시 하기
          </button>
        </motion.div>
      )}
      
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
          <filter id="winner-glow">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 1  0 1 0 0 1  0 0 1 0 1  0 0 0 18 -7" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

// 유기적인 Chill 버튼 컴포넌트
const ChillButton: React.FC<ChillButtonProps> = ({ number, isActive, isWinner, gameState, userTapped, onTap }) => {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] }}
    >
      {/* 배경 원 - 유기적인 형태 */}
      <motion.div
        className="absolute w-[72vw] h-[72vw] max-w-[520px] max-h-[520px] rounded-full bg-black"
        animate={{ 
          filter: isWinner ? "url(#winner-glow)" : isActive ? "url(#glow)" : "none",
          boxShadow: isWinner 
            ? "0px 0px 60px rgba(0,0,0,0.3), 0px 0px 30px rgba(0,0,0,0.2)" 
            : "0px 10px 30px rgba(0,0,0,0.1)"
        }}
        transition={{ duration: 0.5 }}
        style={{ 
          filter: isWinner ? "url(#winner-glow)" : isActive ? "url(#glow)" : "url(#ink-spread)"
        }}
      />
      
      {/* 클릭 가능한 버튼 */}
      <motion.button
        className={`w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] rounded-full flex items-center justify-center text-6xl font-light relative z-10 ${
          gameState === 'waiting' && !userTapped ? 'cursor-pointer' : ''
        } ${isActive || isWinner ? 'text-white' : 'text-white'}`}
        onClick={onTap}
        disabled={gameState !== 'waiting' || userTapped}
        whileTap={gameState === 'waiting' && !userTapped ? { scale: 0.97 } : {}}
        animate={{ 
          scale: isActive && gameState === 'spinning' 
            ? [1, 1.05, 1] 
            : isWinner 
            ? [1, 1.03, 1] 
            : 1
        }}
        transition={isWinner ? {
          scale: { 
            repeat: Infinity, 
            repeatType: "reverse", 
            duration: 1.5,
            ease: "easeInOut"
          }
        } : {
          scale: { duration: 0.3 }
        }}
      >
        {/* 숫자 */}
        <motion.span
          animate={{ 
            opacity: isActive && gameState === 'spinning' ? 1 : 0.9,
            scale: isActive && gameState === 'spinning' ? 1.3 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {number}
        </motion.span>
      </motion.button>
      
      {/* 물결 효과 - 클릭 시 */}
      {gameState === 'waiting' && !userTapped && (
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
          <div className="w-[73vw] h-[73vw] max-w-[515px] max-h-[515px] rounded-full border border-white border-opacity-20" />
        </motion.div>
      )}
      
      {/* 당첨 시 추가 효과 */}
      {isWinner && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ 
            repeat: Infinity,
            repeatType: "reverse", 
            duration: 2,
            ease: "easeInOut"
          }}
        >
          <div className="w-[80vw] h-[80vw] max-w-[560px] max-h-[560px] rounded-full border border-white border-opacity-30" />
        </motion.div>
      )}
      
      {/* 유기적인 움직임을 가진 내부 요소 */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{ 
          rotate: [0, 2, -2, 0],
          scale: [0.97, 1.01, 0.97]
        }}
        transition={{ 
          repeat: Infinity,
          duration: 8,
          ease: "easeInOut"
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <defs>
            <radialGradient id="buttonGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" style={{ stopColor: '#333', stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: '#000', stopOpacity: 0 }} />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="95" fill="url(#buttonGradient)" />
        </svg>
      </motion.div>
    </motion.div>
  );
};

export default ChillGame;