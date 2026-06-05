/** Decorative suit shown on card art (value maps to suit, not engine state). */
export type DisplaySuit = "spades" | "hearts" | "diamonds" | "clubs";

const SUITS: DisplaySuit[] = ["spades", "hearts", "diamonds", "clubs"];

export function displaySuitForValue(value: number): DisplaySuit {
  return SUITS[((value - 2) % 4 + 4) % 4]!;
}

/** Diamond pip cards use SVG so pips match other suits (no boxed diamonds in JPEG art). */
export function usesSvgDiamondPipFace(value: number | undefined): boolean {
  return (
    value != null &&
    value >= 2 &&
    value <= 10 &&
    displaySuitForValue(value) === "diamonds"
  );
}