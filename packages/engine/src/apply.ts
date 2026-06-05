import { topRunLength, topValue } from "./deck.js";
import { isOut, removeCards } from "./player.js";
import { finalizeRound, resolveStalemate } from "./scoring.js";
import { advanceTurn, defaultSkipTarget } from "./turn.js";
import { validate } from "./validate.js";
import type { GameState, Move } from "./types.js";

function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

export function applyMove(state: GameState, move: Move): GameState {
  const v = validate(state, state.currentSeat, move);
  if (!v.ok) throw new Error(v.error ?? "invalid move");
  const s = cloneState(state);
  const seat = s.currentSeat;
  const player = s.players[seat];
  const played = removeCards(player, move.cardIds);
  let keepsTurn = false;

  if (played[0].kind === "clear") {
    s.deadPile.push(...s.stack, ...played);
    s.stack = [];
    keepsTurn = true;
  } else if (played[0].kind === "skip") {
    s.deadPile.push(...played);
    let target = move.targetSeat ?? defaultSkipTarget(s, seat);
    const p = s.players[target];
    if (!p || isOut(p) || p.pendingSkip) {
      target = defaultSkipTarget(s, seat);
    }
    s.players[target].pendingSkip = true;
    keepsTurn = true;
  } else {
    const V = played[0].value!;
    const T = topValue(s.stack);
    s.stack.push(...played);
    const run = topRunLength(s.stack);
    if (run >= s.rules.tapOutCount) {
      s.deadPile.push(...s.stack);
      s.stack = [];
      keepsTurn = true;
    } else if (T !== null && V > T) {
      const below = s.stack.slice(0, s.stack.length - played.length);
      player.hand.push(...below);
      s.stack = [...played];
      keepsTurn = true;
    }
  }

  s.version++;
  s.turnCount++;

  if (isOut(player)) {
    finalizeRound(s, seat);
    return s;
  }

  if (s.turnCount >= s.rules.stalemateTurnCap) {
    resolveStalemate(s);
    return s;
  }

  if (keepsTurn) {
    // same seat
  } else {
    advanceTurn(s);
  }
  return s;
}