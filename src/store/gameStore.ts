// src/store/gameStore.ts 수정 (참가자 목록 문제 해결)
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
  myParticipantId: string; // 추가: 내 참가자 ID 추적
  
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
  myParticipantId: '', // 추가
  
  // 게임 초기 상태
  gameState: initialGameState,
  
  // 액션
  createRoom: () => {
    // roomId 생성
    const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 호스트 참가자 생성 - 임시 ID 사용
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
      myParticipantId: hostId, // 내 ID 저장
    });
    
    return generatedRoomId;
  },
  
  joinRoom: (roomId: string, nickname: string) => {
    const currentParticipants = get().participants;
    const nextNumber = currentParticipants.length + 1;
    
    // 새 참가자 생성 - 임시 ID 사용
    const participantId = `participant_${Date.now()}`;
    const newParticipant: Participant = {
      id: participantId,
      nickname,
      number: nextNumber,
      isHost: false,
    };
    
    set({
      roomId,
      isHost: false,
      participantNumber: nextNumber,
      participants: [...currentParticipants, newParticipant],
      myParticipantId: participantId, // 내 ID 저장
    });
  },
  
  leaveRoom: () => {
    set({
      roomId: '',
      isHost: false,
      participantNumber: 0,
      participants: [],
      myParticipantId: '', // 초기화
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
    const { participants, myParticipantId } = get();
    
    // 현재 사용자가 삭제되는 경우 방을 나가기
    if (myParticipantId === participantId) {
      console.log('현재 사용자가 방에서 제거됨 - 방 나가기');
      set({
        roomId: '',
        isHost: false,
        participantNumber: 0,
        participants: [],
        myParticipantId: '',
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
    const myParticipant = reorderedParticipants.find(p => p.id === myParticipantId);
    if (myParticipant) {
      set({
        participants: reorderedParticipants,
        isHost: myParticipant.isHost,
        participantNumber: myParticipant.number
      });
    }
  },
  
  // 참가자 목록 설정 (서버에서 받은 데이터로 동기화) - 수정된 버전
  setParticipants: (participants) => {
    console.log('setParticipants 호출:', participants);
    console.log('현재 myParticipantId:', get().myParticipantId);
    
    const { myParticipantId, isHost: currentIsHost } = get();
    
    // 서버에서 받은 참가자 목록에 number 속성 추가 (없는 경우)
    const participantsWithNumbers = participants.map((p, index) => ({
      ...p,
      number: p.number || index + 1, // number가 없으면 인덱스 기반으로 생성
    }));
    
    // 호스트인 경우 - 항상 목록 업데이트
    if (currentIsHost) {
      console.log('호스트이므로 참가자 목록 업데이트');
      
      // 내 정보를 서버 데이터로 업데이트 (소켓 ID 기반으로 찾기)
      const myUpdatedInfo = participantsWithNumbers.find(p => p.isHost);
      if (myUpdatedInfo && !myParticipantId) {
        // 처음 방을 만든 경우 내 ID 업데이트
        set({
          participants: participantsWithNumbers,
          myParticipantId: myUpdatedInfo.id,
          participantNumber: myUpdatedInfo.number,
          isHost: true,
        });
      } else {
        set({
          participants: participantsWithNumbers,
        });
      }
      return;
    }
    
    // 참가자인 경우 - 내가 목록에 있는지 확인
    if (myParticipantId) {
      const myParticipant = participantsWithNumbers.find(p => p.id === myParticipantId);
      
      if (myParticipant) {
        // 내가 목록에 있으면 정보 업데이트
        console.log('내 정보 발견, 참가자 목록 업데이트');
        set({
          participants: participantsWithNumbers,
          isHost: myParticipant.isHost,
          participantNumber: myParticipant.number,
        });
      } else {
        // 내가 목록에 없으면 닉네임으로 찾기 시도
        const { participants: currentParticipants } = get();
        const myCurrentInfo = currentParticipants.find(p => p.id === myParticipantId);
        
        if (myCurrentInfo) {
          const myParticipantByNickname = participantsWithNumbers.find(p => 
            p.nickname === myCurrentInfo.nickname
          );
          
          if (myParticipantByNickname) {
            console.log('닉네임으로 내 정보 발견, ID 업데이트');
            set({
              participants: participantsWithNumbers,
              myParticipantId: myParticipantByNickname.id,
              isHost: myParticipantByNickname.isHost,
              participantNumber: myParticipantByNickname.number,
            });
          } else {
            console.log('참가자 목록에서 내 정보를 찾을 수 없음');
            // 목록 업데이트는 하되, 내 정보는 유지
            set({
              participants: participantsWithNumbers,
            });
          }
        }
      }
    } else {
      // myParticipantId가 없는 경우 (초기 상태) - 목록만 업데이트
      console.log('myParticipantId가 없음, 목록만 업데이트');
      set({
        participants: participantsWithNumbers,
      });
    }
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