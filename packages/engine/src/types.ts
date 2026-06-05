export type CardKind = "play" | "clear" | "skip";

export interface Card {
  id: string;
  kind: CardKind;
  value?: number;
  /** Table pile index (0..faceDownPerPlayer-1); set on dealt face-down / face-up cards. */
  slot?: number;
}

export type CpuDifficulty = "easy" | "medium" | "hard";

export interface PlayerState {
  seat: number;
  name: string;
  isCpu: boolean;
  difficulty?: CpuDifficulty;
  hand: Card[];
  faceUp: Card[];
  faceDown: Card[];
  pendingSkip: boolean;
}

export type GamePhase = "playing" | "roundOver" | "matchOver";

export interface RulesSnapshot {
  playersMin: number;
  playersMax: number;
  copiesPerRank: number;
  clearCount: number;
  skipCount: number;
  faceDownPerPlayer: number;
  faceUpPerPlayer: number;
  handSize: number;
  tapOutCount: number;
  clearPoints: number;
  skipPoints: number;
  endingScore: number;
  endOnFirstOut: boolean;
  stalemateTurnCap: number;
}

/** After a higher play (V > T) or safe face-down flip: add same-rank from hand/face-up, then confirm. */
export interface PendingHigherConfirm {
  rank: number;
}

export interface GameState {
  players: PlayerState[];
  stack: Card[];
  deadPile: Card[];
  leftover: Card[];
  currentSeat: number;
  pendingHigherConfirm: PendingHigherConfirm | null;
  phase: GamePhase;
  scores: number[];
  roundScores: number[] | null;
  roundNumber: number;
  roundWinner: number | null;
  matchWinner: number | null;
  matchTiedWinners: number[];
  startingSeat: number;
  rules: RulesSnapshot;
  version: number;
  turnCount: number;
  seed: number;
}

export interface Move {
  cardIds: string[];
  targetSeat?: number;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export interface PlayerSetup {
  name: string;
  isCpu: boolean;
  difficulty?: CpuDifficulty;
}