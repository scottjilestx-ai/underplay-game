"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CARD_BACK_SRC, shouldRenderThemedCard } from "@/lib/cardArt";
import { useTheme } from "@/context/ThemeProvider";
import { ThemedCardBack } from "./ThemedCardBack";

interface Props {
  count: number;
  dealEntrance?: boolean;
  reducedMotion?: boolean;
  /** Tighter fan when multiple opponents share the top row. */
  dense?: boolean;
}

const CARD_W_DEFAULT = 40;
const CARD_H_DEFAULT = 56;
const CARD_W_DENSE = 30;
const CARD_H_DENSE = 42;
const MAX_ROTATE_DEG = 22;
const ROTATION_BLEED_PX = 20;

/** Fanned card backs, centered on the same axis as the table row below. */
export function OpponentHandFan({ count, dealEntrance, reducedMotion, dense }: Props) {
  const { themeId } = useTheme();
  const themed = shouldRenderThemedCard(themeId);
  if (count <= 0) return null;

  const CARD_W = dense ? CARD_W_DENSE : CARD_W_DEFAULT;
  const CARD_H = dense ? CARD_H_DENSE : CARD_H_DEFAULT;
  const step = dense
    ? count > 9
      ? 5
      : count > 6
        ? 6
        : 8
    : count > 9
      ? 7
      : count > 6
        ? 9
        : 11;
  const mid = (count - 1) / 2;
  const span = Math.max(0, count - 1) * step;
  const rotatePad = 14;
  const boxWidth = CARD_W + span + rotatePad * 2;
  const zoneHeight = CARD_H + ROTATION_BLEED_PX;

  return (
    <div
      className="relative w-full flex justify-center shrink-0"
      style={{ height: zoneHeight }}
      aria-label={`${count} cards in hand`}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          width: boxWidth,
          height: CARD_H,
          bottom: ROTATION_BLEED_PX,
        }}
      >
        {Array.from({ length: count }, (_, i) => {
          const t = count === 1 ? 0 : (i - mid) / mid;
          const rotate = t * MAX_ROTATE_DEG;
          const left = rotatePad + i * step;
          return (
            <motion.div
              key={i}
              className="absolute bottom-0"
              style={{ width: CARD_W, height: CARD_H, left, zIndex: i }}
              initial={
                dealEntrance && !reducedMotion
                  ? { opacity: 0, y: -28, scale: 0.85 }
                  : false
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: dealEntrance ? i * 0.05 + 0.08 : 0,
                duration: 0.3,
                ease: "easeOut",
              }}
            >
              <div
                className="relative w-full h-full rounded-[0.3rem] overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.45)] bg-white"
                style={{
                  transform: `rotate(${rotate}deg)`,
                  transformOrigin: "50% 100%",
                }}
              >
                {themed ? (
                  <ThemedCardBack themeId={themeId} className="h-full w-full" />
                ) : (
                  <Image
                    src={CARD_BACK_SRC}
                    alt=""
                    fill
                    className="object-cover"
                    sizes={dense ? "30px" : "40px"}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}