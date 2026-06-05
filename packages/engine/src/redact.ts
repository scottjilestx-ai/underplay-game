import type { Card, GameState, PlayerState } from "./types.js";

export interface RedactedPlayer {
  seat: number;
  name: string;
  isCpu: boolean;
  difficulty?: PlayerState["difficulty"];
  hand: Card[] | null;
  handCount: number;
  faceUp: Card[];
  faceDown: Card[] | null;
  faceDownCount: number;
  pendingSkip: boolean;
}

export interface ClientGameState {
  players: RedactedPlayer[];
  stack: Card[];
  deadPileCount: number;
  leftoverCount: number;
  currentSeat: number;
  phase: GameState["phase"];
  scores: number[];
  roundScores: number[] | null;
  roundNumber: number;
  roundWinner: number | null;
  matchWinner: number | null;
  matchTiedWinners: number[];
  startingSeat: number;
  rules: GameState["rules"];
  version: number;
  turnCount: number;
}

export function redactForSeat(state: GameState, viewerSeat: number): ClientGameState {
  return {
    players: state.players.map((p) => ({
      seat: p.seat,
      name: p.name,
      isCpu: p.isCpu,
      difficulty: p.difficulty,
      hand: p.seat === viewerSeat ? [...p.hand] : null,
      handCount: p.hand.length,
      faceUp: [...p.faceUp],
      faceDown: p.seat === viewerSeat ? null : null,
      faceDownCount: p.faceDown.length,
      pendingSkip: p.pendingSkip,
    })),
    stack: [...state.stack],
    deadPileCount: state.deadPile.length,
    leftoverCount: state.leftover.length,
    currentSeat: state.currentSeat,
    phase: state.phase,
    scores: [...state.scores],
    roundScores: state.roundScores ? [...state.roundScores] : null,
    roundNumber: state.roundNumber,
    roundWinner: state.roundWinner,
    matchWinner: state.matchWinner,
    matchTiedWinners: [...state.matchTiedWinners],
    startingSeat: state.startingSeat,
    rules: state.rules,
    version: state.version,
    turnCount: state.turnCount,
  };
}

/** Reveal face-down only at play time for the active human viewer */
export function revealMoveCards(state: GameState, seat: number, move: { cardIds: string[] }): Card[] {
  const p = state.players[seat];
  return move.cardIds
    .map((id) => p.hand.find((c) => c.id === id) ?? p.faceUp.find((c) => c.id === id) ?? p.faceDown.find((c) => c.id === id))
    .filter((c): c is Card => !!c);
}