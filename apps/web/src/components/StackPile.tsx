"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Card } from "@underplay/engine";
import { PlayingCard } from "./PlayingCard";

interface Props {
  stack: Card[];
  reducedMotion?: boolean;
}

export function StackPile({ stack, reducedMotion }: Props) {
  const visible = stack.slice(-6);

  return (
    <div className="relative h-[7.5rem] w-[min(100%,22rem)] flex items-center justify-center">
      <AnimatePresence mode="popLayout">
        {stack.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-amber-200/40 text-sm italic"
          >
            Empty — play anything
          </motion.p>
        ) : (
          visible.map((c, i) => {
            const isTop = i === visible.length - 1;
            const offset = i - (visible.length - 1);
            return (
              <motion.div
                key={c.id}
                layout
                layoutId={`card-${c.id}`}
                className="absolute"
                initial={reducedMotion ? false : { opacity: 0, y: 28, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: offset * 4,
                  x: offset * 14,
                  rotate: offset * 2.5,
                  scale: isTop ? 1 : 0.96,
                  zIndex: 10 + i,
                }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              >
                <PlayingCard card={c} small={!isTop} reducedMotion={reducedMotion} />
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}