import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { networkInterfaces } from 'os';

// 메시지 타입 정의 (클라이언트와 동일)
type MessageType = 
  | 'JOIN_REQUEST' 
  | 'JOIN_CONFIRMED' 
  | 'PLAYER_LIST_UPDATE' 
  | 'GAME_START' 
  | 'GAME_STATE_UPDATE' 
  | 'TAP_EVENT' 
  | 'ROUND_RESULT' 
  | 'GAME_RESULT' 
  | 'DISCONNECT_NOTICE'
  | 'HOST_CHANGE';

// 메시지 인터페이스 (클라이언트와 동일)
interface Message {
  type: MessageType;
  sender: string;
  timestamp: number;
  payload: any;
}

// 참가자 인터페이스
interface Participant {
  id: string;
  socketId: string;
  nickname: string;
  isHost: boolean;
}

// 방 인터페이스
interface Room {
  id: string;
  hostId: string;
  participants: Participant[];
  gameState: {
    status: 'waiting' | 'running' | 'finished';
    type: 'chill' | 'freshhh' | null;
    currentRound: number;
    roundsTotal: number;
    scores: Record<string, number>;
    winner: string | null;
  };
}

// 서버 설정
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // 개발용으로 모든 오리진 허용
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// 방 목록 (메모리 저장)
const rooms: Record<string, Room> = {};

// 로컬 IP 주소 가져오기
const getLocalIpAddress = (): string | null => {
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
  
  return null;
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

// 소켓 연결 이벤트 처리
io.on('connection', (socket) => {
  console.log('새로운 연결:', socket.id);
  
  // 쿼리 파라미터 가져오기
  const { roomId, isHost } = socket.handshake.query as { roomId?: string; isHost?: string };
  
  // 연결 정보 검증
  if (!roomId) {
    console.error('roomId가 제공되지 않음');
    socket.disconnect();
    return;
  }
  
  // 소켓을 방에 조인
  socket.join(roomId);
  
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
    console.log(`방 생성됨: ${roomId}, 호스트: ${socket.id}`);
  }
  
  // 메시지 수신 처리
  socket.on('message', (message: Message) => {
    console.log('메시지 수신:', message.type);
    
    const room = rooms[roomId];
    if (!room) {
      console.error(`존재하지 않는 방: ${roomId}`);
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
    console.log('연결 해제:', socket.id);
    
    // 방 검색
    const room = rooms[roomId as string];
    if (!room) return;
    
    // 참가자 찾기
    const index = room.participants.findIndex(p => p.socketId === socket.id);
    if (index !== -1) {
      const participant = room.participants[index];
      
      // 참가자 제거
      room.participants.splice(index, 1);
      
      // 방에 알림
      const disconnectMessage: Message = {
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
        const hostChangeMessage: Message = {
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
        console.log(`방 삭제됨: ${room.id}`);
      }
    }
  });
});

// 참가 요청 처리
function handleJoinRequest(socket: any, room: Room, message: Message) {
  const { nickname } = message.payload;
  
  // 참가자 추가
  const newParticipant: Participant = {
    id: message.sender,
    socketId: socket.id,
    nickname,
    isHost: socket.id === room.hostId,
  };
  
  room.participants.push(newParticipant);
  
  // 참가 확인 메시지 전송
  const confirmMessage: Message = {
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
  const updateMessage: Message = {
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
function handleGameStart(socket: any, room: Room, message: Message) {
  const { gameType } = message.payload;
  
  // 호스트 확인
  if (socket.id !== room.hostId) {
    console.error('호스트가 아닌 사용자가 게임 시작 요청:', socket.id);
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
  const gameStartMessage: Message = {
    type: 'GAME_START',
    sender: 'server',
    timestamp: Date.now(),
    payload: {
      gameType,
      gameState: room.gameState,
    },
  };
  
  forwardMessageToRoom(room.id, gameStartMessage);
}

// 탭 이벤트 처리
function handleTapEvent(socket: any, room: Room, message: Message) {
  // 탭 이벤트를 모든 참가자에게 전달
  forwardMessageToRoom(room.id, message);
  
  // 여기에 게임별 탭 이벤트 처리 로직 추가 가능
}

// 방에 메시지 전달
function forwardMessageToRoom(roomId: string, message: Message) {
  io.to(roomId).emit('message', message);
}

// 서버 시작
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  const ipAddress = getLocalIpAddress();
  console.log(`서버 시작: http://${ipAddress}:${PORT}`);
});