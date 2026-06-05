import type { Card, GameState, Move } from "@underplay/engine";

/** Overcut (skip) card shown on the target's panel until their skip is consumed. */
export interface OvercutHold {
  cardId: string;
  card: Card;
  playedBySeat: number;
  targetSeat: number;
}

export function isOvercutPlay(cards: Card[]): boolean {
  return cards.length === 1 && cards[0].kind === "skip";
}

/** Seat that gained pendingSkip from this move. */
export function resolveSkipTarget(
  prev: GameState,
  next: GameState,
  move: Move,
): number {
  if (move.targetSeat != null) {
    const t = move.targetSeat;
    if (
      next.players[t]?.pendingSkip &&
      !prev.players[t]?.pendingSkip
    ) {
      return t;
    }
  }
  for (let i = 0; i < next.players.length; i++) {
    if (next.players[i].pendingSkip && !prev.players[i].pendingSkip) {
      return i;
    }
  }
  return -1;
}

export function createOvercutHold(
  prev: GameState,
  next: GameState,
  move: Move,
  cards: Card[],
): OvercutHold | null {
  if (!isOvercutPlay(cards)) return null;

  let targetSeat = -1;
  if (move.targetSeat != null) {
    const t = move.targetSeat;
    if (
      next.players[t]?.pendingSkip &&
      !prev.players[t]?.pendingSkip
    ) {
      targetSeat = t;
    }
  }
  if (targetSeat < 0) {
    targetSeat = resolveSkipTarget(prev, next, move);
  }
  if (targetSeat < 0) return null;

  return {
    cardId: cards[0].id,
    card: cards[0],
    playedBySeat: prev.currentSeat,
    targetSeat,
  };
}

/** Overcut aimed at this seat (including when you played it on an opponent). */
export function overcutHeldOnTarget(
  holds: OvercutHold[],
  seat: number,
): OvercutHold | undefined {
  return holds.find((h) => h.targetSeat === seat);
}

/** Overcut an opponent played on you — not one you just played on someone else. */
export function overcutHeldIncoming(
  holds: OvercutHold[],
  seat: number,
): OvercutHold | undefined {
  return holds.find(
    (h) => h.targetSeat === seat && h.playedBySeat !== seat,
  );
}

/** @deprecated use resolveSkipTarget */
export const findSkipTarget = resolveSkipTarget;

/** @deprecated use overcutHeldOnTarget */
export const overcutHeldForSeat = overcutHeldOnTarget;