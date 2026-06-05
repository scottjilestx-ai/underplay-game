import type { Card, PlayerState } from "./types.js";

export function uncoveredFaceDownCount(player: PlayerState): number {
  return Math.max(0, player.faceDown.length - player.faceUp.length);
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