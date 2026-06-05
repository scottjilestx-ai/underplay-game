import type { Card } from "@underplay/engine";

export function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const rank = (c: Card) => {
      if (c.kind === "play") return c.value ?? 0;
      if (c.kind === "clear") return 100;
      return 101;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.id.localeCompare(b.id);
  });
}