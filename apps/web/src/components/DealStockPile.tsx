"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { DeckCardImage } from "./DeckCardImage";

interface Props {
  seat: number;
  count: number;
  reducedMotion?: boolean;
}

export function DealStockPile({ seat, count, reducedMotion }: Props) {
  const { deckId } = useTheme();
  if (count <= 0) {
    return (
      <div
        data-deal-target={`seat-${seat}-stock`}
        className="relative mx-auto h-[6.5rem] w-[4.5rem] shrink-0"
        aria-hidden
      />
    );
  }

  const depth = Math.min(count, 4);

  return (
    <div
      data-deal-target={`seat-${seat}-stock`}
      className="relative mx-auto h-[6.5rem] w-[4.5rem] shrink-0"
      aria-label={`${count} cards`}
    >
      {Array.from({ length: depth }, (_, i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-[0.35rem] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.45)] bg-white pointer-events-none"
          style={{
            transform: `translate(${i * 2}px, ${-i * 2}px)`,
            zIndex: i,
            opacity: i === depth - 1 ? 1 : 0.35,
          }}
          aria-hidden={i < depth - 1}
        >
          {i === depth - 1 ? (
            <motion.div
              className="absolute inset-0"
              initial={reducedMotion ? false : { opacity: 0.6, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.12 }}
            >
              <DeckCardImage deckId={deckId} faceDown sizes="72px" />
            </motion.div>
          ) : (
            <DeckCardImage deckId={deckId} faceDown sizes="72px" />
          )}
        </div>
      ))}
      {count > 1 && (
        <span
          className="absolute -top-1 -right-1 z-10 min-w-[1.25rem] rounded-full bg-amber-500/90 px-1 text-center text-[10px] font-bold text-black tabular-nums shadow"
          aria-hidden
        >
          {count}
        </span>
      )}
    </div>
  );
}