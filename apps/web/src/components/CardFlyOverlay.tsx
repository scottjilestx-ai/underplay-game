"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { FlyingCardSpec } from "@/lib/cardFly";
import { DEAL_FLY_DURATION_S } from "@/lib/dealFly";
import { FLY_DURATION_S, FLY_FLIP_REVEAL_S, playFlyEndDelayS } from "@/lib/cardFly";
import { CARD_PLAY_EASE, CARD_STACK_LAND_EASE } from "@/lib/cardMotion";
import { useTheme } from "@/context/ThemeProvider";
import { DeckCardImage } from "./DeckCardImage";

const FACE_UP_HOLD_S = FLY_FLIP_REVEAL_S;

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

function CardFlipFaces({
  card,
  deckId,
}: {
  card: FlyingCardSpec["card"];
  deckId: ReturnType<typeof useTheme>["deckId"];
}) {
  return (
    <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
      <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
        <CardFaceContent card={card} faceDown deckId={deckId} />
      </div>
      <div
        className="absolute inset-0"
        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
      >
        <CardFaceContent card={card} faceDown={false} deckId={deckId} />
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
      const holdS = !dealFlight
        ? spec.revealBeforeFly
          ? FLY_FLIP_REVEAL_S
          : FACE_UP_HOLD_S
        : 0;
      return window.setTimeout(
        () => onCardLand(spec),
        (spec.delay + holdS + duration) * 1000,
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
        const flipAtSource = isPlayFlight && !!spec.revealBeforeFly;
        const holdAtSourceS = isPlayFlight
          ? flipAtSource
            ? FLY_FLIP_REVEAL_S
            : FACE_UP_HOLD_S
          : 0;
        const moveDurationS = duration;
        const totalPlayS = holdAtSourceS + moveDurationS;
        const showBackDuringDeal = Boolean(dealFlight && (spec.faceDown ?? true));

        const stackEase = [...CARD_STACK_LAND_EASE] as [number, number, number, number];
        const positionTransition = isPlayFlight
          ? {
              delay: spec.delay,
              duration: totalPlayS,
              times: [0, holdAtSourceS / totalPlayS, 1] as [number, number, number],
              ease: stackEase,
            }
          : {
              duration: moveDurationS,
              delay: spec.delay,
              ease:
                stockDealFlight && stockDealDurationS != null
                  ? ("linear" as const)
                  : dealFlight
                    ? ([0.22, 0.72, 0.15, 1] as [number, number, number, number])
                    : stackEase,
            };

        const positionAnimate = isPlayFlight
          ? {
              left: [spec.from.left, spec.from.left, spec.to.left],
              top: [spec.from.top, spec.from.top, spec.to.top],
              width: [spec.from.width, spec.from.width, spec.to.width],
              height: [spec.from.height, spec.from.height, spec.to.height],
              opacity: 1,
              rotate: (spec.delay / FLY_DURATION_S) * 4,
            }
          : {
              left: spec.to.left,
              top: spec.to.top,
              width: spec.to.width,
              height: spec.to.height,
              opacity: 1,
              rotate: dealFlight ? spec.delay * 3 : (spec.delay / FLY_DURATION_S) * 4,
            };

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
            animate={positionAnimate}
            transition={positionTransition}
          >
            {flipAtSource ? (
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
                <CardFlipFaces card={spec.card} deckId={deckId} />
              </motion.div>
            ) : (
              <CardFaceContent
                card={spec.card}
                faceDown={showBackDuringDeal}
                deckId={deckId}
              />
            )}
          </motion.div>
        );
      })}
    </div>,
    document.body,
  );
}