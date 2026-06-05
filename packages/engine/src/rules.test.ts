import { describe, expect, it } from "vitest";
import { applyMove } from "./apply.js";
import { buildDeck } from "./deck.js";
import { createMatch } from "./game.js";
import { checkConservation } from "./invariant.js";
import { legalMoves } from "./moves.js";
import type { GameState } from "./types.js";

function minimalState(overrides: Partial<GameState> = {}): GameState {
  const base = createMatch(
    [
      { name: "A", isCpu: false },
      { name: "B", isCpu: false },
    ],
    undefined,
    42,
  );
  return { ...base, ...overrides };
}

describe("deck", () => {
  it("has 160 cards", () => {
    expect(buildDeck().length).toBe(160);
  });
});

describe("conservation", () => {
  it("holds after deal", () => {
    const s = createMatch(
      [
        { name: "A", isCpu: false },
        { name: "B", isCpu: true, difficulty: "easy" },
      ],
      undefined,
      99,
    );
    expect(checkConservation(s)).toBe(true);
  });
});

function gatherCards(s: GameState) {
  const all = [
    ...s.leftover,
    ...s.deadPile,
    ...s.stack,
    ...s.players.flatMap((p) => [...p.hand, ...p.faceUp, ...p.faceDown]),
  ];
  return all;
}

describe("tap-out", () => {
  it("clears entire stack", () => {
    const s = minimalState();
    const fives = gatherCards(s).filter((c) => c.kind === "play" && c.value === 5);
    s.leftover = s.leftover.filter((c) => !fives.slice(0, 4).some((f) => f.id === c.id));
    s.stack = fives.slice(0, 3);
    s.players[0].hand = [fives[3]];
    s.players[0].faceUp = [];
    s.players[0].faceDown = [];
    s.currentSeat = 0;
    const next = applyMove(s, { cardIds: [fives[3].id] });
    expect(next.stack).toEqual([]);
    expect(next.deadPile.length).toBe(4);
    expect(next.currentSeat).toBe(0);
  });
});

describe("higher play", () => {
  it("picks up pile to hand not auto-combine", () => {
    const s = minimalState();
    const pool = gatherCards(s);
    const tens = pool.filter((c) => c.kind === "play" && c.value === 10);
    const fours = pool.filter((c) => c.kind === "play" && c.value === 4);
    const used = [fours[0], tens[1]];
    s.leftover = s.leftover.filter((c) => !used.some((u) => u.id === c.id));
    s.stack = [fours[0]];
    s.players[0].hand = [tens[1]];
    s.players[0].faceUp = [];
    s.players[0].faceDown = [];
    s.currentSeat = 0;
    const next = applyMove(s, { cardIds: [tens[1].id] });
    expect(next.stack.map((c) => c.id)).toEqual([tens[1].id]);
    expect(next.players[0].hand.some((c) => c.id === fours[0].id)).toBe(true);
    expect(next.currentSeat).toBe(0);
  });
});

describe("clear", () => {
  it("empties stack and continues", () => {
    const s = minimalState();
    const pool = gatherCards(s);
    const clr = pool.find((c) => c.kind === "clear")!;
    const three = pool.find((c) => c.kind === "play" && c.value === 3)!;
    s.leftover = s.leftover.filter((c) => c.id !== clr.id && c.id !== three.id);
    s.stack = [three];
    s.players[0].hand = [clr];
    s.players[0].faceUp = [];
    s.players[0].faceDown = [];
    s.currentSeat = 0;
    const next = applyMove(s, { cardIds: [clr.id] });
    expect(next.stack).toEqual([]);
    expect(next.currentSeat).toBe(0);
  });
});

describe("legal moves", () => {
  it("always has a move at start", () => {
    const s = createMatch(
      [
        { name: "A", isCpu: false },
        { name: "B", isCpu: false },
      ],
      undefined,
      7,
    );
    expect(legalMoves(s, s.currentSeat).length).toBeGreaterThan(0);
  });
});