import { describe, expect, it } from "vitest";
import { applyMove } from "./apply.js";
import { chooseMove } from "./ai.js";
import { checkConservation } from "./invariant.js";
import { legalMoves } from "./moves.js";
import { createMatch, startNextRound } from "./game.js";
import type { PlayerSetup } from "./types.js";

function playRandomMatch(seed: number, players: number) {
  const setups: PlayerSetup[] = Array.from({ length: players }, (_, i) => ({
    name: `P${i}`,
    isCpu: true,
    difficulty: (["easy", "medium", "hard"] as const)[i % 3],
  }));
  let state = createMatch(setups, undefined, seed);
  let turns = 0;
  let rounds = 0;
  while (state.phase !== "matchOver" && rounds < 6 && turns < 400) {
    while (state.phase === "playing" && turns++ < 400) {
      const moves = legalMoves(state, state.currentSeat);
      expect(moves.length).toBeGreaterThan(0);
      const move = chooseMove(state, state.currentSeat, "medium") ?? moves[0];
      state = applyMove(state, move);
      expect(checkConservation(state)).toBe(true);
    }
    if (state.phase === "roundOver") {
      state = startNextRound(state);
      rounds++;
    } else break;
  }
  expect(["playing", "roundOver", "matchOver"]).toContain(state.phase);
}

describe("fuzz", () => {
  it(
    "plays CPU matches without breaking invariants",
    () => {
      for (let i = 0; i < 5; i++) {
        playRandomMatch(5000 + i, 2);
      }
    },
    30_000,
  );
});