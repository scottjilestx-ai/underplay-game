"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TURN_TILE_WIDTH_CLASS, turnTilePanelClass } from "@/lib/panelTiles";

interface Props {
  myTurn: boolean;
  activeName: string;
  activeIsCpu: boolean;
  waitingOnHumanOpponent: boolean;
  visible: boolean;
  /** Float over playfield (matches Last 4 plays panel). */
  floating?: boolean;
}

export function TurnStatusTile({
  myTurn,
  activeName,
  activeIsCpu,
  waitingOnHumanOpponent,
  visible,
  floating,
}: Props) {
  if (!visible) return null;

  return (
    <div
      className={`${TURN_TILE_WIDTH_CLASS} pointer-events-auto ${
        floating ? `${turnTilePanelClass} px-2 py-2` : "shrink-0"
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={myTurn ? "you" : activeName}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className={`${turnTilePanelClass} px-3 py-2 text-sm font-semibold tracking-wide ${
            myTurn
              ? "text-amber-100 border-amber-400/45 bg-amber-950/55"
              : "text-amber-200/90"
          }`}
        >
          {myTurn ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              Your turn
            </span>
          ) : waitingOnHumanOpponent ? (
            <span className="block text-xs leading-snug font-medium">
              {activeName}&apos;s turn — add a CPU for solo play
            </span>
          ) : (
            <span className="block text-xs leading-snug font-medium truncate">
              {activeName}
              {activeIsCpu ? " is playing" : "'s turn"}…
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}