import type { Card, CpuDifficulty, FirstPlayerChoice } from "@underplay/engine";

export type { FirstPlayerChoice };

export type GameMode = "cpu" | "hotseat";
export type StackDisplayMode = "full" | "lastPlay" | "none";

export const PLAY_TO_SCORE_OPTIONS = [100, 150, 200, 250, 300, 500] as const;
export type PlayToScore = (typeof PLAY_TO_SCORE_OPTIONS)[number];

export const STACK_DISPLAY_OPTIONS: {
  id: StackDisplayMode;
  label: string;
  shortLabel: string;
  hint: string;
}[] = [
  {
    id: "full",
    label: "Full stack",
    shortLabel: "Full",
    hint: "Fan of recent cards — older plays stay visible underneath.",
  },
  {
    id: "lastPlay",
    label: "Last play only",
    shortLabel: "Last play",
    hint: "Only the cards from the most recent play (e.g. three queens).",
  },
  {
    id: "none",
    label: "Top card only",
    shortLabel: "Top only",
    hint: "Only the top card of the stack — always shown face-up.",
  },
];

export const DEFAULT_OPPONENT_NAMES = ["Botley", "Chip", "Ada"] as const;

export interface OpponentSetup {
  name: string;
  difficulty: CpuDifficulty;
}

export interface GameSetupConfig {
  mode: GameMode;
  playerName: string;
  opponentCount: number;
  opponents: OpponentSetup[];
  playToScore: PlayToScore;
  stackDisplay: StackDisplayMode;
  /** Who opens the first round — seat 0 is the human setup player. */
  firstPlayer: FirstPlayerChoice;
}

export function defaultOpponents(count: number): OpponentSetup[] {
  return Array.from({ length: count }, (_, i) => ({
    name: DEFAULT_OPPONENT_NAMES[i] ?? `Player ${i + 2}`,
    difficulty: "medium" as CpuDifficulty,
  }));
}

export const DISPLAY_NAME_STORAGE_KEY = "underplay-display-name";

export function loadStoredDisplayName(): string {
  if (typeof window === "undefined") return "You";
  return window.localStorage.getItem(DISPLAY_NAME_STORAGE_KEY)?.trim() || "You";
}

export function storeDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (trimmed) window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, trimmed);
}

/** Cards to render in the stack pile for the chosen display mode. */
export function stackCardsForDisplay(
  stack: Card[],
  mode: StackDisplayMode,
  lastPlayCount: number,
  maxVisible = 6,
): { card: Card; faceDown: boolean }[] {
  if (stack.length === 0) return [];

  if (mode === "lastPlay") {
    const n = Math.max(1, Math.min(lastPlayCount || 1, stack.length));
    return stack.slice(-n).map((card) => ({ card, faceDown: false }));
  }

  if (mode === "none") {
    const top = stack[stack.length - 1];
    return top ? [{ card: top, faceDown: false }] : [];
  }

  const visible = stack.slice(-maxVisible);
  return visible.map((card) => ({ card, faceDown: false }));
}

/** Update how many stack cards to show in "last play" mode after a transition. */
export function nextLastPlayStackCount(
  prev: { stack: { length: number }; currentSeat: number },
  next: { stack: { length: number }; currentSeat: number },
  prevCount: number,
): number {
  const prevLen = prev.stack.length;
  const nextLen = next.stack.length;
  if (nextLen === 0) return 0;
  if (nextLen > prevLen) {
    const added = nextLen - prevLen;
    return next.currentSeat === prev.currentSeat ? prevCount + added : added;
  }
  if (nextLen < prevLen) return nextLen;
  return prevCount;
}