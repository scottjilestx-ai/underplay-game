"use client";

import { motion } from "framer-motion";
import type { Card } from "@underplay/engine";
import { TABLE_SLOTS, type SlotMap, cardInSlot } from "@/lib/cardSlots";
import { PlayingCard } from "./PlayingCard";

interface Props {
  faceDown: Card[];
  faceUp: Card[];
  slotMap: SlotMap;
  selected: string[];
  interactive: boolean;
  reducedMotion?: boolean;
  dealing?: boolean;
  onSelect: (id: string) => void;
  compact?: boolean;
}

export function PlayerTableSlots({
  faceDown,
  faceUp,
  slotMap,
  selected,
  interactive,
  reducedMotion,
  dealing,
  onSelect,
  compact,
}: Props) {
  const slotW = compact ? "w-12" : "w-[4.75rem]";
  const slotH = compact ? "h-[4.5rem]" : "h-[7.25rem]";

  return (
    <div className={`flex gap-2 sm:gap-3 justify-center ${compact ? "" : "px-2"}`}>
      {Array.from({ length: TABLE_SLOTS }, (_, slot) => {
        const down = cardInSlot(faceDown, slotMap, slot);
        const up = cardInSlot(faceUp, slotMap, slot);
        const uncovered = !up && !!down;

        return (
          <motion.div
            key={slot}
            className={`relative ${slotW} ${slotH} shrink-0`}
            initial={dealing && !reducedMotion ? { opacity: 0, y: -60, scale: 0.85 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: dealing ? 0.08 * slot + 0.2 : 0, duration: 0.35, ease: "easeOut" }}
          >
            {down && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-0">
                <PlayingCard
                  faceDown
                  small={compact}
                  layoutId={`card-${down.id}`}
                  reducedMotion={reducedMotion}
                  onClick={
                    interactive && uncovered ? () => onSelect(down.id) : undefined
                  }
                  selected={selected.includes(down.id)}
                />
              </div>
            )}
            {up && (
              <div className="absolute bottom-4 left-6 z-10">
                <PlayingCard
                  card={up}
                  small={compact}
                  layoutId={`card-${up.id}`}
                  reducedMotion={reducedMotion}
                  onClick={interactive ? () => onSelect(up.id) : undefined}
                  selected={selected.includes(up.id)}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}