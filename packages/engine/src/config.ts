import type { RulesSnapshot } from "./types.js";

export const DEFAULT_RULES: RulesSnapshot = {
  playersMin: 2,
  playersMax: 4,
  copiesPerRank: 12,
  clearCount: 11,
  skipCount: 5,
  faceDownPerPlayer: 4,
  faceUpPerPlayer: 4,
  handSize: 11,
  tapOutCount: 4,
  clearPoints: 20,
  skipPoints: 30,
  endingScore: 250,
  endOnFirstOut: true,
  stalemateTurnCap: 600,
};

export const NUMBER_RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

export const RANK_LABELS: Record<number, string> = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
};