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
  const [gameSelection] = useState<'chill' | 'freshhh' | null>(selectedGame || null);
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
    ? `${window.location.origin}/join?roomId=${roomId}&isHost=false`
    : '';
  
  // 방 생성 함수 - 수정된 버전 (닉네임 포함)
  const handleCreateRoom = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // 1. 스토어에 방 생성 (자동으로 1번 참가자가 됨)
      const newRoomId = createRoom();
      
      // 2. 소켓 연결 초기화 (호스트 모드, 기본 닉네임 포함)
      await socketService.initSocket(newRoomId, true, '호스트');
      
      // 3. QR 코드 표시 후 게임 시작 버튼 표시
      setTimeout(() => {
        setShowGameButton(true);
      }, 1200); // 모핑 애니메이션 완료 후 표시
      
    } catch (err) {
      console.error('방 생성 오류:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`방 생성 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // 게임 시작 함수
  const handleStartGame = () => {
    if (!gameSelection) {
      setError('게임이 선택되지 않았습니다.');
      return;
    }
    
    if (participants.length < 1) {
      setError('최소 1명의 참가자가 필요합니다.');
      return;
    }
    
    setStartingGame(true);
    
    try {
      // 소켓을 통해 게임 시작 메시지 전송
      socketService.startGame(gameSelection);
      
      // 게임 화면으로 이동
      setTimeout(() => {
        navigate(`/${gameSelection}`, {
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

  // 이전 화면으로 돌아가기
  const handleGoBack = () => {
    // 소켓 연결 해제
    socketService.disconnect();
    navigate('/');
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
      
      {/* 이전 화면 버튼 */}
      <motion.button
        onClick={handleGoBack}
        className="absolute top-4 left-4 w-8 h-8 bg-white border border-black 
                   flex items-center justify-center font-mono text-xs font-bold
                   hover:bg-black hover:text-white transition-colors duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        ←
      </motion.button>
      
      <div className="flex flex-col items-center">
        {/* 정사각형에서 QR코드로, 그리고 원형 버튼으로 모핑 */}
        <motion.div
          layout
          layoutId="main-game-element"
          className="relative flex items-center justify-center overflow-hidden"
          initial={{
            width: 80,
            height: 80,
            borderRadius: '0px',
            scale: 1.2,
            backgroundColor: '#000000'
          }}
          animate={{
            width: roomId ? (startingGame ? 320 : 240) : 80,
            height: roomId ? (startingGame ? 320 : 240) : 80,
            borderRadius: startingGame ? '50%' : '0px',
            scale: roomId ? 1 : 1.2,
            backgroundColor: roomId ? '#ffffff' : '#000000',
            border: roomId ? '2px solid #000000' : 'none',
          }}
          transition={{
            layout: { duration: 0.5, ease: "easeInOut" },
            default: { duration: 1.2, ease: [0.25,0.1,0.25,1.0] },
            backgroundColor: { duration: 0.8, delay: 0.4 },
            borderRadius: { duration: 0.8 }
          }}
        >
          {/* 로딩 상태, QR 코드, 또는 게임 시작 상태 */}
          <AnimatePresence mode="wait">
            {!roomId ? (
              <motion.div
                key="loading"
                className="text-white font-black text-xs tracking-wider uppercase"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {isConnecting ? '...' : 'SLIDE!'}
              </motion.div>
            ) : startingGame ? (
              <motion.div
                key="game-starting"
                className="text-black font-mono font-black text-xl tracking-widest uppercase"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {gameSelection === 'chill' ? 'CHILL' : 'FRESHHH'}
              </motion.div>
            ) : (
              <motion.div
                key="qr-code"
                className="w-full h-full flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <QRCodeGenerator 
                  value={qrCodeValue} 
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000" 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* 참가자 목록 - 개선된 버전 */}
        {roomId && !startingGame && (
          <motion.div 
            className="mt-8 w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.4 }}
          >
            <h3 className="text-lg font-black mb-4 text-center">
              참가자 ({participants.length}명)
            </h3>
            <div className="bg-gray-50 p-4 min-h-24 border-2 border-black">
              {participants.length > 0 ? (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <motion.div 
                      key={participant.id} 
                      className="flex items-center justify-between py-2 px-3 bg-white border border-gray-200"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="font-mono font-semibold">
                        #{participant.number} {participant.nickname}
                      </span>
                      {participant.isHost && (
                        <span className="text-xs bg-black text-white px-2 py-1 font-mono">
                          방장
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  참가자를 기다리는 중...
                </p>
              )}
            </div>
          </motion.div>
        )}
        
        {/* 게임 시작 버튼 */}
        <AnimatePresence>
          {showGameButton && !startingGame && gameSelection && (
            <motion.div 
              className="mt-8 w-full max-w-md"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.25, 0.1, 0.25, 1.0]
              }}
            >
              <motion.button
                onClick={handleStartGame}
                className="relative w-full h-16 bg-black text-white flex items-center justify-center
                          cursor-pointer transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                style={{
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                }}
              >
                <span className="text-white font-mono font-black text-xl tracking-widest uppercase">
                  {gameSelection === 'chill' ? 'CHILL' : 'FRESHHH'} 시작
                </span>
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
                  : 'FRESHHH 게임을 시작합니다...'} 
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RoomCreation;