import React, { useState } from 'react';
import QRCodeScanner from '../../components/common/QRCodeScanner';

const Lobby: React.FC = () => {
  const [joinMethod, setJoinMethod] = useState<'scan' | 'manual'>('manual');
  const [roomId, setRoomId] = useState('');
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [scanResult, setScanResult] = useState('');

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
      }
    } catch (error) {
      setScanResult('유효하지 않은 URL입니다');
    }
  };

  // 방 참여 처리
  const joinRoom = () => {
    if (!roomId.trim() || !nickname.trim()) return;
    
    setIsJoining(true);
    
    // 여기에 실제 방 참여 로직을 추가할 수 있습니다
    console.log(`방 참여: ${roomId}, 닉네임: ${nickname}`);
    
    // 임시 성공 처리
    setTimeout(() => {
      setIsJoining(false);
      alert(`${roomId} 방에 ${nickname}님으로 참여합니다`);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <h1 className="text-4xl font-thin mb-8">
        {joinMethod === 'scan' ? 'QR 코드 스캔' : '방 참여하기'}
      </h1>
      
      {joinMethod === 'scan' ? (
        <>
          <QRCodeScanner onScan={handleScan} />
          
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
          <div className="mb-6">
            <label 
              htmlFor="roomId" 
              className="block text-sm font-light mb-2"
            >
              방 ID
            </label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full h-14 px-4 rounded-full border border-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-200"
              placeholder="방 ID를 입력하세요"
            />
          </div>
          
          <div className="mb-6">
            <label 
              htmlFor="nickname" 
              className="block text-sm font-light mb-2"
            >
              닉네임 (최대 10자)
            </label>
            <input
              id="nickname"
              type="text"
              maxLength={10}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full h-14 px-4 rounded-full border border-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-200"
              placeholder="닉네임을 입력하세요"
            />
          </div>
          
          <button
            onClick={joinRoom}
            disabled={!roomId.trim() || !nickname.trim() || isJoining}
            className={`h-14 w-full rounded-full shadow-sm transition-colors ${
              roomId.trim() && nickname.trim() && !isJoining
                ? 'bg-gray-50 hover:bg-gray-100' 
                : 'bg-gray-50 opacity-50 cursor-not-allowed'
            }`}
          >
            {isJoining ? '참여 중...' : '입장하기'}
          </button>
          
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