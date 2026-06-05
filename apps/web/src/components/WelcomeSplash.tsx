"use client";

import { motion } from "framer-motion";
import { BRAND_NAME } from "@/lib/brand";

interface Props {
  reducedMotion?: boolean;
}

export function WelcomeSplash({ reducedMotion }: Props) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.35 } }}
      className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
    >
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="text-center px-8 py-6 rounded-2xl border border-amber-500/25 bg-black/50 shadow-xl shadow-black/50"
      >
        <h2 className="font-serif text-3xl sm:text-4xl text-amber-100 tracking-tight">
          Welcome to {BRAND_NAME}
        </h2>
      </motion.div>
    </motion.div>
  );
}