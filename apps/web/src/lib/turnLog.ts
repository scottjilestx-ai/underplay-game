import { isAwaitingHigherConfirm, topValue, type Card, type GameState, type Move } from "@underplay/engine";
import {
  formatPlayedCards,
  formatTopConstraint,
  phraseFlippedCards,
  phrasePlayedCards,
} from "@/lib/cardDisplay";

/** One player's turn — may include several plays before the next seat acts. */
export interface TurnLogTurn {
  id: string;
  player: string;
  seat: number;
  actions: string[];
  /** Still the active seat (tap-out chain, higher confirm, etc.). */
  inProgress?: boolean;
}

/** @deprecated Use TurnLogTurn */
export type TurnLogEntry = TurnLogTurn;

export const MAX_TURN_LOG_TURNS = 4;

export function turnEndedAfterMove(prev: GameState, next: GameState): boolean {
  return next.currentSeat !== prev.currentSeat;
}

export function turnEndedAfterConfirm(prev: GameState, next: GameState): boolean {
  return next.currentSeat !== prev.currentSeat;
}

function cardFromPlayer(
  state: GameState,
  seat: number,
  id: string,
): Card | undefined {
  const p = state.players[seat];
  if (!p) return undefined;
  return (
    p.hand.find((c) => c.id === id) ??
    p.faceUp.find((c) => c.id === id) ??
    p.faceDown.find((c) => c.id === id)
  );
}

/** Resolve played cards for logging (hand, face-up, face-down). */
export function cardsForMove(state: GameState, seat: number, move: Move): Card[] {
  return move.cardIds
    .map((id) => cardFromPlayer(state, seat, id))
    .filter((c): c is Card => !!c);
}

function cardsFromMove(state: GameState, seat: number, move: Move): Card[] {
  return cardsForMove(state, seat, move);
}

/** True when the move plays a single Overcut (skip) card. */
export function isSkipMove(state: GameState, seat: number, move: Move): boolean {
  if (move.cardIds.length !== 1) return false;
  const card = cardFromPlayer(state, seat, move.cardIds[0]);
  return card?.kind === "skip";
}

function cardsFromIds(state: GameState, seat: number, cardIds: string[]): Card[] {
  const p = state.players[seat];
  return cardIds
    .map(
      (id) => p.hand.find((c) => c.id === id) ?? p.faceUp.find((c) => c.id === id),
    )
    .filter((c): c is Card => !!c);
}

/** Cards scooped from under the played card(s) on a higher play (engine: rest of stack → hand). */
export function countPileCardsToHand(prev: GameState, move: Move): number {
  return Math.max(0, prev.stack.length - move.cardIds.length);
}

export function pileToHandPhrase(prev: GameState, move: Move): string {
  const n = countPileCardsToHand(prev, move);
  if (n === 0) return "pile to hand";
  return n === 1 ? "1 card to hand" : `${n} cards to hand`;
}

/** Second line for Last 4 Plays — what actually happened (no player name). */
export function turnLogMoveAction(
  prev: GameState,
  next: GameState,
  move: Move,
): string {
  const seat = prev.currentSeat;
  const played = cardsFromMove(prev, seat, move);
  const cards = formatPlayedCards(played);
  const T = topValue(prev.stack);

  if (played.some((c) => c.kind === "clear")) {
    const flippedUndercut = move.cardIds.some((id) =>
      prev.players[seat].faceDown.some((c) => c.id === id),
    );
    if (flippedUndercut && move.targetSeat != null) {
      const target = next.players[move.targetSeat]?.name ?? "opponent";
      return `${phraseFlippedCards(played)} — stack to ${target}`;
    }
    return `cleared the stack with ${cards}`;
  }
  if (played.some((c) => c.kind === "skip") || isSkipMove(prev, seat, move)) {
    const target =
      move.targetSeat != null
        ? (next.players[move.targetSeat]?.name ?? "opponent")
        : "next player";
    return `Overcut → ${target}`;
  }
  if (move.cardIds.some((id) => prev.players[seat].faceDown.some((c) => c.id === id))) {
    const flip = phraseFlippedCards(played);
    if (next.pendingHigherConfirm) {
      const handGrew = next.players[seat].hand.length > prev.players[seat].hand.length;
      if (handGrew) {
        return `${flip} — higher than ${formatTopConstraint(T)}, ${pileToHandPhrase(prev, move)}`;
      }
      return `${flip} — add matching ${cards}, then Confirm`;
    }
    return `${flip} — safe play`;
  }
  if (next.pendingHigherConfirm) {
    return `${phrasePlayedCards(played)} — higher than ${formatTopConstraint(T)}, ${pileToHandPhrase(prev, move)}`;
  }
  if (next.stack.length === 0 && prev.stack.length > 0 && played[0]?.kind === "play") {
    return `tap-out with ${cards} — play again`;
  }
  if (next.currentSeat === seat) {
    return `${phrasePlayedCards(played)} — continues turn`;
  }
  return phrasePlayedCards(played);
}

