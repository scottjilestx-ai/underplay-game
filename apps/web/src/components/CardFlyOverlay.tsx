"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Image from "next/image";
import type { FlyingCardSpec } from "@/lib/cardFly";
import { DEAL_FLY_DURATION_S } from "@/lib/dealFly";
import { CARD_BACK_SRC, cardFaceSrc } from "@/lib/cardArt";
import { FLY_DURATION_S, FLY_FLIP_REVEAL_S, playFlyEndDelayS } from "@/lib/cardFly";
import { CARD_PLAY_EASE, CARD_STACK_LAND_EASE } from "@/lib/cardMotion";
import { usesSvgDiamondPipFace } from "@/lib/cardSuits";
import { PipCardFace } from "./PipCardFace";

interface Props {
  specs: FlyingCardSpec[];
  reducedMotion?: boolean;
  dealFlight?: boolean;
  stockDealFlight?: boolean;
  stockDealDurationS?: number;
  onComplete: () => void;
  onCardLand?: (spec: FlyingCardSpec) => void;
}

function CardFaceContent({
  card,
  faceDown,
}: {
  card: FlyingCardSpec["card"];
  faceDown: boolean;
}) {
  const showBack = faceDown;
  const svgDiamondPip = !showBack && usesSvgDiamondPipFace(card.value);

  return (
    <div className="relative h-full w-full rounded-[0.35rem] overflow-hidden bg-white shadow-[0_10px_28px_rgba(0,0,0,0.5)]">
      {svgDiamondPip ? (
        <PipCardFace value={card.value!} className="h-full w-full" />
      ) : (
        <Image
          src={showBack ? CARD_BACK_SRC : cardFaceSrc(card)}
          alt=""
          fill
          className="object-cover"
          sizes="80px"
        />
      )}
    </div>
  );
}

/** Back + face for a 3D flip at the source (face-down table plays). */
function CardFlipFaces({ card }: { card: FlyingCardSpec["card"] }) {
  const svgDiamondPip = usesSvgDiamondPipFace(card.value);
  return (
    <div
      className="relative h-full w-full"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="absolute inset-0"
        style={{ backfaceVisibility: "hidden" }}
      >
        <CardFaceContent card={card} faceDown />
      </div>
      <div
        className="absolute inset-0"
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
        }}
      >
        {svgDiamondPip ? (
          <div className="relative h-full w-full rounded-[0.35rem] overflow-hidden bg-white shadow-[0_10px_28px_rgba(0,0,0,0.5)]">
            <PipCardFace value={card.value!} className="h-full w-full" />
          </div>
        ) : (
          <CardFaceContent card={card} faceDown={false} />
        )}
      </div>
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

  const playEndS = dealFlight ? null : playFlyEndDelayS(specs);

  useEffect(() => {
    if (reducedMotion || specs.length === 0) {
      onComplete();
      return;
    }
    const waitS = dealFlight
      ? Math.max(...specs.map((s) => s.delay)) + duration
      : (playEndS ?? duration);
    const t = setTimeout(onComplete, waitS * 1000 + 60);
    return () => clearTimeout(t);
  }, [specs, reducedMotion, duration, onComplete, dealFlight, playEndS]);

  useEffect(() => {
    if (reducedMotion || !onCardLand || specs.length === 0) return;
    const timers = specs.map((spec) => {
      const flip = spec.revealBeforeFly ? FLY_FLIP_REVEAL_S : 0;
      return window.setTimeout(
        () => onCardLand(spec),
        (spec.delay + flip + duration) * 1000,
      );
    });
    return () => timers.forEach((t) => clearTimeout(t));
  }, [specs, reducedMotion, duration, onCardLand]);

  if (typeof document === "undefined") return null;
  if (reducedMotion || specs.length === 0) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {specs.map((spec) => {
        const flipFirst = !dealFlight && !!spec.revealBeforeFly;
        const flyDelay = spec.delay + (flipFirst ? FLY_FLIP_REVEAL_S : 0);
        const showBackDuringDeal = Boolean(dealFlight && (spec.faceDown ?? true));

        return (
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
              delay: flyDelay,
              ease:
                stockDealFlight && stockDealDurationS != null
                  ? "linear"
                  : dealFlight
                    ? [0.22, 0.72, 0.15, 1]
                    : CARD_STACK_LAND_EASE,
            }}
          >
            {flipFirst ? (
              <motion.div
                className="h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
                initial={{ rotateY: 180 }}
                animate={{ rotateY: 0 }}
                transition={{
                  delay: spec.delay,
                  duration: FLY_FLIP_REVEAL_S,
                  ease: CARD_PLAY_EASE,
                }}
              >
                <CardFlipFaces card={spec.card} />
              </motion.div>
            ) : (
              <CardFaceContent
                card={spec.card}
                faceDown={showBackDuringDeal}
              />
            )}
          </motion.div>
        );
      })}
    </div>,
    document.body,
  );
}