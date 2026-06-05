import type { GameState } from "@underplay/engine";
import { TABLE_SLOTS, buildSlotMap, cardInSlot } from "@/lib/cardSlots";
import type { FlyRect, FlyingCardSpec } from "@/lib/cardFly";
import {
  cardsInEngineDealOrder,
  faceDownDealOrder,
  faceUpDealOrder,
  type DealSequenceItem,
} from "@/lib/dealOrder";
import { sortHand } from "@/lib/sortCards";

export type OpeningDealTarget = "stock" | "down" | "up";

export type DealFlyFilter = "all" | "opponents" | "human";

/** PlayingCard width (4.5rem) + HandRow gap-2 (8px). */
const HAND_CARD_STEP_PX = 80;

/** Whole opening stock deal (all players, round-robin) should finish in this time. */
export const STOCK_DEAL_TOTAL_S = 2;

/** Face-down / face-up table placement (all slots, round-robin) should finish in this time. */
export const TABLE_DEAL_TOTAL_S = 2;

const STOCK_DEAL_MIN_CARD_S = 0.028;
const TABLE_DEAL_MIN_CARD_S = 0.04;

/** Per-card fly time so the full stock deal completes in ~2s. */
export function stockDealFlyDurationS(state: GameState): number {
  const perPlayer =
    state.rules.faceDownPerPlayer +
    state.rules.faceUpPerPlayer +
    state.rules.handSize;
  const totalCards = state.players.length * perPlayer;
  if (totalCards <= 0) return 0.1;
  return Math.max(STOCK_DEAL_MIN_CARD_S, STOCK_DEAL_TOTAL_S / totalCards);
}

/** All stock cards in one overlay; staggered so the batch finishes in ~STOCK_DEAL_TOTAL_S. */
export function buildStockDealFlySpecs(
  state: GameState,
  humanSeat: number,
): FlyingCardSpec[] {
  const cardDur = stockDealFlyDurationS(state);
  const specs: FlyingCardSpec[] = [];
  let delay = 0;
  for (const item of cardsInEngineDealOrder(state)) {
    const spec = buildSingleOpeningDealFlySpec(state, item, "stock", humanSeat);
    if (!spec) continue;
    specs.push({ ...spec, delay });
    delay += cardDur;
  }
  return specs;
}

/** Per-card fly time so a table phase (down or up) completes in ~TABLE_DEAL_TOTAL_S. */
export function tableDealFlyDurationS(cardCount: number): number {
  if (cardCount <= 0) return 0.1;
  return Math.max(TABLE_DEAL_MIN_CARD_S, TABLE_DEAL_TOTAL_S / cardCount);
}

/** All table cards for one phase in one overlay; staggered to finish in ~TABLE_DEAL_TOTAL_S. */
export function buildTableDealFlySpecs(
  state: GameState,
  phase: "down" | "up",
  humanSeat: number,
): FlyingCardSpec[] {
  const items = phase === "down" ? faceDownDealOrder(state) : faceUpDealOrder(state);
  const cardDur = tableDealFlyDurationS(items.length);
  const specs: FlyingCardSpec[] = [];
  let delay = 0;
  for (const item of items) {
    const spec = buildSingleOpeningDealFlySpec(state, item, phase, humanSeat);
    if (!spec) continue;
    specs.push({ ...spec, delay });
    delay += cardDur;
  }
  return specs;
}

export const DEAL_FLY_DURATION_S = 1.2;
export const DEAL_FLY_STAGGER_S = 0.13;

const TABLE_FLY_W = 56;
const TABLE_FLY_H = 80;
const HAND_FLY_W = 72;
const HAND_FLY_H = 104;

function deckSourceRect(): FlyRect {
  const deck = document.querySelector('[data-fly-source="deck"]');
  if (deck) {
    const r = deck.getBoundingClientRect();
    return {
      left: r.left + r.width / 2 - HAND_FLY_W / 2,
      top: r.top + r.height / 2 - HAND_FLY_H / 2,
      width: HAND_FLY_W,
      height: HAND_FLY_H,
    };
  }
  return {
    left: window.innerWidth / 2 - HAND_FLY_W / 2,
    top: window.innerHeight * 0.42 - HAND_FLY_H / 2,
    width: HAND_FLY_W,
    height: HAND_FLY_H,
  };
}

function targetRect(selector: string, w: number, h: number): FlyRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    left: r.left + r.width / 2 - w / 2,
    top: r.top + r.height / 2 - h / 2,
    width: w,
    height: h,
  };
}

export function dealFlyDurationMs(cardCount: number): number {
  return Math.ceil(
    (DEAL_FLY_DURATION_S + Math.max(0, cardCount - 1) * DEAL_FLY_STAGGER_S) * 1000,
  ) + 100;
}

function includesPlayer(seat: number, humanSeat: number, filter: DealFlyFilter): boolean {
  if (filter === "all") return true;
  if (filter === "opponents") return seat !== humanSeat;
  return seat === humanSeat;
}

function handTargetFromRow(
  row: Element,
  index: number,
  count: number,
): FlyRect {
  const r = row.getBoundingClientRect();
  const totalW = count * HAND_FLY_W + Math.max(0, count - 1) * 8;
  const startX = r.left + r.width / 2 - totalW / 2;
  return {
    left: startX + index * HAND_CARD_STEP_PX,
    top: r.top + r.height / 2 - HAND_FLY_H / 2,
    width: HAND_FLY_W,
    height: HAND_FLY_H,
  };
}

