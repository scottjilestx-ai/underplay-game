import { describe, expect, it } from "vitest";
import { createMatch, resolveStartingSeat } from "./game.js";
import type { PlayerSetup } from "./types.js";

const setups: PlayerSetup[] = [
  { name: "You", isCpu: false },
  { name: "Bot", isCpu: true, difficulty: "medium" },
];

describe("resolveStartingSeat", () => {
  it("picks a valid seat for random", () => {
    const seat = resolveStartingSeat("random", 4, 42);
    expect(seat).toBeGreaterThanOrEqual(0);
    expect(seat).toBeLessThan(4);
  });

  it("is stable for the same seed", () => {
    expect(resolveStartingSeat("random", 3, 99)).toBe(resolveStartingSeat("random", 3, 99));
  });

  it("honors explicit seat", () => {
    expect(resolveStartingSeat(2, 4, 1)).toBe(2);
    expect(resolveStartingSeat(9, 4, 1)).toBe(0);
  });
});

describe("createMatch first player", () => {
  it("opens on the chosen seat", () => {
    const g = createMatch(setups, undefined, 12345, 1);
    expect(g.currentSeat).toBe(1);
    expect(g.startingSeat).toBe(1);
  });

  it("uses random seat from seed", () => {
    const g = createMatch(setups, undefined, 777, "random");
    expect(g.currentSeat).toBe(g.startingSeat);
    expect(g.currentSeat).toBeGreaterThanOrEqual(0);
    expect(g.currentSeat).toBeLessThan(2);
  });
});