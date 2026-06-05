import { activePlayers, isOut } from "./player.js";
import type { GameState } from "./types.js";

export function nextActiveSeat(state: GameState, from: number): number {
  const n = state.players.length;
  let seat = (from + 1) % n;
  for (let i = 0; i < n; i++) {
    if (!isOut(state.players[seat])) return seat;
    seat = (seat + 1) % n;
  }
  return from;
}

export function defaultSkipTarget(state: GameState, from: number): number {
  let seat = nextActiveSeat(state, from);
  const n = state.players.length;
  for (let i = 0; i < n; i++) {
    const p = state.players[seat];
    if (!isOut(p) && !p.pendingSkip) return seat;
    seat = nextActiveSeat(state, seat);
  }
  return nextActiveSeat(state, from);
}

export function advanceTurn(state: GameState): void {
  let next = nextActiveSeat(state, state.currentSeat);
  while (state.players[next].pendingSkip && activePlayers(state.players).length > 1) {
    state.players[next].pendingSkip = false;
    next = nextActiveSeat(state, next);
  }
  state.currentSeat = next;
}