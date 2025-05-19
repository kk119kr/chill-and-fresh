import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import RoomCreation from './pages/RoomCreation';
import Lobby from './pages/Lobby';
import ChillGame from './pages/ChillGame';
import FreshhhGame from './pages/FreshhhGame';
import { useGameStore } from './store/gameStore';

// GameRoute 컴포넌트를 사용하여 게임 관련 라우트를 보호하는 래퍼 컴포넌트
const GameRoute = ({ children }: { children: React.ReactNode }) => {
  const { roomId, participants } = useGameStore();
  
  // 방이 생성되지 않았거나 참가하지 않은 경우 홈으로 리다이렉트
  if (!roomId || participants.length === 0) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { participants, participantNumber, isHost } = useGameStore();
  
  // 게임 종료 처리 함수
  const handleGameEnd = (winnerId: string | number) => {
    console.log('게임 종료, 승자:', winnerId);
    // 필요한 경우 추가 로직 구현 (예: 결과 화면으로 이동)
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<RoomCreation />} />
        <Route path="/join" element={<Lobby />} />
        
        {/* 게임 라우트는 GameRoute로 감싸서 보호 */}
        <Route 
          path="/chill" 
          element={
            <GameRoute>
              <ChillGame 
                participants={participants}
                participantNumber={participantNumber}
                isHost={isHost}
                onGameEnd={(winnerNumber) => handleGameEnd(winnerNumber)}
              />
            </GameRoute>
          } 
        />
        
        <Route 
          path="/freshhh" 
          element={
            <GameRoute>
              <FreshhhGame 
                participants={participants}
                currentUserId={participants[participantNumber - 1]?.id || ''}
                isHost={isHost}
                onGameEnd={(results) => handleGameEnd(results[0]?.participantId || '')}
              />
            </GameRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;