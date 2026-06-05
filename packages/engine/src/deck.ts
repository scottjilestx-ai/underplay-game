import { DEFAULT_RULES, NUMBER_RANKS } from "./config.js";
import type { Card, RulesSnapshot } from "./types.js";

export function buildDeck(rules: RulesSnapshot = DEFAULT_RULES): Card[] {
  const deck: Card[] = [];
  let seq = 0;
  for (const value of NUMBER_RANKS) {
    for (let c = 0; c < rules.copiesPerRank; c++) {
      deck.push({ id: `n-${value}-${seq++}`, kind: "play", value });
    }
  }
  for (let c = 0; c < rules.clearCount; c++) {
    deck.push({ id: `clear-${seq++}`, kind: "clear" });
  }
  for (let c = 0; c < rules.skipCount; c++) {
    deck.push({ id: `skip-${seq++}`, kind: "skip" });
  }
  return deck;
}

export function cardPoints(card: Card, rules: RulesSnapshot = DEFAULT_RULES): number {
  if (card.kind === "play") return card.value ?? 0;
  if (card.kind === "clear") return rules.clearPoints;
  return rules.skipPoints;
}

export function topValue(stack: Card[]): number | null {
  if (stack.length === 0) return null;
  const top = stack[stack.length - 1];
  return top.kind === "play" ? (top.value ?? null) : null;
}

export function topRunLength(stack: Card[]): number {
  if (stack.length === 0) return 0;
  const top = stack[stack.length - 1];
  if (top.kind !== "play") return 0;
  const v = top.value!;
  let run = 0;
  for (let i = stack.length - 1; i >= 0; i--) {
    const c = stack[i];
    if (c.kind !== "play" || c.value !== v) break;
    run++;
  }
  return run;
}