import { findCard, isOut, uncoveredFaceDownCount } from "./player.js";
import type { GameState, Move, ValidationResult } from "./types.js";

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
    const uncovered = uncoveredFaceDownCount(player);
    const fdIndex = player.faceDown.findIndex((c) => c.id === faceDownIds[0]);
    const mustBeUncovered = player.faceDown.length - uncovered;
    if (fdIndex < mustBeUncovered) return { ok: false, error: "face-down covered" };
    const companions = ids.filter((id) => id !== faceDownIds[0]);
    const flipped = findCard(player, faceDownIds[0])!;
    if (flipped.kind !== "play") {
      if (companions.length) return { ok: false, error: "special flip alone" };
      return { ok: true };
    }
    for (const id of companions) {
      const c = findCard(player, id)!;
      if (player.faceDown.some((x) => x.id === id)) return { ok: false, error: "extra face-down" };
      if (c.kind !== "play" || c.value !== flipped.value) return { ok: false, error: "mismatch flip combo" };
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