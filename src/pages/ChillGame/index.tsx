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

// 유기적인 잉크 경로 생성
const generateInkPath = (complexity = 0) => {
  const points = 12;
  const radius = 100;
  // complexity가 높을수록 더 불규칙한 형태
  const variance = 8 + (complexity * 0.5); 
  
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
  const [inkBlobs, setInkBlobs] = useState<Array<{id: number, path: string}>>([]);

  // 호스트가 모든 사용자의 준비 상태를 관리
  const [tappedParticipants, setTappedParticipants] = useState<number[]>([]);

  // 배경 잉크 효과 생성
  useEffect(() => {
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
    
    // 시작 시 진동 효과
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // 랜덤 회전 횟수 (3-6바퀴 사이)
    const rounds = 3 + Math.floor(Math.random() * 3);
    const totalParticipants = participants.length;
    
    // 회전 스피드 & 딜레이 조정 (참가자가 많을수록 빨라짐)
    const baseDelay = 400;
    const speedFactor = Math.min(150, participants.length * 10);
    const initialDelay = baseDelay - speedFactor;
    
    // 회전 효과 구현 - 점점 느려지는 회전
    let currentNumber = 1;
    let rotations = 0;
    let currentDelay = initialDelay;
    
    const rotateWithDelay = () => {
      setActiveNumber(currentNumber);
      
      // 진동 피드백
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      currentNumber++;
      if (currentNumber > totalParticipants) {
        currentNumber = 1;
        rotations++;
      }
      
      // 회전 속도 점진적 감소
      if (rotations >= rounds - 1) {
        currentDelay += 30; // 마지막 바퀴에서 점점 느려짐
      }
      
      // 정해진 회전 수에 도달하면 결과 표시
      if (rotations >= rounds && (Math.random() < 0.3 || currentDelay > 1000)) {
        // 마지막으로 활성화된 번호가 당첨
        const winnerNumber = currentNumber - 1 || totalParticipants;
        setWinner(winnerNumber);
        setGameState('result');
        
        // 당첨 결과 진동 피드백
        if (navigator.vibrate) {
          navigator.vibrate([50, 100, 50, 100, 150]);
        }
        
        // 당첨 결과 콜백 호출
        onGameEnd(winnerNumber);
        return;
      }
      
      // 다음 회전 예약
      setTimeout(rotateWithDelay, currentDelay);
    };
    
    setTimeout(rotateWithDelay, initialDelay);
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

  // 상태에 따른 메시지
  const getMessage = () => {
    if (gameState === 'waiting') {
      return userTapped 
        ? `다른 참가자를 기다리는 중... (${tappedParticipants.length}/${participants.length})` 
        : '버튼을 탭하세요';
    } else if (gameState === 'spinning') {
      return '...';
    } else if (gameState === 'result') {
      return winner === participantNumber 
        ? '당첨되었습니다! 🎉' 
        : '아쉽게도 당첨되지 않았습니다';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ink-white relative overflow-hidden">
      {/* 배경 잉크 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {inkBlobs.map((blob, index) => (
          <motion.svg
            key={blob.id}
            className="absolute"
            viewBox="0 0 100 100"
            style={{
              top: `${15 + (index * 30)}%`,
              left: `${20 + (index * 25)}%`,
              width: `${15 + (index * 5)}vw`,
              height: `${15 + (index * 5)}vw`,
              opacity: 0.02,
              filter: 'blur(1px)'
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
      
      <motion.h1 
        className="text-4xl font-black mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.6 }}
      >
        Chill
      </motion.h1>
      
      <motion.div
        className="mb-8 text-center z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.p 
          className="text-sm text-ink-gray-500"
          animate={gameState === 'result' ? {
            scale: [0.95, 1.05, 1],
            transition: { 
              duration: 0.6,
              type: "spring", 
              stiffness: 400, 
              damping: 10 
            }
          } : {}}
        >
          {getMessage()}
        </motion.p>
      </motion.div>
      
      {/* 메인 게임 버튼 */}
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
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <motion.button 
            className="px-6 py-2 bg-ink-gray-50 rounded-full text-ink-black border border-ink-gray-200 shadow-md hover:shadow-lg transition-shadow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.reload()}
          >
            다시 하기
          </motion.button>
        </motion.div>
      )}
      
      {/* SVG 필터 정의 */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="ink-spread">
            <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="3" seed="0" stitchTiles="stitch" result="turbulence"/>
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="10" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
          <filter id="winner-glow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 18 -7" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

// ChillButton 컴포넌트
const ChillButton: React.FC<ChillButtonProps> = ({ 
  number, 
  isActive, 
  isWinner, 
  gameState,
  userTapped,
  onTap 
}) => {
  const [inkPath, setInkPath] = useState(generateInkPath());
  
  // 활성화됐을 때 또는 주기적으로 잉크 형태 변화
  useEffect(() => {
    if (isActive || isWinner) {
      setInkPath(generateInkPath());
    }
    
    // 각 버튼마다 살짝 다른 주기로 업데이트
    const interval = setInterval(() => {
      if (gameState !== 'spinning') {
        setInkPath(generateInkPath());
      }
    }, 5000 + (number * 200)); // 버튼마다 다른 주기
    
    return () => clearInterval(interval);
  }, [isActive, isWinner, number, gameState]);

  return (
    <motion.div className="relative">
      {/* 배경 발광 효과 - 당첨 또는 활성 상태일 때 */}
      {(isWinner || isActive) && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isWinner ? [0.7, 0.9, 0.7] : [0.4, 0.6, 0.4],
            scale: isWinner ? [0.97, 1.03, 0.97] : [0.99, 1.01, 0.99]
          }}
          transition={{ 
            repeat: Infinity, 
            repeatType: "reverse", 
            duration: isWinner ? 1.2 : 0.8,
            ease: "easeInOut"
          }}
          style={{ 
            filter: 'blur(15px)',
            background: isWinner ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.3)'
          }}
        />
      )}
      
      {/* 입체감을 위한 그림자 레이어 */}
      <motion.div
        className="absolute -top-1 -left-1 w-[calc(100%+8px)] h-[calc(100%+8px)] rounded-full"
        style={{ 
          background: 'rgba(0,0,0,0.03)',
          filter: 'blur(3px)',
          zIndex: -1
        }}
        animate={{ 
          scale: isActive || isWinner ? 1.03 : 1
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* 바깥 물결 효과 */}
      {(isWinner || gameState === 'waiting') && (
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: isWinner ? [0.5, 0.8, 0.5] : [0.1, 0.3, 0.1],
            scale: isWinner ? [0.9, 1.1, 0.9] : [0.95, 1.05, 0.95]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: isWinner ? 2 : 4
          }}
        >
          <motion.div
            className="w-full h-full rounded-full"
            style={{ 
              border: `1px solid ${isWinner ? '#000' : 'rgba(0,0,0,0.2)'}`,
              boxShadow: isWinner 
                ? '0 0 30px rgba(0,0,0,0.2), 0 0 10px rgba(0,0,0,0.4) inset' 
                : 'none'
            }}
          />
        </motion.div>
      )}
      
      {/* 메인 버튼 */}
      <motion.button
        className="w-[70vw] h-[70vw] max-w-[400px] max-h-[400px] flex items-center justify-center relative"
        whileTap={gameState === 'waiting' && !userTapped ? { scale: 0.97 } : undefined}
        onClick={gameState === 'waiting' && !userTapped ? onTap : undefined}
        disabled={gameState !== 'waiting' || userTapped}
        style={{ cursor: gameState === 'waiting' && !userTapped ? 'pointer' : 'default' }}
      >
        <motion.svg 
          viewBox="0 0 200 200" 
          className="absolute inset-0 w-full h-full"
          initial={false}
          animate={{ 
            rotate: isActive ? [0, 2, -2, 0] : [0, 0.5, -0.5, 0],
            scale: isActive ? [0.95, 1.05, 0.95] : [0.98, 1.02, 0.98],
          }}
          transition={{ 
            repeat: Infinity, 
            duration: isActive ? 0.4 : 8,
            ease: "easeInOut" 
          }}
        >
          <defs>
            <filter id="filter-shadow">
              <feDropShadow 
                dx="0" 
                dy="3" 
                stdDeviation="3" 
                floodOpacity={isWinner ? "0.4" : "0.2"} 
                floodColor="#000000" 
              />
            </filter>
            <filter id="inner-emboss">
              <feColorMatrix type="matrix" values="0.5 0 0 0 0  0 0.5 0 0 0  0 0 0.5 0 0  0 0 0 1 0" />
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feOffset dx="0" dy="-2" result="offsetblur"/>
              <feComposite in="SourceGraphic" in2="offsetblur" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
            </filter>
          </defs>
          <motion.path 
            d={inkPath} 
            fill={isWinner || isActive ? "black" : "white"}
            stroke="black"
            strokeWidth="1"
            filter="url(#filter-shadow)"
            initial={false}
            animate={{ d: inkPath }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          {!isWinner && !isActive && (
            <motion.path 
              d={inkPath} 
              fill="transparent"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="8"
              filter="url(#inner-emboss)"
              initial={false}
              animate={{ d: inkPath }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          )}
        </motion.svg>
        
        <motion.span
          className={`z-20 relative text-7xl font-black ${isWinner || isActive ? 'text-white' : 'text-black'}`}
          animate={{ 
            scale: isActive ? [1, 1.3, 1] : 1,
            opacity: isActive ? [0.8, 1, 0.8] : 1
          }}
          transition={{ 
            duration: 0.4
          }}
          style={{
            textShadow: isWinner || isActive 
              ? '0 2px 10px rgba(0,0,0,0.5)' 
              : 'none',
            filter: isWinner 
              ? 'url(#winner-glow)' 
              : 'none'
          }}
        >
          {number}
        </motion.span>
      </motion.button>
    </motion.div>
  );
};

export default ChillGame;