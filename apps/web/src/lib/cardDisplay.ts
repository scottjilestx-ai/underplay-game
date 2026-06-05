import type { Card } from "@underplay/engine";
import { displaySuitForValue, type DisplaySuit } from "@/lib/cardSuits";

const RANK_LABEL: Record<number, string> = {
  11: "J",
  12: "Q",
  13: "K",
};

const SUIT_SYMBOL: Record<DisplaySuit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

const RANK_WORD: Record<number, string> = {
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "jack",
  12: "queen",
  13: "king",
};

const RANK_WORD_PLURAL: Record<number, string> = {
  2: "twos",
  3: "threes",
  4: "fours",
  5: "fives",
  6: "sixes",
  7: "sevens",
  8: "eights",
  9: "nines",
  10: "tens",
  11: "jacks",
  12: "queens",
  13: "kings",
};

export function formatRank(value: number): string {
  return RANK_LABEL[value] ?? String(value);
}

/** Compact label for one card, e.g. J♠ or Undercut. */
export function formatCardLabel(card: Card): string {
  if (card.kind === "clear") return "Undercut";
  if (card.kind === "skip") return "Overcut";
  const v = card.value ?? 0;
  return `${formatRank(v)}${SUIT_SYMBOL[displaySuitForValue(v)]}`;
}

/** What was played, e.g. "J♠" or "6♥ ×3". */
export function formatPlayedCards(cards: Card[]): string {
  if (!cards.length) return "cards";
  const first = cards[0];
  if (first.kind === "clear") return "Undercut";
  if (first.kind === "skip") return "Overcut";
  const label = formatCardLabel(first);
  return cards.length > 1 ? `${label} ×${cards.length}` : label;
}

/** Natural phrase without player name, e.g. "played jack of spades (J♠)". */
export function phrasePlayedCards(cards: Card[]): string {
  if (!cards.length) return "played cards";
  const first = cards[0];
  if (first.kind === "clear") return "cleared the stack (Undercut)";
  if (first.kind === "skip") return "played Overcut";
  const v = first.value ?? 0;
  const label = formatCardLabel(first);
  if (cards.length > 1) {
    const word = RANK_WORD_PLURAL[v] ?? "cards";
    return `played ${cards.length} ${word} (${label} ×${cards.length})`;
  }
  const word = RANK_WORD[v] ?? "card";
  if (v >= 11) return `played ${word} (${label})`;
  return `played ${word} (${label})`;
}

export function phraseFlippedCards(cards: Card[]): string {
  if (!cards.length) return "flipped a face-down card";
  const first = cards[0];
  if (first.kind === "clear") return "flipped Undercut from the table";
  if (first.kind === "skip") return "flipped Overcut from the table";
  const label = formatCardLabel(first);
  if (cards.length > 1) {
    const v = first.value ?? 0;
    const word = RANK_WORD_PLURAL[v] ?? "cards";
    return `flipped ${cards.length} ${word} from the table (${label} ×${cards.length})`;
  }
  const v = first.value ?? 0;
  const word = RANK_WORD[v] ?? "card";
  return `flipped ${word} from the table (${label})`;
}

export function formatTopConstraint(T: number | null): string {
  return T != null ? formatRank(T) : "empty stack";
}