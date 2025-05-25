// server/index.js (빌드 파일 경로 문제 해결 버전)
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { networkInterfaces } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
const PORT = parseInt(process.env.PORT) || 3001;
const HOST = '0.0.0.0'; // Railway에서는 항상 0.0.0.0으로 바인딩

logWithTimestamp(`환경: ${process.env.NODE_ENV || 'development'}`);
logWithTimestamp(`포트: ${PORT}`);
logWithTimestamp(`현재 디렉토리: ${__dirname}`);

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

// ===== 정적 파일 서빙 (프론트엔드) - 경로 수정 =====
if (process.env.NODE_ENV === 'production') {
  // 빌드 파일 경로들을 순차적으로 확인
  const possiblePaths = [
    path.join(__dirname, 'public'),     // server/public
    path.join(__dirname, '..', 'dist'), // dist (루트에서)
    path.join(process.cwd(), 'dist'),   // 현재 작업 디렉토리의 dist
    path.join(process.cwd(), 'server', 'public'), // 현재 작업 디렉토리의 server/public
  ];
  
  let publicPath = null;
  let indexPath = null;
  
  // 각 경로를 확인하여 index.html이 있는 첫 번째 경로 찾기
  for (const testPath of possiblePaths) {
    const testIndexPath = path.join(testPath, 'index.html');
    if (fs.existsSync(testIndexPath)) {
      publicPath = testPath;
      indexPath = testIndexPath;
      break;
    }
  }
  
  if (publicPath && indexPath) {
    logWithTimestamp(`정적 파일 경로 발견: ${publicPath}`);
    logWithTimestamp(`index.html 경로: ${indexPath}`);
    
    // 정적 파일 미들웨어 설정
    app.use(express.static(publicPath, {
      maxAge: '1d', // 1일 캐시
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache'); // HTML은 캐시하지 않음
        }
      }
    }));
    logWithTimestamp('정적 파일 서빙 설정 완료');
    
    // 디렉토리 내용 로깅
    try {
      const files = fs.readdirSync(publicPath);
      logWithTimestamp('정적 파일 디렉토리 내용:', files);
    } catch (err) {
      logWithTimestamp('디렉토리 읽기 오류:', err.message);
    }
  } else {
    logWithTimestamp('경고: index.html을 찾을 수 없습니다!');
    
    // 모든 경로 확인 결과 로깅
    possiblePaths.forEach((testPath, i) => {
      const exists = fs.existsSync(testPath);
      const indexExists = exists ? fs.existsSync(path.join(testPath, 'index.html')) : false;
      logWithTimestamp(`경로 ${i + 1}: ${testPath}`, {
        exists,
        indexExists,
        files: exists ? (function() {
          try {
            return fs.readdirSync(testPath);
          } catch {
            return 'read error';
          }
        })() : 'path not found'
      });
    });
  }
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
// Railway healthcheck 경로
app.get('/api/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    rooms: Object.keys(rooms).length,
    totalConnections: io.engine.clientsCount,
    staticFilesPath: process.env.NODE_ENV === 'production' ? 'configured' : 'dev mode'
  };
  
  res.status(200).json(health);
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

// 루트 경로 처리 - 개선된 버전
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // 이미 설정된 정적 파일 미들웨어를 사용
    // Express의 정적 파일 서빙이 자동으로 index.html을 제공함
    const indexPath = path.join(__dirname, 'public', 'index.html');
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // 대체 경로들 시도
      const altPaths = [
        path.join(__dirname, '..', 'dist', 'index.html'),
        path.join(process.cwd(), 'dist', 'index.html'),
        path.join(process.cwd(), 'server', 'public', 'index.html')
      ];
      
      let found = false;
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          res.sendFile(altPath);
          found = true;
          break;
        }
      }
      
      if (!found) {
        res.status(404).json({
          error: 'Frontend build not found',
          message: 'Please ensure the build process completed successfully',
          paths_checked: [indexPath, ...altPaths],
          cwd: process.cwd(),
          dirname: __dirname
        });
      }
    }
  } else {
    res.json({
      message: 'Chill and Fresh 서버가 실행 중입니다!',
      status: 'online',
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// SPA 라우팅을 위한 fallback - 개선된 버전
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res, next) => {
    // API 경로나 소켓 경로가 아닌 경우에만 index.html 반환
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    
    // 파일 확장자가 있는 경우 (JS, CSS, 이미지 등) 404 반환
    if (path.extname(req.path)) {
      return res.status(404).send('File not found');
    }
    
    // index.html 찾기 (위와 동일한 로직)
    const indexPath = path.join(__dirname, 'public', 'index.html');
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      const altPaths = [
        path.join(__dirname, '..', 'dist', 'index.html'),
        path.join(process.cwd(), 'dist', 'index.html'),
        path.join(process.cwd(), 'server', 'public', 'index.html')
      ];
      
      let found = false;
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          res.sendFile(altPath);
          found = true;
          break;
        }
      }
      
      if (!found) {
        res.status(404).json({
          error: 'Page not found',
          requestedPath: req.path
        });
      }
    }
  });
}

