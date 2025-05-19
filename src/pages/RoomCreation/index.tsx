import React, { useState } from 'react';

const RoomCreation: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isRoomCreated, setIsRoomCreated] = useState(false);

  // 방 생성 함수
  const createRoom = () => {
    if (!nickname.trim()) return;
    
    // 랜덤 6자리 방 ID 생성 (알파벳 + 숫자)
    const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(generatedRoomId);
    setIsRoomCreated(true);
    
    // 여기에 실제 방 생성 로직을 추가할 수 있습니다
    console.log(`방 생성: ${generatedRoomId}, 닉네임: ${nickname}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <h1 className="text-4xl font-thin mb-8">방 만들기</h1>
      
      {!isRoomCreated ? (
        <div className="w-full max-w-md">
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
            onClick={createRoom}
            disabled={!nickname.trim()}
            className={`h-14 w-full rounded-full shadow-sm transition-colors ${
              nickname.trim() 
                ? 'bg-gray-50 hover:bg-gray-100' 
                : 'bg-gray-50 opacity-50 cursor-not-allowed'
            }`}
          >
            방 생성하기
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="mb-4">
            {/* QR코드가 여기에 표시됩니다 */}
            <div className="w-60 h-60 bg-gray-100 flex items-center justify-center">
              QR 코드 자리
            </div>
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
              <p className="text-sm text-gray-500">아직 참가자가 없습니다</p>
            </div>
          </div>
          
          <button
            disabled={true}
            className="h-14 w-full rounded-full mt-8 bg-gray-50 opacity-50 cursor-not-allowed"
          >
            게임 시작 (2명 이상 필요)
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomCreation;