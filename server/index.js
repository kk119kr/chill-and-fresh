// server/index.js
// CommonJS 방식으로 변경
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { networkInterfaces } = require('os');

// 서버 설정
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 모든 출처 허용 (개발 환경)
    methods: ["GET", "POST"],
    credentials: false
  },
});

app.use(cors({
  origin: "*", // 모든 출처 허용 (개발 환경)
  credentials: false
}));
app.use(express.json());

// 방 목록 (메모리 저장)
const rooms = {};

// 디버깅용 로그 추가
const logWithTimestamp = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

// 로컬 IP 주소 가져오기
const getLocalIpAddress = () => {
  const interfaces = networkInterfaces();
  
  // WiFi 또는 이더넷 네트워크 인터페이스 찾기
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // IPv4 주소이고 내부 주소가 아닌 경우
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return '127.0.0.1'; // 기본 로컬호스트 주소 반환
};

// 서버 API 엔드포인트
app.get('/', (req, res) => {
  res.send('Chill & Fresh 게임 서버 활성화');
});

// 로컬 IP 주소 가져오기 API
app.get('/api/local-ip', (req, res) => {
  const ipAddress = getLocalIpAddress();
  res.json({ ip: ipAddress });
});

// 상태 확인용 엔드포인트
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    rooms: Object.keys(rooms).length,
    timestamp: new Date().toISOString()
  });
});

// 소켓 연결 이벤트 처리
io.on('connection', (socket) => {
  logWithTimestamp('새로운 연결:', socket.id);
  
  // 쿼리 파라미터 가져오기
  const { roomId, isHost } = socket.handshake.query;
  
  // 연결 정보 검증
  if (!roomId) {
    logWithTimestamp('roomId가 제공되지 않음');
    socket.disconnect();
    return;
  }
  
  // 소켓을 방에 조인
  socket.join(roomId);
  logWithTimestamp(`소켓 ${socket.id}이(가) 방 ${roomId}에 조인함`);
  
  // 호스트인 경우 방 생성
  if (isHost === 'true' && !rooms[roomId]) {
    rooms[roomId] = {
      id: roomId,
      hostId: socket.id,
      participants: [],
      gameState: {
        status: 'waiting',
        type: null,
        currentRound: 0,
        roundsTotal: 3,
        scores: {},
        winner: null,
      },
    };
    logWithTimestamp(`방 생성됨: ${roomId}, 호스트: ${socket.id}`);
    
    // 방 생성 확인 메시지
    socket.emit('message', {
      type: 'ROOM_CREATED',
      sender: 'server',
      timestamp: Date.now(),
      payload: {
        roomId: roomId,
        hostId: socket.id
      }
    });
  }
  
  // 메시지 수신 처리
  socket.on('message', (message) => {
    logWithTimestamp('메시지 수신:', message.type);
    
    const room = rooms[roomId];
    if (!room) {
      logWithTimestamp(`존재하지 않는 방: ${roomId}`);
      return;
    }
    
    switch (message.type) {
      case 'JOIN_REQUEST':
        handleJoinRequest(socket, room, message);
        break;
        
      case 'GAME_START':
        handleGameStart(socket, room, message);
        break;
        
      case 'TAP_EVENT':
        handleTapEvent(socket, room, message);
        break;
        
      default:
        // 다른 메시지는 그대로 전달
        forwardMessageToRoom(room.id, message);
    }
  });
  
  // 연결 해제 처리
  socket.on('disconnect', () => {
    logWithTimestamp('연결 해제:', socket.id);
    
    // 방 검색
    const room = rooms[roomId];
    if (!room) return;
    
    // 참가자 찾기
    const index = room.participants.findIndex(p => p.socketId === socket.id);
    if (index !== -1) {
      const participant = room.participants[index];
      
      // 참가자 제거
      room.participants.splice(index, 1);
      
      // 방에 알림
      const disconnectMessage = {
        type: 'DISCONNECT_NOTICE',
        sender: 'server',
        timestamp: Date.now(),
        payload: {
          participantId: participant.id,
          nickname: participant.nickname,
        },
      };
      
      forwardMessageToRoom(room.id, disconnectMessage);
      
      // 호스트가 나간 경우 처리
      if (participant.isHost && room.participants.length > 0) {
        // 가장 오래된 참가자를 새 호스트로 설정
        const newHost = room.participants[0];
        newHost.isHost = true;
        room.hostId = newHost.socketId;
        
        // 호스트 변경 알림
        const hostChangeMessage = {
          type: 'HOST_CHANGE',
          sender: 'server',
          timestamp: Date.now(),
          payload: {
            newHostId: newHost.id,
            newHostNickname: newHost.nickname,
          },
        };
        
        forwardMessageToRoom(room.id, hostChangeMessage);
      }
      
      // 방에 참가자가 없으면 방 삭제
      if (room.participants.length === 0) {
        delete rooms[room.id];
        logWithTimestamp(`방 삭제됨: ${room.id}`);
      }
    }
  });
});

