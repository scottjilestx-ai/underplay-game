"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { PLAY_SUMMARY_FLY_S } from "@/lib/playSummary";
import { TURN_TILE_WIDTH_CLASS, turnTilePanelClass } from "@/lib/panelTiles";

export type PlaySummaryPhase = "hold" | "fly";

export interface PlaySummaryPayload {
  id: string;
  player: string;
  action: string;
  line: string;
  phase: PlaySummaryPhase;
}

interface Props {
  summary: PlaySummaryPayload;
  reducedMotion?: boolean;
  onFlyComplete: () => void;
}

function measureTarget(): DOMRect | null {
  const land = document.querySelector("[data-turn-history-land]");
  if (land) return land.getBoundingClientRect();
  const panel = document.querySelector("[data-turn-history-panel]");
  return panel?.getBoundingClientRect() ?? null;
}

export function PlaySummaryFly({ summary, reducedMotion, onFlyComplete }: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [flyFrom, setFlyFrom] = useState<DOMRect | null>(null);
  const [flyTo, setFlyTo] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (summary.phase !== "fly") return;
    const anchor = anchorRef.current;
    const target = measureTarget();
    if (anchor) setFlyFrom(anchor.getBoundingClientRect());
    if (target) setFlyTo(target);
  }, [summary.phase, summary.id]);

  const tileClass = `${TURN_TILE_WIDTH_CLASS} ${turnTilePanelClass} px-3 py-2.5 text-center shadow-lg shadow-black/50`;

  const tileBody = (
    <p className="text-xs leading-snug text-amber-100/95 font-medium">{summary.line}</p>
  );

  if (summary.phase === "hold" || (summary.phase === "fly" && (!flyFrom || !flyTo))) {
    return (
      <div
        ref={anchorRef}
        data-play-summary-anchor
        className="flex justify-center w-full min-h-[2.75rem] items-center"
      >
        <motion.div
          key={summary.id}
          initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={tileClass}
        >
          {tileBody}
        </motion.div>
      </div>
    );
  }

  if (!flyFrom || !flyTo) {
    return (
      <div
        ref={anchorRef}
        data-play-summary-anchor
        className="flex justify-center w-full min-h-[2.75rem] items-center"
      >
        <div className={tileClass}>{tileBody}</div>
      </div>
    );
  }

  if (typeof document === "undefined") return null;

  return (
    <>
      <div
        ref={anchorRef}
        data-play-summary-anchor
        className="min-h-[2.75rem] w-full"
        aria-hidden
      />
      {createPortal(
        <motion.div
          className={`fixed z-[90] pointer-events-none ${tileClass}`}
          style={{ width: flyFrom.width, maxWidth: flyFrom.width }}
          initial={{
            left: flyFrom.left,
            top: flyFrom.top,
            opacity: 1,
            scale: 1,
          }}
          animate={{
            left: flyTo.left,
            top: flyTo.top,
            width: flyTo.width,
            opacity: 0.92,
            scale: 0.92,
          }}
          transition={{
            duration: reducedMotion ? 0.2 : PLAY_SUMMARY_FLY_S,
            ease: [0.22, 0.85, 0.25, 1],
          }}
          onAnimationComplete={onFlyComplete}
        >
          {tileBody}
        </motion.div>,
        document.body,
      )}
    </>
  );
}