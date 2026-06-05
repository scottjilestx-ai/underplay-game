"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { FlyingCardSpec } from "@/lib/cardFly";
import { DEAL_FLY_DURATION_S } from "@/lib/dealFly";
import { FLY_DURATION_S } from "@/lib/cardFly";
import { PlayingCard } from "./PlayingCard";

interface Props {
  specs: FlyingCardSpec[];
  reducedMotion?: boolean;
  /** Slower deal flight from the deck. */
  dealFlight?: boolean;
  /** Opening stock deal uses stockDealDurationS (~2s for all cards). */
  stockDealFlight?: boolean;
  stockDealDurationS?: number;
  onComplete: () => void;
}

export function CardFlyOverlay({
  specs,
  reducedMotion,
  dealFlight,
  stockDealFlight,
  stockDealDurationS,
  onComplete,
}: Props) {
  const duration = dealFlight
    ? stockDealFlight && stockDealDurationS != null
      ? stockDealDurationS
      : DEAL_FLY_DURATION_S
    : FLY_DURATION_S;

  useEffect(() => {
    if (reducedMotion || specs.length === 0) {
      onComplete();
      return;
    }
    const maxDelay = Math.max(...specs.map((s) => s.delay));
    const t = setTimeout(onComplete, (maxDelay + duration) * 1000 + 60);
    return () => clearTimeout(t);
  }, [specs, reducedMotion, duration, onComplete]);

  if (typeof document === "undefined") return null;
  if (reducedMotion || specs.length === 0) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {specs.map((spec) => (
        <motion.div
          key={`fly-${spec.id}`}
          className="fixed"
          initial={{
            left: spec.from.left,
            top: spec.from.top,
            width: spec.from.width,
            height: spec.from.height,
            opacity: 1,
            rotate: 0,
            zIndex: 120,
          }}
          animate={{
            left: spec.to.left,
            top: spec.to.top,
            width: spec.to.width,
            height: spec.to.height,
            opacity: 1,
            rotate: dealFlight ? spec.delay * 3 : (spec.delay / FLY_DURATION_S) * 4,
          }}
          transition={{
            duration,
            delay: spec.delay,
            ease:
              stockDealFlight && stockDealDurationS != null
                ? "linear"
                : dealFlight
                  ? [0.22, 0.72, 0.15, 1]
                  : [0.22, 0.85, 0.25, 1],
          }}
        >
          <div className="relative h-full w-full">
            <PlayingCard
              card={spec.card}
              faceDown={spec.faceDown}
              small={spec.small}
              reducedMotion
            />
          </div>
        </motion.div>
      ))}
    </div>,
    document.body,
  );
}