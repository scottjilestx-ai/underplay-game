"use client";

import { motion } from "framer-motion";
import type { Card } from "@underplay/engine";
import { PlayingCard } from "./PlayingCard";

interface Props {
  card: Card;
  reducedMotion?: boolean;
  compact?: boolean;
}

/** Overcut stays in the player's area until the skip on the target is consumed. */
export function OvercutPlaySlot({ card, reducedMotion, compact }: Props) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.88 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="flex justify-center py-1"
      data-overcut-held={card.id}
      aria-label="Overcut in play"
    >
      <div className="rounded-lg ring-2 ring-rose-400/70 shadow-lg shadow-rose-900/30">
        <PlayingCard card={card} small={compact} reducedMotion={reducedMotion} />
      </div>
    </motion.div>
  );
}