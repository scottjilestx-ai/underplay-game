import { chooseMove } from "./ai.js";
import { applyMove } from "./apply.js";
import { checkConservation } from "./invariant.js";
import { legalMoves } from "./moves.js";
import { createMatch, startNextRound } from "./game.js";
import type { GameState, PlayerSetup } from "./types.js";

function playMatch(setups: PlayerSetup[], seed: number, maxRounds = 20): GameState {
  let state = createMatch(setups, undefined, seed);
  let rounds = 0;
  while (state.phase !== "matchOver" && rounds++ < maxRounds) {
    let guard = 0;
    while (state.phase === "playing" && guard++ < 800) {
      const moves = legalMoves(state, state.currentSeat);
      const p = state.players[state.currentSeat];
      const move = p.isCpu
        ? chooseMove(state, state.currentSeat, p.difficulty ?? "medium")
        : moves[Math.floor(Math.random() * moves.length)];
      if (!move) break;
      state = applyMove(state, move);
      if (!checkConservation(state)) throw new Error("conservation broken");
    }
    if (state.phase === "roundOver") state = startNextRound(state);
    else break;
  }
  return state;
}

const setups: PlayerSetup[] = [
  { name: "CPU-A", isCpu: true, difficulty: "hard" },
  { name: "CPU-B", isCpu: true, difficulty: "medium" },
  { name: "CPU-C", isCpu: true, difficulty: "easy" },
];

let wins = [0, 0, 0];
const N = 30;
for (let i = 0; i < N; i++) {
  const end = playMatch(setups, 1000 + i);
  const w = end.matchWinner ?? end.matchTiedWinners[0];
  if (w != null) wins[w]++;
  console.log(
    `sim ${i + 1}/${N} phase=${end.phase} scores=${end.scores.join(",")} winner=${w}`,
  );
}
console.log("wins by seat:", wins);