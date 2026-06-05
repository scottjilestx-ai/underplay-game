"use client";

import { motion } from "framer-motion";

interface Props {
  reducedMotion?: boolean;
}

export function LetsPlaySplash({ reducedMotion }: Props) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.4 } }}
      className="pointer-events-none absolute inset-0 z-[45] flex items-center justify-center px-6"
    >
      <motion.p
        initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="font-serif text-4xl sm:text-5xl md:text-6xl text-amber-100 tracking-tight text-center drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
      >
        Let&apos;s play.
      </motion.p>
    </motion.div>
  );
}