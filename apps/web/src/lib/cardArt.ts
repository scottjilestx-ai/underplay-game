import type { Card } from "@underplay/engine";
import type { GameThemeId } from "@/lib/themes";
import { usesThemedSvgDeck } from "@/lib/themes";

/** Default Bicycle-style JPEG deck (fallback / legacy). */
export function cardFaceSrc(card: Card): string {
  if (card.kind === "clear") return "/cards/faces/clear.jpg";
  if (card.kind === "skip") return "/cards/faces/skip.jpg";
  const value = card.value ?? 2;
  const padded = String(value).padStart(2, "0");
  return `/cards/faces/${padded}.jpg`;
}

export const CARD_BACK_SRC = "/cards/bicycle-back.jpg";

export function shouldRenderThemedCard(themeId: GameThemeId): boolean {
  return usesThemedSvgDeck(themeId);
}