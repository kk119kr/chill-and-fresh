// src/pages/Lobby/index.tsx (닉네임 문제 수정)
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
  const [joinMethod, setJoinMethod] = useState<'scan' | 'manual'>('scan');
  const [roomId, setRoomId] = useState(searchParams.get('roomId') || '');
  const [isJoining, setIsJoining] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [waitingForGame, setWaitingForGame] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  
  // Zustand 스토어에서 필요한 상태와 액션 가져오기
  const { gameState, participants, joinRoom, myParticipantId } = useGameStore();
  
  // URL에 roomId가 있으면 자동으로 참여 시도
  useEffect(() => {
    const urlRoomId = searchParams.get('roomId');
    if (urlRoomId && !waitingForGame && !isJoining) {
      setRoomId(urlRoomId);
      handleJoinRoom(urlRoomId);
    }
  }, [searchParams]);
  
  // QR 코드 스캔 결과 처리 - 바로 입장하도록 수정
  const handleScan = (data: string) => {
    try {
      const url = new URL(data);
      const roomIdParam = url.searchParams.get('roomId');
      
      if (roomIdParam) {
        setRoomId(roomIdParam);
        setScanResult(`방 ID: ${roomIdParam} - 입장 중...`);
        
        // 성공적인 스캔 시 진동 피드백 (모바일)
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        // 바로 방 참여 시도
        handleJoinRoom(roomIdParam);
      } else {
        setScanResult('유효하지 않은 QR 코드입니다');
        setError('유효하지 않은 QR 코드입니다');
        
        if (navigator.vibrate) {
          navigator.vibrate([20, 50, 20]);
        }
      }
    } catch (error) {
      setScanResult('유효하지 않은 URL입니다');
      setError('유효하지 않은 URL입니다');
      
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
  
  // 방 참여 처리 - 닉네임 생성 로직 수정
  const handleJoinRoom = async (targetRoomId?: string) => {
    const finalRoomId = targetRoomId || roomId.trim();
    
    if (!finalRoomId || isJoining) return;
    
    setIsJoining(true);
    setError(null);
    setConnectionStatus('connecting');
    
    try {
      console.log(`방 참여 시도: roomId=${finalRoomId}`);
      
      // 1. 임시 닉네임 생성 (서버에서 정확한 닉네임을 받을 예정)
      const tempNickname = `PT-${Math.floor(Math.random() * 1000)}`;
      
      // 2. 스토어 상태 업데이트 (임시 닉네임으로)
      joinRoom(finalRoomId, tempNickname);
      
      // 3. 소켓 연결 초기화 (참가자 모드) - 서버에서 닉네임 자동 생성
      const success = await socketService.initSocket(finalRoomId, false, tempNickname);
      
      if (!success) {
        throw new Error('소켓 연결에 실패했습니다.');
      }
      
      setConnectionStatus('connected');
      console.log('소켓 연결 성공 - JOIN_REQUEST는 자동으로 전송됨');
      
      // 4. 대기 상태로 전환
      setWaitingForGame(true);
      
      // 성공 시 진동 피드백
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
      
    } catch (err) {
      console.error('방 참여 오류:', err);
      setError('방 참여 중 오류가 발생했습니다. 방 ID를 확인해주세요.');
      setIsJoining(false);
      setWaitingForGame(false);
      setConnectionStatus('error');
      
      if (navigator.vibrate) {
        navigator.vibrate([20, 100, 20]);
      }
    }
  };
  
  // 게임 상태 변화 감지
  useEffect(() => {
    console.log('게임 상태 변화:', gameState.status, gameState.type);
    
    if (gameState.status === 'running' && gameState.type) {
      console.log(`게임 화면으로 이동: /${gameState.type}`);
      navigate(`/${gameState.type}`);
    }
  }, [gameState.status, gameState.type, navigate]);
  
  // 참가자 목록 변화 감지
  useEffect(() => {
    console.log('참가자 목록 변화:', participants);
    console.log('내 참가자 ID:', myParticipantId);
    
    if (isJoining && participants.length > 0) {
      const myParticipant = participants.find(p => 
        p.id === myParticipantId || (!p.isHost && p.id.includes('participant'))
      );
      
      if (myParticipant) {
        console.log('참가 완료:', myParticipant);
        setIsJoining(false);
        setConnectionStatus('connected');
      }
    }
  }, [participants, isJoining, myParticipantId]);
  
  // 연결 상태 모니터링
  useEffect(() => {
    const checkConnectionStatus = () => {
      const status = socketService.getConnectionStatus();
      if (status === 'error' || status === 'disconnected') {
        if (waitingForGame || isJoining) {
          setError('서버와의 연결이 끊어졌습니다. 다시 시도해주세요.');
          setIsJoining(false);
          setWaitingForGame(false);
          setConnectionStatus('error');
        }
      }
    };
    
    const interval = setInterval(checkConnectionStatus, 2000);
    return () => clearInterval(interval);
  }, [waitingForGame, isJoining]);
  
  // 컴포넌트 언마운트 시 소켓 연결 해제
  useEffect(() => {
    return () => {
      if (gameState.status === 'waiting') {
        console.log('컴포넌트 언마운트 - 소켓 연결 해제');
        socketService.disconnect();
      } else {
        console.log('게임 진행 중 - 소켓 연결 유지');
      }
    };
  }, [gameState.status]);

  // 나가기 처리
  const handleLeave = () => {
    setWaitingForGame(false);
    setIsJoining(false);
    setError(null);
    setConnectionStatus('idle');
    socketService.disconnect();
    
    const { leaveRoom } = useGameStore.getState();
    leaveRoom();
    
    navigate('/');
  };

  // 대기 화면이 표시되고 있는 경우
  if (waitingForGame) {
    // 내 참가자 정보 찾기
    const myParticipant = participants.find(p => 
      p.id === myParticipantId || (!p.isHost && p.id.includes('participant'))
    );
    
    // 방장을 맨 위로, 나머지를 번호순으로 정렬
    const sortedParticipants = [...participants].sort((a, b) => {
      if (a.isHost) return -1;
      if (b.isHost) return 1;
      return a.number - b.number;
    });
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <motion.div
          className="text-center max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-black mb-8 uppercase tracking-widest">
            게임 대기 중
          </h1>
          
          {/* 연결 상태 표시 */}
          <div className="flex items-center justify-center mb-6">
            <motion.div
              className={`w-3 h-3 mr-2 ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 
                'bg-gray-400'
              }`}
              animate={{
                opacity: connectionStatus === 'connecting' ? [1, 0.3, 1] : 1
              }}
              transition={{
                repeat: connectionStatus === 'connecting' ? Infinity : 0,
                duration: 1.5
              }}
            />
            <span className="font-mono text-sm uppercase tracking-wider">
              {connectionStatus === 'connected' ? '연결됨' : 
               connectionStatus === 'error' ? '연결 오류' : 
               '연결 중...'}
            </span>
          </div>
          
          <motion.div
            className="w-16 h-16 border-4 border-black border-t-transparent rounded-full mx-auto mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          
          <div className="bg-gray-50 border-2 border-black p-4 mb-6">
            <p className="text-lg font-mono mb-2">
              방 ID: <span className="font-bold">{roomId}</span>
            </p>
            {myParticipant && (
              <p className="text-sm text-blue-600">
                내 닉네임: <span className="font-semibold">{myParticipant.nickname}</span>
              </p>
            )}
          </div>
          
          <p className="text-base text-gray-600 mb-8">
            호스트가 게임을 시작할 때까지 기다려주세요
          </p>
          
          {participants.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">
                참가자 목록 ({participants.length}명)
              </h3>
              <div className="bg-gray-50 border-2 border-black p-4 max-h-48 overflow-y-auto">
                {sortedParticipants.map((participant) => (
                  <motion.div 
                    key={participant.id} 
                    className={`flex items-center justify-between py-2 px-3 mb-2 last:mb-0 border
                      ${participant.id === myParticipantId
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-white border-gray-200'}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="font-mono">
                      {participant.nickname}
                      {participant.id === myParticipantId && 
                        <span className="ml-2 text-xs text-blue-600">(나)</span>
                      }
                    </span>
                    {participant.isHost && (
                      <span className="text-xs bg-black text-white px-2 py-1 font-mono">
                        방장
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          <motion.button
            onClick={handleLeave}
            className="w-full px-6 py-3 bg-white border-2 border-black text-black font-mono
                       hover:bg-black hover:text-white transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            나가기
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 relative overflow-hidden">
      {/* 이전 화면 버튼 */}
      <motion.button
        onClick={() => navigate('/')}
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

      <motion.h1 
        className="text-4xl font-black mb-8 uppercase tracking-widest"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {joinMethod === 'scan' ? 'QR 코드 스캔' : '방 참여하기'}
      </motion.h1>
      
      {error && (
        <motion.div 
          className="mb-4 px-4 py-2 bg-red-100 border-2 border-red-500 text-center w-full max-w-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-red-700 font-mono">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-600 underline"
          >
            닫기
          </button>
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
            <div className="relative mb-4">
              <QRCodeScanner 
                onScan={handleScan} 
                onError={handleScanError} 
              />
            </div>
            
            {scanResult && (
              <motion.p 
                className="mt-4 text-sm text-center text-gray-600 font-mono"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {scanResult}
              </motion.p>
            )}
            
            <motion.button
              onClick={() => setJoinMethod('manual')}
              className="mt-8 w-full text-sm text-gray-500 underline font-mono hover:text-black transition-colors"
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
              placeholder="방 ID를 입력하세요 (예: ABC123)"
              fullWidth
              className="mb-6"
              maxLength={6}
            />
            
            <Button
              onClick={() => handleJoinRoom()}
              disabled={!roomId.trim() || roomId.length !== 6 || isJoining}
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
              className="mt-8 w-full text-sm text-gray-500 underline font-mono hover:text-black transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              QR 코드로 스캔하기
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Lobby;