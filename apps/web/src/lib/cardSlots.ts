import type { Card } from "@underplay/engine";

export const TABLE_SLOTS = 4;

export type SlotMap = Record<string, number>;

export function buildSlotMap(faceDown: Card[], faceUp: Card[]): SlotMap {
  const map: SlotMap = {};
  faceDown.forEach((c, i) => {
    map[c.id] = i;
  });
  faceUp.forEach((c, i) => {
    map[c.id] = i;
  });
  return map;
}

export function cardInSlot(cards: Card[], map: SlotMap, slot: number): Card | undefined {
  return cards.find((c) => map[c.id] === slot);
}