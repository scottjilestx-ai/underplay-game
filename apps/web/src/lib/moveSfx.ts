import type { Card, GameState, Move } from "@underplay/engine";
import { isAwaitingHigherConfirm } from "@underplay/engine";
import type { Sfx } from "@/lib/audio";

function findInZones(
  player: GameState["players"][0],
  id: string,
): Card | undefined {
  return (
    player.hand.find((c) => c.id === id) ??
    player.faceUp.find((c) => c.id === id) ??
    player.faceDown.find((c) => c.id === id)
  );
}

/** Which move SFX matches this transition (excludes round/match win). */
export function resolveMoveSfx(
  prev: GameState,
  next: GameState,
  move: Move,
): Sfx | null {
  const seat = prev.currentSeat;
  const played = move.cardIds
    .map((id) => findInZones(prev.players[seat], id))
    .filter(Boolean);
  if (
    played.some((c) => c?.kind === "clear") ||
    (next.stack.length === 0 && prev.stack.length > 0 && played[0]?.kind !== "skip")
  ) {
    return "clear";
  }
  if (played.some((c) => c?.kind === "skip")) return "skip";
  if (move.cardIds.some((id) => prev.players[seat].faceDown.some((c) => c.id === id))) {
    return "flip";
  }
  if (next.pendingHigherConfirm) return "pickup";
  return "play";
}

export function resolveHigherConfirmSfx(prev: GameState, next: GameState): Sfx {
  if (
    next.stack.length === 0 &&
    prev.stack.length > 0 &&
    !isAwaitingHigherConfirm(next) &&
    next.currentSeat === prev.currentSeat
  ) {
    return "tap";
  }
  if (next.stack.length > prev.stack.length) return "play";
  return "play";
}

export function isRoundOrMatchWin(next: GameState): boolean {
  return next.phase === "roundOver" || next.phase === "matchOver";
}