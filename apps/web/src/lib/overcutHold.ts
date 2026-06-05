import type { Card, GameState, Move } from "@underplay/engine";

export interface OvercutHold {
  cardId: string;
  card: Card;
  /** Seat that played the overcut. */
  playerSeat: number;
  /** Seat marked with pendingSkip. */
  targetSeat: number;
}

export function isOvercutPlay(cards: Card[]): boolean {
  return cards.length === 1 && cards[0].kind === "skip";
}

/** Who received the skip after this move (handles retargeting in engine). */
export function findSkipTarget(
  prev: GameState,
  next: GameState,
  move: Move,
): number {
  if (
    move.targetSeat != null &&
    next.players[move.targetSeat]?.pendingSkip &&
    !prev.players[move.targetSeat]?.pendingSkip
  ) {
    return move.targetSeat;
  }
  for (let i = 0; i < next.players.length; i++) {
    if (next.players[i].pendingSkip && !prev.players[i].pendingSkip) {
      return i;
    }
  }
  return next.players.findIndex((p) => p.pendingSkip);
}

export function overcutHeldForSeat(
  holds: OvercutHold[],
  seat: number,
): OvercutHold | undefined {
  return holds.find((h) => h.playerSeat === seat);
}