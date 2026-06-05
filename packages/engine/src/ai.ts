import { topValue } from "./deck.js";
import { applyMove } from "./apply.js";
import { isOut, pointsHeld, totalHeld } from "./player.js";
import { legalMoves } from "./moves.js";
import type { CpuDifficulty, GameState, Move } from "./types.js";

function isSafeMove(state: GameState, move: Move): boolean {
  const player = state.players[state.currentSeat];
  const card = [...player.hand, ...player.faceUp, ...player.faceDown].find(
    (c) => c.id === move.cardIds[0],
  );
  if (!card || card.kind !== "play") return card?.kind === "clear" || card?.kind === "skip";
  const T = topValue(state.stack);
  if (T === null) return true;
  return (card.value ?? 0) <= T;
}

function scoreState(state: GameState, seat: number, difficulty: CpuDifficulty): number {
  const p = state.players[seat];
  if (isOut(p)) return 1_000_000;
  let score = -totalHeld(p) * 120;
  if (difficulty === "hard") score -= pointsHeld(p, state.rules) * 3;
  return score;
}

function evaluateMove(
  state: GameState,
  seat: number,
  move: Move,
  difficulty: CpuDifficulty,
): number {
  try {
    const next = applyMove(state, move);
    if (isOut(next.players[seat])) return 1_000_000;
    let score = scoreState(next, seat, difficulty);
    if (next.currentSeat === seat) score += difficulty === "hard" ? 60 : 30;
    const wasSpecial =
      move.cardIds.length === 1 &&
      [...state.players[seat].hand, ...state.players[seat].faceUp].some(
        (c) => c.id === move.cardIds[0] && c.kind !== "play",
      );
    if (wasSpecial && legalMoves(state, seat).some((m) => isSafeMove(state, m))) {
      score -= difficulty === "hard" ? 90 : 40;
    }
    if (next.stack.length === 0 && state.stack.length > 0) score += difficulty === "hard" ? 220 : 100;
    return score;
  } catch {
    return -1_000_000;
  }
}

export function chooseMove(
  state: GameState,
  seat: number,
  difficulty: CpuDifficulty,
): Move | null {
  const moves = legalMoves(state, seat);
  if (!moves.length) return null;

  const rngPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  if (difficulty === "easy") {
    const safe = moves.filter((m) => isSafeMove(state, m));
    if (safe.length) return rngPick(safe);
    return rngPick(moves);
  }

  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const sc = evaluateMove(state, seat, m, difficulty);
    if (sc > bestScore) {
      bestScore = sc;
      best = m;
    }
  }
  return best;
}

export function advanceUntilHuman(state: GameState): GameState {
  let s = state;
  let guard = 0;
  while (s.phase === "playing" && guard++ < 200) {
    const p = s.players[s.currentSeat];
    if (!p.isCpu) break;
    const move = chooseMove(s, s.currentSeat, p.difficulty ?? "medium");
    if (!move) break;
    s = applyMove(s, move);
  }
  return s;
}