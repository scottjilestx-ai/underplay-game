"use client";

import { motion } from "framer-motion";
import type { Card } from "@underplay/engine";
import { useTheme } from "@/context/ThemeProvider";
import { ThemedCardBack } from "./ThemedCardBack";
import { ThemedCardFace } from "./ThemedCardFace";

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
  const { themeId } = useTheme();
  const w = small ? "w-14 h-20" : "w-[4.5rem] h-[6.5rem]";
  const showBack = faceDown || !card;

  return (
    <motion.button
      type="button"
      data-card-face={showBack ? "down" : "up"}
      onClick={onClick}
      disabled={!onClick}
      whileHover={onClick && !reducedMotion ? { y: -8, scale: 1.03 } : undefined}
      whileTap={onClick && !reducedMotion ? { scale: 0.97 } : undefined}
      className={`${w} relative shrink-0 ${onClick ? "cursor-pointer" : "cursor-default"} ${selected ? "ring-2 ring-[var(--theme-accent)] ring-offset-2 ring-offset-[var(--table-felt-base)] z-10" : ""}`}
    >
      <div className="absolute inset-0 rounded-[0.35rem] shadow-[0_10px_28px_rgba(0,0,0,0.5),0_2px_6px_rgba(0,0,0,0.35)] overflow-hidden bg-white">
        {showBack ? (
          <ThemedCardBack themeId={themeId} className="h-full w-full" />
        ) : (
          <ThemedCardFace card={card!} themeId={themeId} className="h-full w-full" />
        )}
      </div>
    </motion.button>
  );
}