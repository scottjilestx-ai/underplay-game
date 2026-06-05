"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Card } from "@underplay/engine";
import { deckBackSrc, deckFaceSrc } from "@/lib/cardArt";
import { primeAudioFromGesture } from "@/lib/audio";
import { useTheme } from "@/context/ThemeProvider";

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
  const { deckId } = useTheme();
  const w = small ? "w-14 h-20" : "w-[4.5rem] h-[6.5rem]";
  const showBack = faceDown || !card;
  const src = showBack ? deckBackSrc(deckId) : deckFaceSrc(deckId, card!);

  return (
    <motion.button
      type="button"
      data-card-face={showBack ? "down" : "up"}
      onPointerDown={() => {
        if (onClick) primeAudioFromGesture();
      }}
      onClick={onClick}
      disabled={!onClick}
      whileHover={onClick && !reducedMotion ? { y: -8, scale: 1.03 } : undefined}
      whileTap={onClick && !reducedMotion ? { scale: 0.97 } : undefined}
      className={`${w} relative shrink-0 ${onClick ? "cursor-pointer" : "cursor-default"} ${selected ? "ring-2 ring-[var(--theme-accent)] ring-offset-2 ring-offset-[var(--table-felt-base)] z-10" : ""}`}
    >
      <div className="absolute inset-0 rounded-[0.35rem] shadow-[0_10px_28px_rgba(0,0,0,0.5),0_2px_6px_rgba(0,0,0,0.35)] overflow-hidden bg-white">
        <Image
          src={src}
          alt={showBack ? "Card back" : "Playing card"}
          fill
          className="object-contain"
          sizes={small ? "56px" : "72px"}
          priority={showBack}
        />
      </div>
    </motion.button>
  );
}