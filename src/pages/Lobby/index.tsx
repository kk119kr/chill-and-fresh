import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeScanner from '../../components/common/QRCodeScanner';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useGameStore } from '../../store/gameStore';
import socketService from '../../services/socketService';

const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [joinMethod, setJoinMethod] = useState<'scan' | 'manual'>('manual');
  const [roomId, setRoomId] = useState(searchParams.get('roomId') || '');
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [inkBlobs, setInkBlobs] = useState<Array<{id: number, path: string}>>([]);
  
  // Zustand 스토어에서 필요한 상태와 액션 가져오기
  const { gameState, joinRoom } = useGameStore();
  
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
  
  // QR 코드 스캔 결과 처리
  const handleScan = (data: string) => {
    try {
      // URL에서 roomId 파라미터 추출
      const url = new URL(data);
      const roomIdParam = url.searchParams.get('roomId');
      
      if (roomIdParam) {
        setRoomId(roomIdParam);
        setScanResult(`방 ID: ${roomIdParam}`);
        // 스캔 성공 시 수동 입력 모드로 전환
        setJoinMethod('manual');
        
        // 성공적인 스캔 시 진동 피드백 (모바일)
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      } else {
        setScanResult('유효하지 않은 QR 코드입니다');
        setError('유효하지 않은 QR 코드입니다');
        
        // 실패 시 짧은 진동 패턴 (경고)
        if (navigator.vibrate) {
          navigator.vibrate([20, 50, 20]);
        }
      }
    } catch (error) {
      setScanResult('유효하지 않은 URL입니다');
      setError('유효하지 않은 URL입니다');
      
      // 실패 시 짧은 진동 패턴 (경고)
      if (navigator.vibrate) {
        navigator.vibrate([20, 50, 20]);
      }
    }
  };
  
  // QR 스캔 에러 처리
  const handleScanError = (error: string) => {
    console.error('QR 코드 스캔 오류:', error);
    setError('카메라 접근에 문제가 있습니다. 권한을 확인해주세요.');
  };
  
  // 방 참여 처리
  const handleJoinRoom = async () => {
    if (!roomId.trim() || !nickname.trim() || isJoining) return;
    
    setIsJoining(true);
    setError(null);
    
    try {
      // 1. 소켓 연결 초기화 (참가자 모드)
      await socketService.initSocket(roomId, false);
      
      // 2. 스토어 상태 업데이트
      joinRoom(roomId, nickname);
      
      // 3. 소켓으로 참여 요청 전송
      socketService.joinRoom(nickname);
      
      // 성공 시 진동 피드백
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
      
      // 4. 성공 시 대기 화면으로 이동
      // gameState.type이 설정되어 있으면 해당 게임 화면으로 바로 이동
      if (gameState.status === 'running' && gameState.type) {
        navigate(`/${gameState.type}`);
      } else {
        // 대기 화면 - 실제로는 여기서 호스트의 게임 시작을 기다림
        // 소켓 이벤트를 통해 게임 시작 신호를 받으면 게임 화면으로 이동
      }
      
    } catch (err) {
      console.error('방 참여 오류:', err);
      setError('방 참여 중 오류가 발생했습니다. 방 ID를 확인해주세요.');
      
      // 실패 시 진동 패턴 (경고)
      if (navigator.vibrate) {
        navigator.vibrate([20, 100, 20]);
      }
    } finally {
      setIsJoining(false);
    }
  };
  
  // 게임 상태 변화 감지
  useEffect(() => {
    // 게임이 시작되면 해당 게임 화면으로 이동
    if (gameState.status === 'running' && gameState.type) {
      navigate(`/${gameState.type}`);
    }
  }, [gameState.status, gameState.type, navigate]);
  
  // 컴포넌트 언마운트 시 소켓 연결 해제
  useEffect(() => {
    return () => {
      // 참여 성공 전에 페이지를 나가는 경우에만 연결 해제
      if (gameState.status === 'waiting' && !gameState.type) {
        socketService.disconnect();
      }
    };
  }, [gameState.status, gameState.type]);

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
              width: `${15 + (index * 5)}vw`,
              height: `${15 + (index * 5)}vw`,
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
        {joinMethod === 'scan' ? 'QR 코드 스캔' : '방 참여하기'}
      </motion.h1>
      
      {error && (
        <motion.div 
          className="mb-4 px-4 py-2 bg-state-error rounded-lg text-center w-full max-w-md shadow-ink"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-ink-black">{error}</p>
        </motion.div>
      )}
      
      <AnimatePresence mode="wait">
        {joinMethod === 'scan' ? (
          <motion.div
            key="qr-scanner"
            className="w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            {/* QR 스캐너 주변에 유기적인 경계 효과 */}
            <div className="relative mb-4">
              <motion.div
                className="absolute -inset-4 rounded-xl opacity-10"
                animate={{ 
                  opacity: [0.07, 0.12, 0.07],
                  scale: [0.98, 1.02, 0.98]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 4,
                  ease: "easeInOut"
                }}
                style={{ 
                  background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 70%)',
                  filter: 'blur(6px)'
                }}
              />
              
              <QRCodeScanner 
                onScan={handleScan} 
                onError={handleScanError} 
              />
            </div>
            
            {scanResult && (
              <motion.p 
                className="mt-4 text-sm text-center text-ink-gray-600"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {scanResult}
              </motion.p>
            )}
            
            <motion.button
              onClick={() => setJoinMethod('manual')}
              className="mt-8 w-full text-sm text-ink-gray-500 underline"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              방 ID 직접 입력하기
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            key="manual-form"
            className="w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <Input
              label="방 ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="방 ID를 입력하세요"
              fullWidth
              className="mb-4"
            />
            
            <Input
              label="닉네임 (최대 10자)"
              maxLength={10}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              fullWidth
              className="mb-6"
            />
            
            <Button
              onClick={handleJoinRoom}
              disabled={!roomId.trim() || !nickname.trim() || isJoining}
              fullWidth
              size="large"
              isLoading={isJoining}
              variant="primary"
              layoutId="lobby-button"
            >
              {isJoining ? '참여 중...' : '입장하기'}
            </Button>
            
            <motion.button
              onClick={() => setJoinMethod('scan')}
              className="mt-8 w-full text-sm text-ink-gray-500 underline"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              QR 코드로 스캔하기
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 종이 질감 효과 - 하단 장식 */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" 
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.01) 100%)'
        }}
      />
    </div>
  );
};

export default Lobby;