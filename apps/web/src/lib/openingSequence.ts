import type { GameState } from "@underplay/engine";
import { cardsDealtToPlayer } from "@/lib/dealOrder";

/** Opening deal animation phases (game start only). */
export type DeckPhase =
  | "welcome"
  | "shuffle"
  | "deal-stock"
  | "deal-down"
  | "deal-up"
  | "hand-reveal"
  | "hand-sort"
  | "lets-play"
  | null;

export const OPENING_TIMINGS = {
  welcomeMs: 2000,
  /** Deck shuffle wiggle before stock deal. */
  shuffleMs: 1400,
  letsPlayMs: 3000,
  /** Hand flip + sort beat after reveal. */
  handRevealMs: 900,
  handSortMs: 700,
} as const;

export const OPENING_TIMINGS_REDUCED = {
  welcomeMs: 2000,
  shuffleMs: 0,
  letsPlayMs: 3000,
  handRevealMs: 0,
  handSortMs: 0,
} as const;

export function cardRevealLevel(phase: DeckPhase): 0 | 1 | 2 | 3 {
  if (phase === null || phase === "lets-play") return 3;
  if (phase === "hand-reveal" || phase === "hand-sort") return 3;
  if (phase === "deal-up") return 2;
  if (phase === "deal-down") return 1;
  return 0;
}

export function showOpponentZone(phase: DeckPhase): boolean {
  return phase !== "welcome";
}

/** Player row visible for stock deal and table placement. */
export function showPlayerZone(phase: DeckPhase, opening = false): boolean {
  if (!opening) return phase !== "welcome";
  return (
    phase === "deal-stock" ||
    phase === "deal-down" ||
    phase === "deal-up" ||
    phase === "hand-reveal" ||
    phase === "hand-sort" ||
    phase === "lets-play" ||
    phase === null
  );
}

/** Hand row shows only after table deal; faces flip on hand-reveal. */
export function showHandRow(phase: DeckPhase, opening = false): boolean {
  if (!opening) return true;
  return (
    phase === "hand-reveal" ||
    phase === "hand-sort" ||
    phase === "lets-play" ||
    phase === null
  );
}

/** Stack is hidden during opening deal flights so face-up cards do not read as stack plays. */
export function showStackZone(phase: DeckPhase, opening = false): boolean {
  if (phase === "welcome") return false;
  if (opening) {
    return (
      phase === "hand-reveal" ||
      phase === "hand-sort" ||
      phase === "lets-play"
    );
  }
  return true;
}

export function playfieldBlank(phase: DeckPhase): boolean {
  return phase === "welcome";
}

export function openingStatusText(
  phase: DeckPhase,
  state: GameState | null,
): string {
  if (!state) return "\u00a0";
  const n = cardsDealtToPlayer(state);
  switch (phase) {
    case "shuffle":
      return "Shuffling…";
    case "deal-stock":
      return `Dealing ${n} cards face down…`;
    case "deal-down":
      return "Placing face-down cards…";
    case "deal-up":
      return "Placing face-up cards…";
    case "hand-reveal":
      return "Revealing your hand…";
    case "hand-sort":
      return "Sorting your hand…";
    default:
      return "\u00a0";
  }
}

export function deckAnimPhase(
  phase: DeckPhase,
): "shuffle" | "deal" | null {
  if (phase === "shuffle") return "shuffle";
  if (
    phase === "deal-stock" ||
    phase === "deal-down" ||
    phase === "deal-up"
  ) {
    return "deal";
  }
  return null;
}