"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CARD_BACK_SRC } from "@/lib/cardArt";

interface Props {
  phase: "shuffle" | "deal" | null;
  reducedMotion?: boolean;
}

export function DeckAnimation({ phase, reducedMotion }: Props) {
  if (!phase || reducedMotion) return null;

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-[38%] z-30 -translate-x-1/2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
    >
      <motion.div
        animate={
          phase === "shuffle"
            ? { rotate: [0, -6, 6, -4, 4, 0], y: [0, -4, 0, -2, 0] }
            : { y: [0, -12, 0], scale: [1, 1.05, 1] }
        }
        transition={{
          duration: phase === "shuffle" ? 0.9 : 0.5,
          repeat: phase === "shuffle" ? 2 : 0,
          ease: "easeInOut",
        }}
        className="relative h-24 w-[4.5rem] shadow-2xl"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-[0.35rem] overflow-hidden"
            style={{ transform: `translate(${i * 2}px, ${-i * 3}px)` }}
          >
            <Image src={CARD_BACK_SRC} alt="" fill className="object-cover" sizes="72px" />
          </div>
        ))}
      </motion.div>
      <p className="mt-3 text-center text-amber-100/80 text-sm font-medium tracking-wide">
        {phase === "shuffle" ? "Shuffling…" : "Dealing…"}
      </p>
    </motion.div>
  );
}