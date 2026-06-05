"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CARD_BACK_SRC } from "@/lib/cardArt";

interface Props {
  seat: number;
  count: number;
  reducedMotion?: boolean;
}

/** Face-down stock during opening deal (cards not yet on table / revealed hand). */
export function DealStockPile({ seat, count, reducedMotion }: Props) {
  if (count <= 0) {
    return (
      <div
        data-deal-target={`seat-${seat}-stock`}
        className="relative mx-auto h-[6.5rem] w-[4.5rem] shrink-0"
        aria-hidden
      />
    );
  }

  const layers = Math.min(count, 8);

  return (
    <div
      data-deal-target={`seat-${seat}-stock`}
      className="relative mx-auto h-[6.5rem] w-[4.5rem] shrink-0"
      aria-label={`${count} cards`}
    >
      {Array.from({ length: layers }, (_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-[0.35rem] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.45)] bg-white"
          style={{ transform: `translate(${i * 2}px, ${-i * 2}px)` }}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.02, duration: 0.15 }}
        >
          <Image src={CARD_BACK_SRC} alt="" fill className="object-cover" sizes="72px" />
        </motion.div>
      ))}
    </div>
  );
}