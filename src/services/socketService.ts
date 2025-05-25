// src/services/socketService.ts (연결 안정성 개선)
import { io, Socket } from 'socket.io-client';
import { useGameStore, Participant, GameType } from '../store/gameStore';

export type MessageType = 
  | 'JOIN_REQUEST' 
  | 'JOIN_CONFIRMED' 
  | 'PLAYER_LIST_UPDATE' 
  | 'GAME_START' 
  | 'GAME_STATE_UPDATE' 
  | 'TAP_EVENT' 
  | 'ROUND_RESULT' 
  | 'GAME_RESULT' 
  | 'DISCONNECT_NOTICE'
  | 'HOST_CHANGE'
  | 'ROOM_CREATED';

export interface Message {
  type: MessageType;
  sender: string;
  timestamp: number;
  payload: any;
}

class SocketService {
  private socket: Socket | null = null;
  private roomId: string = '';
  private isHost: boolean = false;
  private nickname: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3; // 줄임
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private connectionErrorMessage: string = '';
  private joinRequestSent: boolean = false; // 추가: 중복 요청 방지
  private heartbeatInterval: number | null = null; // 추가: 연결 유지
  
  public getConnectionStatus(): string {
    return this.connectionStatus;
  }

  public getErrorMessage(): string {
    return this.connectionErrorMessage;
  }
  
  private getServerUrl(): string {
    const currentHost = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    
    console.log(`현재 호스트: ${currentHost}, 프로토콜: ${protocol}`);
    
    if (import.meta.env.PROD) {
      const serverUrl = window.location.origin;
      console.log(`프로덕션 URL: ${serverUrl}`);
      return serverUrl;
    }
    
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      const currentPort = window.location.port;
      if (currentPort === '5173') {
        console.log('로컬 개발 환경 - 포트 3001로 연결');
        return 'http://localhost:3001';
      }
    }
    
