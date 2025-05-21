// src/services/socketService.ts 개선 버전
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
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10; // 최대 재시도 횟수 증가
  private reconnectTimeout: number | null = null;
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private connectionErrorMessage: string = '';
  
  // 연결 상태 확인
  public getConnectionStatus(): string {
    return this.connectionStatus;
  }

  // 오류 메시지 가져오기
  public getErrorMessage(): string {
    return this.connectionErrorMessage;
  }
  
  // 로컬 IP 주소 확인 메서드 추가
  private async getLocalIP(): Promise<string> {
    try {
      // 서버 API를 통해 로컬 IP 주소 얻기 시도
      const response = await fetch('/api/local-ip');
      
      if (response.ok) {
        const data = await response.json();
        return data.ip;
      }
    } catch (error) {
      console.log('로컬 IP 확인 실패, 기본 호스트 사용:', error);
    }
    
    // 기본값으로 현재 호스트 반환
    return window.location.hostname;
  }
  
  // 소켓 서버 URL 가져오기
  private async getServerUrl(): Promise<string> {
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    
    // 개발 환경에서는 로컬 IP 사용
    if (import.meta.env.DEV) {
      const hostname = await this.getLocalIP();
      return `${protocol}://${hostname}:3001`;
    }
    
    // 프로덕션에서는 현재 호스트의 API 엔드포인트 사용
    return `${protocol}://${window.location.host}/api`;
  }
  
  // 소켓 연결 초기화
  public async initSocket(roomId: string, isHost: boolean): Promise<boolean> {
    this.roomId = roomId;
    this.isHost = isHost;
    this.connectionStatus = 'connecting';
    this.connectionErrorMessage = '';
    
    console.log(`소켓 연결 시도: roomId=${roomId}, isHost=${isHost}`);
    
    // 기존 소켓이 있으면 연결 해제
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    try {
      // 서버 URL 설정
      this.serverUrl = await this.getServerUrl();
      console.log(`서버 URL: ${this.serverUrl}`);
      
      return new Promise((resolve, reject) => {
        try {
          // Socket.IO 연결 옵션 개선
          this.socket = io(this.serverUrl, {
            query: {
              roomId,
              isHost: isHost ? 'true' : 'false',
            },
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 30000, // 타임아웃 증가
            transports: ['websocket', 'polling'], // 웹소켓 먼저 시도
            forceNew: true, // 새 연결 강제
            autoConnect: true, // 자동 연결
            withCredentials: false, // CORS 문제 해결
          });
          
          // 연결 이벤트 핸들러
          this.socket.on('connect', () => {
            console.log('소켓 연결 성공:', this.socket?.id);
            this.connectionStatus = 'connected';
            this.reconnectAttempts = 0;
            this.connectionErrorMessage = '';
            
            // 연결 성공 시 이벤트 핸들러도 등록
            this.registerEventHandlers();
            
            resolve(true);
          });
          
          // 연결 오류 이벤트 핸들러
          this.socket.on('connect_error', (error) => {
            this.connectionStatus = 'error';
            this.reconnectAttempts++;
            this.connectionErrorMessage = `연결 오류: ${error.message}`;
            
            console.error('소켓 연결 오류:', error.message, `(시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            // 최대 재시도 횟수 초과 또는 CORS 관련 오류인 경우
            if (this.reconnectAttempts >= this.maxReconnectAttempts || 
                error.message.includes('CORS') || 
                error.message.includes('소켓이 닫힘')) {
              
              // 수동 재연결 시도 - 서버 URL 변경
              if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
              }
              
              this.reconnectTimeout = window.setTimeout(() => {
                console.log('수동 재연결 시도...');
                this.tryAlternativeConnection(roomId, isHost)
                  .then(result => resolve(result))
                  .catch(err => reject(err));
              }, 2000);
            }
          });
          
          this.socket.on('disconnect', (reason) => {
            console.log('소켓 연결 해제:', reason);
            this.connectionStatus = 'disconnected';
            this.connectionErrorMessage = `연결 해제: ${reason}`;
            
            // 서버 측에서 연결을 해제한 경우 재연결 시도 안 함
            if (reason === 'io server disconnect') {
              reject(new Error('서버에서 연결을 해제했습니다.'));
            }
            // 전송 오류는 자동으로 재연결 시도
            else if (reason === 'transport error' || reason === 'transport close') {
              console.log('전송 오류로 인한 연결 해제, 재연결 시도...');
              
              if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
              }
              
              this.reconnectTimeout = window.setTimeout(() => {
                this.tryAlternativeConnection(roomId, isHost)
                  .then(result => resolve(result))
                  .catch(err => reject(err));
              }, 1000);
            }
          });
          
          // 오류 이벤트 핸들러
          this.socket.on('error', (error) => {
            console.error('소켓 오류:', error);
            this.connectionErrorMessage = `소켓 오류: ${error.toString()}`;
          });
          
          // 재연결 시도 이벤트 핸들러
          this.socket.io.on('reconnect_attempt', (attempt) => {
            console.log(`재연결 시도 ${attempt}/${this.maxReconnectAttempts}`);
          });
          
          this.socket.io.on('reconnect', () => {
            console.log('재연결 성공');
            this.connectionStatus = 'connected';
            this.connectionErrorMessage = '';
          });
        } catch (error) {
          console.error('소켓 초기화 오류:', error);
          this.connectionStatus = 'error';
          this.connectionErrorMessage = `초기화 오류: ${error instanceof Error ? error.message : String(error)}`;
          reject(error);
        }
      });
    } catch (error) {
      console.error('서버 URL 가져오기 오류:', error);
      this.connectionStatus = 'error';
      this.connectionErrorMessage = `서버 URL 오류: ${error instanceof Error ? error.message : String(error)}`;
      throw error;
    }
  }
  
  // 대체 연결 시도 메서드
  private async tryAlternativeConnection(roomId: string, isHost: boolean): Promise<boolean> {
    console.log('대체 연결 시도 중...');
    
    // 폴백(fallback) URL 시도
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    
    // 대체 URL 목록
    const alternativeUrls = [
      `${protocol}://${window.location.hostname}:3001`, // 직접 포트 접근
      `${protocol}://localhost:3001`, // 로컬호스트
      `${protocol}://127.0.0.1:3001` // IP 주소
    ];
    
    // 기존에 시도한 URL을 제외
    const urlsToTry = alternativeUrls.filter(url => url !== this.serverUrl);
    
    // 각 URL 시도
    for (const url of urlsToTry) {
      console.log(`대체 URL 시도: ${url}`);
      this.serverUrl = url;
      
      // 기존 소켓 연결 해제
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      
      // 새 연결 시도
      this.socket = io(this.serverUrl, {
        query: {
          roomId,
          isHost: isHost ? 'true' : 'false',
        },
        reconnectionAttempts: 3, // 적은 수의 재시도만
        timeout: 5000, // 빠른 타임아웃
        transports: ['polling', 'websocket'], // 폴링 먼저 시도
        forceNew: true,
        autoConnect: true,
      });
      
      try {
        // 연결 성공 여부 확인
        const connected = await new Promise<boolean>((resolve) => {
          const timer = setTimeout(() => resolve(false), 5000);
          
          this.socket?.on('connect', () => {
            clearTimeout(timer);
            this.registerEventHandlers();
            this.connectionStatus = 'connected';
            this.connectionErrorMessage = '';
            resolve(true);
          });
          
          this.socket?.on('connect_error', () => {
            clearTimeout(timer);
            resolve(false);
          });
        });
        
        if (connected) {
          console.log(`대체 URL 연결 성공: ${url}`);
          return true;
        }
      } catch (error) {
        console.error(`대체 URL 연결 실패: ${url}`, error);
      }
    }
    
    console.error('모든 대체 URL 연결 실패');
    this.connectionStatus = 'error';
    this.connectionErrorMessage = '모든 서버 연결 시도 실패';
    throw new Error('서버 연결 실패: 모든 가능한 URL 접속 시도 실패');
  }
  
  // 소켓 연결 종료
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus = 'disconnected';
      this.connectionErrorMessage = '';
    }
    
    // 재연결 타임아웃 취소
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  // 메시지 전송
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
    
    console.log('메시지 전송:', fullMessage.type);
    this.socket.emit('message', fullMessage);
  }
  
  // 방 참여 요청
  public joinRoom(nickname: string): void {
    console.log(`방 참여 요청: ${nickname}, roomId=${this.roomId}`);
    this.sendMessage({
      type: 'JOIN_REQUEST',
      payload: {
        roomId: this.roomId,
        nickname,
      },
    });
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
  
  // 소켓 이벤트 핸들러 등록
  private registerEventHandlers(): void {
    if (!this.socket) return;
    
    console.log('이벤트 핸들러 등록');
    
    // 다른 이벤트 리스너 삭제 (중복 방지)
    this.socket.off('message');
    
    // 메시지 수신 핸들러
    this.socket.on('message', (message: Message) => {
      console.log('메시지 수신:', message.type);
      const gameStore = useGameStore.getState();
      
      // 메시지가 비어있거나 타입이 없는 경우 처리 X
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
            // 방 참여 확인 및 현재 상태 설정
            console.log('방 참여 확인:', message.payload);
            // 참가자 설정이 있는 경우
            if (message.payload.gameState) {
              gameStore.setGameStatus(message.payload.gameState.status);
            }
            break;
            
          case 'PLAYER_LIST_UPDATE':
            // 참가자 목록 업데이트
            if (message.payload && Array.isArray(message.payload.participants)) {
              console.log('참가자 목록 업데이트:', message.payload.participants);
              const participants = message.payload.participants as Participant[];
              gameStore.setParticipants(participants);
            } else {
              console.error('유효하지 않은 참가자 목록:', message.payload);
            }
            break;
            
          case 'GAME_START':
            // 게임 시작
            if (message.payload && message.payload.gameType) {
              console.log('게임 시작:', message.payload.gameType);
              gameStore.startGame(message.payload.gameType);
            } else {
              console.error('유효하지 않은 게임 시작 페이로드:', message.payload);
            }
            break;
            
          case 'GAME_STATE_UPDATE':
            // 게임 상태 업데이트
            if (message.payload && message.payload.status) {
              gameStore.setGameStatus(message.payload.status);
            }
            break;
            
          case 'TAP_EVENT':
            // 다른 참가자의 탭 이벤트 처리
            console.log('탭 이벤트:', message.payload);
            break;
            
          case 'ROUND_RESULT':
            // 라운드 결과 처리
            if (message.payload && message.payload.scores) {
              // 점수 업데이트
              const scores = message.payload.scores as Record<string, number>;
              Object.entries(scores).forEach(([participantId, score]) => {
                gameStore.updateScore(participantId, score as number);
              });
            }
            break;
            
          case 'GAME_RESULT':
            // 게임 결과 처리
            if (message.payload && message.payload.winner) {
              gameStore.setWinner(message.payload.winner);
            }
            gameStore.endGame();
            break;
            
          case 'DISCONNECT_NOTICE':
            // 참가자 연결 해제 처리
            if (message.payload && message.payload.participantId) {
              console.log('참가자 연결 해제:', message.payload.nickname);
              gameStore.removeParticipant(message.payload.participantId);
            }
            break;
            
          case 'HOST_CHANGE':
            // 호스트 변경 처리
            console.log('호스트 변경:', message.payload);
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