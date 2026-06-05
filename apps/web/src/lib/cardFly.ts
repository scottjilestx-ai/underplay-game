import type { Card } from "@underplay/engine";

export interface FlyRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FlyingCardSpec {
  id: string;
  card: Card;
  from: FlyRect;
  to: FlyRect;
  delay: number;
  faceDown?: boolean;
  /** @deprecated deal/play flights use fill sizing from from/to rects */
  small?: boolean;
  /** Opening stock deal: increment pile when this card lands. */
  stockSeat?: number;
  /** Face-down flip: reveal at source, then fly face-up to the stack. */
  revealBeforeFly?: boolean;
}

export const FLY_FLIP_REVEAL_S = 0.3;

/** Matches PlayingCard default size (4.5rem × 6.5rem at 16px root). */
export const FLY_CARD_WIDTH = 72;
export const FLY_CARD_HEIGHT = 104;

export const FLY_DURATION_S = 0.72;
export const FLY_STAGGER_S = 0.09;

function stackLandingRects(count: number): FlyRect[] {
  const stack = document.querySelector('[data-fly-target="stack"]');
  if (!stack) return [];
  const s = stack.getBoundingClientRect();
  const baseX = s.left + s.width / 2 - FLY_CARD_WIDTH / 2;
  const baseY = s.top + s.height / 2 - FLY_CARD_HEIGHT / 2;
  const startIdx = Math.max(0, count - 1);
  return Array.from({ length: count }, (_, i) => {
    const offset = i - startIdx;
    return {
      left: baseX + offset * 14,
      top: baseY + offset * 4,
      width: FLY_CARD_WIDTH,
      height: FLY_CARD_HEIGHT,
    };
  });
}

function rectFromElement(el: Element, index: number, total: number): FlyRect {
  const r = el.getBoundingClientRect();
  const spread = (index - (total - 1) / 2) * 10;
  return {
    left: r.left + r.width / 2 - FLY_CARD_WIDTH / 2 + spread,
    top: r.top + r.height / 2 - FLY_CARD_HEIGHT / 2,
    width: FLY_CARD_WIDTH,
    height: FLY_CARD_HEIGHT,
  };
}

export interface BuildFlySpecsOptions {
  /** Card ids played from face-down table slots — flip before flying. */
  revealBeforeFlyIds?: ReadonlySet<string>;
}

/** @param sourceSeat CPU/opponent seat — uses [data-fly-source] when card elements are hidden */
export function buildFlySpecs(
  cardIds: string[],
  cards: Card[],
  sourceSeat?: number,
  options?: BuildFlySpecsOptions,
): FlyingCardSpec[] | null {
  const targets = stackLandingRects(cardIds.length);
  if (!targets.length) return null;

  const fallbackSource =
    sourceSeat != null
      ? document.querySelector(`[data-fly-source="opponent-${sourceSeat}"]`)
      : null;

  const specs: FlyingCardSpec[] = [];
  for (let i = 0; i < cardIds.length; i++) {
    const id = cardIds[i];
    const card = cards.find((c) => c.id === id);
    if (!card) continue;
    const el =
      document.querySelector(`[data-play-card="${CSS.escape(id)}"]`) ?? fallbackSource;
    if (!el) continue;
    const from = rectFromElement(el, i, cardIds.length);
    const revealBeforeFly = options?.revealBeforeFlyIds?.has(id) ?? false;
    specs.push({
      id,
      card,
      from,
      to: targets[i],
      delay: i * FLY_STAGGER_S,
      faceDown: false,
      revealBeforeFly,
    });
  }
  return specs.length ? specs : null;
}

export function playFlyEndDelayS(specs: FlyingCardSpec[]): number {
  if (!specs.length) return 0;
  return Math.max(
    ...specs.map(
      (s) =>
        s.delay +
        (s.revealBeforeFly ? FLY_FLIP_REVEAL_S : 0) +
        FLY_DURATION_S,
    ),
  );
}

export function flyAnimationMs(cardCount: number): number {
  return Math.ceil((FLY_DURATION_S + Math.max(0, cardCount - 1) * FLY_STAGGER_S) * 1000) + 80;
}