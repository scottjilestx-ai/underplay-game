"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TurnLogEntry } from "@/lib/turnLog";
import { TURN_TILE_WIDTH_CLASS, turnTilePanelClass } from "@/lib/panelTiles";

interface Props {
  entries: TurnLogEntry[];
  reducedMotion?: boolean;
  /** Overlay on playfield — does not consume layout space */
  floating?: boolean;
}

export function TurnHistory({ entries, reducedMotion, floating }: Props) {
  return (
    <div
      data-turn-history-panel
      className={`${TURN_TILE_WIDTH_CLASS} pointer-events-auto ${
        floating ? `${turnTilePanelClass} px-2 py-2` : "shrink-0"
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-amber-200/50 mb-1.5 text-center">
        Last 4 plays
      </p>
      {entries.length === 0 ? (
        <p className="text-amber-200/40 text-xs italic text-center rounded-xl border border-dashed border-amber-500/20 px-3 py-3">
          No plays yet
        </p>
      ) : (
        <motion.ul layout className="flex flex-col gap-2 items-stretch">
          <AnimatePresence initial={false} mode="popLayout">
            {entries.map((e, i) => {
              const isLatest = i === entries.length - 1;
              return (
                <motion.li
                  key={e.id}
                  layout
                  initial={
                    reducedMotion ? false : { opacity: 0, y: 14, scale: 0.92 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={
                    reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: 28, scale: 0.88, transition: { duration: 0.22 } }
                  }
                  transition={{
                    layout: { type: "spring", stiffness: 420, damping: 32 },
                    opacity: { duration: 0.2 },
                  }}
                  className={`rounded-xl border px-3 py-2 shadow-sm ${
                    isLatest
                      ? "border-amber-400/45 bg-amber-950/50 shadow-amber-900/20"
                      : "border-amber-500/20 bg-black/45"
                  }`}
                >
                  <p
                    className={`text-[11px] font-semibold truncate ${
                      isLatest ? "text-amber-200" : "text-amber-200/75"
                    }`}
                  >
                    {e.player}
                  </p>
                  <p
                    className={`text-xs leading-snug mt-0.5 ${
                      isLatest ? "text-amber-100/95" : "text-amber-200/60"
                    }`}
                  >
                    {e.action}
                  </p>
                </motion.li>
              );
            })}
          </AnimatePresence>
          <li
            data-turn-history-land
            className="min-h-[2.5rem] rounded-xl border border-transparent"
            aria-hidden
          />
        </motion.ul>
      )}
    </div>
  );
}