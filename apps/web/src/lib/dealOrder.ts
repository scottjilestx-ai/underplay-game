import type { Card, GameState } from "@underplay/engine";

export interface DealSequenceItem {
  seat: number;
  card: Card;
  /** Index within this player's 19-card deal pile (0–18). */
  stockIndex: number;
  /** Table slot for face-down / face-up rows. */
  slot: number;
}

/** Round-robin order matching `packages/engine/src/deal.ts`. */
export function cardsInEngineDealOrder(state: GameState): DealSequenceItem[] {
  const items: DealSequenceItem[] = [];
  const n = state.players.length;
  const r = state.rules;
  let stockIndex = 0;

  for (let round = 0; round < r.faceDownPerPlayer; round++) {
    for (let p = 0; p < n; p++) {
      const card = state.players[p].faceDown[round];
      if (card) items.push({ seat: p, card, stockIndex: stockIndex++, slot: round });
    }
  }
  for (let round = 0; round < r.faceUpPerPlayer; round++) {
    for (let p = 0; p < n; p++) {
      const card = state.players[p].faceUp[round];
      if (card) items.push({ seat: p, card, stockIndex: stockIndex++, slot: round });
    }
  }
  for (let round = 0; round < r.handSize; round++) {
    for (let p = 0; p < n; p++) {
      const card = state.players[p].hand[round];
      if (card) items.push({ seat: p, card, stockIndex: stockIndex++, slot: round });
    }
  }
  return items;
}

export function faceDownDealOrder(state: GameState): DealSequenceItem[] {
  return cardsInEngineDealOrder(state).filter((item) =>
    state.players[item.seat].faceDown.some((c) => c.id === item.card.id),
  );
}

export function faceUpDealOrder(state: GameState): DealSequenceItem[] {
  return cardsInEngineDealOrder(state).filter((item) =>
    state.players[item.seat].faceUp.some((c) => c.id === item.card.id),
  );
}

export function handDealOrder(state: GameState, seat: number): Card[] {
  return [...state.players[seat].hand];
}

export function cardsDealtToPlayer(state: GameState): number {
  const r = state.rules;
  return r.faceDownPerPlayer + r.faceUpPerPlayer + r.handSize;
}