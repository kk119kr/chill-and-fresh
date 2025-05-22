import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeGenerator from '../../components/common/QRCodeGenerator';
import { useGameStore } from '../../store/gameStore';
import socketService from '../../services/socketService';

interface LocationState {
  selectedGame?: 'chill' | 'freshhh';
  animateFrom?: string;
}

const RoomCreation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedGame } = (location.state as LocationState) || {};
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameSelection, setGameSelection] = useState<'chill' | 'freshhh' | null>(selectedGame || null);
  const [startingGame, setStartingGame] = useState(false);
  const [showGameButton, setShowGameButton] = useState(false);
  
  // Zustand 스토어에서 필요한 상태와 액션 가져오기
  const { roomId, participants, createRoom } = useGameStore();
  
  // 컴포넌트 마운트 시 자동으로 방 생성
  useEffect(() => {
    handleCreateRoom();
  }, []);
  
  // QR 코드에 포함될 URL 생성
  const qrCodeValue = roomId 
    ? `${window.location.origin}/join?roomId=${roomId}` 
    : '';
  
  // 방 생성 함수
  const handleCreateRoom = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // 1. 스토어에 방 생성 (자동으로 1번 참가자가 됨)
      const newRoomId = createRoom();
      
      // 2. 소켓 연결 초기화 (호스트 모드)
      await socketService.initSocket(newRoomId, true);
      
      // 3. QR 코드 표시 후 게임 시작 버튼 표시
      setTimeout(() => {
        setShowGameButton(true);
      }, 800);
      
    } catch (err) {
      console.error('방 생성 오류:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`방 생성 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // 게임 시작 함수
  const handleStartGame = (gameType: 'chill' | 'freshhh') => {
    if (participants.length < 1) {
      setError('최소 1명의 참가자가 필요합니다.');
      return;
    }
    
    setGameSelection(gameType);
    setStartingGame(true);
    
    try {
      // 소켓을 통해 게임 시작 메시지 전송
      socketService.startGame(gameType);
      
      // 게임 화면으로 이동
      setTimeout(() => {
        navigate(`/${gameType}`, {
          state: {
            fromRoom: true
          }
        });
      }, 1000);
    } catch (err) {
      console.error('게임 시작 오류:', err);
      setError('게임 시작 중 오류가 발생했습니다. 다시 시도해주세요.');
      setStartingGame(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 relative overflow-hidden">
      {error && (
        <motion.div 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 
                     bg-black text-white px-4 py-2 text-sm z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {error}
        </motion.div>
      )}
      
      <div className="flex flex-col items-center">
        {/* 다이아몬드에서 QR코드로 모핑 */}
        <motion.div
          layoutId="main-game-element"
          className="relative"
          initial={false}
          animate={{
            rotate: roomId ? 0 : 45,
            scale: roomId ? 1.2 : 1,
          }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1.0]
          }}
        >
          {roomId ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <QRCodeGenerator 
                value={qrCodeValue} 
                size={240}
                title="QR코드를 스캔하여 참여하세요" 
              />
            </motion.div>
          ) : (
            <div className="w-24 h-24 bg-black flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-sm tracking-wider uppercase transform -rotate-45">
                {isConnecting ? '...' : 'SLIDE!'}
              </span>
            </div>
          )}
        </motion.div>

        {/* 방 ID 표시 */}
        {roomId && (
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <p className="text-lg font-black mb-2">방 ID</p>
            <div className="px-6 py-3 bg-gray-100 border-2 border-black">
              <span className="text-2xl font-black tracking-widest">{roomId}</span>
            </div>
          </motion.div>
        )}
        
        {/* 참가자 목록 */}
        {roomId && (
          <motion.div 
            className="mt-8 w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <h3 className="text-lg font-black mb-4">참가자</h3>
            <div className="bg-gray-100 border-2 border-black p-4 min-h-24">
              {participants.length > 0 ? (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <motion.div 
                      key={participant.id} 
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="font-black">
                        {participant.nickname} (참가자 {participant.number})
                      </span>
                      {participant.isHost && (
                        <span className="text-xs bg-black text-white px-2 py-1">
                          방장
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">참가자를 기다리는 중...</p>
              )}
            </div>
          </motion.div>
        )}
        
        {/* 게임 시작 버튼 */}
        <AnimatePresence>
          {showGameButton && !startingGame && (
            <motion.div 
              className="mt-8 flex flex-col space-y-4 w-full max-w-md"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.25, 0.1, 0.25, 1.0]
              }}
            >
              <motion.button
                onClick={() => handleStartGame('chill')}
                className="h-16 bg-black text-white font-black text-xl tracking-wider uppercase
                          hover:bg-gray-900 transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
              >
                CHILL 시작
              </motion.button>

              <motion.button
                onClick={() => handleStartGame('freshhh')}
                className="h-16 bg-white text-black border-2 border-black font-black text-xl tracking-wider uppercase
                          hover:bg-gray-50 transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
              >
                RANDOM 시작
              </motion.button>
            </motion.div>
          )}
          
          {startingGame && (
            <motion.div 
              className="mt-8 text-center py-8 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.p 
                className="text-xl font-black text-gray-700"
                animate={{ 
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2
                }}
              >
                {gameSelection === 'chill' 
                  ? 'CHILL 게임을 시작합니다...' 
                  : 'RANDOM 게임을 시작합니다...'} 
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RoomCreation;