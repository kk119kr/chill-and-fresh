import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeGenerator from '../../components/common/QRCodeGenerator';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useGameStore } from '../../store/gameStore';
import socketService from '../../services/socketService';

interface LocationState {
  selectedGame?: 'chill' | 'freshhh';
  animateFrom?: string;
}

const RoomCreation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedGame, animateFrom } = (location.state as LocationState) || {};
  
  const [nickname, setNickname] = useState('');
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameSelection, setGameSelection] = useState<'chill' | 'freshhh' | null>(selectedGame || null);
  const [startingGame, setStartingGame] = useState(false);
  const [inkBlobs, setInkBlobs] = useState<Array<{id: number, path: string}>>([]);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const [showManualOptions, setShowManualOptions] = useState(false);
  
  // Zustand 스토어에서 필요한 상태와 액션 가져오기
  const { roomId, participants, createRoom } = useGameStore();
  
  // 잉크 형태 경로 생성
  const generateInkPath = (seed: number) => {
    const points = 8 + Math.floor(seed % 4);
    const radius = 30 + (seed * 10);
    const variance = 15 + (seed * 2);
    
    let path = "M";
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = radius + (Math.random() * variance * 2 - variance);
      const x = Math.cos(angle) * r + 50; // 중심점 50,50
      const y = Math.sin(angle) * r + 50;
      
      if (i === 0) path += `${x},${y}`;
      else path += ` L${x},${y}`;
    }
    path += " Z";
    return path;
  };
  
  // 배경 잉크 효과 생성
  useEffect(() => {
    // 초기 잉크 효과 생성
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
  
  // 소켓 연결 상태 확인
  useEffect(() => {
    if (isRoomCreated) {
      // 방이 생성된 후 정기적으로 연결 상태 확인
      const connectionCheck = setInterval(() => {
        const status = socketService.getConnectionStatus();
        
        if (status === 'error' || status === 'disconnected') {
          setError(`연결 상태: ${status}. ${socketService.getErrorMessage()}`);
        } else if (error && status === 'connected') {
          // 연결이 복구된 경우 오류 메시지 제거
          setError(null);
        }
      }, 3000);
      
      return () => clearInterval(connectionCheck);
    }
  }, [isRoomCreated, error]);
  
  // QR 코드에 포함될 URL 생성
  const qrCodeValue = isRoomCreated 
    ? `${window.location.origin}/join?roomId=${roomId}` 
    : '';
  
  // 초기 선택된 게임이 있으면 바로 닉네임 입력 후 방 생성으로 이동하도록 애니메이션
  useEffect(() => {
    if (selectedGame && animateFrom === 'home') {
      // 애니메이션 효과 추가 가능
      console.log(`Home에서 ${selectedGame} 게임이 선택되었습니다.`);
    }
  }, [selectedGame, animateFrom]);
  
  // 소켓 서버 URL 수동 변경
  const handleManualServerUrl = async () => {
    const urlInput = prompt('소켓 서버 URL을 입력하세요 (예: http://localhost:3001)', socketService.getServerUrl?.() || 'http://localhost:3001');
    
    if (!urlInput) return;
    
    // 수동으로 서버 URL 설정
    if (typeof socketService.setServerUrl === 'function') {
      socketService.setServerUrl(urlInput);
      
      // 다시 연결 시도
      handleCreateRoom();
    } else {
      setError('이 버전의 socketService는 수동 URL 설정을 지원하지 않습니다.');
    }
  };
  
  // 방 생성 함수
  const handleCreateRoom = async () => {
    if (!nickname.trim() || isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // 1. 스토어에 방 생성
      const newRoomId = createRoom(nickname);
      
      // 2. 소켓 연결 초기화 (호스트 모드)
      await socketService.initSocket(newRoomId, true);
      
      // 3. 방 생성 성공
      setIsRoomCreated(true);
      setConnectionRetries(0);
      
      // 진동 피드백 (모바일)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (err) {
      console.error('방 생성 오류:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`방 생성 중 오류가 발생했습니다: ${errorMessage}`);
      setConnectionRetries(prev => prev + 1);
      
      // 3번 이상 실패하면 수동 옵션 표시
      if (connectionRetries >= 2) {
        setShowManualOptions(true);
      }
    } finally {
      setIsConnecting(false);
    }
  };
  
  // 연결 재시도
  const handleRetryConnection = () => {
    // 기존 연결 해제
    socketService.disconnect();
    // 다시 연결 시도
    handleCreateRoom();
  };
  
  // 게임 시작 함수
  const handleStartGame = (gameType: 'chill' | 'freshhh') => {
    if (participants.length < 1) {
      setError('최소 1명의 참가자가 필요합니다.');
      return;
    }
    
    // 연결 상태 확인
    const connectionStatus = socketService.getConnectionStatus();
    if (connectionStatus !== 'connected') {
      setError(`소켓 연결 상태가 불안정합니다(${connectionStatus}). 잠시 후 다시 시도해주세요.`);
      return;
    }
    
    setGameSelection(gameType);
    setStartingGame(true);
    
    // 진동 피드백
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
    
    // 게임 시작
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-ink-white p-4 relative overflow-hidden">
      {/* 배경 잉크 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {inkBlobs.map((blob, index) => (
          <motion.svg
            key={blob.id}
            className="absolute"
            viewBox="0 0 100 100"
            style={{
              top: `${10 + (index * 30)}%`,
              left: `${20 + (index * 25)}%`,
              width: `${20 + (index * 5)}vw`,
              height: `${20 + (index * 5)}vw`,
              opacity: 0.03
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
        transition={{ duration: 0.4 }}
      >
        {!isRoomCreated ? '방 만들기' : '초대하기'}
      </motion.h1>
      
      {error && (
        <motion.div 
          className="mb-4 px-4 py-2 bg-state-error text-ink-black rounded-lg text-center w-full max-w-md"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm">{error}</p>
          {showManualOptions && !isRoomCreated && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <button 
                onClick={handleRetryConnection}
                className="text-xs px-3 py-1 bg-white rounded-full shadow-sm hover:shadow"
              >
                다시 시도
              </button>
              <button 
                onClick={handleManualServerUrl}
                className="text-xs px-3 py-1 bg-white rounded-full shadow-sm hover:shadow"
              >
                서버 URL 변경
              </button>
            </div>
          )}
        </motion.div>
      )}
      
      <AnimatePresence mode="wait">
        {!isRoomCreated ? (
          <motion.div 
            key="nickname-form"
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <Input
              label="닉네임 (최대 10자)"
              maxLength={10}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              fullWidth
              error={nickname.length > 10 ? "닉네임은 최대 10자까지 입력 가능합니다." : undefined}
            />
            
            <Button
              onClick={handleCreateRoom}
              disabled={!nickname.trim() || isConnecting || nickname.length > 10}
              fullWidth
              size="large"
              isLoading={isConnecting}
              variant={selectedGame === 'chill' ? 'primary' : selectedGame === 'freshhh' ? 'secondary' : 'primary'}
            >
              {isConnecting ? `방 생성 중... ${connectionRetries > 0 ? `(시도 ${connectionRetries + 1})` : ''}` : '방 생성하기'}
            </Button>
            
            {selectedGame && (
              <div className="text-center mt-4">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-ink-gray-500"
                >
                  선택된 게임: <span className="font-medium">{selectedGame === 'chill' ? 'Chill (랜덤 당첨)' : 'Freshhh (눈치게임)'}</span>
                </motion.p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="room-info"
            className="w-full max-w-md flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 relative">
              {/* QR 코드 주변 유기적인 효과 - 잉크가 종이에 번지는 효과 */}
              <motion.div 
                className="absolute -inset-3 rounded-xl"
                initial={{ opacity: 0.05 }}
                animate={{ 
                  opacity: [0.03, 0.06, 0.03],
                  scale: [0.98, 1.02, 0.98]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 6,
                  ease: "easeInOut"
                }}
                style={{ filter: 'url(#ink-spread)' }}
              >
                <div className="w-full h-full bg-ink-black rounded-xl"></div>
              </motion.div>
              
              <QRCodeGenerator 
                value={qrCodeValue} 
                size={240} 
                title="이 QR 코드를 스캔하여 참여하세요" 
              />
            </div>
            
            <div className="mb-8 text-center w-full">
              <p className="text-lg mb-1">방 ID</p>
              <Input
                value={roomId}
                readOnly
                showCopy
                fullWidth
                className="text-center tracking-wider font-medium"
                helperText="QR코드를 스캔하거나 방 ID를 공유하세요"
              />
              
              {/* 현재 소켓 연결 상태 표시 */}
              <div className="mt-2 text-xs">
                <span className="inline-flex items-center">
                  <span 
                    className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      socketService.getConnectionStatus() === 'connected' ? 'bg-green-500' : 
                      socketService.getConnectionStatus() === 'connecting' ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`}
                  ></span>
                  서버 상태: {
                    socketService.getConnectionStatus() === 'connected' ? '연결됨' : 
                    socketService.getConnectionStatus() === 'connecting' ? '연결 중' : 
                    '연결 안됨'
                  }
                  {socketService.getConnectionStatus() !== 'connected' && (
                    <button 
                      onClick={handleRetryConnection}
                      className="ml-2 underline text-ink-gray-500"
                    >
                      재연결
                    </button>
                  )}
                </span>
              </div>
            </div>
            
            <div className="w-full mb-8 relative">
              <motion.div 
                className="absolute -inset-2 rounded-lg opacity-10"
                animate={{ 
                  opacity: [0.05, 0.1, 0.05],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 4
                }}
                style={{ 
                  background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 70%)',
                  filter: 'blur(8px)'
                }}
              />
            
              <h3 className="text-lg mb-3">참가자 목록</h3>
              <div className="bg-ink-gray-100 rounded-lg p-4 min-h-32 max-h-64 overflow-y-auto shadow-inner-emboss">
                {participants.length > 0 ? (
                  <ul>
                    {participants.map((participant) => (
                      <motion.li 
                        key={participant.id} 
                        className="mb-2 flex items-center"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="text-ink-black">{participant.nickname}</span>
                        {participant.isHost && (
                          <span className="ml-2 text-xs bg-ink-gray-200 px-2 py-1 rounded-full">
                            방장
                          </span>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-gray-500">아직 참가자가 없습니다</p>
                )}
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {!startingGame ? (
                <motion.div 
                  key="game-selection"
                  className="mt-4 w-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-center mb-4">게임 선택</p>
                  <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                    <Button
                      onClick={() => handleStartGame('chill')}
                      disabled={participants.length < 1 || socketService.getConnectionStatus() !== 'connected'}
                      variant="primary"
                      size="large"
                      className={`flex-1 ${selectedGame === 'chill' ? 'ring-2 ring-ink-black' : ''}`}
                    >
                      Chill (랜덤 당첨)
                    </Button>

                    <Button
                      onClick={() => handleStartGame('freshhh')}
                      disabled={participants.length < 1 || socketService.getConnectionStatus() !== 'connected'}
                      variant="secondary"
                      size="large"
                      className={`flex-1 ${selectedGame === 'freshhh' ? 'ring-2 ring-ink-black' : ''}`}
                    >
                      Freshhh (눈치게임)
                    </Button>
                  </div>
                  
                  {participants.length < 1 && (
                    <p className="text-xs text-ink-gray-500 text-center mt-2">
                      게임 시작을 위해 최소 1명의 참가자가 필요합니다
                    </p>
                  )}
                  
                  {socketService.getConnectionStatus() !== 'connected' && participants.length >= 1 && (
                    <p className="text-xs text-ink-gray-500 text-center mt-2">
                      서버에 연결되어 있지 않습니다. 재연결 후 시도해주세요.
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="game-starting"
                  className="text-center mt-4 py-4 px-8 bg-state-highlight rounded-lg w-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.p 
                    className="text-xl font-light text-ink-gray-700"
                    animate={{ 
                      opacity: [0.7, 1, 0.7],
                      scale: [0.98, 1.02, 0.98]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2
                    }}
                  >
                    {gameSelection === 'chill' 
                      ? 'Chill (랜덤 당첨)' 
                      : 'Freshhh (눈치게임)'} 
                    을 시작합니다...
                  </motion.p>
                  
                  <motion.div
                    className="mt-2 flex justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex space-x-2">
                      <motion.div 
                        className="w-3 h-3 bg-ink-gray-400 rounded-full loading-dot"
                      />
                      <motion.div 
                        className="w-3 h-3 bg-ink-gray-400 rounded-full loading-dot"
                      />
                      <motion.div 
                        className="w-3 h-3 bg-ink-gray-400 rounded-full loading-dot"
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 연결 문제 발생 시 표시되는 디버그 정보 패널 */}
      {isRoomCreated && error && (
        <motion.div
          className="fixed bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-ink-gray-200 text-xs max-h-32 overflow-y-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="font-bold mb-1">연결 문제 해결을 위한 정보</h4>
          <p className="mb-2">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={handleRetryConnection}
              className="px-2 py-1 bg-ink-gray-100 rounded-md hover:bg-ink-gray-200"
            >
              재연결 시도
            </button>
            <button
              onClick={handleManualServerUrl}
              className="px-2 py-1 bg-ink-gray-100 rounded-md hover:bg-ink-gray-200"
            >
              서버 URL 변경
            </button>
            <button
              onClick={() => setError(null)}
              className="px-2 py-1 bg-ink-gray-100 rounded-md hover:bg-ink-gray-200 ml-auto"
            >
              닫기
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RoomCreation;