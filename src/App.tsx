import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import RoomCreation from './pages/RoomCreation';
import Lobby from './pages/Lobby';
import ChillGame from './pages/ChillGame';
import FreshhhGame from './pages/FreshhhGame';
import { useGameStore } from './store/gameStore';
import NetworkStatus from './components/common/NetworkStatus';
import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

// 바우하우스 스타일 페이지 전환 애니메이션
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1.0]
      }}
      className="w-full h-full relative"
    >
      {children}
    </motion.div>
  );
};

// 게임 라우트 접근 제어 래퍼 컴포넌트
const GameRouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { roomId, participants } = useGameStore();
  
  if (!roomId || participants.length === 0) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// 애니메이션 라우트 컴포넌트
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <Home />
          </PageTransition>
        } />
        <Route path="/create" element={
          <PageTransition>
            <RoomCreation />
          </PageTransition>
        } />
        <Route path="/join" element={
          <PageTransition>
            <Lobby />
          </PageTransition>
        } />
        <Route path="/chill" element={
          <GameRouteWrapper>
            <PageTransition>
              <ChillGame 
                participants={useGameStore.getState().participants}
                participantNumber={useGameStore.getState().participantNumber}
                isHost={useGameStore.getState().isHost}
                onGameEnd={(winnerNumber) => console.log('게임 종료, 승자:', winnerNumber)}
              />
            </PageTransition>
          </GameRouteWrapper>
        } />
        <Route path="/freshhh" element={
          <GameRouteWrapper>
            <PageTransition>
              <FreshhhGame 
                participants={useGameStore.getState().participants}
                currentUserId={useGameStore.getState().participants[useGameStore.getState().participantNumber - 1]?.id || ''}
                isHost={useGameStore.getState().isHost}
                onGameEnd={(results) => console.log('게임 종료:', results)}
              />
            </PageTransition>
          </GameRouteWrapper>
        } />
      </Routes>
    </AnimatePresence>
  );
};

// 메인 App 컴포넌트
function App() {
  return (
    <Router>
      {/* 네트워크 상태 표시 */}
      <NetworkStatus />
      
      {/* 바우하우스 기하학적 배경 요소들 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* 기본 그리드 패턴 */}
        <motion.div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
          animate={{
            opacity: [0.01, 0.03, 0.01]
          }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: "easeInOut"
          }}
        />
        
        {/* 떠다니는 기하학적 요소들 */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-8 h-8 border border-black opacity-5"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "linear"
          }}
        />
        
        <motion.div
          className="absolute top-3/4 right-1/3 w-6 h-6 bg-black opacity-3"
          animate={{
            x: [0, -40, 0],
            y: [0, 20, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            repeat: Infinity,
            duration: 15,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute top-1/2 right-1/4 w-4 h-12 bg-black opacity-4"
          animate={{
            rotate: [0, 180, 360],
            x: [0, 30, 0]
          }}
          transition={{
            repeat: Infinity,
            duration: 12,
            ease: "linear"
          }}
        />
      </div>
      
      {/* 페이지 라우팅 */}
      <div className="relative z-10">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;