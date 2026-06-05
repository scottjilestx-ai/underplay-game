import { dealRound } from "./deal.js";
import { DEFAULT_RULES } from "./config.js";
import { createRng } from "./rng.js";
import type { GameState, PlayerSetup, RulesSnapshot } from "./types.js";

/** Seat index (0 = first setup player) or random before deal. */
export type FirstPlayerChoice = "random" | number;

export function resolveStartingSeat(
  choice: FirstPlayerChoice,
  playerCount: number,
  seed: number,
): number {
  if (playerCount <= 0) return 0;
  if (choice === "random") {
    const rng = createRng(seed ^ 0x9e3779b9);
    return Math.floor(rng.next() * playerCount);
  }
  const seat = Math.floor(choice);
  if (seat < 0 || seat >= playerCount) return 0;
  return seat;
}

/** Back-compat for states saved before pendingHigherConfirm existed. */
export function normalizeGameState(state: GameState): GameState {
  if (state.pendingHigherConfirm === undefined) {
    return { ...state, pendingHigherConfirm: null };
  }
  return state;
}

export function createMatch(
  setups: PlayerSetup[],
  rules: RulesSnapshot = DEFAULT_RULES,
  seed = Date.now(),
  firstPlayer: FirstPlayerChoice = 0,
): GameState {
  const count = setups.length;
  if (count < rules.playersMin || count > rules.playersMax) {
    throw new Error(`player count ${count} out of range`);
  }
  const startingSeat = resolveStartingSeat(firstPlayer, count, seed);
  return dealRound(count, setups, rules, seed, 1, startingSeat, setups.map(() => 0));
}

export function startNextRound(state: GameState): GameState {
  if (state.phase !== "roundOver") throw new Error("not between rounds");
  const setups = state.players.map((p) => ({
    name: p.name,
    isCpu: p.isCpu,
    difficulty: p.difficulty,
  }));
  const startingSeat = (state.startingSeat + 1) % state.players.length;
  return dealRound(
    state.players.length,
    setups,
    state.rules,
    state.seed + state.roundNumber * 9973,
    state.roundNumber + 1,
    startingSeat,
    state.scores,
  );
}