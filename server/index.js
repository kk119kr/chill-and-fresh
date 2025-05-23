// server/index.js (Railway 통합 - 프론트엔드 + 소켓 서버)
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { networkInterfaces } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 디버깅용 로그 추가
const logWithTimestamp = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

logWithTimestamp('서버 초기화 시작...');

// 서버 설정
const app = express();
const server = createServer(app);

// 포트 설정 - Railway에서 제공하는 PORT 환경변수 사용
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Railway에서는 항상 0.0.0.0으로 바인딩

logWithTimestamp(`환경: ${process.env.NODE_ENV || 'development'}`);
logWithTimestamp(`포트: ${PORT}`);

// CORS 설정
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null,
      'https://*.railway.app'
    ].filter(Boolean)
  : ["http://localhost:5173", "http://localhost:3000"];

logWithTimestamp('허용된 오리진:', allowedOrigins);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 10000,
  connectTimeout: 30000,
  allowEIO3: true,
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// ===== 정적 파일 서빙 (프론트엔드) =====
// 프로덕션 환경에서 빌드된 React 앱을 서빙
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, 'public');
  logWithTimestamp(`정적 파일 경로: ${publicPath}`);
  
  // 빌드된 정적 파일들을 서빙
  app.use(express.static(publicPath));
  
  // SPA 라우팅을 위한 fallback
  app.get('*', (req, res, next) => {
    // API 경로나 소켓 경로가 아닌 경우에만 index.html 반환
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    const indexPath = path.join(publicPath, 'index.html');
    logWithTimestamp(`index.html 반환: ${indexPath}`);
    res.sendFile(indexPath);
  });
}

// 방 목록 (메모리 저장)
const rooms = {};

// 로컬 IP 주소 가져오기
const getLocalIpAddress = () => {
  const interfaces = networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return '127.0.0.1';
};

