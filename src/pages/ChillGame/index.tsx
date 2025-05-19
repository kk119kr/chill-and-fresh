import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
  const [readyParticipants, setReadyParticipants] = useState<number[]>([]);

  // 버튼 탭 처리
  const handleTap = () => {
    if (gameState !== 'waiting' || userTapped) return;
    
    setUserTapped(true);
    
    // 실제 구현에서는 소켓으로 준비 상태 전송
    console.log(`참가자 ${participantNumber}이(가) 준비 완료`);
    
    // 호스트인 경우 readyParticipants 업데이트 (실제론 서버에서 관리)
    if (isHost) {
      setReadyParticipants(prev => {
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

  // 게임 상태에 따른 버튼 스타일
  const getButtonStyle = () => {
    if (gameState === 'waiting') {
      return userTapped 
        ? 'bg-gray-100 shadow-sm' 
        : 'bg-gray-50 hover:bg-gray-100 shadow-sm';
    }
    
    if (gameState === 'spinning') {
      return activeNumber === participantNumber 
        ? 'bg-gray-100 ring-4 ring-gray-200 shadow-md' 
        : 'bg-gray-50 shadow-sm';
    }
    
    if (gameState === 'result') {
      return winner === participantNumber 
        ? 'bg-gray-100 ring-8 ring-gray-200 shadow-lg pulse-animation' 
        : 'bg-gray-50 opacity-50 shadow-sm';
    }
    
    return 'bg-gray-50 shadow-sm';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-4xl font-thin mb-8">Chill</h1>
      
      <div className="mb-8 text-center">
        {gameState === 'waiting' && (
          <p className="text-sm text-gray-500">
            {userTapped 
              ? '다른 참가자를 기다리는 중...' 
              : '버튼을 탭하세요'}
          </p>
        )}
        
        {gameState === 'result' && (
          <p className="text-lg">
            {winner === participantNumber 
              ? '당첨되었습니다! 🎉' 
              : '아쉽게도 당첨되지 않았습니다'}
          </p>
        )}
      </div>
      
      <motion.button
        className={`rounded-full w-64 h-64 flex items-center justify-center text-5xl font-light ${getButtonStyle()}`}
        onClick={handleTap}
        disabled={gameState !== 'waiting' || userTapped}
        whileTap={{ scale: gameState === 'waiting' ? 0.98 : 1 }}
        animate={{ 
          scale: activeNumber === participantNumber && gameState === 'spinning' ? 1.05 : 1,
          transition: { duration: 0.2 }
        }}
      >
        {participantNumber}
      </motion.button>
      
      {gameState === 'result' && isHost && (
        <div className="mt-8">
          <button 
            className="px-6 py-2 bg-gray-50 rounded-full shadow-sm hover:bg-gray-100 mt-4"
            onClick={() => window.location.reload()}
          >
            다시 하기
          </button>
        </div>
      )}
      
      {/* CSS 애니메이션 (당첨 시 반짝임 효과) */}
      <style jsx>{`
        .pulse-animation {
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(200, 200, 200, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(200, 200, 200, 0); }
          100% { box-shadow: 0 0 0 0 rgba(200, 200, 200, 0); }
        }
      `}</style>
    </div>
  );
};

export default ChillGame;