// src/store/gameStore.ts 수정 (닉네임 문제 해결)
import { create } from 'zustand';

export interface Participant {
  id: string;
  nickname: string;
  number: number;
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
    
    // 호스트 참가자 생성 (닉네임 문제 해결)
    const hostParticipant: Participant = {
      id: `host_${Date.now()}`,
      nickname: '호스트', // 기본 닉네임 설정
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
      roomId,
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
    const { participants, participantNumber, isHost } = get();
    const currentUser = participants.find(p => p.number === participantNumber);
    
    // 현재 사용자가 삭제되는 경우 방을 나가기
    if (currentUser && currentUser.id === participantId) {
      set({
        roomId: '',
        isHost: false,
        participantNumber: 0,
        participants: [],
        gameState: initialGameState,
      });
      return;
    }
    
    const updatedParticipants = participants.filter(p => p.id !== participantId);
    
    // 번호 재정렬
    const reorderedParticipants = updatedParticipants.map((p, index) => ({
      ...p,
      number: index + 1,
      isHost: index === 0, // 첫 번째 참가자가 호스트
    }));
    
    // 현재 사용자의 새로운 정보 계산
    const newCurrentUser = reorderedParticipants.find(p => p.id === currentUser?.id);
    const newParticipantNumber = newCurrentUser ? newCurrentUser.number : participantNumber;
    const newIsHost = newCurrentUser ? newCurrentUser.isHost : isHost;
    
    set({
      participants: reorderedParticipants,
      isHost: newIsHost,
      participantNumber: newParticipantNumber
    });
  },
  
  // 참가자 목록 설정 (서버에서 받은 데이터로 동기화)
  setParticipants: (participants) => {
    const { participantNumber, isHost } = get();
    
    // 현재 사용자 정보 찾기
    const currentParticipant = participants.find(p => p.number === participantNumber);
    
    // 현재 사용자가 목록에 없으면 상태 초기화
    if (!currentParticipant && participants.length > 0) {
      console.log('현재 사용자가 참가자 목록에서 제거됨');
      return;
    }
    
    set({
      participants,
      isHost: currentParticipant?.isHost || isHost,
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