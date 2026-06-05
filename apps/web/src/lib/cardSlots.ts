import type { Card } from "@underplay/engine";

export const TABLE_SLOTS = 4;

/** Compact opponent table row width (must match PlayerTableSlots compact layout). */
export const OPPONENT_TABLE_SLOT_W_REM = 3.5;
export const OPPONENT_TABLE_SLOT_GAP_REM = 0.75;
export const OPPONENT_TABLE_WIDTH_REM =
  TABLE_SLOTS * OPPONENT_TABLE_SLOT_W_REM +
  (TABLE_SLOTS - 1) * OPPONENT_TABLE_SLOT_GAP_REM;

export type SlotMap = Record<string, number>;

export function buildSlotMap(faceDown: Card[], faceUp: Card[]): SlotMap {
  const map: SlotMap = {};
  faceDown.forEach((c, i) => {
    map[c.id] = c.slot ?? i;
  });
  faceUp.forEach((c, i) => {
    map[c.id] = c.slot ?? i;
  });
  return map;
}

export function cardInSlot(cards: Card[], map: SlotMap, slot: number): Card | undefined {
  return cards.find((c) => map[c.id] === slot);
}