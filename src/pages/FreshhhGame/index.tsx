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
  
  // 카운트다운 효과
  useEffect(() => {
    if (roundState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (roundState === 'countdown' && countdown === 0) {
      // 카운트다운 완료, 라운드 시작
      setRoundState('running');
      startRound();
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
    
    startTimeRef.current = Date.now();
    
    // 버튼 색상 변화 애니메이션 시작
    buttonControls.start({
      backgroundColor: ["hsl(0, 0%, 95%)", "hsl(0, 100%, 90%)"],
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

interface FreshhhButtonProps {
  colorProgress: number;
  tapped: boolean;
  score: number | null;
  onTap: () => void;
}  

const FreshhhButton: React.FC<FreshhhButtonProps> = ({ colorProgress, tapped, score, onTap }) => {
  // 색상 변화 기반 애니메이션
  const buttonControls = useAnimation();
  
  useEffect(() => {
    if (!tapped) {
      buttonControls.start({
        backgroundColor: [`hsl(0, ${colorProgress}%, ${90 - colorProgress * 0.1}%)`],
        transition: { duration: 0.3 }
      });
    }
  }, [colorProgress, tapped, buttonControls]);

  return (
    <motion.div className="relative">
      {/* 배경 물결 효과 */}
      {!tapped && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={false}
          animate={{ scale: [0.97, 1.03, 0.97], opacity: [0.4, 0.6, 0.4] }}
          transition={{ 
            repeat: Infinity, 
            repeatType: "reverse", 
            duration: 3,
            ease: "easeInOut"
          }}
        >
          <div className="w-[104%] h-[104%] rounded-full border border-red-200 opacity-30" />
        </motion.div>
      )}
      
      {/* 메인 버튼 */}
      <motion.button
        className="w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] rounded-full flex items-center justify-center text-2xl font-light shadow-sm relative"
        animate={buttonControls}
        whileTap={!tapped ? { scale: 0.98 } : {}}
        onClick={!tapped ? onTap : undefined}
      >
        {!tapped ? (
  <motion.span 
    animate={{ opacity: [0.8, 1, 0.8] }}
    transition={{ repeat: Infinity, duration: 1.5 }}
  >
    TAP!
  </motion.span>
) : (
  <motion.span 
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
  >
    {score !== null ? (score > 0 ? `+${score}` : score) : ''}
  </motion.span>
)}
        
        {/* 잉크 효과 오버레이 - 색상 변화에 따라 효과도 변화 */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 200 200" 
          style={{ opacity: 0.1 + (colorProgress * 0.003) }}  // 색상 진행에 따라 약간 더 진해짐
        >
          <defs>
            <filter id="freshhh-distort">
              <feTurbulence type="fractalNoise" baseFrequency={0.01 + (colorProgress * 0.0002)} numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={5 + (colorProgress * 0.05)} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(255,0,0,0.2)" strokeWidth="1" filter="url(#freshhh-distort)" />
        </svg>
      </motion.button>
    </motion.div>
  );
};

  // 시간 초과 처리
  const handleTimeout = () => {
    setTapped(true);
    
    // 시간 초과 패널티 점수
    calculateScore(participants.length, roundDuration);
    
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <motion.div 
        className="absolute top-4 left-0 right-0 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-lg font-light">라운드 {currentRound}/3</p>
      </motion.div>
      
      {roundState === 'countdown' && (
        <motion.div 
          className="text-6xl font-thin mb-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          key={countdown}
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
          <p className="text-xl font-light">이번 라운드 점수</p>
          <motion.p 
            className="text-4xl font-light mt-2"
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
      
      {/* 유기적인 잉크 효과가 있는 버튼 */}
      <div className="relative">
        {/* 물결 효과 배경 */}
        {roundState === 'running' && !tapped && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={false}
            animate={{ scale: [0.97, 1.03, 0.97], opacity: [0.5, 0.7, 0.5] }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 2,
              ease: "easeInOut"
            }}
          >
            <div className="w-[73vw] h-[73vw] max-w-[515px] max-h-[515px] rounded-full border border-gray-200 opacity-30" />
          </motion.div>
        )}

        {/* 메인 버튼 */}
        <motion.button
          className="rounded-full w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] flex items-center justify-center shadow-sm relative"
          style={{
            backgroundColor: `hsl(0, ${colorProgress}%, ${90 - colorProgress * 0.1}%)`,
            opacity: roundState === 'result' ? 0.5 : 1
          }}
          animate={buttonControls}
          onClick={handleTap}
          disabled={roundState !== 'running' || tapped}
          initial={{ scale: 0.95, opacity: 0 }}
          whileHover={roundState === 'running' && !tapped ? { scale: 1.01 } : {}}
          whileTap={roundState === 'running' && !tapped ? { scale: 0.98 } : {}}
          transition={{ duration: 0.3 }}
        >
          {roundState === 'running' && !tapped && (
            <motion.span 
              className="text-2xl font-light"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              TAP!
            </motion.span>
          )}
          
          {tapped && tapTime !== null && (
            <motion.span 
              className="text-xl font-light"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {(tapTime / 1000).toFixed(2)}s
            </motion.span>
          )}
          
          {roundState === 'result' && (
            <motion.span 
              className="text-xl font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {tappedParticipants.indexOf(currentUserId) + 1}/{participants.length}
            </motion.span>
          )}
        </motion.button>
        
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
            className="text-4xl font-light mt-2"
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