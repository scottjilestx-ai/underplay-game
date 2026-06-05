import { legalMoves, validate, type GameState, type Move } from "@underplay/engine";

export type TargetedPlayOptions = {
  needsTarget: boolean;
  targetSeat: number | null;
};

export function movesMatchingSelection(
  moves: Move[],
  selected: string[],
): Move[] {
  if (!selected.length) return [];
  const key = [...selected].sort().join(",");
  return moves.filter(
    (m) =>
      m.cardIds.length === selected.length &&
      [...m.cardIds].sort().join(",") === key,
  );
}

/** True only when every legal play of this selection requires targetSeat. */
export function selectionRequiresTarget(
  moves: Move[],
  selected: string[],
): boolean {
  const matching = movesMatchingSelection(moves, selected);
  if (!matching.length) return false;
  return matching.every((m) => m.targetSeat != null);
}

/** Pick the legal move for the current selection; targeted specials require an exact target seat. */
export function findMoveForSelection(
  moves: Move[],
  selected: string[],
  options: TargetedPlayOptions,
): Move | undefined {
  const matching = movesMatchingSelection(moves, selected);
  return matching.find((m) => {
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