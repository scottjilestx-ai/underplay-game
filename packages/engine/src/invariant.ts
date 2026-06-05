import { buildDeck } from "./deck.js";
import type { GameState } from "./types.js";

export function allCardIds(state: GameState): string[] {
  const ids: string[] = [];
  for (const p of state.players) {
    ids.push(...p.hand.map((c) => c.id), ...p.faceUp.map((c) => c.id), ...p.faceDown.map((c) => c.id));
  }
  ids.push(...state.stack.map((c) => c.id));
  ids.push(...state.deadPile.map((c) => c.id));
  ids.push(...state.leftover.map((c) => c.id));
  return ids;
}

export function checkConservation(state: GameState): boolean {
  const expected = new Set(buildDeck(state.rules).map((c) => c.id));
  const seen = allCardIds(state);
  if (seen.length !== expected.size) return false;
  const counts = new Map<string, number>();
  for (const id of seen) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
    if (!expected.has(id)) return false;
  }
  for (const id of expected) {
    if ((counts.get(id) ?? 0) !== 1) return false;
  }
  return true;
}