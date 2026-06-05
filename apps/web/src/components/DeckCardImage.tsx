"use client";

import Image from "next/image";
import type { Card } from "@underplay/engine";
import { deckBackSrc, deckFaceSrc } from "@/lib/cardArt";
import type { CardDeckId } from "@/lib/cardDecks";

interface Props {
  deckId: CardDeckId;
  card?: Card;
  faceDown?: boolean;
  className?: string;
  sizes?: string;
}

export function DeckCardImage({
  deckId,
  card,
  faceDown = false,
  className = "h-full w-full",
  sizes = "80px",
}: Props) {
  const showBack = faceDown || !card;
  const src = showBack ? deckBackSrc(deckId) : deckFaceSrc(deckId, card!);

  return (
    <div className={`relative ${className} overflow-hidden bg-[#f2ebe0]`}>
      <Image src={src} alt="" fill className="object-cover" sizes={sizes} />
    </div>
  );
}