import { create } from 'zustand';

export interface Participant {
  id: string;
  nickname: string;
  isHost: boolean;
}

export type GameType = 'chill' | 'freshhh' | null;

export interface GameState {
  status: 'waiting' | 'running' | 'finished';
  type: GameType;
  currentRound: number;
  roundsTotal: number;
  scores: Record<string, number>;
  winner: string | null;
}

interface GameStore {
  // 세션 관련 상태
  roomId: string;
  isHost: boolean;
  nickname: string;
  participantNumber: number;
  participants: Participant[];
  
  // 게임 관련 상태
  gameState: GameState;
  
  // 액션
  createRoom: (nickname: string) => string;
  joinRoom: (roomId: string, nickname: string) => void;
  leaveRoom: () => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  
  // 게임 액션
  startGame: (gameType: GameType) => void;
  setGameStatus: (status: GameState['status']) => void;
  updateScore: (participantId: string, score: number) => void;
  setWinner: (participantId: string) => void;
  endGame: () => void;
  nextRound: () => void;
  resetGame: () => void;
}

// 초기 게임 상태
const initialGameState: GameState = {
  status: 'waiting',
  type: null,
  currentRound: 0,
  roundsTotal: 3,
  scores: {},
  winner: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  // 세션 초기 상태
  roomId: '',
  isHost: false,
  nickname: '',
  participantNumber: 0,
  participants: [],
  
  // 게임 초기 상태
  gameState: initialGameState,
  
  // 액션
  createRoom: (nickname) => {
    // roomId 생성 (실제로는 서버에서 생성할 수 있음)
    const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 참가자 ID 생성
    const participantId = Date.now().toString();
    
    set({
      roomId: generatedRoomId,
      isHost: true,
      nickname,
      participantNumber: 1,
      participants: [
        {
          id: participantId,
          nickname,
          isHost: true,
        },
      ],
    });
    
    return generatedRoomId;
  },
  
  joinRoom: (roomId, nickname) => {
    // 참가자 ID 생성
    const participantId = Date.now().toString();
    
    set({
      roomId,
      isHost: false,
      nickname,
      participantNumber: get().participants.length + 1,
      participants: [
        ...get().participants,
        {
          id: participantId,
          nickname,
          isHost: false,
        },
      ],
    });
  },
  
  leaveRoom: () => {
    set({
      roomId: '',
      isHost: false,
      nickname: '',
      participantNumber: 0,
      participants: [],
      gameState: initialGameState,
    });
  },
  
  addParticipant: (participant) => {
    // 이미 존재하는 참가자인지 확인
    if (get().participants.some(p => p.id === participant.id)) {
      return;
    }
    
    set({
      participants: [...get().participants, participant],
    });
  },
  
  removeParticipant: (participantId) => {
    const { participants } = get();
    const updatedParticipants = participants.filter(p => p.id !== participantId);
    
    // 호스트가 나간 경우 다음 참가자를 호스트로 설정
    let newHost = false;
    if (participants.find(p => p.id === participantId)?.isHost && updatedParticipants.length > 0) {
      updatedParticipants[0].isHost = true;
      
      // 내가 새 호스트가 되었는지 확인
      if (updatedParticipants[0].id === get().participants.find(p => p.nickname === get().nickname)?.id) {
        newHost = true;
      }
    }
    
    set({
      participants: updatedParticipants,
      isHost: newHost || get().isHost,
    });
  },
  
  startGame: (gameType) => {
    // 점수 초기화
    const scores: Record<string, number> = {};
    get().participants.forEach(p => {
      scores[p.id] = 0;
    });
    
    set({
      gameState: {
        ...initialGameState,
        status: 'running',
        type: gameType,
        currentRound: 1,
        scores,
      },
    });
  },
  
  setGameStatus: (status) => {
    set({
      gameState: {
        ...get().gameState,
        status,
      },
    });
  },
  
  updateScore: (participantId, score) => {
    const { gameState } = get();
    const newScores = { ...gameState.scores };
    
    // 점수 업데이트
    newScores[participantId] = (newScores[participantId] || 0) + score;
    
    set({
      gameState: {
        ...gameState,
        scores: newScores,
      },
    });
  },
  
  setWinner: (participantId) => {
    set({
      gameState: {
        ...get().gameState,
        winner: participantId,
      },
    });
  },
  
  endGame: () => {
    set({
      gameState: {
        ...get().gameState,
        status: 'finished',
      },
    });
  },
  
  nextRound: () => {
    const { gameState } = get();
    
    set({
      gameState: {
        ...gameState,
        currentRound: gameState.currentRound + 1,
      },
    });
  },
  
  resetGame: () => {
    set({
      gameState: initialGameState,
    });
  },
}));