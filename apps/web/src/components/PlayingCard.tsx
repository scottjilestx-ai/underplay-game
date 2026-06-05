"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Card } from "@underplay/engine";
import { CARD_BACK_SRC, cardFaceSrc } from "@/lib/cardArt";
import { usesSvgDiamondPipFace } from "@/lib/cardSuits";
import { PipCardFace } from "./PipCardFace";

interface Props {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  small?: boolean;
  onClick?: () => void;
  reducedMotion?: boolean;
}

export function PlayingCard({
  card,
  faceDown = false,
  selected,
  small,
  onClick,
  reducedMotion,
}: Props) {
  const w = small ? "w-14 h-20" : "w-[4.5rem] h-[6.5rem]";
  const showBack = faceDown || !card;
  const src = showBack ? CARD_BACK_SRC : cardFaceSrc(card!);
  const svgDiamondPip =
    !showBack && card && usesSvgDiamondPipFace(card.value);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      whileHover={onClick && !reducedMotion ? { y: -8, scale: 1.03 } : undefined}
      whileTap={onClick && !reducedMotion ? { scale: 0.97 } : undefined}
      className={`${w} relative shrink-0 ${onClick ? "cursor-pointer" : "cursor-default"} ${selected ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-950 z-10" : ""}`}
    >
      <div className="absolute inset-0 rounded-[0.35rem] shadow-[0_10px_28px_rgba(0,0,0,0.5),0_2px_6px_rgba(0,0,0,0.35)] overflow-hidden bg-white">
        {svgDiamondPip ? (
          <PipCardFace value={card!.value!} className="h-full w-full" />
        ) : (
          <Image
            src={src}
            alt={showBack ? "Card back" : "Playing card"}
            fill
            className="object-cover"
            sizes={small ? "56px" : "72px"}
            priority={showBack}
          />
        )}
      </div>
    </motion.button>
  );
}