import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChillGameProps {
  participants: { id: string; nickname: string }[];
  participantNumber: number;
  isHost: boolean;
  onGameEnd: (winnerNumber: number) => void;
}

interface PlayerRoundScore {
  round1: number;
  round2: number;
  round3: number;
  total: number;
}

interface PlayerResult {
  id: string;
  nickname: string;
  rank: number;
  scores: PlayerRoundScore;
}

const ChillGame: React.FC<ChillGameProps> = ({
  participants,
  participantNumber,
  isHost,
}) => {
  // 게임 상태
  const [gamePhase, setGamePhase] = useState<'waiting' | 'countdown' | 'playing' | 'roundEnd' | 'gameEnd'>('waiting');
  const [currentRound, setCurrentRound] = useState(1);
  const [countdown, setCountdown] = useState(3);
  
  // 준비 상태
  const [readyPlayers, setReadyPlayers] = useState<Set<number>>(new Set());
  const [isReady, setIsReady] = useState(false);
  
  // 게임 진행 상태
  const [colorProgress, setColorProgress] = useState(0); // 0-100
  const [gameTimer, setGameTimer] = useState<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // 플레이어 액션
  const [hasPressed, setHasPressed] = useState(false);
  const [isExploded, setIsExploded] = useState(false);
  const [allScores, setAllScores] = useState<Record<string, PlayerRoundScore>>({});
  
  // 최종 결과
  const [finalResults, setFinalResults] = useState<PlayerResult[]>([]);

  // 초기화
  useEffect(() => {
    initializeScores();
  }, [participants]);

  const initializeScores = () => {
    const scores: Record<string, PlayerRoundScore> = {};
    participants.forEach(p => {
      scores[p.id] = { round1: 0, round2: 0, round3: 0, total: 0 };
    });
    setAllScores(scores);
  };

  // Ready 버튼 처리
  const handleReady = () => {
    if (isReady) return;
    
    setIsReady(true);
    const newReadyPlayers = new Set(readyPlayers);
    newReadyPlayers.add(participantNumber);
    setReadyPlayers(newReadyPlayers);
    
    // 실제로는 소켓으로 전송
    console.log(`Player ${participantNumber} is ready`);
    
    // 모든 플레이어가 준비되었는지 확인 (임시로 로컬에서 처리)
    if (newReadyPlayers.size === participants.length) {
      console.log('All players ready');
    }
  };

  // Start 버튼 처리 (호스트만)
  const handleStart = () => {
    if (!isHost || readyPlayers.size !== participants.length) return;
    
    setGamePhase('countdown');
    setCountdown(3);
  };

  // 카운트다운 처리
  useEffect(() => {
    if (gamePhase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gamePhase === 'countdown' && countdown === 0) {
      startRound();
    }
  }, [gamePhase, countdown]);

  // 라운드 시작
  const startRound = () => {
    setGamePhase('playing');
    setColorProgress(0);
    setHasPressed(false);
    setIsExploded(false);
    setStartTime(Date.now());
    
    // 4초 타이머 시작
    const timer = setInterval(() => {
      setColorProgress(prev => {
        const newProgress = prev + (100 / (4000 / 50)); // 50ms 간격으로 업데이트
        
        if (newProgress >= 100) {
          clearInterval(timer);
          if (!hasPressed) {
            handleExplosion();
          }
          return 100;
        }
        return newProgress;
      });
    }, 50);
    
    setGameTimer(timer);
  };

  // 버튼 누르기 처리
  const handlePress = () => {
    if (gamePhase !== 'playing' || hasPressed) return;
    
    const currentTime = Date.now();
    const elapsed = startTime ? currentTime - startTime : 0;
    
    setHasPressed(true);
    
    if (gameTimer) {
      clearInterval(gameTimer);
      setGameTimer(null);
    }
    
    console.log(`Player ${participantNumber} pressed at ${elapsed}ms`);
    
    // 임시로 라운드 종료 처리 (실제로는 모든 플레이어가 눌렀을 때)
    setTimeout(() => {
      endRound();
    }, 1000);
  };

  // 폭발 처리
  const handleExplosion = () => {
    setIsExploded(true);
    
    setTimeout(() => {
      endRound();
    }, 2000);
  };

  // 라운드 종료
  const endRound = () => {
    // 점수 계산 (임시 로직)
    const playerCount = participants.length;
    const halfCount = Math.floor(playerCount / 2);
    
    let score = 0;
    if (isExploded) {
      score = -5;
    } else {
      // 임시로 랜덤 순위 부여 (실제로는 서버에서 계산)
      const randomRank = Math.floor(Math.random() * playerCount) + 1;
      
      if (playerCount % 2 === 1) {
        // 홀수인 경우
        const middle = Math.ceil(playerCount / 2);
        if (randomRank === middle) {
          score = 0;
        } else if (randomRank < middle) {
          score = -(middle - randomRank);
        } else {
          score = randomRank - middle;
        }
      } else {
        // 짝수인 경우
        if (randomRank <= halfCount) {
          score = -(halfCount - randomRank + 1);
        } else {
          score = randomRank - halfCount;
        }
      }
    }
    
    // 점수 업데이트
    const updatedScores = { ...allScores };
    const currentPlayerScore = updatedScores[participants[participantNumber - 1].id];
    
    if (currentRound === 1) currentPlayerScore.round1 = score;
    else if (currentRound === 2) currentPlayerScore.round2 = score;
    else if (currentRound === 3) currentPlayerScore.round3 = score;
    
    currentPlayerScore.total = currentPlayerScore.round1 + currentPlayerScore.round2 + currentPlayerScore.round3;
    setAllScores(updatedScores);
    
    setGamePhase('roundEnd');
    
    // 다음 라운드 또는 게임 종료
    setTimeout(() => {
      if (currentRound < 3) {
        setCurrentRound(prev => prev + 1);
        setGamePhase('waiting');
        setReadyPlayers(new Set());
        setIsReady(false);
      } else {
        endGame();
      }
    }, 3000);
  };

  // 게임 종료
  const endGame = () => {
    // 최종 결과 계산
    const results: PlayerResult[] = participants.map(p => ({
      id: p.id,
      nickname: p.nickname,
      rank: 1,
      scores: allScores[p.id]
    }));
    
    // 랭킹 정렬
    results.sort((a, b) => b.scores.total - a.scores.total);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    setFinalResults(results);
    setGamePhase('gameEnd');
  };

  // 게임 재시작
  const handleRestart = () => {
    setCurrentRound(1);
    setGamePhase('waiting');
    setReadyPlayers(new Set());
    setIsReady(false);
    setColorProgress(0);
    setHasPressed(false);
    setIsExploded(false);
    setFinalResults([]);
    initializeScores();
  };

  // 버튼 색상 계산
  const getButtonColor = () => {
    if (gamePhase === 'playing') {
      const red = Math.floor(colorProgress * 2.55);
      return `rgb(${red}, ${255 - red}, ${255 - red})`;
    }
    return 'white';
  };

  // 버튼 텍스트
  const getButtonText = () => {
    if (gamePhase === 'waiting') {
      if (isHost) {
        return readyPlayers.size === participants.length ? 'START!' : 'START!';
      } else {
        return isReady ? 'READY!' : 'READY!';
      }
    } else if (gamePhase === 'playing') {
      return 'CHILL';
    } else if (gamePhase === 'roundEnd') {
      const currentPlayerScore = allScores[participants[participantNumber - 1]?.id];
      const roundScore = currentRound === 1 ? currentPlayerScore?.round1 : 
                        currentRound === 2 ? currentPlayerScore?.round2 : 
                        currentPlayerScore?.round3;
      return roundScore !== undefined && roundScore > 0 ? `+${roundScore}` : `${roundScore}`;
    }
    return '';
  };

  // 버튼 활성화 상태
  const isButtonActive = () => {
    if (gamePhase === 'waiting') {
      if (isHost) {
        return readyPlayers.size === participants.length;
      } else {
        return !isReady;
      }
    } else if (gamePhase === 'playing') {
      return !hasPressed;
    }
    return false;
  };

  // 버튼 클릭 핸들러
  const handleButtonClick = () => {
    if (gamePhase === 'waiting') {
      if (isHost && readyPlayers.size === participants.length) {
        handleStart();
      } else if (!isHost && !isReady) {
        handleReady();
      }
    } else if (gamePhase === 'playing') {
      handlePress();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white relative overflow-hidden">
      {/* 재시작 버튼 (호스트만, 게임 종료 시에만) */}
      {isHost && gamePhase === 'gameEnd' && (
        <motion.button
          onClick={handleRestart}
          className="absolute top-4 left-4 px-4 py-2 bg-black text-white font-mono text-xs font-bold tracking-widest uppercase"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          RESTART
        </motion.button>
      )}

      {/* 라운드 표시 - 점으로 변경 */}
      {gamePhase !== 'gameEnd' && (
        <motion.div 
          className="absolute top-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex space-x-3">
            {[1, 2, 3].map(round => (
              <div
                key={round}
                className={`w-3 h-3 rounded-full ${
                  round === currentRound ? 'bg-green-500' : // 현재 라운드 - 초록점
                  round < currentRound ? 'bg-red-500' : // 완료된 라운드 - 빨간점
                  'bg-gray-300' // 예정된 라운드 - 회색점
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* 카운트다운 */}
      <AnimatePresence>
        {gamePhase === 'countdown' && (
          <motion.div
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            key={countdown}
            transition={{ duration: 0.3 }}
          >
            <div className="text-8xl font-black text-black">
              {countdown}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOMB 표시 */}
      <AnimatePresence>
        {isExploded && (
          <motion.div
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div 
              className="text-8xl font-black text-red-600"
              style={{
                textShadow: '4px 4px 0px #000, 8px 8px 0px rgba(0,0,0,0.3)',
                transform: 'perspective(500px) rotateX(15deg)'
              }}
            >
              BOMB
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메인 게임 버튼 - 크기 증가 */}
      {gamePhase !== 'gameEnd' && (
        <motion.div className="relative">
          <motion.button
            className="w-96 h-96 flex items-center justify-center relative border-2 border-black"
            style={{
              backgroundColor: isExploded ? '#ff0000' : getButtonColor(),
              borderRadius: '50%'
            }}
            layoutId="main-game-element"
            whileHover={isButtonActive() ? { scale: 1.05 } : undefined}
            whileTap={isButtonActive() ? { scale: 0.95 } : undefined}
            onClick={isButtonActive() ? handleButtonClick : undefined}
            animate={{
              scale: isExploded ? [1, 1.1, 0.9, 1] : hasPressed ? [1, 0.95, 1] : 1,
              backgroundColor: getButtonColor()
            }}
            transition={{
              scale: { duration: isExploded ? 0.5 : 0.2 },
              backgroundColor: { duration: 0.1 }
            }}
            disabled={!isButtonActive()}
          >
            <span 
              className={`font-mono font-black text-4xl tracking-widest uppercase ${
                colorProgress > 50 ? 'text-white' : 'text-black'
              } ${!isButtonActive() && gamePhase === 'waiting' ? 'opacity-50' : ''}`}
            >
              {getButtonText()}
            </span>
          </motion.button>
        </motion.div>
      )}

      {/* 최종 결과 화면 */}
      <AnimatePresence>
        {gamePhase === 'gameEnd' && (
          <motion.div
            className="w-full max-w-4xl mx-auto p-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-black text-center mb-8 uppercase tracking-widest">
              Final Results
            </h2>
            
            <div className="bg-white border-2 border-black overflow-hidden">
              {/* 헤더 */}
              <div className="grid grid-cols-6 bg-black text-white font-mono font-bold text-sm">
                <div className="p-4 border-r border-white">RANK</div>
                <div className="p-4 border-r border-white">PLAYER</div>
                <div className="p-4 border-r border-white">R1</div>
                <div className="p-4 border-r border-white">R2</div>
                <div className="p-4 border-r border-white">R3</div>
                <div className="p-4">TOTAL</div>
              </div>
              
              {/* 결과 행 */}
              {finalResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  className={`grid grid-cols-6 font-mono ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  } ${result.rank === 1 ? 'bg-yellow-100' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <div className="p-4 border-r border-gray-300 font-bold text-lg">
                    #{result.rank}
                  </div>
                  <div className="p-4 border-r border-gray-300 font-semibold">
                    {result.nickname}
                  </div>
                  <div className="p-4 border-r border-gray-300 text-center">
                    {result.scores.round1 > 0 ? `+${result.scores.round1}` : result.scores.round1}
                  </div>
                  <div className="p-4 border-r border-gray-300 text-center">
                    {result.scores.round2 > 0 ? `+${result.scores.round2}` : result.scores.round2}
                  </div>
                  <div className="p-4 border-r border-gray-300 text-center">
                    {result.scores.round3 > 0 ? `+${result.scores.round3}` : result.scores.round3}
                  </div>
                  <div className="p-4 font-bold text-lg text-center">
                    {result.scores.total > 0 ? `+${result.scores.total}` : result.scores.total}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChillGame;