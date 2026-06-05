import { topRunLength, topValue } from "./deck.js";
import { applyMove } from "./apply.js";
import {
  confirmHigherPlay,
  extendHigherPlay,
  isAwaitingHigherConfirm,
  legalHigherExtensions,
} from "./confirm.js";
import { isOut, pointsHeld, totalHeld } from "./player.js";
import { legalMoves } from "./moves.js";
import type { CpuDifficulty, GameState, Move } from "./types.js";

type DifficultyProfile = {
  /** Chance to ignore evaluation and pick a random legal move. */
  mistakeRate: number;
  /** When not blundering on easy, pick from the worst-scoring fraction of moves. */
  easyWorstFraction: number;
  keepTurnBonus: number;
  clearStackBonus: number;
  specialPenalty: number;
  pointsHeldMult: number;
  multiCardBonus: number;
  /** Minimum extension score to add more same-rank cards after a higher play. */
  extendMinScore: number;
  extendCardCost: number;
};

const PROFILES: Record<CpuDifficulty, DifficultyProfile> = {
  easy: {
    mistakeRate: 0.38,
    easyWorstFraction: 0.65,
    keepTurnBonus: 6,
    clearStackBonus: 30,
    specialPenalty: 4,
    pointsHeldMult: 0,
    multiCardBonus: 0,
    extendMinScore: 500,
    extendCardCost: 20,
  },
  medium: {
    mistakeRate: 0.06,
    easyWorstFraction: 0,
    keepTurnBonus: 38,
    clearStackBonus: 130,
    specialPenalty: 48,
    pointsHeldMult: 1.5,
    multiCardBonus: 14,
    extendMinScore: -20,
    extendCardCost: 9,
  },
  hard: {
    mistakeRate: 0,
    easyWorstFraction: 0,
    keepTurnBonus: 95,
    clearStackBonus: 340,
    specialPenalty: 140,
    pointsHeldMult: 5,
    multiCardBonus: 32,
    extendMinScore: -80,
    extendCardCost: 3,
  },
};

function profile(difficulty: CpuDifficulty): DifficultyProfile {
  return PROFILES[difficulty];
}

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

function playedCardValue(state: GameState, seat: number, move: Move): number {
  const player = state.players[seat];
  const zones = [...player.hand, ...player.faceUp, ...player.faceDown];
  return move.cardIds.reduce((sum, id) => {
    const c = zones.find((x) => x.id === id);
    if (!c || c.kind !== "play") return sum;
    return sum + (c.value ?? 0);
  }, 0);
}

function scoreState(
  state: GameState,
  seat: number,
  difficulty: CpuDifficulty,
): number {
  const p = state.players[seat];
  const w = profile(difficulty);
  if (isOut(p)) return 1_000_000;
  let score = -totalHeld(p) * 120;
  score -= pointsHeld(p, state.rules) * w.pointsHeldMult;
  return score;
}

function evaluateMove(
  state: GameState,
  seat: number,
  move: Move,
  difficulty: CpuDifficulty,
): number {
  const w = profile(difficulty);
  try {
    const next = applyMove(state, move);
    if (isOut(next.players[seat])) return 1_000_000;
    let score = scoreState(next, seat, difficulty);
    if (next.currentSeat === seat) score += w.keepTurnBonus;
    const wasSpecial =
      move.cardIds.length === 1 &&
      [...state.players[seat].hand, ...state.players[seat].faceUp].some(
        (c) => c.id === move.cardIds[0] && c.kind !== "play",
      );
    if (wasSpecial && legalMoves(state, seat).some((m) => isSafeMove(state, m))) {
      score -= w.specialPenalty;
    }
    if (next.stack.length === 0 && state.stack.length > 0) {
      score += w.clearStackBonus;
    }
    if (move.cardIds.length > 1) {
      score += w.multiCardBonus * (move.cardIds.length - 1);
    }
    if (difficulty === "easy") {
      // Prefer dumping low cards; avoid picking up the pile unless random blunder.
      score -= playedCardValue(state, seat, move) * 4;
      if (!isSafeMove(state, move)) score -= 120;
    }
    if (difficulty === "hard") {
      const run = topRunLength(next.stack);
      if (run >= next.rules.tapOutCount - 1 && next.stack.length > 0) {
        score += 80;
      }
      if (isSafeMove(state, move) && state.stack.length > 0) {
        score += 25;
      }
    }
    const fromFaceDown = state.players[seat].faceDown.some((c) =>
      move.cardIds.includes(c.id),
    );
    if (fromFaceDown && move.targetSeat != null) {
      const card = [...state.players[seat].hand, ...state.players[seat].faceUp, ...state.players[seat].faceDown].find(
        (c) => c.id === move.cardIds[0],
      );
      if (card?.kind === "clear") {
        const burden = totalHeld(next.players[move.targetSeat]!);
        score +=
          difficulty === "hard" ? burden * 45 : difficulty === "medium" ? burden * 22 : 8;
      }
    }
    return score;
  } catch {
    return -1_000_000;
  }
}

