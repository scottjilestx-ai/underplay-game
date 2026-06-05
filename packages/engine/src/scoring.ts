import { isOut, pointsHeld } from "./player.js";
import type { GameState } from "./types.js";

export function finalizeRound(state: GameState, winner: number): void {
  const roundScores = state.players.map((p, i) =>
    i === winner ? 0 : pointsHeld(p, state.rules),
  );
  state.roundScores = roundScores;
  state.roundWinner = winner;
  state.scores = state.scores.map((s, i) => s + roundScores[i]);
  state.phase = "roundOver";

  const ceiling = state.rules.endingScore;
  const over = state.scores.some((s) => s >= ceiling);
  if (over) {
    const min = Math.min(...state.scores);
    const tied = state.scores
      .map((s, i) => (s === min ? i : -1))
      .filter((i) => i >= 0);
    state.matchTiedWinners = tied;
    state.matchWinner = tied.length === 1 ? tied[0] : null;
    state.phase = "matchOver";
  }
}

export function resolveStalemate(state: GameState): void {
  let best = 0;
  let bestPts = Infinity;
  for (let i = 0; i < state.players.length; i++) {
    if (isOut(state.players[i])) continue;
    const pts = pointsHeld(state.players[i], state.rules);
    if (pts < bestPts) {
      bestPts = pts;
      best = i;
    }
  }
  finalizeRound(state, best);
}