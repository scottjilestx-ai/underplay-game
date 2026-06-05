"use client";

import { motion } from "framer-motion";
import type { Card } from "@underplay/engine";
import { PlayingCard } from "./PlayingCard";

interface Props {
  seat: number;
  cards: Card[];
  selected: string[];
  interactive: boolean;
  reducedMotion?: boolean;
  hiddenCardIds?: ReadonlySet<string>;
  /** Opening: show backs until reveal flip completes. */
  faceDown?: boolean;
  /** Animate layout when card order changes (opening sort). */
  layoutSort?: boolean;
  onSelect: (id: string) => void;
}

/** Hand uses plain DOM (no shared layoutId) so cards never fly to the stack/table. */
export function HandRow({
  seat,
  cards,
  selected,
  interactive,
  reducedMotion,
  hiddenCardIds,
  faceDown,
  layoutSort,
  onSelect,
}: Props) {
  if (cards.length === 0) {
    return <div className="min-h-[7rem] w-full" aria-hidden />;
  }

  return (
    <motion.div
      layout={layoutSort && !reducedMotion}
      data-deal-target={`seat-${seat}-hand-row`}
      className="flex gap-2 justify-start sm:justify-center px-3 py-2 min-h-[7rem] w-full overflow-x-auto overflow-y-visible"
    >
      {cards.map((c, i) => (
        <motion.div
          key={c.id}
          layout={layoutSort && !reducedMotion}
          layoutId={layoutSort ? `hand-card-${c.id}` : undefined}
          data-play-card={c.id}
          data-deal-target={`seat-${seat}-hand-${c.id}`}
          className={`shrink-0 ${hiddenCardIds?.has(c.id) ? "opacity-0 pointer-events-none" : "transition-opacity duration-150"}`}
          initial={
            faceDown && !reducedMotion
              ? { opacity: 0, rotateY: 90 }
              : false
          }
          animate={
            faceDown && !reducedMotion
              ? { opacity: 1, rotateY: 0 }
              : { opacity: 1, rotateY: 0 }
          }
          transition={{
            delay: faceDown && !reducedMotion ? i * 0.05 : 0,
            duration: 0.35,
            ease: "easeOut",
          }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <PlayingCard
            card={c}
            faceDown={faceDown}
            selected={selected.includes(c.id)}
            onClick={interactive ? () => onSelect(c.id) : undefined}
            reducedMotion={reducedMotion}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}