// src/store/gameStore.ts 수정 (자동 번호 채번)
import { create } from 'zustand';

export interface Participant {
  id: string;
  nickname: string; // nickname 속성 추가
  number: number; // 1번부터 순차적으로 채번
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
  participantNumber: number;
  participants: Participant[];
  
  // 게임 관련 상태
  gameState: GameState;
  
  // 액션
  createRoom: () => string;
  joinRoom: (roomId: string, nickname: string) => void;
  leaveRoom: () => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  setParticipants: (participants: Participant[]) => void;
  
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
  participantNumber: 0,
  participants: [],
  
  // 게임 초기 상태
  gameState: initialGameState,
  
  // 액션
  createRoom: () => {
    // roomId 생성
    const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 호스트 참가자 생성 (1번)
    const hostParticipant: Participant = {
      id: `host_${Date.now()}`,
      nickname: '호스트', // 기본 닉네임
      number: 1,
      isHost: true,
    };
    
    set({
      roomId: generatedRoomId,
      isHost: true,
      participantNumber: 1,
      participants: [hostParticipant],
    });
    
    return generatedRoomId;
  },
  
  joinRoom: (roomId: string, nickname: string) => {
    const currentParticipants = get().participants;
    const nextNumber = currentParticipants.length + 1;
    
    // 새 참가자 생성
    const newParticipant: Participant = {
      id: `participant_${Date.now()}`,
      nickname,
      number: nextNumber,
      isHost: false,
    };
    
    set({
      roomId, // 이미 roomId를 사용하고 있으므로 currentRoomId 변수가 불필요
      isHost: false,
      participantNumber: nextNumber,
      participants: [...currentParticipants, newParticipant],
    });
  },
  
  leaveRoom: () => {
    set({
      roomId: '',
      isHost: false,
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
    
    // 번호 재정렬
    const reorderedParticipants = updatedParticipants.map((p, index) => ({
      ...p,
      number: index + 1,
      isHost: index === 0, // 첫 번째 참가자가 호스트
    }));
    
    // 현재 사용자가 새 호스트가 되었는지 확인
    const currentUser = get().participants.find(p => p.number === get().participantNumber);
    const newHost = reorderedParticipants.length > 0 && currentUser && reorderedParticipants[0].id === currentUser.id;
    
    set({
      participants: reorderedParticipants,
      isHost: newHost || get().isHost,
      participantNumber: currentUser ? 
        reorderedParticipants.findIndex(p => p.id === currentUser.id) + 1 : 
        get().participantNumber
    });
  },
  
  // 참가자 목록 설정
  setParticipants: (participants) => {
    const currentParticipantNumber = get().participantNumber;
    const currentParticipant = participants.find(p => p.number === currentParticipantNumber);
    
    set({
      participants,
      isHost: currentParticipant?.isHost || false,
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