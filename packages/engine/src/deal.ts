import { buildDeck } from "./deck.js";
import { DEFAULT_RULES } from "./config.js";
import { createRng, shuffle } from "./rng.js";
import type { GameState, PlayerSetup, RulesSnapshot } from "./types.js";

export function dealRound(
  playerCount: number,
  setups: PlayerSetup[],
  rules: RulesSnapshot = DEFAULT_RULES,
  seed: number,
  roundNumber: number,
  startingSeat: number,
  scores: number[],
): GameState {
  const rng = createRng(seed);
  const deck = shuffle(buildDeck(rules), rng);
  const perPlayer = rules.faceDownPerPlayer + rules.faceUpPerPlayer + rules.handSize;
  const dealtTotal = perPlayer * playerCount;
  const leftover = deck.slice(dealtTotal);

  const players = setups.slice(0, playerCount).map((s, seat) => ({
    seat,
    name: s.name,
    isCpu: s.isCpu,
    difficulty: s.difficulty,
    hand: [] as typeof deck,
    faceUp: [] as typeof deck,
    faceDown: [] as typeof deck,
    pendingSkip: false,
  }));

  let idx = 0;
  for (let r = 0; r < rules.faceDownPerPlayer; r++) {
    for (let p = 0; p < playerCount; p++) {
      players[p].faceDown.push({ ...deck[idx++], slot: r });
    }
  }
  for (let r = 0; r < rules.faceUpPerPlayer; r++) {
    for (let p = 0; p < playerCount; p++) {
      players[p].faceUp.push({ ...deck[idx++], slot: r });
    }
  }
  for (let r = 0; r < rules.handSize; r++) {
    for (let p = 0; p < playerCount; p++) players[p].hand.push(deck[idx++]);
  }

  return {
    players,
    stack: [],
    deadPile: [],
    leftover,
    currentSeat: startingSeat,
    pendingHigherConfirm: null,
    phase: "playing",
    scores: [...scores],
    roundScores: null,
    roundNumber,
    roundWinner: null,
    matchWinner: null,
    matchTiedWinners: [],
    startingSeat,
    rules,
    version: 0,
    turnCount: 0,
    seed,
  };
}