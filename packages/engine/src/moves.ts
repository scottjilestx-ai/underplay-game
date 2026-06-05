import { isAwaitingHigherConfirm } from "./confirm.js";
import { isOut, uncoveredFaceDownCards } from "./player.js";
import { validate } from "./validate.js";
import type { Card, GameState, Move } from "./types.js";

function combinations(cards: Card[], max: number): Card[][] {
  const results: Card[][] = [];
  const n = cards.length;
  for (let size = 1; size <= Math.min(max, n); size++) {
    const combo: Card[] = [];
    const walk = (start: number, left: number) => {
      if (left === 0) {
        results.push([...combo]);
        return;
      }
      for (let i = start; i <= n - left; i++) {
        combo.push(cards[i]);
        walk(i + 1, left - 1);
        combo.pop();
      }
    };
    walk(0, size);
  }
  return results;
}

export function legalMoves(state: GameState, seat: number): Move[] {
  if (state.phase !== "playing" || seat !== state.currentSeat) return [];
  if (isAwaitingHigherConfirm(state)) return [];
  const player = state.players[seat];
  const moves: Move[] = [];
  const seen = new Set<string>();

  const add = (m: Move) => {
    const key = `${m.cardIds.join(",")}|${m.targetSeat ?? ""}`;
    if (seen.has(key)) return;
    if (validate(state, seat, m).ok) {
      seen.add(key);
      moves.push(m);
    }
  };

  for (const fd of uncoveredFaceDownCards(player)) {
    if (fd.kind === "clear" || fd.kind === "skip") {
      for (let t = 0; t < state.players.length; t++) {
        if (t === seat) continue;
        const target = state.players[t];
        if (!target || isOut(target)) continue;
        if (fd.kind === "skip" && target.pendingSkip) continue;
        add({ cardIds: [fd.id], targetSeat: t });
      }
    } else {
      add({ cardIds: [fd.id] });
    }
  }

  for (const c of player.hand) {
    if (c.kind === "clear" || c.kind === "skip") add({ cardIds: [c.id] });
  }
  for (const c of player.faceUp) {
    if (c.kind === "clear" || c.kind === "skip") add({ cardIds: [c.id] });
  }

  const pool = [...player.hand, ...player.faceUp].filter((c) => c.kind === "play");
  const byValue = new Map<number, Card[]>();
  for (const c of pool) {
    const v = c.value!;
    if (!byValue.has(v)) byValue.set(v, []);
    byValue.get(v)!.push(c);
  }
  for (const group of byValue.values()) {
    for (const combo of combinations(group, group.length)) {
      add({ cardIds: combo.map((c) => c.id) });
    }
  }

  const skipMoves = moves.filter((m) => {
    const c = [...player.hand, ...player.faceUp, ...player.faceDown].find(
      (x) => x.id === m.cardIds[0],
    );
    return c?.kind === "skip";
  });
  if (skipMoves.length) {
    const extra: Move[] = [];
    for (const m of skipMoves) {
      for (let t = 0; t < state.players.length; t++) {
        if (t === seat) continue;
        const target = state.players[t];
        if (target.pendingSkip) continue;
        extra.push({ ...m, targetSeat: t });
      }
    }
    for (const m of extra) add(m);
  }

  return moves;
}