import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import QRCodeScanner from '../../components/common/QRCodeScanner';
import Input from '../../components/common/Input';
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
  
  // Zustand 스토어에서 필요한 상태와 액션 가져오기
  const { gameState, joinRoom } = useGameStore();
  
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
      } else {
        setScanResult('유효하지 않은 QR 코드입니다');
        setError('유효하지 않은 QR 코드입니다');
      }
    } catch (error) {
      setScanResult('유효하지 않은 URL입니다');
      setError('유효하지 않은 URL입니다');
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <h1 className="text-4xl font-thin mb-8">
        {joinMethod === 'scan' ? 'QR 코드 스캔' : '방 참여하기'}
      </h1>
      
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 text-red-500 rounded-lg text-center w-full max-w-md">
          {error}
        </div>
      )}
      
      {joinMethod === 'scan' ? (
        <>
          <QRCodeScanner 
            onScan={handleScan} 
            onError={handleScanError} 
          />
          
          {scanResult && (
            <p className="mt-4 text-sm text-center">
              {scanResult}
            </p>
          )}
          
          <button
            onClick={() => setJoinMethod('manual')}
            className="mt-6 text-sm text-gray-500 underline"
          >
            방 ID 직접 입력하기
          </button>
        </>
      ) : (
        <div className="w-full max-w-md">
          <Input
            label="방 ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            placeholder="방 ID를 입력하세요"
            fullWidth
          />
          
          <Input
            label="닉네임 (최대 10자)"
            maxLength={10}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            fullWidth
          />
          
          <motion.button
            className={`w-full h-14 bg-white border border-gray-200 text-black rounded-full flex items-center justify-center text-lg font-light mt-4 ${
              !roomId.trim() || !nickname.trim() || isJoining ? 'opacity-50' : ''
            }`}
            onClick={handleJoinRoom}
            disabled={!roomId.trim() || !nickname.trim() || isJoining}
            whileTap={roomId.trim() && nickname.trim() && !isJoining ? { scale: 0.98 } : undefined}
            layoutId="secondary-button" // Home 컴포넌트에서 가져온 ID
          >
            {isJoining ? '참여 중...' : '입장하기'}
          </motion.button>
          
          <button
            onClick={() => setJoinMethod('scan')}
            className="mt-6 w-full text-sm text-gray-500 underline"
          >
            QR 코드로 스캔하기
          </button>
        </div>
      )}
    </div>
  );
};

export default Lobby;