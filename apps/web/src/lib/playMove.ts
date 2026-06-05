import type { Move } from "@underplay/engine";

/** Pick the legal move for the current selection; targeted specials require an exact target seat. */
export function findMoveForSelection(
  moves: Move[],
  selected: string[],
  options: { needsTarget: boolean; targetSeat: number | null },
): Move | undefined {
  const key = [...selected].sort().join(",");
  return moves.find((m) => {
    if (m.cardIds.length !== selected.length) return false;
    if ([...m.cardIds].sort().join(",") !== key) return false;
    if (options.needsTarget) {
      return (
        options.targetSeat != null && m.targetSeat === options.targetSeat
      );
    }
    return m.targetSeat == null;
  });
}

export function canPlaySelection(
  moves: Move[],
  selected: string[],
  options: { needsTarget: boolean; targetSeat: number | null },
): boolean {
  return findMoveForSelection(moves, selected, options) != null;
}