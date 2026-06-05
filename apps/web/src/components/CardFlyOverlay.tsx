"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Image from "next/image";
import type { FlyingCardSpec } from "@/lib/cardFly";
import { DEAL_FLY_DURATION_S } from "@/lib/dealFly";
import { CARD_BACK_SRC, cardFaceSrc } from "@/lib/cardArt";
import { FLY_DURATION_S } from "@/lib/cardFly";
import { usesSvgDiamondPipFace } from "@/lib/cardSuits";
import { PipCardFace } from "./PipCardFace";

interface Props {
  specs: FlyingCardSpec[];
  reducedMotion?: boolean;
  dealFlight?: boolean;
  stockDealFlight?: boolean;
  stockDealDurationS?: number;
  onComplete: () => void;
  /** Called when each card's flight finishes (opening deal stock pile). */
  onCardLand?: (spec: FlyingCardSpec) => void;
}

function FlyingCardFace({ spec }: { spec: FlyingCardSpec }) {
  const showBack = spec.faceDown ?? true;
  const svgDiamondPip =
    !showBack && usesSvgDiamondPipFace(spec.card.value);

  return (
    <div className="relative h-full w-full rounded-[0.35rem] overflow-hidden bg-white shadow-[0_10px_28px_rgba(0,0,0,0.5)]">
      {svgDiamondPip ? (
        <PipCardFace value={spec.card.value!} className="h-full w-full" />
      ) : (
        <Image
          src={showBack ? CARD_BACK_SRC : cardFaceSrc(spec.card)}
          alt=""
          fill
          className="object-cover"
          sizes="80px"
        />
      )}
    </div>
  );
}

export function CardFlyOverlay({
  specs,
  reducedMotion,
  dealFlight,
  stockDealFlight,
  stockDealDurationS,
  onComplete,
  onCardLand,
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

  useEffect(() => {
    if (reducedMotion || !onCardLand || specs.length === 0) return;
    const timers = specs.map((spec) =>
      window.setTimeout(
        () => onCardLand(spec),
        (spec.delay + duration) * 1000,
      ),
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [specs, reducedMotion, duration, onCardLand]);

  if (typeof document === "undefined") return null;
  if (reducedMotion || specs.length === 0) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {specs.map((spec) => (
        <motion.div
          key={`fly-${spec.id}`}
          className="fixed overflow-hidden rounded-[0.35rem]"
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
          <FlyingCardFace spec={spec} />
        </motion.div>
      ))}
    </div>,
    document.body,
  );
}