import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeGenerator from '../../components/common/QRCodeGenerator';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useGameStore } from '../../store/gameStore';
import socketService from '../../services/socketService';

const RoomCreation: React.FC = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Zustand 스토어에서 필요한 상태와 액션 가져오기
  const { roomId, participants, createRoom } = useGameStore();
  
  // QR 코드에 포함될 URL 생성
  const qrCodeValue = isRoomCreated 
    ? `${window.location.origin}/join?roomId=${roomId}` 
    : '';
  
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
    } catch (err) {
      console.error('방 생성 오류:', err);
      setError('방 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsConnecting(false);
    }
  };
  
  // 게임 시작 함수
  const handleStartGame = (gameType: 'chill' | 'freshhh') => {
    if (participants.length < 2) {
      setError('게임을 시작하려면 최소 2명의 참가자가 필요합니다.');
      return;
    }
    
    // 소켓을 통해 게임 시작 메시지 전송
    socketService.startGame(gameType);
    
    // 게임 화면으로 이동
    navigate(`/${gameType}`);
  };
  
  // 소켓 연결 해제
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <h1 className="text-4xl font-thin mb-8">방 만들기</h1>
      
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 text-red-500 rounded-lg text-center">
          {error}
        </div>
      )}
      
      {!isRoomCreated ? (
        <div className="w-full max-w-md">
          <Input
            label="닉네임 (최대 10자)"
            maxLength={10}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            fullWidth
          />
          
          <Button
            onClick={handleCreateRoom}
            disabled={!nickname.trim() || isConnecting}
            fullWidth
            size="large"
          >
            {isConnecting ? '방 생성 중...' : '방 생성하기'}
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="mb-4">
            <QRCodeGenerator value={qrCodeValue} size={240} />
          </div>
          
          <div className="mb-8 text-center">
            <p className="text-lg mb-1">방 ID</p>
            <p className="text-3xl font-light tracking-wider">{roomId}</p>
            <p className="text-sm text-gray-500 mt-2">
              QR코드를 스캔하거나 방 ID를 공유하세요
            </p>
          </div>
          
          <div className="w-full">
            <h3 className="text-lg mb-3">참가자 목록</h3>
            <div className="bg-gray-50 rounded-lg p-4 min-h-32">
              {participants.length > 0 ? (
                <ul>
                  {participants.map((participant) => (
                    <li key={participant.id} className="mb-2 flex items-center">
                      <span className="text-gray-800">{participant.nickname}</span>
                      {participant.isHost && (
                        <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded-full">
                          방장
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">아직 참가자가 없습니다</p>
              )}
            </div>
          </div>
          
          <div className="mt-8 w-full">
            <p className="text-center mb-4">게임 선택</p>
            <div className="flex space-x-4">
              <Button
                onClick={() => handleStartGame('chill')}
                disabled={participants.length < 2}
                variant="primary"
                size="large"
                className="flex-1"
              >
                Chill (랜덤 당첨)
              </Button>
              
              <Button
                onClick={() => handleStartGame('freshhh')}
                disabled={participants.length < 2}
                variant="secondary"
                size="large"
                className="flex-1"
              >
                Freshhh (눈치게임)
              </Button>
            </div>
            
            {participants.length < 2 && (
              <p className="text-xs text-gray-500 text-center mt-2">
                게임 시작을 위해 최소 2명의 참가자가 필요합니다
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomCreation;