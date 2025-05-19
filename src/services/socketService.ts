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
  | 'HOST_CHANGE';

// 메시지 인터페이스
export interface Message {
  type: MessageType;
  sender: string;
  timestamp: number;
  payload: any;
}

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string = ''; // 실제 서버 URL로 대체
  private roomId: string = '';
  private isHost: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
  // 소켓 연결 초기화
  public initSocket(roomId: string, isHost: boolean): Promise<boolean> {
    this.roomId = roomId;
    this.isHost = isHost;
    
    // 호스트인 경우 로컬 서버 URL 사용 (예: http://localhost:3001)
    // 참가자인 경우 호스트의 IP 주소 + 포트 사용
    // 실제 구현에서는 QR 코드에 호스트 IP + 포트 포함 가능
    this.serverUrl = isHost 
      ? 'http://localhost:3001' 
      : `http://${window.location.hostname}:3001`;
    
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          query: {
            roomId,
            isHost: isHost ? 'true' : 'false',
          },
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
        });
        
        this.socket.on('connect', () => {
          console.log('소켓 연결 성공');
          this.reconnectAttempts = 0;
          resolve(true);
        });
        
        this.socket.on('connect_error', (error) => {
          console.error('소켓 연결 오류:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('최대 재연결 시도 횟수 초과'));
          }
        });
        
        this.socket.on('disconnect', (reason) => {
          console.log('소켓 연결 해제:', reason);
          
          // 서버 측에서 연결을 해제한 경우 재연결 시도 안 함
          if (reason === 'io server disconnect') {
            reject(new Error('서버에서 연결을 해제했습니다.'));
          }
        });
        
        // 소켓 이벤트 핸들러 등록
        this.registerEventHandlers();
        
      } catch (error) {
        console.error('소켓 초기화 오류:', error);
        reject(error);
      }
    });
  }
  
  // 소켓 연결 종료
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  // 메시지 전송
  public sendMessage(message: Omit<Message, 'sender' | 'timestamp'>): void {
    if (!this.socket) {
      console.error('소켓이 연결되지 않았습니다.');
      return;
    }
    
    const fullMessage: Message = {
      ...message,
      sender: this.socket.id,
      timestamp: Date.now(),
    };
    
    this.socket.emit('message', fullMessage);
  }
  
  // 방 참여 요청
  public joinRoom(nickname: string): void {
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
  
  // 소켓 이벤트 핸들러 등록
  private registerEventHandlers(): void {
    if (!this.socket) return;
    
    // 메시지 수신 핸들러
    this.socket.on('message', (message: Message) => {
      const gameStore = useGameStore.getState();
      
      switch (message.type) {
        case 'JOIN_CONFIRMED':
          // 방 참여 확인 및 현재 상태 설정
          console.log('방 참여 확인:', message.payload);
          break;
          
        case 'PLAYER_LIST_UPDATE':
          // 참가자 목록 업데이트
          const participants = message.payload.participants as Participant[];
          participants.forEach(p => {
            gameStore.addParticipant(p);
          });
          break;
          
        case 'GAME_START':
          // 게임 시작
          gameStore.startGame(message.payload.gameType);
          break;
          
        case 'GAME_STATE_UPDATE':
          // 게임 상태 업데이트
          gameStore.setGameStatus(message.payload.status);
          break;
          
        case 'TAP_EVENT':
          // 다른 참가자의 탭 이벤트 처리
          console.log('탭 이벤트:', message.payload);
          break;
          
        case 'ROUND_RESULT':
          // 라운드 결과 처리
          // 점수 업데이트
          const scores = message.payload.scores as Record<string, number>;
          Object.entries(scores).forEach(([participantId, score]) => {
            gameStore.updateScore(participantId, score as number);
          });
          break;
          
        case 'GAME_RESULT':
          // 게임 결과 처리
          if (message.payload.winner) {
            gameStore.setWinner(message.payload.winner);
          }
          gameStore.endGame();
          break;
          
        case 'DISCONNECT_NOTICE':
          // 참가자 연결 해제 처리
          gameStore.removeParticipant(message.payload.participantId);
          break;
          
        case 'HOST_CHANGE':
          // 호스트 변경 처리
          console.log('호스트 변경:', message.payload);
          break;
          
        default:
          console.log('알 수 없는 메시지 유형:', message.type);
      }
    });
  }
}

// 싱글톤 인스턴스 생성
export const socketService = new SocketService();
export default socketService;