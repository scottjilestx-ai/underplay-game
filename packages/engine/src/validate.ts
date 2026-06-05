import { findCard, isOut, isFaceDownUncovered } from "./player.js";
import type { GameState, Move, ValidationResult } from "./types.js";

function validateTarget(
  state: GameState,
  seat: number,
  targetSeat: number | undefined,
): ValidationResult {
  if (targetSeat == null) return { ok: false, error: "choose target" };
  if (targetSeat === seat) return { ok: false, error: "invalid target" };
  const target = state.players[targetSeat];
  if (!target || isOut(target)) return { ok: false, error: "invalid target" };
  return { ok: true };
}

export function validate(state: GameState, seat: number, move: Move): ValidationResult {
  if (state.phase !== "playing") return { ok: false, error: "not playing" };
  if (seat !== state.currentSeat) return { ok: false, error: "not your turn" };
  const player = state.players[seat];
  if (!player) return { ok: false, error: "invalid seat" };
  if (isOut(player)) return { ok: false, error: "player out" };
  if (!move.cardIds.length) return { ok: false, error: "no cards" };
  const ids = move.cardIds;
  if (new Set(ids).size !== ids.length) return { ok: false, error: "duplicate ids" };

  const cards = ids.map((id) => findCard(player, id));
  if (cards.some((c) => !c)) return { ok: false, error: "card not owned" };

  const faceDownIds = ids.filter((id) => player.faceDown.some((c) => c.id === id));
  if (faceDownIds.length > 1) return { ok: false, error: "multiple face-down" };
  if (faceDownIds.length === 1) {
    if (!isFaceDownUncovered(player, faceDownIds[0])) {
      return { ok: false, error: "face-down covered" };
    }
    const companions = ids.filter((id) => id !== faceDownIds[0]);
    if (companions.length) {
      return { ok: false, error: "flip face-down alone; add matches after confirm" };
    }
    const flipped = cards[0]!;
    if (flipped.kind === "clear" || flipped.kind === "skip") {
      const tv = validateTarget(state, seat, move.targetSeat);
      if (!tv.ok) return tv;
      if (flipped.kind === "skip" && state.players[move.targetSeat!]!.pendingSkip) {
        return { ok: false, error: "already skipped" };
      }
    }
    return { ok: true };
  }

  const played = cards as NonNullable<(typeof cards)[0]>[];
  const hasSpecial = played.some((c) => c.kind !== "play");
  if (hasSpecial) {
    if (played.length !== 1) return { ok: false, error: "special alone" };
    return { ok: true };
  }
  const values = new Set(played.map((c) => c.value));
  if (values.size !== 1) return { ok: false, error: "mixed values" };
  return { ok: true };
}