// ===== 소켓 연결 이벤트 처리 =====
io.on('connection', (socket) => {
  logWithTimestamp('새로운 연결:', socket.id);
  
  const { roomId, isHost, nickname } = socket.handshake.query;
  
  if (!roomId) {
    logWithTimestamp('roomId가 제공되지 않음');
    socket.emit('error', { message: 'roomId가 필요합니다.' });
    socket.disconnect();
    return;
  }
  
  socket.join(roomId);
  logWithTimestamp(`소켓 ${socket.id}이(가) 방 ${roomId}에 조인함`);
  
  // 호스트인 경우 방 생성 또는 호스트 복구
  if (isHost === 'true') {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      id: roomId,
      hostId: socket.id,
      participants: [{
        id: `host_${socket.id}`,
        socketId: socket.id,
        nickname: nickname || '호스트',
        number: 1, // 번호 추가
        isHost: true,
      }],
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
    // 기존 방이 있는 경우 호스트 정보 업데이트
    rooms[roomId].hostId = socket.id;
    const existingHost = rooms[roomId].participants.find(p => p.isHost);
    if (existingHost) {
      existingHost.socketId = socket.id;
    } else {
      rooms[roomId].participants.unshift({
        id: `host_${socket.id}`,
        socketId: socket.id,
        nickname: nickname || '호스트',
        number: 1, // 번호 추가
        isHost: true,
      });
    }
    logWithTimestamp(`기존 방의 호스트 업데이트: ${roomId}, 새 호스트: ${socket.id}`);
  }
  
  // 참가자 목록 업데이트 전송 시에도 number 포함
  const updateMessage = {
    type: 'PLAYER_LIST_UPDATE',
    sender: 'server',
    timestamp: Date.now(),
    payload: {
      participants: rooms[roomId].participants.map(p => ({
        id: p.id,
        nickname: p.nickname,
        number: p.number, // 번호 포함
        isHost: p.isHost,
      })),
    },
  };
  
  io.to(roomId).emit('message', updateMessage);
}

  // 메시지 수신 처리
  socket.on('message', (message) => {
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
  });
  
  // 연결 해제 처리
  socket.on('disconnect', (reason) => {
    logWithTimestamp(`소켓 연결 해제: ${socket.id}, 이유: ${reason}`);
    
    const room = rooms[roomId];
    if (!room) return;
    
    // 참가자 목록에서 제거
    const participantIndex = room.participants.findIndex(p => p.socketId === socket.id);
    if (participantIndex !== -1) {
      const removedParticipant = room.participants[participantIndex];
      room.participants.splice(participantIndex, 1);
      
      logWithTimestamp(`참가자 제거: ${removedParticipant.nickname} (${socket.id})`);
      
      // 다른 참가자들에게 알림
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
      
      // 방이 비었으면 삭제
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
  
  // 이미 참가했는지 확인 (socketId 기준)
  if (room.participants.some(p => p.socketId === socket.id)) {
    logWithTimestamp('이미 참가한 소켓:', socket.id);
    return;
  }
  
  const participantId = `participant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const participantNumber = room.participants.length + 1; // 번호 계산
  
  const newParticipant = {
    id: participantId,
    socketId: socket.id,
    nickname,
    number: participantNumber, // 번호 추가
    isHost: false,
  };
  
  // 참가자 추가
  room.participants.push(newParticipant);
  logWithTimestamp(`참가자 추가: ${nickname} (${socket.id}), 총 참가자: ${room.participants.length}`);
  
  // 참가 확인 메시지
  const confirmMessage = {
    type: 'JOIN_CONFIRMED',
    sender: 'server',
    timestamp: Date.now(),
    payload: {
      participant: {
        id: newParticipant.id,
        nickname: newParticipant.nickname,
        number: newParticipant.number, // 번호 포함
        isHost: newParticipant.isHost,
      },
      gameState: room.gameState,
    },
  };
  
  socket.emit('message', confirmMessage);
  
  // 모든 클라이언트에게 참가자 목록 업데이트 전송
  const updateMessage = {
    type: 'PLAYER_LIST_UPDATE',
    sender: 'server',
    timestamp: Date.now(),
    payload: {
      participants: room.participants.map(p => ({
        id: p.id,
        nickname: p.nickname,
        number: p.number, // 번호 포함
        isHost: p.isHost,
      })),
    },
  };
  
  io.to(room.id).emit('message', updateMessage);
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