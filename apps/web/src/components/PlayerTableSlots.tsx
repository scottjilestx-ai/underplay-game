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

/** Peek of down card: up shares center anchor, nudged slightly up-right (px, stays in slot). */
const UP_NUDGE = { x: 5, y: -5 };
const UP_NUDGE_COMPACT = { x: 4, y: -4 };

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
  const slotW = compact ? "w-[3.75rem]" : "w-[4.85rem]";
  const slotH = compact ? "h-[5.25rem]" : "h-[7rem]";
  const gap = compact ? "gap-3" : "gap-5";
  const nudge = compact ? UP_NUDGE_COMPACT : UP_NUDGE;

  return (
    <div className={`flex ${gap} justify-center px-2`}>
      {Array.from({ length: TABLE_SLOTS }, (_, slot) => {
        const down = cardInSlot(faceDown, slotMap, slot);
        const up = cardInSlot(faceUp, slotMap, slot);
        const uncovered = !up && !!down;

        return (
          <motion.div
            key={slot}
            className={`relative ${slotW} ${slotH} shrink-0 overflow-visible`}
            initial={dealing && !reducedMotion ? { opacity: 0, y: -40, scale: 0.9 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: dealing ? 0.08 * slot + 0.2 : 0, duration: 0.35, ease: "easeOut" }}
          >
            {down && (
              <div className="absolute bottom-0 left-1/2 z-0 -translate-x-1/2">
                <PlayingCard
                  faceDown
                  small={compact}
                  reducedMotion={reducedMotion}
                  onClick={
                    interactive && uncovered ? () => onSelect(down.id) : undefined
                  }
                  selected={selected.includes(down.id)}
                />
              </div>
            )}
            {up && (
              <div
                className="absolute bottom-0 left-1/2 z-10"
                style={{
                  transform: `translate(calc(-50% + ${nudge.x}px), ${nudge.y}px)`,
                }}
              >
                <PlayingCard
                  card={up}
                  small={compact}
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