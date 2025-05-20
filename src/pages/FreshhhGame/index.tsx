import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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
  
  // 버튼 색상 계산
  const getButtonBackgroundColor = () => {
    // 점진적으로 회색에서 빨간색으로 변화
    if (roundState === 'running') {
      // HSL 색상으로 변환하여 부드러운 변화 구현
      // 회색(0% 채도) -> 빨간색(100% 채도)
      return `hsl(0, ${colorProgress}%, 90%)`;
    }
    
    return 'hsl(0, 0%, 95%)'; // 기본 연한 회색
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="absolute top-4 left-0 right-0 text-center">
        <p className="text-lg font-light">라운드 {currentRound}/3</p>
      </div>
      
      {roundState === 'countdown' && (
        <div className="text-6xl font-thin mb-8">
          {countdown}
        </div>
      )}
      
      {roundState === 'result' && (
        <div className="mb-8">
          <p className="text-xl font-light">이번 라운드 점수</p>
          <p className="text-4xl font-light mt-2">
            {roundScore !== null && roundScore > 0 && '+'}
            {roundScore}
          </p>
        </div>
      )}
      
      <motion.button
        className="rounded-full w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] flex items-center justify-center shadow-sm"
        style={{
          backgroundColor: getButtonBackgroundColor(),
          opacity: roundState === 'result' ? 0.5 : 1
        }}
        onClick={handleTap}
        disabled={roundState !== 'running' || tapped}
        whileTap={{ scale: roundState === 'running' && !tapped ? 0.98 : 1 }}
      >
        {roundState === 'running' && !tapped && (
          <span className="text-2xl font-light">TAP!</span>
        )}
        
        {tapped && tapTime !== null && (
          <span className="text-xl font-light">
            {(tapTime / 1000).toFixed(2)}s
          </span>
        )}
        
        {roundState === 'result' && (
          <span className="text-xl font-light">
            {tappedParticipants.indexOf(currentUserId) + 1}/{participants.length}
          </span>
        )}
      </motion.button>
      
      {currentRound === 3 && roundState === 'result' && (
        <div className="mt-8">
          <p className="text-xl font-light">총점</p>
          <p className="text-4xl font-light mt-2">
            {totalScore + (roundScore || 0)}
          </p>
        </div>
      )}
    </div>
  );
};

export default FreshhhGame;