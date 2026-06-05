"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Card } from "@underplay/engine";
import { stackZoneHeightRem, stackZoneWidthRem } from "@/lib/cardDimensions";
import { PlayingCard } from "./PlayingCard";

interface Props {
  stack: Card[];
  reducedMotion?: boolean;
  landedCardIds?: ReadonlySet<string>;
}

export function StackPile({ stack, reducedMotion, landedCardIds }: Props) {
  const visible = stack.slice(-6);

  return (
    <div
      data-fly-target="stack"
      className="relative shrink-0"
      style={{
        width: `${stackZoneWidthRem}rem`,
        height: `${stackZoneHeightRem}rem`,
      }}
    >
      <div
        className="absolute inset-0 rounded-[0.35rem] border-2 border-dashed border-amber-400/40 bg-amber-950/20 shadow-[inset_0_0_24px_rgba(0,0,0,0.25)] flex flex-col items-center justify-center gap-1 px-3 pointer-events-none z-0"
        aria-hidden
      >
        <span className="text-amber-200/55 text-xs uppercase tracking-[0.2em] font-semibold">
          Stack
        </span>
        {stack.length === 0 && (
          <span className="text-amber-200/35 text-[10px] italic text-center leading-tight">
            play anything
          </span>
        )}
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="relative w-[4.5rem] h-[6.5rem]">
          <AnimatePresence mode="popLayout">
            {stack.length > 0 &&
              visible.map((c, i) => {
                const isTop = i === visible.length - 1;
                const offset = i - (visible.length - 1);
                const justLanded = landedCardIds?.has(c.id);
                return (
                  <motion.div
                    key={`stack-${c.id}`}
                    className="absolute left-1/2 top-1/2"
                    style={{ marginLeft: "-2.25rem", marginTop: "-3.25rem" }}
                    initial={
                      reducedMotion || justLanded
                        ? false
                        : { opacity: 0, y: 40, scale: 0.88 }
                    }
                    animate={{
                      opacity: 1,
                      y: offset * 4,
                      x: offset * 14,
                      rotate: offset * 2.5,
                      scale: isTop ? 1 : 0.96,
                      zIndex: 10 + i,
                    }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.85 }}
                    transition={
                      reducedMotion
                        ? { duration: 0.12 }
                        : { type: "spring", stiffness: 200, damping: 22, mass: 1.1 }
                    }
                  >
                    <PlayingCard card={c} small={!isTop} reducedMotion={reducedMotion} />
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}