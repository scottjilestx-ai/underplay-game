import { legalMoves, validate, type GameState, type Move } from "@underplay/engine";

export type TargetedPlayOptions = {
  needsTarget: boolean;
  targetSeat: number | null;
};

/** Pick the legal move for the current selection; targeted specials require an exact target seat. */
export function findMoveForSelection(
  moves: Move[],
  selected: string[],
  options: TargetedPlayOptions,
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
  options: TargetedPlayOptions,
): boolean {
  return findMoveForSelection(moves, selected, options) != null;
}

/** Resolve the move to commit, always binding the UI target seat when required. */
export function buildTargetedMove(
  state: GameState,
  seat: number,
  selected: string[],
  options: TargetedPlayOptions,
): Move | undefined {
  const moves = legalMoves(state, seat);
  const found = findMoveForSelection(moves, selected, options);
  if (found) return found;

  if (!options.needsTarget || options.targetSeat == null || selected.length !== 1) {
    return undefined;
  }

  const candidate: Move = {
    cardIds: [...selected],
    targetSeat: options.targetSeat,
  };
  return validate(state, seat, candidate).ok ? candidate : undefined;
}