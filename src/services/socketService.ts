// src/services/socketService.ts (수정된 버전 - 연결 안정성 개선)
import { io, Socket } from 'socket.io-client';
import { useGameStore, Participant, GameType } from '../store/gameStore';

// 메시지 타입 정의
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

// 메시지 인터페이스
export interface Message {
  type: MessageType;
  sender: string;
  timestamp: number;
  payload: any;
}

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string = ''; 
  private roomId: string = '';
  private isHost: boolean = false;
  private nickname: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectTimeout: number | null = null;
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private connectionErrorMessage: string = '';
  private isInitializing: boolean = false;
  
  // 연결 상태 확인
  public getConnectionStatus(): string {
    return this.connectionStatus;
  }

  // 오류 메시지 가져오기
  public getErrorMessage(): string {
    return this.connectionErrorMessage;
  }
  
  // 소켓 서버 URL 가져오기
  private getServerUrl(): string {
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    
    console.log(`현재 호스트: ${currentHost}, 포트: ${currentPort}, 프로토콜: ${protocol}`);
    
    // Railway 배포 환경 감지
    if (currentHost.includes('railway.app') || 
        currentHost.includes('up.railway.app') ||
        (import.meta.env.PROD && currentHost !== 'localhost')) {
      const serverUrl = `${protocol}//${currentHost}${currentPort ? ':' + currentPort : ''}`;
      console.log(`Railway 프로덕션 URL: ${serverUrl}`);
      return serverUrl;
    } else if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      if (currentPort === '5173') {
        console.log('로컬 개발 환경 감지 - 포트 3001로 연결');
        return 'http://localhost:3001';
      } else {
        console.log('로컬 빌드 버전 - 현재 포트 사용');
        return window.location.origin;
      }
    } else {
      console.log('기타 환경 - 현재 도메인 사용');
      return window.location.origin;
    }
  }
  
  // 소켓 연결 초기화 - 수정된 버전 (안정성 개선)
  public async initSocket(roomId: string, isHost: boolean, nickname?: string): Promise<boolean> {
    // 이미 초기화 중인 경우 대기
    if (this.isInitializing) {
      console.log('이미 초기화 중입니다. 대기 중...');
      return false;
    }

    this.isInitializing = true;
    this.roomId = roomId;
    this.isHost = isHost;
    this.nickname = nickname || (isHost ? '호스트' : '참가자');
    this.connectionStatus = 'connecting';
    this.connectionErrorMessage = '';
    
    console.log(`소켓 연결 시도: roomId=${roomId}, isHost=${isHost}, nickname=${this.nickname}`);
    
    // 기존 소켓이 있으면 완전히 정리
    if (this.socket) {
      console.log('기존 소켓 연결 정리 중...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      // 정리 완료까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    try {
      this.serverUrl = this.getServerUrl();
      console.log(`최종 서버 URL: ${this.serverUrl}`);
      
      return new Promise((resolve, reject) => {
        try {
          // Socket.IO 연결 옵션 - 안정성 개선
          this.socket = io(this.serverUrl, {
            query: { 
              roomId, 
              isHost: isHost ? 'true' : 'false',
              nickname: this.nickname
            },
            reconnection: false, // 자동 재연결 비활성화 (수동 제어)
            timeout: 15000, // 타임아웃 단축
            transports: ['websocket', 'polling'],
            forceNew: true,
            autoConnect: true,
            withCredentials: false,
            upgrade: true,
            rememberUpgrade: true
          });
          
          // 연결 성공 타이머
          const connectTimeout = setTimeout(() => {
            console.error('연결 타임아웃');
            this.connectionStatus = 'error';
            this.connectionErrorMessage = '연결 타임아웃';
            this.isInitializing = false;
            reject(new Error('연결 타임아웃'));
          }, 15000);
          
          // 연결 이벤트 핸들러
          this.socket.on('connect', () => {
            clearTimeout(connectTimeout);
            console.log('소켓 연결 성공:', this.socket?.id);
            this.connectionStatus = 'connected';
            this.reconnectAttempts = 0;
            this.connectionErrorMessage = '';
            this.isInitializing = false;
            
            this.registerEventHandlers();
            resolve(true);
          });
          
          // 연결 오류 이벤트 핸들러
          this.socket.on('connect_error', (error) => {
            clearTimeout(connectTimeout);
            this.connectionStatus = 'error';
            this.reconnectAttempts++;
            this.connectionErrorMessage = `연결 오류: ${error.message}`;
            this.isInitializing = false;
            
            console.error('소켓 연결 오류:', error.message, `(시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            reject(new Error(`서버 연결 실패: ${error.message}`));
          });
          
          this.socket.on('disconnect', (reason) => {
            console.log('소켓 연결 해제:', reason);
            this.connectionStatus = 'disconnected';
            this.connectionErrorMessage = `연결 해제: ${reason}`;
            this.isInitializing = false;
            
            // 예상치 못한 연결 해제인 경우에만 재연결 시도
            if (reason === 'io server disconnect' || reason === 'transport close') {
              this.attemptReconnect();
            }
          });
          
          this.socket.on('error', (error) => {
            console.error('소켓 오류:', error);
            this.connectionErrorMessage = `소켓 오류: ${error.toString()}`;
            this.isInitializing = false;
          });
          
        } catch (error) {
          console.error('소켓 초기화 오류:', error);
          this.connectionStatus = 'error';
          this.connectionErrorMessage = `초기화 오류: ${error instanceof Error ? error.message : String(error)}`;
          this.isInitializing = false;
          reject(error);
        }
      });
    } catch (error) {
      console.error('서버 URL 설정 오류:', error);
      this.connectionStatus = 'error';
      this.connectionErrorMessage = `서버 URL 오류: ${error instanceof Error ? error.message : String(error)}`;
      this.isInitializing = false;
      throw error;
    }
  }

  // 재연결 시도
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('최대 재연결 시도 횟수 초과');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000);
    console.log(`${delay}ms 후 재연결 시도 (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = window.setTimeout(() => {
      this.initSocket(this.roomId, this.isHost, this.nickname)
        .catch(error => {
          console.error('재연결 실패:', error);
        });
    }, delay);
  }
  
  // 소켓 연결 종료 - 개선된 버전
  public disconnect(): void {
    console.log('소켓 연결 해제 요청');
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connectionStatus = 'disconnected';
    this.connectionErrorMessage = '';
    this.isInitializing = false;
    this.reconnectAttempts = 0;
  }
  
  // 메시지 전송 - 안전성 개선
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
  
  // 방 참여 요청 - 수정된 버전
  public joinRoom(nickname: string): void {
    console.log(`방 참여 요청: ${nickname}, roomId=${this.roomId}`);
    
    // 닉네임 저장
    this.nickname = nickname;
    
    // 짧은 딜레이 후 전송 (연결 안정화)
    setTimeout(() => {
      this.sendMessage({
        type: 'JOIN_REQUEST',
        payload: {
          roomId: this.roomId,
          nickname,
        },
      });
    }, 300);
  }
  
  // 게임 시작 요청
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
  
  // 탭 이벤트 전송
  public sendTapEvent(tapTime: number): void {
    this.sendMessage({
      type: 'TAP_EVENT',
      payload: {
        roomId: this.roomId,
        tapTime,
      },
    });
  }
  
  // 서버 상태 확인 (핑)
  public ping(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket || this.socket.disconnected) {
        resolve(false);
        return;
      }
      
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);
      
      this.socket.emit('ping', null, () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });
  }
  
  // 소켓 이벤트 핸들러 등록 - 수정된 버전
  private registerEventHandlers(): void {
    if (!this.socket) return;
    
    console.log('이벤트 핸들러 등록');
    
    // 이벤트 리스너 중복 방지
    this.socket.off('message');
    
    // 메시지 수신 핸들러
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
            if (message.payload.gameState) {
              gameStore.setGameStatus(message.payload.gameState.status);
            }
            break;
            
          case 'PLAYER_LIST_UPDATE':
            if (message.payload && Array.isArray(message.payload.participants)) {
              console.log('참가자 목록 업데이트:', message.payload.participants);
              const participants = message.payload.participants.map((p: any, index: number) => ({
                id: p.id,
                nickname: p.nickname,
                number: index + 1, // 서버에서 number가 없을 수 있으므로 클라이언트에서 설정
                isHost: p.isHost || false,
              })) as Participant[];
              gameStore.setParticipants(participants);
            }
            break;
            
          case 'GAME_START':
            if (message.payload && message.payload.gameType) {
              console.log('게임 시작:', message.payload.gameType);
              gameStore.startGame(message.payload.gameType);
            }
            break;
            
          case 'GAME_STATE_UPDATE':
            if (message.payload && message.payload.status) {
              gameStore.setGameStatus(message.payload.status);
            }
            break;
            
          case 'TAP_EVENT':
            console.log('탭 이벤트:', message.payload);
            break;
            
          case 'ROUND_RESULT':
            if (message.payload && message.payload.scores) {
              const scores = message.payload.scores as Record<string, number>;
              Object.entries(scores).forEach(([participantId, score]) => {
                gameStore.updateScore(participantId, score as number);
              });
            }
            break;
            
          case 'GAME_RESULT':
            if (message.payload && message.payload.winner) {
              gameStore.setWinner(message.payload.winner);
            }
            gameStore.endGame();
            break;
            
          case 'DISCONNECT_NOTICE':
            if (message.payload && message.payload.participantId) {
              console.log('참가자 연결 해제:', message.payload.nickname);
              // 자신의 연결 해제가 아닌 경우에만 처리
              if (message.payload.participantId !== this.socket?.id) {
                gameStore.removeParticipant(message.payload.participantId);
              }
            }
            break;
            
          case 'HOST_CHANGE':
            console.log('호스트 변경:', message.payload);
            if (message.payload.newHostId === this.socket?.id) {
              // 자신이 새 호스트가 된 경우
              const participants = gameStore.participants.map(p => ({
                ...p,
                isHost: p.id === message.payload.newHostId
              }));
              gameStore.setParticipants(participants);
            }
            break;
            
          default:
            console.log('알 수 없는 메시지 유형:', message.type);
        }
      } catch (error) {
        console.error('메시지 처리 오류:', error);
      }
    });
    
    // 핑퐁 응답 설정
    this.socket.on('ping', (cb) => {
      if (typeof cb === 'function') {
        cb();
      }
    });
  }
}

// 싱글톤 인스턴스 생성
export const socketService = new SocketService();
export default socketService;