export function turnLogHigherExtension(
  prev: GameState,
  cardIds: string[],
): string {
  const cards = cardsFromIds(prev, prev.currentSeat, cardIds);
  const label = formatPlayedCards(cards);
  return `added ${label} to stack`;
}

export function turnLogHigherExtensionResult(
  prev: GameState,
  next: GameState,
): string {
  if (
    next.stack.length === 0 &&
    prev.stack.length > 0 &&
    !isAwaitingHigherConfirm(next)
  ) {
    return " — tap-out, play again";
  }
  return "";
}

export function turnLogConfirmAction(prev: GameState, next: GameState): string {
  const rank = prev.pendingHigherConfirm?.rank;
  const rankLabel =
    rank != null
      ? formatPlayedCards([{ id: "", kind: "play", value: rank }])
      : "play";

  if (
    next.stack.length === 0 &&
    prev.stack.length > 0 &&
    next.currentSeat === prev.currentSeat
  ) {
    return `confirmed tap-out on ${rankLabel} — play again`;
  }
  if (next.currentSeat === prev.currentSeat) {
    return `confirmed — ${rankLabel} on stack, play again`;
  }
  return `confirmed — ${rankLabel} on stack, turn ends`;
}

/** Full sentence for the flying summary tile under the stack. */
export function turnLogFlyLine(player: string, action: string): string {
  const trimmed = action.trim();
  if (!trimmed) return player;
  const lower = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  return `${player} ${lower}`;
}

/** @deprecated Use turnLogMoveAction */
export function describeMove(prev: GameState, next: GameState, move: Move): string {
  return turnLogMoveAction(prev, next, move);
}

/** @deprecated Use turnLogHigherExtension */
export function describeHigherExtension(
  prev: GameState,
  cardIds: string[],
): string {
  return turnLogHigherExtension(prev, cardIds);
}

/** @deprecated Use turnLogHigherExtensionResult */
export function describeHigherExtensionResult(
  prev: GameState,
  next: GameState,
): string {
  return turnLogHigherExtensionResult(prev, next);
}

/** @deprecated Use turnLogConfirmAction */
export function describeHigherConfirm(prev: GameState, next: GameState): string {
  return turnLogConfirmAction(prev, next);
}

function newTurnId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Append a play to the current turn, or start a new turn group. Keeps last {@link MAX_TURN_LOG_TURNS} turns. */
export function recordTurnPlay(
  log: TurnLogTurn[],
  player: string,
  seat: number,
  action: string,
  endsTurn: boolean,
): TurnLogTurn[] {
  const trimmed = action.trim();
  if (!trimmed) return trimTurnLog(log);

  const tail = log[log.length - 1];

  if (tail?.inProgress && tail.seat === seat) {
    const turns = [...log];
    turns[turns.length - 1] = {
      ...tail,
      player,
      actions: [...tail.actions, trimmed],
      inProgress: !endsTurn,
    };
    return trimTurnLog(turns);
  }

  const turns = [...log];
  if (tail?.inProgress) {
    turns[turns.length - 1] = { ...tail, inProgress: false };
  }
  turns.push({
    id: newTurnId(),
    player,
    seat,
    actions: [trimmed],
    inProgress: !endsTurn,
  });

  return trimTurnLog(turns);
}

export function trimTurnLog(turns: TurnLogTurn[]): TurnLogTurn[] {
  return turns.slice(-MAX_TURN_LOG_TURNS);
}

/** @deprecated Use recordTurnPlay */
export function appendTurnLog(
  entries: TurnLogTurn[],
  player: string,
  action: string,
): TurnLogTurn[] {
  const seat = entries[entries.length - 1]?.seat ?? 0;
  return recordTurnPlay(entries, player, seat, action, true);
}