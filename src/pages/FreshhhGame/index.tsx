import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface Participant {
  id: string;
  nickname: string;
}

interface GameResult {
  participantId: string;
  score: number;
  rank: number;
}

interface FreshhhGameProps {
  participants: Participant[];
  currentUserId: string;
  isHost: boolean;
  onGameEnd: (results: GameResult[]) => void;
}

const FreshhhGame: React.FC<FreshhhGameProps> = ({
  participants,
  currentUserId,
  isHost,
  onGameEnd,
}) => {
  // 라운드 관련 상태
  const [currentRound, setCurrentRound] = useState(1);
  const [roundState, setRoundState] = useState<'countdown' | 'running' | 'result'>('countdown');
  const [countdown, setCountdown] = useState(3);
  
  // 색상 변화 및 타이머 관련 상태
  const [colorProgress, setColorProgress] = useState(0); // 0-100
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const buttonControls = useAnimation();
  const roundDuration = 4000; // 4초
  
  // 사용자 액션 관련 상태
  const [tapped, setTapped] = useState(false);
  const [tapTime, setTapTime] = useState<number | null>(null);
  const [roundScore, setRoundScore] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  
  // 다른 참가자의 탭 기록 (실제로는 서버에서 관리)
  const [tappedParticipants, setTappedParticipants] = useState<string[]>([]);
  
  // 배경 잉크 효과 상태
  const [inkBlobs, setInkBlobs] = useState<Array<{id: number, path: string}>>([]);
  const [buttonInkPath, setButtonInkPath] = useState(generateInkPath(0));
  
  // 잉크 패스 생성 함수
  function generateInkPath(complexity = 0) {
    const points = 12;
    const radius = 100;
    // complexity가 높을수록 더 불규칙한 형태
    const variance = 5 + (complexity * 0.5); 
    
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
  }
  
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
  
  // 카운트다운 효과
  useEffect(() => {
    if (roundState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
        
        // 진동 피드백
        if (navigator.vibrate) {
          navigator.vibrate(20);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (roundState === 'countdown' && countdown === 0) {
      // 카운트다운 완료, 라운드 시작
      setRoundState('running');
      startRound();
      
      // 진동 피드백
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
    }
  }, [countdown, roundState]);
  
  // 라운드 시작
  const startRound = () => {
    // 상태 초기화
    setColorProgress(0);
    setTapped(false);
    setTapTime(null);
    setRoundScore(null);
    setTappedParticipants([]);
    setButtonInkPath(generateInkPath(0));
    
    startTimeRef.current = Date.now();
    
    // 버튼 색상 변화 애니메이션 시작
    buttonControls.start({
      backgroundColor: ["hsl(0, 0%, 95%)", "hsl(0, 100%, 50%)"],
      transition: { duration: 4, ease: "linear" }
    });
    
    // 버튼 색상 변화 시작
    const step = 100 / (roundDuration / 16.67); // 60fps 기준
    
    const updateColor = () => {
      setColorProgress(prev => {
        const newProgress = prev + step;
        
        if (newProgress >= 100) {
          // 시간 초과
          if (!tapped) {
            handleTimeout();
          }
          return 100;
        }
        
        // 잉크 형태 변화 - 색상 진행에 따라 점점 더 불규칙하게
        if (Math.floor(newProgress) % 10 === 0) {
          setButtonInkPath(generateInkPath(newProgress / 20));
        }
        
        timerRef.current = requestAnimationFrame(updateColor);
        return newProgress;
      });
    };
    
    timerRef.current = requestAnimationFrame(updateColor);
  };
  
  // 버튼 탭 처리
  const handleTap = () => {
    if (roundState !== 'running' || tapped) return;
    
    // 애니메이션 중지
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }
    
    // 탭 시간 기록
    const currentTime = Date.now();
    const elapsedTime = startTimeRef.current ? currentTime - startTimeRef.current : 0;
    setTapped(true);
    setTapTime(elapsedTime);
    
    // 진동 피드백
    if (navigator.vibrate) {
      navigator.vibrate([40, 30, 20]);
    }
    
    // 버튼 탭 시 물결 효과 애니메이션
    buttonControls.start({
      scale: [1, 0.98, 1],
      transition: { duration: 0.3 }
    });
    
    // 사용자가 몇 번째로 탭했는지 기록 (실제로는 서버에서 관리)
    const newTappedParticipants = [...tappedParticipants, currentUserId];
    setTappedParticipants(newTappedParticipants);
    
    // 점수 계산 (예시)
    calculateScore(newTappedParticipants.indexOf(currentUserId) + 1, elapsedTime);
    
    // 실제 구현에서는 서버로 탭 이벤트 전송
    console.log(`참가자 ${currentUserId}가 ${elapsedTime}ms에 탭했습니다.`);
    
    // 모든 참가자가 탭했는지 확인 (실제로는 서버에서 관리)
    if (isHost && newTappedParticipants.length === participants.length) {
      endRound();
    }
  };
  
  // 시간 초과 처리
  const handleTimeout = () => {
    setTapped(true);
    
    // 시간 초과 패널티 점수
    calculateScore(participants.length, roundDuration);
    
    // 진동 피드백
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // 시간 초과 시 폭발 효과 애니메이션
    buttonControls.start({
      scale: [1, 1.1, 0.95],
      opacity: [1, 0.8, 1],
      transition: { duration: 0.5 }
    });
    
    // 실제 구현에서는 서버로 시간 초과 이벤트 전송
    console.log(`참가자 ${currentUserId}가 시간 초과되었습니다.`);
    
    // 라운드 종료 (실제로는 서버 주도로 처리)
    if (isHost) {
      endRound();
    }
  };
  
  // 점수 계산
  const calculateScore = (position: number, time: number) => {
    // 순서 기반 점수 계산
    let orderScore = 0;
    
    // 시간 초과 패널티
    if (time >= roundDuration) {
      orderScore = -5;
    } else {
      // 순서 기반 점수 계산 (예시)
      const percentile = (position - 1) / (participants.length - 1) * 100;
      
      if (percentile <= 20) {
        orderScore = -3; // 가장 빠른 20%
      } else if (percentile <= 40) {
        orderScore = -1.5;
      } else if (percentile <= 60) {
        orderScore = 0; // 중간 20%
      } else if (percentile <= 80) {
        orderScore = 1.5;
      } else {
        orderScore = 3; // 가장 느린 20%
      }
    }
    
    setRoundScore(orderScore);
    setTotalScore(prev => prev + orderScore);
  };
  
  // 라운드 종료
  const endRound = () => {
    setRoundState('result');
    
    // 3초 후 다음 라운드 또는 게임 종료
    setTimeout(() => {
      if (currentRound < 3) {
        // 다음 라운드 시작
        setCurrentRound(prev => prev + 1);
        setRoundState('countdown');
        setCountdown(3);
      } else {
        // 게임 종료 및 결과 전송
        onGameEnd([
          // 실제 구현에서는 서버에서 계산된 결과를 받아옴
          {
            participantId: currentUserId,
            score: totalScore + (roundScore || 0),
            rank: 1 // 임시
          }
        ]);
      }
    }, 3000);
  };
  
  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ink-white relative overflow-hidden">
      {/* 배경 잉크 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {inkBlobs.map((blob, index) => (
          <motion.svg
            key={blob.id}
            className="absolute"
            viewBox="0 0 200 200"
            style={{
              top: `${15 + (index * 30)}%`,
              left: `${20 + (index * 25)}%`,
              width: `${20 + (index * 5)}vw`,
              height: `${20 + (index * 5)}vw`,
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
        Freshhh
      </motion.h1>
      
      {/* 라운드 인디케이터 */}
      <motion.div 
        className="absolute top-4 left-0 right-0 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map(round => (
            <motion.div 
              key={round}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                round === currentRound 
                  ? 'bg-ink-black text-ink-white' 
                  : round < currentRound 
                    ? 'bg-ink-gray-200 text-ink-gray-500' 
                    : 'border border-ink-gray-200 text-ink-gray-400'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: round === currentRound ? [0.95, 1.05, 1] : 1,
              }}
              transition={{
                duration: 0.3,
                delay: 0.1 * round,
                scale: {
                  repeat: round === currentRound ? Infinity : 0,
                  duration: 2
                }
              }}
            >
              {round}
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {roundState === 'countdown' && (
        <motion.div 
          className="text-7xl font-thin mb-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          key={countdown}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 15
          }}
        >
          {countdown}
        </motion.div>
      )}
      
      {roundState === 'result' && (
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xl font-light mb-2">이번 라운드 점수</p>
          <motion.p 
            className={`text-4xl font-black mt-2 ${
              roundScore && roundScore > 0 ? 'text-ink-black' : 
              roundScore && roundScore < 0 ? 'text-ink-gray-700' : 
              'text-ink-gray-500'
            }`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 10
            }}
          >
            {roundScore !== null && roundScore > 0 && '+'}
            {roundScore}
          </motion.p>
        </motion.div>
      )}
      
      {/* 강도 표시 바 - 진행 중일 때만 표시 */}
      {roundState === 'running' && !tapped && (
        <motion.div 
          className="mb-8 w-48 h-1 bg-ink-gray-100 rounded-full overflow-hidden"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="h-full rounded-full"
            style={{ 
              width: `${colorProgress}%`,
              background: `hsl(0, ${colorProgress}%, ${50 - colorProgress * 0.3}%)`
            }}
          />
        </motion.div>
      )}
      
      {/* 메인 게임 버튼 */}
      <div className="relative">
        {/* 배경 물결 효과 */}
        {roundState === 'running' && !tapped && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={false}
            animate={{ 
              scale: [0.97, 1.03, 0.97], 
              opacity: [0.5, 0.7, 0.5] 
            }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 2,
              ease: "easeInOut"
            }}
          >
            <div className="w-[73vw] h-[73vw] max-w-[515px] max-h-[515px] rounded-full border border-ink-gray-200 opacity-30" />
          </motion.div>
        )}
        
        {/* 메인 버튼 */}
        <motion.button
          className="w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] relative"
          whileTap={roundState === 'running' && !tapped ? { scale: 0.97 } : undefined}
          onClick={roundState === 'running' && !tapped ? handleTap : undefined}
          disabled={roundState !== 'running' || tapped}
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            cursor: roundState === 'running' && !tapped ? 'pointer' : 'default'
          }}
          animate={buttonControls}
        >
          <motion.svg 
            viewBox="0 0 200 200" 
            className="absolute inset-0 w-full h-full"
            initial={false}
            animate={{ 
              rotate: tapped ? [0, 3, -3, 0] : [0, 0.5, -0.5, 0],
            }}
            transition={{ 
              repeat: tapped ? 0 : Infinity, 
              duration: tapped ? 0.4 : 8,
              ease: "easeInOut" 
            }}
          >
            <motion.path 
              d={buttonInkPath} 
              fill={tapped 
                ? colorProgress > 80 ? "#ff3333" : 
                  colorProgress > 60 ? "#ff6666" : 
                  colorProgress > 40 ? "#ff9999" : 
                  colorProgress > 20 ? "#ffcccc" : "#ffffff"
                : `hsl(0, ${colorProgress}%, ${95 - colorProgress * 0.3}%)`
              }
              stroke={colorProgress > 80 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.8)"}
              strokeWidth="1"
              initial={false}
              animate={{ d: buttonInkPath }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </motion.svg>
          
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
          >
            {!tapped ? (
              <motion.span 
                className="relative z-10 uppercase tracking-widest text-2xl font-black"
                style={{ 
                  color: colorProgress > 50 ? 'white' : 'black',
                  textShadow: colorProgress > 50 ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                }}
                animate={{ 
                  scale: [0.95, 1.05, 0.95],
                  opacity: [0.9, 1, 0.9]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5 
                }}
              >
                TAP!
              </motion.span>
            ) : (
              <motion.span 
                className="relative z-10 text-6xl font-black"
                style={{ 
                  color: colorProgress > 50 ? 'white' : 'black',
                  textShadow: '0 2px 10px rgba(0,0,0,0.15)'
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 400,
                  damping: 10
                }}
              >
                {roundScore !== null ? (roundScore > 0 ? `+${roundScore}` : roundScore) : ''}
              </motion.span>
            )}
          </motion.div>
          
          {/* 잉크 효과 오버레이 */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
            viewBox="0 0 200 200" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="ink-distort">
                <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
            <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" filter="url(#ink-distort)" />
          </svg>
        </motion.button>
        
        {/* 탭 후 물결 효과 */}
        {tapped && (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ 
              scale: 1.5, 
              opacity: 0,
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ 
              borderRadius: '100%',
              border: `2px solid rgba(0, 0, 0, 0.3)`
            }}
          />
        )}
      </div>
      
      {currentRound === 3 && roundState === 'result' && (
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-xl font-light">총점</p>
          <motion.p 
            className="text-4xl font-black mt-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 10
            }}
          >
            {totalScore + (roundScore || 0)}
          </motion.p>
        </motion.div>
      )}
      
      {/* 유기적인 흐름을 위한 배경 요소 */}
      <svg className="absolute inset-0 w-0 h-0 pointer-events-none">
        <defs>
          <filter id="freshhh-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" seed="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="freshhh-glow">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 1  0 0 0 0 0  0 0 0 0 0  0 0 0 12 -6" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default FreshhhGame;