// 참가 요청 처리
function handleJoinRequest(socket, room, message) {
  const { nickname } = message.payload;
  
  // 참가자 추가
  const newParticipant = {
    id: message.sender,
    socketId: socket.id,
    nickname,
    isHost: socket.id === room.hostId,
  };
  
  room.participants.push(newParticipant);
  logWithTimestamp(`참가자 추가: ${nickname} (${socket.id})`);
  
  // 참가 확인 메시지 전송
  const confirmMessage = {
    type: 'JOIN_CONFIRMED',
    sender: 'server',
    timestamp: Date.now(),
    payload: {
      participant: newParticipant,
      gameState: room.gameState,
    },
  };
  
  socket.emit('message', confirmMessage);
  
  // 모든 참가자에게 업데이트된 참가자 목록 전송
  const updateMessage = {
    type: 'PLAYER_LIST_UPDATE',
    sender: 'server',
    timestamp: Date.now(),
    payload: {
      participants: room.participants.map(p => ({
        id: p.id,
        nickname: p.nickname,
        isHost: p.isHost,
      })),
    },
  };
  
  forwardMessageToRoom(room.id, updateMessage);
}

// 게임 시작 처리
function handleGameStart(socket, room, message) {
  const { gameType } = message.payload;
  
  // 호스트 확인
  if (socket.id !== room.hostId) {
    logWithTimestamp('호스트가 아닌 사용자가 게임 시작 요청:', socket.id);
    return;
  }
  
  // 게임 상태 업데이트
  room.gameState = {
    ...room.gameState,
    status: 'running',
    type: gameType,
    currentRound: 1,
    scores: {},
  };
  
  // 점수 초기화
  room.participants.forEach(p => {
    room.gameState.scores[p.id] = 0;
  });
  
  // 게임 시작 메시지 전송
  const gameStartMessage = {
    type: 'GAME_START',
    sender: 'server',
    timestamp: Date.now(),
    payload: {
      gameType,
      gameState: room.gameState,
    },
  };
  
  forwardMessageToRoom(room.id, gameStartMessage);
  logWithTimestamp(`게임 시작: ${gameType}, 방: ${room.id}`);
}

// 탭 이벤트 처리
function handleTapEvent(socket, room, message) {
  // 탭 이벤트를 모든 참가자에게 전달
  forwardMessageToRoom(room.id, message);
  logWithTimestamp(`탭 이벤트: ${socket.id}`);
}

// 방에 메시지 전달
function forwardMessageToRoom(roomId, message) {
  io.to(roomId).emit('message', message);
}

// 서버 시작
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  const ipAddress = getLocalIpAddress();
  logWithTimestamp(`서버 시작: http://${ipAddress}:${PORT}`);
});

// 예기치 않은 에러 처리
process.on('uncaughtException', (err) => {
  logWithTimestamp('예기치 않은 오류:', err);
});

// 확인용 콘솔 메시지
logWithTimestamp('소켓 서버 초기화 완료');