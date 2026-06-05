"use client";

import type { Card } from "@underplay/engine";
import { TABLE_SLOTS, type SlotMap, cardInSlot } from "@/lib/cardSlots";
import { PlayingCard } from "./PlayingCard";

interface Props {
  seat: number;
  faceDown: Card[];
  faceUp: Card[];
  slotMap: SlotMap;
  selected: string[];
  interactive: boolean;
  reducedMotion?: boolean;
  onSelect: (id: string) => void;
  compact?: boolean;
  hiddenCardIds?: ReadonlySet<string>;
}

/** Peek of down card: up shares bottom-center anchor, nudged slightly up-right (stays in slot). */
const UP_NUDGE = { x: 5, y: -5 };
const UP_NUDGE_COMPACT = { x: 4, y: -4 };

export function PlayerTableSlots({
  seat,
  faceDown,
  faceUp,
  slotMap,
  selected,
  interactive,
  reducedMotion,
  onSelect,
  compact,
  hiddenCardIds,
}: Props) {
  const slotW = compact ? "w-14" : "w-[4.5rem]";
  const slotH = compact ? "h-20" : "h-[6.5rem]";
  const gap = compact ? "gap-3" : "gap-5";
  const nudge = compact ? UP_NUDGE_COMPACT : UP_NUDGE;

  return (
    <div className={`grid grid-cols-4 ${gap} justify-center w-fit mx-auto`}>
      {Array.from({ length: TABLE_SLOTS }, (_, slot) => {
        const down = cardInSlot(faceDown, slotMap, slot);
        const up = cardInSlot(faceUp, slotMap, slot);
        const uncovered =
          !!down &&
          (down.slot != null
            ? !faceUp.some((u) => u.slot === down.slot)
            : !up);

        return (
          <div key={slot} className={`relative ${slotW} ${slotH} shrink-0 overflow-visible`}>
            <div
              data-deal-target={`seat-${seat}-slot-${slot}-down`}
              className={`absolute bottom-0 left-1/2 z-0 ${slotW} ${slotH} pointer-events-none`}
              style={{ transform: "translateX(-50%)" }}
              aria-hidden
            />
            <div
              data-deal-target={`seat-${seat}-slot-${slot}-up`}
              className={`absolute bottom-0 left-1/2 z-[5] ${slotW} ${slotH} pointer-events-none`}
              style={{
                transform: `translate(calc(-50% + ${nudge.x}px), ${nudge.y}px)`,
              }}
              aria-hidden
            />
            {down && (
              <div
                data-play-card={down.id}
                className={`absolute bottom-0 left-1/2 z-0 transition-opacity duration-150 ${hiddenCardIds?.has(down.id) ? "opacity-0" : ""}`}
                style={{ transform: "translateX(-50%)" }}
              >
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
                data-play-card={up.id}
                className={`absolute bottom-0 left-1/2 z-10 transition-opacity duration-150 ${hiddenCardIds?.has(up.id) ? "opacity-0" : ""}`}
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
          </div>
        );
      })}
    </div>
  );
}