/** Wait until the human hand row is laid out (player zone mounts on deal-hand). */
function stockTargetRect(seat: number, stockIndex: number): FlyRect | null {
  const el = document.querySelector(`[data-deal-target="seat-${seat}-stock"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const offset = Math.min(stockIndex, 12) * 2;
  return {
    left: r.left + r.width / 2 - HAND_FLY_W / 2 + offset,
    top: r.top + r.height / 2 - HAND_FLY_H / 2 - offset,
    width: HAND_FLY_W,
    height: HAND_FLY_H,
  };
}

/** One card, one flight — used for the opening deal cadence. */
export function buildSingleOpeningDealFlySpec(
  state: GameState,
  item: DealSequenceItem,
  target: OpeningDealTarget,
  humanSeat: number,
): FlyingCardSpec | null {
  const from = deckSourceRect();
  const { seat, card } = item;

  if (target === "stock") {
    const to = stockTargetRect(seat, item.stockIndex);
    if (!to) return null;
    return {
      id: card.id,
      card,
      from: { ...from },
      to,
      delay: 0,
      faceDown: true,
      small: seat !== humanSeat,
    };
  }

  if (target === "down") {
    const to = targetRect(
      `[data-deal-target="seat-${seat}-slot-${item.slot}-down"]`,
      TABLE_FLY_W,
      TABLE_FLY_H,
    );
    if (!to) return null;
    return {
      id: card.id,
      card,
      from: { ...from },
      to,
      delay: 0,
      faceDown: true,
      small: true,
    };
  }

  const to = targetRect(
    `[data-deal-target="seat-${seat}-slot-${item.slot}-up"]`,
    TABLE_FLY_W,
    TABLE_FLY_H,
  );
  if (!to) return null;
  return {
    id: card.id,
    card,
    from: { ...from },
    to,
    delay: 0,
    faceDown: true,
    small: true,
  };
}

export function waitForStockTargets(
  state: GameState,
  maxFrames = 40,
): Promise<void> {
  return new Promise((resolve) => {
    let frame = 0;
    const tick = () => {
      const ready = state.players.every((p) =>
        document.querySelector(`[data-deal-target="seat-${p.seat}-stock"]`),
      );
      if (ready || frame >= maxFrames) {
        resolve();
        return;
      }
      frame += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export function waitForHumanHandTargets(
  state: GameState,
  humanSeat: number,
  maxFrames = 40,
): Promise<void> {
  const cards = sortHand(state.players[humanSeat]?.hand ?? []);
  const selectors = cards.map(
    (c) => `[data-deal-target="seat-${humanSeat}-hand-${CSS.escape(c.id)}"]`,
  );

  return new Promise((resolve) => {
    let frame = 0;
    const tick = () => {
      const row = document.querySelector(
        `[data-deal-target="seat-${humanSeat}-hand-row"]`,
      );
      const ready =
        !!row &&
        (selectors.length === 0 ||
          selectors.every((s) => document.querySelector(s)));
      if (ready || frame >= maxFrames) {
        resolve();
        return;
      }
      frame += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export function buildOpeningDealFlySpecs(
  state: GameState,
  phase: "down" | "up" | "hand",
  humanSeat: number,
  filter: DealFlyFilter = "all",
): FlyingCardSpec[] {
  const from = deckSourceRect();
  const specs: FlyingCardSpec[] = [];
  let delay = 0;

  for (const player of state.players) {
    if (!includesPlayer(player.seat, humanSeat, filter)) continue;
    const slotMap = buildSlotMap(player.faceDown, player.faceUp);

    if (phase === "down" || phase === "up") {
      const zone = phase;
      const cards = phase === "down" ? player.faceDown : player.faceUp;
      if (!cards.length) continue;
      for (let slot = 0; slot < TABLE_SLOTS; slot++) {
        const card = cardInSlot(cards, slotMap, slot);
        if (!card) continue;
        const to = targetRect(
          `[data-deal-target="seat-${player.seat}-slot-${slot}-${zone}"]`,
          TABLE_FLY_W,
          TABLE_FLY_H,
        );
        if (!to) continue;
        specs.push({
          id: card.id,
          card,
          from: { ...from },
          to,
          delay: 0,
          faceDown: true,
          small: true,
        });
      }
    } else {
      const opponentSource =
        player.seat !== humanSeat
          ? targetRect(`[data-fly-source="opponent-${player.seat}"]`, HAND_FLY_W, HAND_FLY_H)
          : null;

      const handCards =
        player.seat === humanSeat ? sortHand(player.hand) : player.hand;
      const handMid = (handCards.length - 1) / 2;
      const handRow =
        player.seat === humanSeat
          ? document.querySelector(
              `[data-deal-target="seat-${player.seat}-hand-row"]`,
            )
          : null;

      for (let i = 0; i < handCards.length; i++) {
        const card = handCards[i];
        let to =
          targetRect(
            `[data-deal-target="seat-${player.seat}-hand-${CSS.escape(card.id)}"]`,
            HAND_FLY_W,
            HAND_FLY_H,
          ) ?? opponentSource;

        if (!to && handRow) {
          to = handTargetFromRow(handRow, i, handCards.length);
        }
        if (!to) continue;

        if (opponentSource && player.seat !== humanSeat) {
          to = { ...to, left: to.left + (i - handMid) * 14 };
        }
        specs.push({
          id: card.id,
          card,
          from: { ...from },
          to,
          delay,
          faceDown: player.seat !== humanSeat,
          small: player.seat !== humanSeat,
        });
        delay += DEAL_FLY_STAGGER_S;
      }
    }
  }

  if (phase === "down" || phase === "up") {
    const cardDur = tableDealFlyDurationS(specs.length);
    return specs.map((spec, i) => ({ ...spec, delay: i * cardDur }));
  }

  return specs;
}