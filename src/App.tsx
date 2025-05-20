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

// 페이지 전환 효과 컴포넌트
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        type: "tween",
        ease: [0.25, 0.1, 0.25, 1.0],
        duration: 0.6
      }}
      className="w-full h-full"
    >
      {children}

      {/* SVG 필터 정의 */}
      <svg className="absolute inset-0 w-0 h-0 z-[-1]">
        <defs>
          <filter id="ink-transition">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </motion.div>
  );
};

// 게임 라우트 래퍼 컴포넌트
const GameRouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { roomId, participants } = useGameStore();
  
  if (!roomId || participants.length === 0) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// 전환 애니메이션 래퍼 컴포넌트
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
      <NetworkStatus />
      <AnimatedRoutes />
    </Router>
  );
}

export default App;