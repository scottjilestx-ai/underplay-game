import { topRunLength, topValue } from "./deck.js";
import { isOut, removeCards } from "./player.js";
import { finalizeRound, resolveStalemate } from "./scoring.js";
import { advanceTurn } from "./turn.js";
import { isAwaitingHigherConfirm } from "./confirm.js";
import { validate } from "./validate.js";
import type { GameState, Move } from "./types.js";

function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

export function applyMove(state: GameState, move: Move): GameState {
  if (isAwaitingHigherConfirm(state)) {
    throw new Error("confirm higher play before playing again");
  }
  const v = validate(state, state.currentSeat, move);
  if (!v.ok) throw new Error(v.error ?? "invalid move");
  const s = cloneState(state);
  const seat = s.currentSeat;
  const player = s.players[seat];
  const isFaceDownFlip = move.cardIds.some((id) =>
    player.faceDown.some((c) => c.id === id),
  );
  const played = removeCards(player, move.cardIds);
  let keepsTurn = false;

  if (played[0].kind === "clear") {
    if (isFaceDownFlip && move.targetSeat != null) {
      const target = move.targetSeat;
      const tp = s.players[target];
      if (tp && !isOut(tp)) {
        tp.hand.push(...s.stack, ...played);
      } else {
        s.deadPile.push(...s.stack, ...played);
      }
    } else {
      s.deadPile.push(...s.stack, ...played);
    }
    s.stack = [];
    keepsTurn = true;
  } else if (played[0].kind === "skip") {
    s.deadPile.push(...played);
    const target = move.targetSeat!;
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
      s.pendingHigherConfirm = { rank: V };
      keepsTurn = true;
    } else if (isFaceDownFlip) {
      // Safe number flip: pause so same-rank hand/face-up cards can be added, then Confirm.
      s.pendingHigherConfirm = { rank: V };
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