function pickEasyMove(
  state: GameState,
  seat: number,
  moves: Move[],
  rng: () => number,
): Move {
  const w = profile("easy");
  if (rng() < w.mistakeRate) return moves[Math.floor(rng() * moves.length)];

  const ranked = moves
    .map((m) => ({ m, sc: evaluateMove(state, seat, m, "easy") }))
    .sort((a, b) => a.sc - b.sc);
  const poolSize = Math.max(1, Math.ceil(moves.length * w.easyWorstFraction));
  const pool = ranked.slice(0, poolSize);
  return pool[Math.floor(rng() * pool.length)].m;
}

function pickMediumOrHardMove(
  state: GameState,
  seat: number,
  moves: Move[],
  difficulty: "medium" | "hard",
  rng: () => number,
): Move {
  const w = profile(difficulty);
  if (rng() < w.mistakeRate) return moves[Math.floor(rng() * moves.length)];

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

/** After a higher play: optionally extend with same-rank cards, then confirm (passes turn). */
export function resolveHigherConfirm(
  state: GameState,
  seat: number,
  difficulty: CpuDifficulty = state.players[seat]?.difficulty ?? "medium",
): GameState {
  if (!isAwaitingHigherConfirm(state) || state.currentSeat !== seat) return state;
  const rank = state.pendingHigherConfirm!.rank;
  const extensions = legalHigherExtensions(state, seat);
  const w = profile(difficulty);

  if (difficulty === "easy") {
    let tapOutExt: string[] = [];
    for (const ids of extensions) {
      try {
        const extended = extendHigherPlay(state, ids);
        const run = topRunLength(extended.stack);
        if (extended.stack.length === 0 || run >= extended.rules.tapOutCount) {
          tapOutExt = ids;
          break;
        }
      } catch {
        /* skip invalid */
      }
    }
    let s = state;
    if (tapOutExt.length) s = extendHigherPlay(s, tapOutExt);
    if (!isAwaitingHigherConfirm(s)) return s;
    return confirmHigherPlay(s);
  }

  let best: string[] = [];
  let bestScore = -Infinity;
  for (const ids of extensions) {
    try {
      const extended = extendHigherPlay(state, ids);
      let score = 0;
      const run = topRunLength(extended.stack);
      if (extended.stack.length === 0) score += w.clearStackBonus * 2;
      if (run >= extended.rules.tapOutCount) score += w.clearStackBonus * 1.5;
      score -= extended.players[seat].hand.filter(
        (c) => c.kind === "play" && c.value === rank,
      ).length * (difficulty === "hard" ? 6 : 4);
      score -= ids.length * w.extendCardCost;
      if (score > bestScore && score >= w.extendMinScore) {
        bestScore = score;
        best = ids;
      }
    } catch {
      /* skip invalid */
    }
  }
  let s = state;
  if (best.length) s = extendHigherPlay(s, best);
  if (!isAwaitingHigherConfirm(s)) return s;
  return confirmHigherPlay(s);
}

export function chooseMove(
  state: GameState,
  seat: number,
  difficulty: CpuDifficulty,
  rng: () => number = Math.random,
): Move | null {
  const moves = legalMoves(state, seat);
  if (!moves.length) return null;

  if (difficulty === "easy") {
    return pickEasyMove(state, seat, moves, rng);
  }
  return pickMediumOrHardMove(state, seat, moves, difficulty, rng);
}

export function advanceUntilHuman(state: GameState): GameState {
  let s = state;
  let guard = 0;
  while (s.phase === "playing" && guard++ < 200) {
    const p = s.players[s.currentSeat];
    if (!p.isCpu) break;
    if (isAwaitingHigherConfirm(s)) {
      s = resolveHigherConfirm(s, s.currentSeat, p.difficulty ?? "medium");
      continue;
    }
    const move = chooseMove(s, s.currentSeat, p.difficulty ?? "medium");
    if (!move) break;
    s = applyMove(s, move);
  }
  return s;
}