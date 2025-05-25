// src/store/gameStore.ts (참가자 연결 문제 해결)
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
  myParticipantId: string;
  myNickname: string; // 추가: 닉네임 추적
  
  // 게임 관련 상태
  gameState: GameState;
  
  // 액션
  createRoom: () => string;
  joinRoom: (roomId: string, nickname: string) => void;
  leaveRoom: () => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  setParticipants: (participants: Participant[]) => void;
  updateMyParticipantId: (newId: string) => void; // 추가
  
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
  myParticipantId: '',
  myNickname: '',
  
  // 게임 초기 상태
  gameState: initialGameState,
  
  // 액션
  createRoom: () => {
    const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hostId = `host_${Date.now()}`;
    const hostParticipant: Participant = {
      id: hostId,
      nickname: '호스트',
      number: 1,
      isHost: true,
    };
    
    set({
      roomId: generatedRoomId,
      isHost: true,
      participantNumber: 1,
      participants: [hostParticipant],
      myParticipantId: hostId,
      myNickname: '호스트',
    });
    
    return generatedRoomId;
  },
  
  joinRoom: (roomId: string, nickname: string) => {
    // 참가자는 임시 ID만 생성하고, 서버 응답을 기다림
    const tempId = `temp_participant_${Date.now()}`;
    
    set({
      roomId,
      isHost: false,
      participantNumber: 0, // 서버에서 결정됨
      participants: [], // 서버에서 받을 예정
      myParticipantId: tempId,
      myNickname: nickname,
    });
  },
  
  leaveRoom: () => {
    set({
      roomId: '',
      isHost: false,
      participantNumber: 0,
      participants: [],
      myParticipantId: '',
      myNickname: '',
      gameState: initialGameState,
    });
  },
  
  addParticipant: (participant) => {
    if (get().participants.some(p => p.id === participant.id)) {
      return;
    }
    
    set({
      participants: [...get().participants, participant],
    });
  },
  
  removeParticipant: (participantId) => {
    const { participants, myParticipantId } = get();
    
    if (myParticipantId === participantId) {
      console.log('현재 사용자가 방에서 제거됨 - 방 나가기');
      get().leaveRoom();
      return;
    }
    
    const updatedParticipants = participants.filter(p => p.id !== participantId);
    set({ participants: updatedParticipants });
  },
  
  // 서버에서 받은 참가자 목록으로 동기화 (완전히 수정)
  setParticipants: (serverParticipants) => {
    console.log('setParticipants 호출:', serverParticipants);
    const { myNickname, isHost: currentIsHost } = get();
    
    // 번호가 없는 참가자에게 번호 부여
    const participantsWithNumbers = serverParticipants.map((p, index) => ({
      ...p,
      number: p.number || index + 1,
    }));
    
    if (currentIsHost) {
      // 호스트인 경우: 서버에서 받은 호스트 정보로 내 ID 업데이트
      const serverHost = participantsWithNumbers.find(p => p.isHost);
      if (serverHost) {
        set({
          participants: participantsWithNumbers,
          myParticipantId: serverHost.id,
          participantNumber: serverHost.number,
        });
      } else {
        set({ participants: participantsWithNumbers });
      }
    } else {
      // 참가자인 경우: 닉네임으로 내 정보 찾기
      const myParticipant = participantsWithNumbers.find(p => 
        p.nickname === myNickname && !p.isHost
      );
      
      if (myParticipant) {
        console.log('내 참가자 정보 발견:', myParticipant);
        set({
          participants: participantsWithNumbers,
          myParticipantId: myParticipant.id,
          participantNumber: myParticipant.number,
          isHost: myParticipant.isHost,
        });
      } else {
        console.log('내 참가자 정보를 찾을 수 없음. 닉네임:', myNickname);
        // 목록은 업데이트하되, 내 정보는 유지
        set({ participants: participantsWithNumbers });
      }
    }
  },
  
  // 서버에서 받은 새로운 ID로 업데이트
  updateMyParticipantId: (newId: string) => {
    console.log('참가자 ID 업데이트:', newId);
    set({ myParticipantId: newId });
  },
  
  startGame: (gameType) => {
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