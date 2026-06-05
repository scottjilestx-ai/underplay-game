import { topRunLength } from "./deck.js";
import { removeCards } from "./player.js";
import { advanceTurn } from "./turn.js";
import type { Card, GameState } from "./types.js";

function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

export function isAwaitingHigherConfirm(state: GameState): boolean {
  const pending = state.pendingHigherConfirm;
  return (
    state.phase === "playing" &&
    pending != null &&
    typeof pending.rank === "number"
  );
}

function activeRank(state: GameState): number {
  const rank = state.pendingHigherConfirm?.rank;
  if (rank == null) throw new Error("not awaiting higher confirm");
  return rank;
}

export function legalHigherExtensions(state: GameState, seat: number): string[][] {
  if (!isAwaitingHigherConfirm(state) || seat !== state.currentSeat) return [];
  const rank = activeRank(state);
  const player = state.players[seat];
  const pool = [...player.hand, ...player.faceUp].filter(
    (c) => c.kind === "play" && c.value === rank,
  );
  const results: string[][] = [];
  const n = pool.length;
  for (let size = 1; size <= n; size++) {
    const combo: Card[] = [];
    const walk = (start: number, left: number) => {
      if (left === 0) {
        results.push(combo.map((c) => c.id));
        return;
      }
      for (let i = start; i <= n - left; i++) {
        combo.push(pool[i]);
        walk(i + 1, left - 1);
        combo.pop();
      }
    };
    walk(0, size);
  }
  return results;
}

export function validateHigherExtension(
  state: GameState,
  seat: number,
  cardIds: string[],
): { ok: boolean; error?: string } {
  if (!isAwaitingHigherConfirm(state)) return { ok: false, error: "not awaiting confirm" };
  if (seat !== state.currentSeat) return { ok: false, error: "not your turn" };
  if (!cardIds.length) return { ok: false, error: "no cards" };
  if (new Set(cardIds).size !== cardIds.length) return { ok: false, error: "duplicate ids" };
  const rank = activeRank(state);
  const player = state.players[seat];
  const cards = cardIds.map((id) => {
    const c =
      player.hand.find((x) => x.id === id) ?? player.faceUp.find((x) => x.id === id);
    return c;
  });
  if (cards.some((c) => !c)) return { ok: false, error: "card not in hand or face-up" };
  if (cards.some((c) => c!.kind !== "play" || c!.value !== rank)) {
    return { ok: false, error: "must match higher-play rank" };
  }
  return { ok: true };
}

export function extendHigherPlay(state: GameState, cardIds: string[]): GameState {
  const v = validateHigherExtension(state, state.currentSeat, cardIds);
  if (!v.ok) throw new Error(v.error ?? "invalid extension");
  const s = cloneState(state);
  const seat = s.currentSeat;
  const player = s.players[seat];
  const added = removeCards(player, cardIds);
  s.stack.push(...added);
  const run = topRunLength(s.stack);
  if (run >= s.rules.tapOutCount) {
    s.deadPile.push(...s.stack);
    s.stack = [];
    // Tap-out during higher confirm: same player plays again (§7.2), not pass via Confirm.
    s.pendingHigherConfirm = null;
    s.turnCount++;
  }
  s.version++;
  return s;
}

export function confirmHigherPlay(state: GameState): GameState {
  if (!isAwaitingHigherConfirm(state)) throw new Error("not awaiting confirm");
  const s = cloneState(state);
  s.pendingHigherConfirm = null;
  s.version++;
  s.turnCount++;
  advanceTurn(s);
  return s;
}