// ===== API 엔드포인트 =====
app.get('/api/health', (req, res) => {
  logWithTimestamp('Health check 요청');
  res.status(200).json({
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    rooms: Object.keys(rooms).length,
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// 로컬 IP 주소 가져오기 API
app.get('/api/local-ip', (req, res) => {
  const ipAddress = getLocalIpAddress();
  logWithTimestamp(`로컬 IP 요청: ${ipAddress}`);
  res.json({ ip: ipAddress });
});

// 상태 확인용 엔드포인트
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    rooms: Object.keys(rooms).length,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ping 엔드포인트
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

// 루트 경로 처리 (개발 환경용)
app.get('/', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    res.json({
      message: 'Chill and Fresh 서버가 실행 중입니다!',
      status: 'online',
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// ===== 소켓 연결 이벤트 처리 =====
io.on('connection', (socket) => {
  logWithTimestamp('새로운 연결:', socket.id);
  
  const { roomId, isHost } = socket.handshake.query;
  
  if (!roomId) {
    logWithTimestamp('roomId가 제공되지 않음');
    socket.emit('error', { message: 'roomId가 필요합니다.' });
    socket.disconnect();
    return;
  }
  
  socket.join(roomId);
  logWithTimestamp(`소켓 ${socket.id}이(가) 방 ${roomId}에 조인함`);
  
  // 호스트인 경우 방 생성
  if (isHost === 'true') {
    if (!rooms[roomId]) {
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
    } else {
      rooms[roomId].hostId = socket.id;
      logWithTimestamp(`기존 방의 호스트 업데이트: ${roomId}, 새 호스트: ${socket.id}`);
    }
    
    socket.emit('message', {
      type: 'ROOM_CREATED',
      sender: 'server',
      timestamp: Date.now(),
      payload: {
        roomId: roomId,
        hostId: socket.id
      }
    });
  } else {
    if (!rooms[roomId]) {
      socket.emit('error', { message: '존재하지 않는 방입니다.' });
      socket.disconnect();
      return;
    }
  }
  
  // 소켓 핑/퐁 이벤트 처리
  socket.on('ping', (callback) => {
    if (typeof callback === 'function') {
      callback();
    }
  });
  
  // 메시지 수신 처리
  socket.on('message', (message) => {
    logWithTimestamp('메시지 수신:', message.type);
    
    const room = rooms[roomId];
    if (!room) {
      logWithTimestamp(`존재하지 않는 방: ${roomId}`);
      socket.emit('error', { message: '존재하지 않는 방입니다.' });
      return;
    }
    
    try {
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
          forwardMessageToRoom(room.id, message);
      }
    } catch (error) {
      logWithTimestamp('메시지 처리 오류:', error);
      socket.emit('error', { message: `메시지 처리 오류: ${error.message}` });
    }
  });
  
  // 연결 해제 처리
  socket.on('disconnect', (reason) => {
    logWithTimestamp(`연결 해제: ${socket.id}, 이유: ${reason}`);
    
    const room = rooms[roomId];
    if (!room) return;
    
    const index = room.participants.findIndex(p => p.socketId === socket.id);
    if (index !== -1) {
      const participant = room.participants[index];
      
      room.participants.splice(index, 1);
      
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
      
      if (socket.id === room.hostId && room.participants.length > 0) {
        const newHost = room.participants[0];
        newHost.isHost = true;
        room.hostId = newHost.socketId;
        
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
        logWithTimestamp(`호스트 변경: ${room.id}, 새 호스트: ${newHost.socketId}`);
      }
      
      if (room.participants.length === 0) {
        delete rooms[room.id];
        logWithTimestamp(`방 삭제됨: ${room.id}`);
      }
    }
  });
  
  socket.on('error', (error) => {
    logWithTimestamp('소켓 오류:', error);
    socket.emit('error', { message: `소켓 오류: ${error.message || 'Unknown error'}` });
  });
});

// ===== 소켓 이벤트 핸들러 함수들 =====
function handleJoinRequest(socket, room, message) {
  const { nickname } = message.payload;
  
  if (!nickname) {
    socket.emit('error', { message: '닉네임이 필요합니다.' });
    return;
  }
  
  if (room.participants.some(p => p.socketId === socket.id)) {
    socket.emit('error', { message: '이미 참가 중입니다.' });
    return;
  }
  
  const participantId = message.sender || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  const newParticipant = {
    id: participantId,
    socketId: socket.id,
    nickname,
    isHost: socket.id === room.hostId,
  };
  
  room.participants.push(newParticipant);
  logWithTimestamp(`참가자 추가: ${nickname} (${socket.id})`);
  
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

function handleGameStart(socket, room, message) {
  const { gameType } = message.payload;
  
  if (!gameType) {
    socket.emit('error', { message: '게임 타입이 필요합니다.' });
    return;
  }
  
  if (socket.id !== room.hostId) {
    logWithTimestamp('호스트가 아닌 사용자가 게임 시작 요청:', socket.id);
    socket.emit('error', { message: '호스트만 게임을 시작할 수 있습니다.' });
    return;
  }
  
  room.gameState = {
    ...room.gameState,
    status: 'running',
    type: gameType,
    currentRound: 1,
    scores: {},
  };
  
  room.participants.forEach(p => {
    room.gameState.scores[p.id] = 0;
  });
  
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

function handleTapEvent(socket, room, message) {
  const participant = room.participants.find(p => p.socketId === socket.id);
  
  if (!participant) {
    socket.emit('error', { message: '참가자가 아닙니다.' });
    return;
  }
  
  message.payload.participantId = participant.id;
  message.payload.nickname = participant.nickname;
  forwardMessageToRoom(room.id, message);
  logWithTimestamp(`탭 이벤트: ${socket.id}, 참가자: ${participant.nickname}`);
}

function forwardMessageToRoom(roomId, message) {
  if (!message || !message.type) {
    logWithTimestamp('유효하지 않은 메시지');
    return;
  }
  
  io.to(roomId).emit('message', message);
}

// ===== 서버 시작 =====
server.listen(PORT, HOST, () => {
  const ipAddress = getLocalIpAddress();
  logWithTimestamp(`서버 시작: ${HOST}:${PORT}`);
  logWithTimestamp(`환경: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV === 'production') {
    logWithTimestamp(`Railway URL: https://${process.env.RAILWAY_STATIC_URL || 'your-app'}.railway.app`);
  } else {
    logWithTimestamp(`로컬 IP: http://${ipAddress}:${PORT}`);
  }
  
  logWithTimestamp(`API 엔드포인트:`);
  logWithTimestamp(`- 상태 확인: /api/health`);
  logWithTimestamp(`- 핑: /api/ping`);
  logWithTimestamp(`- 로컬 IP: /api/local-ip`);
});

// 예기치 않은 에러 처리
process.on('uncaughtException', (err) => {
  logWithTimestamp('예기치 않은 오류:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logWithTimestamp('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 종료 신호 처리
process.on('SIGINT', () => {
  logWithTimestamp('SIGINT 수신, 서버 종료 중...');
  server.close(() => {
    logWithTimestamp('서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logWithTimestamp('SIGTERM 수신, 서버 종료 중...');
  server.close(() => {
    logWithTimestamp('서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

logWithTimestamp('통합 서버 초기화 완료 (프론트엔드 + 소켓)');