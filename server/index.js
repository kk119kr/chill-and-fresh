// server/index.js (Railway 배포 오류 수정)
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { networkInterfaces } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logWithTimestamp = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

logWithTimestamp('서버 초기화 시작...');

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT) || 3001;
const HOST = '0.0.0.0';

// Railway URL 수정
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.RAILWAY_STATIC_URL ? `https://${process.env.RAILWAY_STATIC_URL}` : null,
      'https://chill-and-fresh-production.up.railway.app',
      'https://*.railway.app'
    ].filter(Boolean)
  : ["http://localhost:5173", "http://localhost:3000"];

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

// 정적 파일 서빙 설정
if (process.env.NODE_ENV === 'production') {
  const possiblePaths = [
    path.join(__dirname, 'public'),
    path.join(__dirname, '..', 'dist'),
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'server', 'public'),
  ];
  
  let publicPath = null;
  
  for (const testPath of possiblePaths) {
    const testIndexPath = path.join(testPath, 'index.html');
    if (fs.existsSync(testIndexPath)) {
      publicPath = testPath;
      break;
    }
  }
  
  if (publicPath) {
    logWithTimestamp(`정적 파일 경로: ${publicPath}`);
    app.use(express.static(publicPath, {
      maxAge: '1d',
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));
  }
}

// 방 목록 - 수정된 구조
const rooms = {};

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

// API 엔드포인트
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    rooms: Object.keys(rooms).length,
    totalConnections: io.engine.clientsCount,
  });
});

app.get('/api/local-ip', (req, res) => {
  const ipAddress = getLocalIpAddress();
  res.json({ ip: ipAddress });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    rooms: Object.keys(rooms).length,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

// 루트 및 SPA 라우팅
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Frontend build not found' });
    }
  } else {
    res.json({ message: 'Chill and Fresh 서버 실행 중' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    if (path.extname(req.path)) {
      return res.status(404).send('File not found');
    }
    
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Page not found' });
    }
  });
}

// 소켓 연결 이벤트 처리
io.on('connection', (socket) => {
  logWithTimestamp('새로운 연결:', socket.id);
  
  const { roomId, isHost, nickname } = socket.handshake.query;
  
  if (!roomId) {
    socket.emit('error', { message: 'roomId가 필요합니다.' });
    socket.disconnect();
    return;
  }
  
  socket.join(roomId);
  logWithTimestamp(`소켓 ${socket.id}이(가) 방 ${roomId}에 조인함`);
  
  // 호스트인 경우 방 생성 또는 업데이트
  if (isHost === 'true') {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        hostId: socket.id,
        participants: [],
        readyPlayers: new Set(), // 수정: Set 초기화
        gameState: { // 수정: gameState 초기화
          status: 'waiting',
          type: null,
          currentRound: 0,
          roundsTotal: 3,
          scores: {},
          winner: null
        }
      };
      
      // 호스트 참가자 추가
      const hostParticipant = {
        id: `host_${socket.id}`,
        socketId: socket.id,
        nickname: nickname || '호스트',
        number: 1,
        isHost: true,
      };
      
      rooms[roomId].participants.push(hostParticipant);
      rooms[roomId].readyPlayers.add(hostParticipant.id);
      
      logWithTimestamp(`방 생성됨: ${roomId}, 호스트: ${socket.id}`);
    } else {
      // 기존 방이 있는 경우 호스트 정보 업데이트
      rooms[roomId].hostId = socket.id;
      const existingHost = rooms[roomId].participants.find(p => p.isHost);
      if (existingHost) {
        existingHost.socketId = socket.id;
      }
      logWithTimestamp(`호스트 재연결: ${roomId}`);
    }
    
    // 참가자 목록 업데이트 전송
    sendParticipantUpdate(roomId);
  }
  
  // 메시지 처리
  socket.on('message', (message) => {
    try {
      if (!message || !message.type) {
        logWithTimestamp('유효하지 않은 메시지:', message);
        return;
      }
      
      const room = rooms[roomId];
      if (!room) {
        socket.emit('error', { message: '방을 찾을 수 없습니다.' });
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
          forwardMessageToRoom(room.id, message);
      }
    } catch (error) {
      logWithTimestamp('메시지 처리 오류:', error.message);
      socket.emit('error', { message: '메시지 처리 중 오류가 발생했습니다.' });
    }
  });
  
  // 연결 해제 처리
  socket.on('disconnect', (reason) => {
    logWithTimestamp(`소켓 연결 해제: ${socket.id}, 이유: ${reason}`);
    try {
      handleDisconnect(socket.id, roomId);
    } catch (error) {
      logWithTimestamp('연결 해제 처리 오류:', error.message);
    }
  });
});

// 헬퍼 함수들
function generateParticipantNickname(participantCount) {
  return `PT-${participantCount}`;
}

function sendParticipantUpdate(roomId) {
  try {
    const room = rooms[roomId];
    if (!room) return;
    
    const updateMessage = {
      type: 'PLAYER_LIST_UPDATE',
      sender: 'server',
      timestamp: Date.now(),
      payload: {
        participants: room.participants.map(p => ({
          id: p.id,
          nickname: p.nickname,
          number: p.number,
          isHost: p.isHost,
          isReady: false, // 로비에서는 준비 상태 없음
        })),
      },
    };
    
    io.to(roomId).emit('message', updateMessage);
    logWithTimestamp(`참가자 목록 업데이트 전송: ${roomId}`, {
      participants: room.participants.length,
      ready: room.readyPlayers ? room.readyPlayers.size : 0,
    });
  } catch (error) {
    logWithTimestamp('참가자 목록 업데이트 오류:', error.message);
  }
}

