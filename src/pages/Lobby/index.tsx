import React, { useState } from 'react';

const Lobby: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);

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
      <h1 className="text-4xl font-thin mb-8">방 참여하기</h1>
      
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
      </div>
    </div>
  );
};

export default Lobby;