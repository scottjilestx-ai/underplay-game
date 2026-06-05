import type { GameState, Move } from "@underplay/engine";
import { turnLogFlyLine, turnLogHigherExtension, turnLogMoveAction } from "@/lib/turnLog";

export const PLAY_SUMMARY_HOLD_MS = 2000;
export const PLAY_SUMMARY_FLY_S = 0.65;

/** Natural sentence for the under-stack tile, e.g. "You played jack (J♠)." */
export function summarizeStackPlay(
  playerName: string,
  prev: GameState,
  next: GameState,
  move: Move,
): string {
  const action = turnLogMoveAction(prev, next, move);
  return `${turnLogFlyLine(playerName, action)}.`;
}

export function summarizeHigherExtension(
  playerName: string,
  prev: GameState,
  cardIds: string[],
  resultSuffix = "",
): string {
  const action = turnLogHigherExtension(prev, cardIds) + resultSuffix;
  return `${turnLogFlyLine(playerName, action)}.`;
}