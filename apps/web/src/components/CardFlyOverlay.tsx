"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { FlyingCardSpec } from "@/lib/cardFly";
import { DEAL_FLY_DURATION_S } from "@/lib/dealFly";
import {
  FACE_UP_SOURCE_HOLD_S,
  FLY_DURATION_S,
  FLY_FLIP_REVEAL_S,
  playFlyEndDelayS,
} from "@/lib/cardFly";
import { CARD_STACK_LAND_EASE } from "@/lib/cardMotion";
import { useTheme } from "@/context/ThemeProvider";
import { DeckCardImage } from "./DeckCardImage";

interface Props {
  specs: FlyingCardSpec[];
  reducedMotion?: boolean;
  dealFlight?: boolean;
  stockDealFlight?: boolean;
  stockDealDurationS?: number;
  onComplete: () => void;
  onCardLand?: (spec: FlyingCardSpec) => void;
}

function CardFaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full rounded-[0.35rem] overflow-hidden shadow-[0_10px_28px_rgba(0,0,0,0.5)]">
      {children}
    </div>
  );
}

function CardFaceContent({
  card,
  faceDown,
  deckId,
}: {
  card: FlyingCardSpec["card"];
  faceDown: boolean;
  deckId: ReturnType<typeof useTheme>["deckId"];
}) {
  return (
    <CardFaceShell>
      <DeckCardImage deckId={deckId} card={card} faceDown={faceDown} sizes="80px" />
    </CardFaceShell>
  );
}

/**
 * Play flight: hold at source (back → face if needed), then move to stack showing face only.
 * Avoids 3D backface glitches that left the clone face-down during flight.
 */
function PlayFlyCard({
  spec,
  deckId,
  moveDurationS,
}: {
  spec: FlyingCardSpec;
  deckId: ReturnType<typeof useTheme>["deckId"];
  moveDurationS: number;
}) {
  const needsReveal = !!spec.revealBeforeFly;
  const [revealed, setRevealed] = useState(!needsReveal);
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    const holdS = needsReveal ? FLY_FLIP_REVEAL_S : FACE_UP_SOURCE_HOLD_S;
    const flyAt = (spec.delay + holdS) * 1000;

    if (needsReveal) {
      setRevealed(false);
      const tReveal = window.setTimeout(() => setRevealed(true), flyAt);
      const tFly = window.setTimeout(() => setFlying(true), flyAt);
      return () => {
        clearTimeout(tReveal);
        clearTimeout(tFly);
      };
    }

    setRevealed(true);
    const tFly = window.setTimeout(() => setFlying(true), flyAt);
    return () => clearTimeout(tFly);
  }, [needsReveal, spec.delay, spec.id]);

  const stackEase = [...CARD_STACK_LAND_EASE] as [number, number, number, number];
  const atSource = !flying;

  return (
    <motion.div
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
        left: atSource ? spec.from.left : spec.to.left,
        top: atSource ? spec.from.top : spec.to.top,
        width: atSource ? spec.from.width : spec.to.width,
        height: atSource ? spec.from.height : spec.to.height,
        opacity: 1,
        rotate: flying ? (spec.delay / FLY_DURATION_S) * 4 : 0,
      }}
      transition={
        flying
          ? { duration: moveDurationS, delay: 0, ease: stackEase }
          : { duration: 0 }
      }
    >
      <CardFaceContent
        card={spec.card}
        faceDown={needsReveal && !revealed}
        deckId={deckId}
      />
    </motion.div>
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
  const { deckId } = useTheme();
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
      const sourceHoldS = !dealFlight
        ? spec.revealBeforeFly
          ? FLY_FLIP_REVEAL_S
          : FACE_UP_SOURCE_HOLD_S
        : 0;
      return window.setTimeout(
        () => onCardLand(spec),
        (spec.delay + sourceHoldS + duration) * 1000,
      );
    });
    return () => timers.forEach((t) => clearTimeout(t));
  }, [specs, reducedMotion, duration, onCardLand, dealFlight]);

  if (typeof document === "undefined") return null;
  if (reducedMotion || specs.length === 0) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {specs.map((spec) => {
        const isPlayFlight = !dealFlight;
        const showBackDuringDeal = Boolean(dealFlight && (spec.faceDown ?? true));
        const stackEase = [...CARD_STACK_LAND_EASE] as [number, number, number, number];

        if (isPlayFlight) {
          return (
            <PlayFlyCard
              key={`fly-${spec.id}`}
              spec={spec}
              deckId={deckId}
              moveDurationS={duration}
            />
          );
        }

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
              rotate: spec.delay * 3,
            }}
            transition={{
              duration,
              delay: spec.delay,
              ease:
                stockDealFlight && stockDealDurationS != null
                  ? ("linear" as const)
                  : dealFlight
                    ? ([0.22, 0.72, 0.15, 1] as [number, number, number, number])
                    : stackEase,
            }}
          >
            <CardFaceContent
              card={spec.card}
              faceDown={showBackDuringDeal}
              deckId={deckId}
            />
          </motion.div>
        );
      })}
    </div>,
    document.body,
  );
}