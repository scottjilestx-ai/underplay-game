import type { Card } from "@underplay/engine";

/** Raster card image pack (faces + back). */
export type CardDeckId =
  | "bicycle"
  | "kenney"
  | "sketchfab"
  | "classic-diamonds"
  | "classic-hearts"
  | "classic-spades"
  | "classic-clubs";

export interface CardDeck {
  id: CardDeckId;
  name: string;
  shortName: string;
  tagline: string;
  /** CC0 / PD / project — shown in theme browser */
  license: string;
  basePath: string;
  previewRank: number;
}

export const CARD_DECKS: Record<CardDeckId, CardDeck> = {
  bicycle: {
    id: "bicycle",
    name: "Bicycle",
    shortName: "Bicycle",
    tagline: "Photo-style faces — the original UnderPlay deck.",
    license: "Project assets",
    basePath: "/cards/decks/bicycle",
    previewRank: 7,
  },
  kenney: {
    id: "kenney",
    name: "Kenney Pixel",
    shortName: "Kenney",
    tagline: "Crisp pixel-art cards (CC0).",
    license: "CC0 — Kenney.nl",
    basePath: "/cards/decks/kenney",
    previewRank: 7,
  },
  sketchfab: {
    id: "sketchfab",
    name: "Sketchfab Vintage",
    shortName: "Sketchfab",
    tagline: "Distressed casino deck — Dumokan Art (CC BY).",
    license: "CC BY — Dumokan Art / Sketchfab",
    basePath: "/cards/decks/sketchfab",
    previewRank: 8,
  },
  "classic-diamonds": {
    id: "classic-diamonds",
    name: "Classic Diamonds",
    shortName: "Diamonds",
    tagline: "Traditional English pattern — diamond suit.",
    license: "Public domain — Vector Playing Cards",
    basePath: "/cards/decks/classic-diamonds",
    previewRank: 7,
  },
  "classic-hearts": {
    id: "classic-hearts",
    name: "Classic Hearts",
    shortName: "Hearts",
    tagline: "Traditional English pattern — heart suit.",
    license: "Public domain — Vector Playing Cards",
    basePath: "/cards/decks/classic-hearts",
    previewRank: 7,
  },
  "classic-spades": {
    id: "classic-spades",
    name: "Classic Spades",
    shortName: "Spades",
    tagline: "Traditional English pattern — spade suit.",
    license: "Public domain — Vector Playing Cards",
    basePath: "/cards/decks/classic-spades",
    previewRank: 7,
  },
  "classic-clubs": {
    id: "classic-clubs",
    name: "Classic Clubs",
    shortName: "Clubs",
    tagline: "Traditional English pattern — club suit.",
    license: "Public domain — Vector Playing Cards",
    basePath: "/cards/decks/classic-clubs",
    previewRank: 7,
  },
};

export const CARD_DECK_IDS: CardDeckId[] = [
  "bicycle",
  "kenney",
  "sketchfab",
  "classic-diamonds",
  "classic-hearts",
  "classic-spades",
  "classic-clubs",
];

const LEGACY_DECK_MAP: Record<string, CardDeckId> = {
  volt: "bicycle",
  regal: "classic-hearts",
  casino: "bicycle",
  neon: "kenney",
  vintage: "classic-clubs",
  ocean: "classic-spades",
};

export function normalizeDeckId(raw: string | null | undefined): CardDeckId {
  if (!raw) return "bicycle";
  if (raw in CARD_DECKS) return raw as CardDeckId;
  return LEGACY_DECK_MAP[raw] ?? "bicycle";
}

export function getCardDeck(id: CardDeckId): CardDeck {
  return CARD_DECKS[id];
}

export function deckBackSrc(deckId: CardDeckId): string {
  return `${CARD_DECKS[deckId].basePath}/back.jpg`;
}

export function deckFaceSrc(deckId: CardDeckId, card: Card): string {
  const base = CARD_DECKS[deckId].basePath;
  if (card.kind === "clear") return `${base}/faces/clear.jpg`;
  if (card.kind === "skip") return `${base}/faces/skip.jpg`;
  const value = card.value ?? 2;
  const padded = String(value).padStart(2, "0");
  return `${base}/faces/${padded}.jpg`;
}