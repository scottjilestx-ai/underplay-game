import { describe, expect, it } from "vitest";
import { applyMove } from "./apply.js";
import { buildDeck } from "./deck.js";
import { createMatch } from "./game.js";
import { chooseMove, resolveHigherConfirm } from "./ai.js";
import { isAwaitingHigherConfirm } from "./confirm.js";
import { legalMoves } from "./moves.js";
import type { Card, GameState } from "./types.js";

function gatherCards(s: GameState): Card[] {
  return [
    ...s.leftover,
    ...s.deadPile,
    ...s.stack,
    ...s.players.flatMap((p) => [...p.hand, ...p.faceUp, ...p.faceDown]),
  ];
}

/** Stack top 7; CPU can play safe 3s as a pair or risky 10 (higher). */
function higherVsSafeState(seed: number): GameState {
  const s = createMatch(
    [
      { name: "Human", isCpu: false },
      { name: "CPU", isCpu: true, difficulty: "hard" },
    ],
    undefined,
    seed,
  );
  const pool = gatherCards(s);
  const seven = pool.find((c) => c.kind === "play" && c.value === 7)!;
  const threes = pool.filter((c) => c.kind === "play" && c.value === 3);
  const ten = pool.find((c) => c.kind === "play" && c.value === 10)!;
  const used = new Set([seven.id, threes[0].id, threes[1].id, ten.id]);
  s.leftover = s.leftover.filter((c) => !used.has(c.id));
  s.stack = [seven];
  s.players[0].hand = [threes[0], threes[1]];
  s.players[0].faceUp = [ten];
  s.players[0].faceDown = [];
  s.currentSeat = 0;
  return s;
}

describe("CPU difficulty", () => {
  it("hard picks safe low play over a higher card that picks up the pile", () => {
    const s = higherVsSafeState(101);
    const move = chooseMove(s, 0, "hard", () => 0);
    expect(move).not.toBeNull();
    const ids = new Set(move!.cardIds);
    expect(ids.has(s.players[0].hand[0].id)).toBe(true);
    expect(ids.has(s.players[0].hand[1].id)).toBe(true);
    expect(ids.has(s.players[0].faceUp[0].id)).toBe(false);
  });

  it("easy can blunder into the higher play when rng forces a random pick", () => {
    const s = higherVsSafeState(101);
    const tenId = s.players[0].faceUp[0].id;
    const moves = legalMoves(s, 0);
    const riskyIdx = moves.findIndex((m) => m.cardIds[0] === tenId);
    expect(riskyIdx).toBeGreaterThanOrEqual(0);
    let calls = 0;
    const rng = () => {
      calls++;
      if (calls === 1) return 0.2; // trigger mistake branch (< 0.38)
      return (riskyIdx + 0.01) / moves.length;
    };
    const move = chooseMove(s, 0, "easy", rng);
    expect(move?.cardIds).toEqual([tenId]);
  });

  it("easy confirms higher plays without extending extras", () => {
    const s = createMatch(
      [
        { name: "CPU", isCpu: true, difficulty: "easy" },
        { name: "B", isCpu: false },
      ],
      undefined,
      55,
    );
    const pool = gatherCards(s);
    const fours = pool.filter((c) => c.kind === "play" && c.value === 4);
    const sixes = pool.filter((c) => c.kind === "play" && c.value === 6);
    const used = new Set([fours[0].id, sixes[0].id, sixes[1].id, sixes[2].id]);
    s.leftover = s.leftover.filter((c) => !used.has(c.id));
    s.stack = [fours[0]];
    s.players[0].hand = [sixes[0], sixes[1], sixes[2]];
    s.players[0].faceUp = [];
    s.players[0].faceDown = [];
    s.currentSeat = 0;
    const afterHigher = applyMove(s, { cardIds: [sixes[0].id] });
    expect(isAwaitingHigherConfirm(afterHigher)).toBe(true);
    const resolved = resolveHigherConfirm(afterHigher, 0, "easy");
    expect(isAwaitingHigherConfirm(resolved)).toBe(false);
    expect(resolved.players[0].hand.filter((c) => c.value === 6).length).toBe(2);
  });

  it("hard extends same-rank cards when it sets up a tap-out", () => {
    const s = createMatch(
      [
        { name: "CPU", isCpu: true, difficulty: "hard" },
        { name: "B", isCpu: false },
      ],
      undefined,
      77,
    );
    const pool = gatherCards(s);
    const fives = pool.filter((c) => c.kind === "play" && c.value === 5);
    const used = new Set(fives.slice(0, 6).map((c) => c.id));
    s.leftover = s.leftover.filter((c) => !used.has(c.id));
    s.stack = fives.slice(0, 3);
    s.players[0].hand = [fives[3], fives[4], fives[5]];
    s.players[0].faceUp = [];
    s.players[0].faceDown = [];
    s.currentSeat = 0;
    const afterHigher = applyMove(s, { cardIds: [fives[3].id] });
    const resolved = resolveHigherConfirm(afterHigher, 0, "hard");
    expect(resolved.stack).toEqual([]);
    expect(resolved.currentSeat).toBe(0);
  });

  it("preserves per-seat difficulty on deal", () => {
    const s = createMatch(
      [
        { name: "You", isCpu: false },
        { name: "Botley", isCpu: true, difficulty: "easy" },
        { name: "Chip", isCpu: true, difficulty: "hard" },
      ],
      undefined,
      1,
    );
    expect(s.players[1].difficulty).toBe("easy");
    expect(s.players[2].difficulty).toBe("hard");
    expect(buildDeck().length).toBe(160);
    expect(legalMoves(s, 0).length).toBeGreaterThan(0);
  });
});