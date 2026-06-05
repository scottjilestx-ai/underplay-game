/**
 * Card flight timing/easing inspired by pakastin's deck-of-cards (MIT).
 * @see https://github.com/deck-of-cards/deck-of-cards
 * @see https://deck.of.cards/old
 */

/** deck-of-cards default animateTo duration (ms). */
export const CARD_PLAY_DURATION_MS = 500;

/** Framer Motion cubic-bezier approximating deck-of-cards `quartOut`. */
export const CARD_PLAY_EASE = [0.25, 1, 0.5, 1] as const;

/** Slightly softer landing on stack (quadOut). */
export const CARD_STACK_LAND_EASE = [0.5, 1, 0.5, 1] as const;

export const CARD_FLIP_DURATION_MS = 300;

/** Stagger between cards in a multi-card play (ms). */
export const CARD_PLAY_STAGGER_MS = 90;

/** Easing functions ported from deck-of-cards/lib/ease.js (MIT). */
export const deckEase = {
  linear: (t: number) => t,
  quadOut: (t: number) => t * (2 - t),
  cubicOut: (t: number) => {
    const u = t - 1;
    return u * u * u + 1;
  },
  quartOut: (t: number) => {
    const u = t - 1;
    return 1 - u * u * u * u;
  },
  quartInOut: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
} as const;