    console.log('기본 환경 - 현재 도메인 사용');
    return window.location.origin;
  }
  
  public async initSocket(roomId: string, isHost: boolean, nickname?: string): Promise<boolean> {
    this.roomId = roomId;
    this.isHost = isHost;
    this.nickname = nickname || '';
    this.connectionStatus = 'connecting';
    this.connectionErrorMessage = '';
    this.reconnectAttempts = 0;
    this.joinRequestSent = false; // 초기화
    
    console.log(`소켓 연결 시도: roomId=${roomId}, isHost=${isHost}, nickname=${this.nickname}`);
    
    // 기존 소켓 정리
    this.cleanup();
    
    try {
      const serverUrl = this.getServerUrl();
      console.log(`최종 서버 URL: ${serverUrl}`);
      
      return new Promise((resolve, reject) => {
        try {
          this.socket = io(serverUrl, {
            query: { 
              roomId, 
              isHost: isHost ? 'true' : 'false',
              nickname: this.nickname
            },
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 3000,
            timeout: 10000, // 줄임
            transports: ['polling', 'websocket'],
            forceNew: true,
            autoConnect: true,
            withCredentials: false,
          });
          
          // 연결 성공
          this.socket.on('connect', () => {
            console.log('소켓 연결 성공:', this.socket?.id);
            this.connectionStatus = 'connected';
            this.reconnectAttempts = 0;
            this.connectionErrorMessage = '';
            
            this.registerEventHandlers();
            this.startHeartbeat(); // 연결 유지 시작
            
            // 참가자인 경우 JOIN_REQUEST 자동 전송
            if (!this.isHost && !this.joinRequestSent) {
              setTimeout(() => {
                this.joinRoom(this.nickname);
              }, 100);
            }
            
            resolve(true);
          });
          
          // 연결 오류
          this.socket.on('connect_error', (error) => {
            this.connectionStatus = 'error';
            this.reconnectAttempts++;
            this.connectionErrorMessage = `연결 오류: ${error.message}`;
            
            console.error('소켓 연결 오류:', error.message, `(시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
              reject(new Error(`서버 연결 실패: ${error.message}`));
            }
          });
          
          // 연결 해제
          this.socket.on('disconnect', (reason) => {
            console.log('소켓 연결 해제:', reason);
            this.connectionStatus = 'disconnected';
            this.connectionErrorMessage = `연결 해제: ${reason}`;
            this.stopHeartbeat();
            
            // 의도하지 않은 연결 해제인 경우 자동 재연결 시도
            if (reason === 'io server disconnect') {
              console.log('서버에서 연결을 끊음 - 재연결 시도하지 않음');
            } else if (reason === 'transport close' || reason === 'transport error') {
              console.log('네트워크 문제로 연결 해제 - 자동 재연결 대기');
            }
          });
          
          this.socket.on('error', (error) => {
            console.error('소켓 오류:', error);
            this.connectionErrorMessage = `소켓 오류: ${error.toString()}`;
          });
          
        } catch (error) {
          console.error('소켓 초기화 오류:', error);
          this.connectionStatus = 'error';
          this.connectionErrorMessage = `초기화 오류: ${error instanceof Error ? error.message : String(error)}`;
          reject(error);
        }
      });
    } catch (error) {
      console.error('서버 URL 설정 오류:', error);
      this.connectionStatus = 'error';
      this.connectionErrorMessage = `서버 URL 오류: ${error instanceof Error ? error.message : String(error)}`;
      throw error;
    }
  }
  
  // 연결 유지를 위한 하트비트
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping');
      }
    }, 25000); // 25초마다 핑
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private cleanup(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  public disconnect(): void {
    console.log('소켓 연결 종료 요청');
    this.cleanup();
    this.connectionStatus = 'disconnected';
    this.connectionErrorMessage = '';
    this.joinRequestSent = false;
  }
  
  public sendMessage(message: Omit<Message, 'sender' | 'timestamp'>): void {
    if (!this.socket || this.socket.disconnected) {
      console.error('소켓이 연결되지 않았습니다. 메시지 전송 실패:', message.type);
      return;
    }
    
    const fullMessage: Message = {
      ...message,
      sender: this.socket.id || 'unknown',
      timestamp: Date.now(),
    };
    
    console.log('메시지 전송:', fullMessage.type, fullMessage.payload);
    this.socket.emit('message', fullMessage);
  }
  
  public joinRoom(nickname: string): void {
    if (this.joinRequestSent) {
      console.log('이미 JOIN_REQUEST를 전송했습니다.');
      return;
    }
    
    console.log(`방 참여 요청: ${nickname}, roomId=${this.roomId}`);
    this.nickname = nickname;
    this.joinRequestSent = true;
    
    this.sendMessage({
      type: 'JOIN_REQUEST',
      payload: {
        roomId: this.roomId,
        nickname,
      },
    });
  }
  
  public startGame(gameType: GameType): void {
    if (!this.isHost) {
      console.error('호스트만 게임을 시작할 수 있습니다.');
      return;
    }
    
    console.log(`게임 시작 요청: ${gameType}`);
    this.sendMessage({
      type: 'GAME_START',
      payload: {
        gameType,
        roomId: this.roomId,
      },
    });
  }
  
  public sendTapEvent(tapTime: number): void {
    this.sendMessage({
      type: 'TAP_EVENT',
      payload: {
        roomId: this.roomId,
        tapTime,
      },
    });
  }
  
  public ping(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket || this.socket.disconnected) {
        resolve(false);
        return;
      }
      
      const timeout = setTimeout(() => {
        resolve(false);
      }, 3000);
      
      this.socket.emit('ping', null, () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });
  }
  
  private registerEventHandlers(): void {
    if (!this.socket) return;
    
    console.log('이벤트 핸들러 등록');
    this.socket.off('message');
    
    this.socket.on('message', (message: Message) => {
      console.log('메시지 수신:', message.type, message.payload);
      const gameStore = useGameStore.getState();
      
      if (!message || !message.type) {
        console.error('유효하지 않은 메시지 수신:', message);
        return;
      }
      
      try {
        switch (message.type) {
          case 'ROOM_CREATED':
            console.log('방 생성 확인:', message.payload);
            break;
            
          case 'JOIN_CONFIRMED':
            console.log('방 참여 확인:', message.payload);
            this.joinRequestSent = false; // 리셋
            
            // 서버에서 받은 내 참가자 정보로 ID 업데이트
            if (message.payload?.participant?.id) {
              gameStore.updateMyParticipantId(message.payload.participant.id);
            }
            
            if (message.payload?.gameState) {
              gameStore.setGameStatus(message.payload.gameState.status);
            }
            break;
            
          case 'PLAYER_LIST_UPDATE':
            if (message.payload && Array.isArray(message.payload.participants)) {
              console.log('참가자 목록 업데이트:', message.payload.participants);
              const participants = message.payload.participants.map((p: any) => ({
                id: p.id,
                nickname: p.nickname,
                number: p.number || 0,
                isHost: p.isHost || false,
              })) as Participant[];
              gameStore.setParticipants(participants);
            }
            break;
            
          case 'GAME_START':
            if (message.payload?.gameType) {
              console.log('게임 시작:', message.payload.gameType);
              gameStore.startGame(message.payload.gameType);
            }
            break;
            
          case 'GAME_STATE_UPDATE':
            if (message.payload?.status) {
              gameStore.setGameStatus(message.payload.status);
            }
            break;
            
          case 'TAP_EVENT':
            console.log('탭 이벤트:', message.payload);
            break;
            
          case 'ROUND_RESULT':
            if (message.payload?.scores) {
              const scores = message.payload.scores as Record<string, number>;
              Object.entries(scores).forEach(([participantId, score]) => {
                gameStore.updateScore(participantId, score as number);
              });
            }
            break;
            
          case 'GAME_RESULT':
            if (message.payload?.winner) {
              gameStore.setWinner(message.payload.winner);
            }
            gameStore.endGame();
            break;
            
          case 'DISCONNECT_NOTICE':
            if (message.payload?.participantId) {
              console.log('참가자 연결 해제:', message.payload.nickname);
              gameStore.removeParticipant(message.payload.participantId);
            }
            break;
            
          case 'HOST_CHANGE':
            console.log('호스트 변경:', message.payload);
            break;
            
          default:
            console.log('알 수 없는 메시지 유형:', message.type);
        }
      } catch (error) {
        console.error('메시지 처리 오류:', error);
      }
    });
    
    // 핑퐁 응답
    this.socket.on('ping', (cb) => {
      if (typeof cb === 'function') {
        cb();
      }
    });
    
    // 에러 처리 강화
    this.socket.on('error', (error) => {
      console.error('소켓 런타임 오류:', error);
    });
  }
}

export const socketService = new SocketService();
export default socketService;