import type { Card, PlayerState } from "./types.js";

function faceUpCoversSlot(player: PlayerState, slot: number): boolean {
  return player.faceUp.some((c) => c.slot === slot);
}

/** Face-down cards with no face-up card in the same table slot. */
export function uncoveredFaceDownCards(player: PlayerState): Card[] {
  return player.faceDown.filter((fd) => {
    if (fd.slot == null) {
      const legacyUncovered = Math.max(
        0,
        player.faceDown.length - player.faceUp.length,
      );
      const coveredStart = player.faceDown.length - legacyUncovered;
      const idx = player.faceDown.findIndex((c) => c.id === fd.id);
      return idx >= coveredStart;
    }
    return !faceUpCoversSlot(player, fd.slot);
  });
}

export function isFaceDownUncovered(player: PlayerState, faceDownId: string): boolean {
  return uncoveredFaceDownCards(player).some((c) => c.id === faceDownId);
}

export function uncoveredFaceDownCount(player: PlayerState): number {
  return uncoveredFaceDownCards(player).length;
}

export function totalHeld(player: PlayerState): number {
  return player.hand.length + player.faceUp.length + player.faceDown.length;
}

export function isOut(player: PlayerState): boolean {
  return totalHeld(player) === 0;
}

export function activePlayers(players: PlayerState[]): PlayerState[] {
  return players.filter((p) => !isOut(p));
}

export function findCard(player: PlayerState, id: string): Card | undefined {
  return (
    player.hand.find((c) => c.id === id) ??
    player.faceUp.find((c) => c.id === id) ??
    player.faceDown.find((c) => c.id === id)
  );
}

export function removeCards(player: PlayerState, ids: string[]): Card[] {
  const idSet = new Set(ids);
  const removed: Card[] = [];
  const pull = (zone: Card[]) => {
    const keep: Card[] = [];
    for (const c of zone) {
      if (idSet.has(c.id)) {
        removed.push(c);
        idSet.delete(c.id);
      } else keep.push(c);
    }
    return keep;
  };
  player.hand = pull(player.hand);
  player.faceUp = pull(player.faceUp);
  player.faceDown = pull(player.faceDown);
  return removed;
}

export function pointsHeld(player: PlayerState, rules: { clearPoints: number; skipPoints: number }): number {
  const all = [...player.hand, ...player.faceUp, ...player.faceDown];
  return all.reduce((sum, c) => {
    if (c.kind === "play") return sum + (c.value ?? 0);
    if (c.kind === "clear") return sum + rules.clearPoints;
    return sum + rules.skipPoints;
  }, 0);
}