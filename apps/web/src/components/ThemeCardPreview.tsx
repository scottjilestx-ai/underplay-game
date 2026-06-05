"use client";

import Image from "next/image";
import type { Card } from "@underplay/engine";
import { deckBackSrc, deckFaceSrc, getCardDeck, type CardDeckId } from "@/lib/cardDecks";

const SAMPLE_CLEAR: Card = { id: "preview-clear", kind: "clear" };
const SAMPLE_SKIP: Card = { id: "preview-skip", kind: "skip" };

function sampleFace(deckId: CardDeckId): Card {
  const rank = getCardDeck(deckId).previewRank;
  return { id: `preview-${deckId}`, kind: "play", value: rank };
}

interface Props {
  deckId: CardDeckId;
  className?: string;
}

export function DeckCardMini({ deckId, className = "" }: Props) {
  return (
    <div
      className={`relative w-11 h-[3.9rem] rounded-[0.3rem] overflow-hidden shadow-md bg-white ${className}`}
    >
      <Image src={deckBackSrc(deckId)} alt="" fill className="object-contain" sizes="44px" />
    </div>
  );
}

export function DeckCardStrip({ deckId, className = "" }: Props) {
  const face = sampleFace(deckId);

  return (
    <div className={`flex gap-2 ${className}`}>
      {[
        { faceDown: true as const, card: undefined },
        { faceDown: false as const, card: face },
        { faceDown: false as const, card: SAMPLE_CLEAR },
        { faceDown: false as const, card: SAMPLE_SKIP },
      ].map((item, i) => (
        <div
          key={i}
          className="relative w-[3.25rem] h-[4.75rem] rounded-[0.3rem] overflow-hidden shadow-lg shrink-0 bg-[#f2ebe0]"
        >
          <Image
            src={
              item.faceDown ? deckBackSrc(deckId) : deckFaceSrc(deckId, item.card!)
            }
            alt=""
            fill
            className="object-contain"
            sizes="52px"
          />
        </div>
      ))}
    </div>
  );
}