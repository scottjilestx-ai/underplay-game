import { dealRound } from "./deal.js";
import { DEFAULT_RULES } from "./config.js";
import type { GameState, PlayerSetup, RulesSnapshot } from "./types.js";

export function createMatch(
  setups: PlayerSetup[],
  rules: RulesSnapshot = DEFAULT_RULES,
  seed = Date.now(),
): GameState {
  const count = setups.length;
  if (count < rules.playersMin || count > rules.playersMax) {
    throw new Error(`player count ${count} out of range`);
  }
  return dealRound(count, setups, rules, seed, 1, 0, setups.map(() => 0));
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