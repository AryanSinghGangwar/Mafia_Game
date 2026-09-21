export type Role = 'mafia' | 'villager' | 'doctor' | 'sheriff';
export type Phase = 'lobby' | 'role-reveal' | 'night' | 'day-announcement' | 'day-discussion' | 'day-voting' | 'elimination-result' | 'game-over';
export type Alignment = 'mafia' | 'town';

export interface Player {
  id: string;
  name: string;
  color: string;
  role: Role | null;
  isAlive: boolean;
  isHost: boolean;
  isConnected: boolean;
  hasVoted: boolean;
  hasActed: boolean;
  actionTarget?: string | null;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  message: string;
  timestamp: number;
}

export interface NightResults {
  killed: { id: string; name: string; role: Role } | null;
  saved: boolean;
  savedPlayer?: string;
  investigated?: {
    playerId: string;
    playerName: string;
    isMafia: boolean;
  };
}

export interface EliminationResult {
  eliminated: { id: string; name: string; role: Role } | null;
  voteCounts: Record<string, number>;
  skipCount: number;
}

export interface GameState {
  code: string;
  phase: Phase;
  round: number;
  players: Player[];
  chat: ChatMessage[];
  phaseEndTime: number | null;
  nightResults?: NightResults;
  eliminationResult?: EliminationResult;
  winner?: 'town' | 'mafia' | null;
}