function handleJoinRequest(socket, room, message) {
  try {
    // 이미 참가했는지 확인
    if (room.participants.some(p => p.socketId === socket.id)) {
      logWithTimestamp('이미 참가한 소켓:', socket.id);
      return;
    }
    
    // 자동 닉네임 생성
    const participantCount = room.participants.filter(p => !p.isHost).length + 1;
    const autoNickname = generateParticipantNickname(participantCount);
    const participantNumber = room.participants.length + 1;
    
    const participantId = `participant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const newParticipant = {
      id: participantId,
      socketId: socket.id,
      nickname: autoNickname,
      number: participantNumber,
      isHost: false,
      isReady: false, // 로비에서는 준비 상태 없음
    };
    
    room.participants.push(newParticipant);
    logWithTimestamp(`참가자 추가: ${autoNickname} (${socket.id}), 총 참가자: ${room.participants.length}`);
    
    // 참가 확인 메시지
    const confirmMessage = {
      type: 'JOIN_CONFIRMED',
      sender: 'server',
      timestamp: Date.now(),
      payload: {
        participant: {
          id: newParticipant.id,
          nickname: newParticipant.nickname,
          number: newParticipant.number,
          isHost: newParticipant.isHost,
          isReady: newParticipant.isReady,
        },
        gameState: room.gameState,
      },
    };
    
    socket.emit('message', confirmMessage);
    
    // 모든 클라이언트에게 참가자 목록 업데이트
    sendParticipantUpdate(room.id);
  } catch (error) {
    logWithTimestamp('참가 요청 처리 오류:', error.message);
    socket.emit('error', { message: '참가 처리 중 오류가 발생했습니다.' });
  }
}

function handleGameStart(socket, room, message) {
  try {
    const { gameType } = message.payload;
    
    if (!gameType) {
      socket.emit('error', { message: '게임 타입이 필요합니다.' });
      return;
    }
    
    if (socket.id !== room.hostId) {
      socket.emit('error', { message: '호스트만 게임을 시작할 수 있습니다.' });
      return;
    }
    
    // 최소 참가자 수 확인
    if (room.participants.length < 1) {
      socket.emit('error', { message: '참가자가 없습니다.' });
      return;
    }
    
    // gameState 확인 및 초기화
    if (!room.gameState) {
      room.gameState = {
        status: 'waiting',
        type: null,
        currentRound: 0,
        roundsTotal: 3,
        scores: {},
        winner: null
      };
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
  } catch (error) {
    logWithTimestamp('게임 시작 처리 오류:', error.message);
    socket.emit('error', { message: '게임 시작 중 오류가 발생했습니다.' });
  }
}

function handleTapEvent(socket, room, message) {
  try {
    const participant = room.participants.find(p => p.socketId === socket.id);
    if (!participant) {
      socket.emit('error', { message: '참가자가 아닙니다.' });
      return;
    }
    
    message.payload.participantId = participant.id;
    message.payload.nickname = participant.nickname;
    forwardMessageToRoom(room.id, message);
  } catch (error) {
    logWithTimestamp('탭 이벤트 처리 오류:', error.message);
  }
}

function handleDisconnect(socketId, roomId) {
  try {
    const room = rooms[roomId];
    if (!room) return;
    
    const participantIndex = room.participants.findIndex(p => p.socketId === socketId);
    if (participantIndex !== -1) {
      const removedParticipant = room.participants[participantIndex];
      room.participants.splice(participantIndex, 1);
      
      // readyPlayers에서도 제거
      if (room.readyPlayers && room.readyPlayers.has(removedParticipant.id)) {
        room.readyPlayers.delete(removedParticipant.id);
      }
      
      logWithTimestamp(`참가자 제거: ${removedParticipant.nickname} (${socketId})`);
      
      // 참가자 목록 업데이트
      sendParticipantUpdate(room.id);
      
      // 방이 비었으면 삭제
      if (room.participants.length === 0) {
        delete rooms[room.id];
        logWithTimestamp(`방 삭제됨: ${room.id}`);
      }
    }
  } catch (error) {
    logWithTimestamp('연결 해제 처리 오류:', error.message);
  }
}

function forwardMessageToRoom(roomId, message) {
  try {
    if (!message || !message.type) return;
    io.to(roomId).emit('message', message);
  } catch (error) {
    logWithTimestamp('메시지 전달 오류:', error.message);
  }
}

// 서버 시작
server.listen(PORT, HOST, () => {
  const ipAddress = getLocalIpAddress();
  logWithTimestamp(`서버 시작: ${HOST}:${PORT}`);
  logWithTimestamp(`환경: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV === 'production') {
    logWithTimestamp(`Railway URL: https://chill-and-fresh-production.up.railway.app`);
  } else {
    logWithTimestamp(`로컬 IP: http://${ipAddress}:${PORT}`);
  }
});

// 예외 처리 강화
process.on('uncaughtException', (err) => {
  logWithTimestamp('예기치 않은 오류:', err.message);
  logWithTimestamp('스택 트레이스:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logWithTimestamp('Unhandled Rejection at:', promise);
  logWithTimestamp('Reason:', reason);
  process.exit(1);
});

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

logWithTimestamp('통합 서버 초기화 완료');