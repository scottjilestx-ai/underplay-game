"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { ThemedCardBack } from "./ThemedCardBack";

interface Props {
  phase: "shuffle" | "deal" | null;
  reducedMotion?: boolean;
  hidden?: boolean;
}

export function DeckAnimation({ phase, reducedMotion, hidden }: Props) {
  const { themeId } = useTheme();
  if (!phase || reducedMotion) return null;

  const dealing = phase === "deal";

  return (
    <motion.div
      data-fly-source="deck"
      className={`pointer-events-none absolute left-1/2 top-[38%] z-30 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ${
        hidden ? "opacity-0" : ""
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: dealing ? 0.92 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
    >
      <motion.div
        animate={
          phase === "shuffle"
            ? { rotate: [0, -6, 6, -4, 4, 0], y: [0, -4, 0, -2, 0] }
            : dealing
              ? { y: [0, -3, 0] }
              : { y: [0, -12, 0], scale: [1, 1.05, 1] }
        }
        transition={{
          duration: phase === "shuffle" ? 0.9 : dealing ? 1.4 : 0.5,
          repeat: phase === "shuffle" ? 2 : dealing ? Infinity : 0,
          ease: "easeInOut",
        }}
        className="relative h-[6.5rem] w-[4.5rem] shadow-2xl"
      >
        <div className="absolute inset-0 rounded-[0.35rem] overflow-hidden bg-white">
          <ThemedCardBack themeId={themeId} className="h-full w-full" />
        </div>
      </motion.div>
      {phase === "shuffle" && (
        <p className="mt-3 text-center text-amber-100/80 text-sm font-medium tracking-wide">
          Shuffling…
        </p>
      )}
    </motion.div>
  );
}