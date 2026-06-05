import { describe, expect, it } from "vitest";
import { applyMove } from "./apply.js";
import { confirmHigherPlay, extendHigherPlay } from "./confirm.js";
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
  it("picks up pile to hand and awaits confirm", () => {
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
    expect(next.pendingHigherConfirm).toEqual({ rank: 10 });
  });

  it("confirm passes turn; extension adds same rank only", () => {
    const s = minimalState();
    const pool = gatherCards(s);
    const tens = pool.filter((c) => c.kind === "play" && c.value === 10);
    const fours = pool.filter((c) => c.kind === "play" && c.value === 4);
    const used = [fours[0], tens[0], tens[1], tens[2]];
    s.leftover = s.leftover.filter((c) => !used.some((u) => u.id === c.id));
    s.stack = [fours[0]];
    s.players[0].hand = [tens[0], tens[1], tens[2]];
    s.players[0].faceUp = [];
    s.players[0].faceDown = [];
    s.currentSeat = 0;
    let mid = applyMove(s, { cardIds: [tens[0].id] });
    mid = extendHigherPlay(mid, [tens[1].id, tens[2].id]);
    expect(mid.stack.length).toBe(3);
    const done = confirmHigherPlay(mid);
    expect(done.pendingHigherConfirm).toBeNull();
    expect(done.currentSeat).toBe(1);
  });

  it("extension tap-out clears confirm and keeps turn to play again", () => {
    const s = minimalState();
    const pool = gatherCards(s);
    const queens = pool.filter((c) => c.kind === "play" && c.value === 12);
    const fours = pool.filter((c) => c.kind === "play" && c.value === 4);
    const used = [fours[0], queens[0], queens[1], queens[2], queens[3]];
    s.leftover = s.leftover.filter((c) => !used.some((u) => u.id === c.id));
    s.stack = [fours[0]];
    s.players[0].hand = [queens[0], queens[1], queens[2], queens[3]];
    s.players[0].faceUp = [];
    s.players[0].faceDown = [];
    s.currentSeat = 0;
    let mid = applyMove(s, { cardIds: [queens[0].id] });
    expect(mid.pendingHigherConfirm).toEqual({ rank: 12 });
    mid = extendHigherPlay(mid, [queens[1].id, queens[2].id, queens[3].id]);
    expect(mid.stack).toEqual([]);
    expect(mid.pendingHigherConfirm).toBeNull();
    expect(mid.currentSeat).toBe(0);
    expect(legalMoves(mid, 0).length).toBeGreaterThan(0);
  });
});

describe("face-down uncover by slot", () => {
  it("allows flip when that slot lost its face-up, not only the last pile", () => {
    const s = minimalState();
    const pool = gatherCards(s);
    const cards = pool.filter((c) => c.kind === "play").slice(0, 6);
    s.leftover = s.leftover.filter((c) => !cards.some((x) => x.id === c.id));
    s.stack = [];
    s.currentSeat = 0;
    s.players[0].hand = [];
    s.players[0].faceDown = cards.slice(0, 4).map((c, slot) => ({ ...c, slot }));
    s.players[0].faceUp = [cards[4], cards[5]].map((c, i) => ({ ...c, slot: i }));
    const slot1Down = s.players[0].faceDown[1]!;
    expect(legalMoves(s, 0).some((m) => m.cardIds[0] === slot1Down.id)).toBe(false);
    s.players[0].faceUp = s.players[0].faceUp.filter((c) => c.slot !== 1);
    expect(legalMoves(s, 0).some((m) => m.cardIds[0] === slot1Down.id)).toBe(true);
  });
});

describe("face-down flip", () => {
  it("safe flip awaits confirm to add same rank from hand", () => {
    const s = minimalState();
    const pool = gatherCards(s);
    const twos = pool.filter((c) => c.kind === "play" && c.value === 2);
    const sevens = pool.filter((c) => c.kind === "play" && c.value === 7);
    const used = [twos[0], twos[1], twos[2], sevens[0]];
    s.leftover = s.leftover.filter((c) => !used.some((u) => u.id === c.id));
    s.stack = [sevens[0]];
    s.players[0].hand = [twos[1], twos[2]];
    s.players[0].faceUp = [];
    s.players[0].faceDown = [twos[0]];
    s.currentSeat = 0;
    const next = applyMove(s, { cardIds: [twos[0].id] });
    expect(next.stack.map((c) => c.id)).toEqual([sevens[0].id, twos[0].id]);
    expect(next.pendingHigherConfirm).toEqual({ rank: 2 });
    expect(next.currentSeat).toBe(0);
    const extended = extendHigherPlay(next, [twos[1].id]);
    expect(extended.stack.length).toBe(3);
    const done = confirmHigherPlay(extended);
    expect(done.pendingHigherConfirm).toBeNull();
    expect(done.currentSeat).toBe(1);
  });
});

describe("skip (overcut)", () => {
  it("applies pendingSkip only to the chosen target seat", () => {
    const s = createMatch(
      [
        { name: "You", isCpu: false },
        { name: "Bodily", isCpu: true },
        { name: "Chip", isCpu: true },
        { name: "Pat", isCpu: true },
      ],
      undefined,
      7,
    );
    const pool = gatherCards(s);
    const skip = pool.find((c) => c.kind === "skip")!;
    s.leftover = s.leftover.filter((c) => c.id !== skip.id);
    s.players[0].hand = [skip];
    s.players[0].faceUp = [];
    s.players[0].faceDown = [];
    s.currentSeat = 0;
    const chipSeat = s.players.findIndex((p) => p.name === "Chip");
    expect(chipSeat).toBeGreaterThan(0);
    const next = applyMove(s, { cardIds: [skip.id], targetSeat: chipSeat });
    const bodilySeat = s.players.findIndex((p) => p.name === "Bodily");
    expect(next.players[chipSeat].pendingSkip).toBe(true);
    expect(next.players[bodilySeat].pendingSkip).toBe(false);
    expect(next.currentSeat).toBe(0);
  });
});

describe("face-down undercut", () => {
  it("requires a target and sends the stack to that player", () => {
    const s = minimalState();
    const pool = gatherCards(s);
    const clr = pool.find((c) => c.kind === "clear")!;
    const three = pool.find((c) => c.kind === "play" && c.value === 3)!;
    const four = pool.find((c) => c.kind === "play" && c.value === 4)!;
    s.leftover = s.leftover.filter(
      (c) => c.id !== clr.id && c.id !== three.id && c.id !== four.id,
    );
    s.stack = [three, four];
    s.players[0].hand = [];
    s.players[0].faceUp = [];
    s.players[0].faceDown = [{ ...clr, slot: 0 }];
    s.currentSeat = 0;
    expect(
      legalMoves(s, 0).some(
        (m) => m.cardIds[0] === clr.id && m.targetSeat === 1,
      ),
    ).toBe(true);
    const next = applyMove(s, { cardIds: [clr.id], targetSeat: 1 });
    expect(next.stack).toEqual([]);
    expect(next.players[1].hand.map((c) => c.id)).toEqual(
      expect.arrayContaining([three.id, four.id, clr.id]),
    );
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