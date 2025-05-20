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
  // readyParticipants를 제거하지 않고 실제 사용하도록 수정
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
    }, 400 - Math.min(150, participants.length * 10)); // 참가자가 많을수록 빨라짐
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

  // 준비 상태 디버깅 정보 (readyParticipants를 사용하는 부분 추가)
  useEffect(() => {
    if (isHost) {
      console.log(`현재 준비된 참가자: ${tappedParticipants.join(', ')}`);
      console.log(`전체 참가자 수: ${participants.length}`);
    }
  }, [tappedParticipants, participants.length, isHost]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-4xl font-thin mb-8">Chill</h1>
      
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
            className="text-lg"
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
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <button 
            className="px-6 py-2 bg-gray-50 rounded-full shadow-sm hover:bg-gray-100 mt-4"
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
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="ink-spread">
            <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="3" seed="0" stitchTiles="stitch" result="turbulence"/>
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="10" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
          <filter id="winner-glow">
            <feGaussianBlur stdDeviation="8" result="blur" />
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
    <motion.div className="relative">
      {/* 배경 발광 효과 - 당첨 또는 활성 상태일 때 */}
      {(isWinner || isActive) && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isWinner ? [0.6, 0.8, 0.6] : [0.3, 0.5, 0.3],
            scale: isWinner ? [0.98, 1.02, 0.98] : [0.99, 1.01, 0.99]
          }}
          transition={{ 
            repeat: Infinity, 
            repeatType: "reverse", 
            duration: isWinner ? 1.5 : 0.8,
            ease: "easeInOut"
          }}
          style={{ 
            filter: 'blur(15px)',
            background: isWinner ? 'white' : 'rgba(255,255,255,0.3)'
          }}
        />
      )}
      
      {/* 메인 버튼 */}
      <motion.button
        className="w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] rounded-full flex items-center justify-center bg-white shadow-sm text-5xl font-light relative"
        whileTap={{ scale: 0.98 }}
        onClick={onTap}
        animate={{ 
          boxShadow: isWinner 
            ? '0px 0px 30px rgba(255,255,255,0.5), 0px 0px 15px rgba(0,0,0,0.1)' 
            : '0px 5px 15px rgba(0,0,0,0.05)'
        }}
      >
        <motion.span
          animate={{ 
            scale: isActive ? [1, 1.2, 1] : 1,
            opacity: isActive ? [0.8, 1, 0.8] : 0.9
          }}
          transition={{ 
            duration: 0.4
          }}
        >
          {number}
        </motion.span>
        
        {/* 잉크 효과 오버레이 */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
          viewBox="0 0 200 200" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="ink-spread">
            <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="3" result="turbulence"/>
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="8" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
          <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" filter="url(#ink-spread)" />
        </svg>
      </motion.button>
      
      {/* 추가 물결 효과 */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={false}
        animate={{ 
          scale: [0.97, 1.03, 0.97], 
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 1, -1, 0]  // 미세한 회전 추가
        }}
        transition={{ 
          repeat: Infinity, 
          repeatType: "reverse", 
          duration: 4,
          ease: "easeInOut"
        }}
      >
        <div className="w-[104%] h-[104%] rounded-full border border-gray-300 opacity-30" />
      </motion.div>
    </motion.div>
  );
};

export default ChillGame;