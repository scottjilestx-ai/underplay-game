"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BRAND_NAME } from "@/lib/brand";

const FEATURES = [
  {
    icon: "🎯",
    title: "Lowest score wins",
    body: "Empty every zone first to win the round. Everyone else banks the points still in their hands.",
  },
  {
    icon: "⬇️",
    title: "Play under the top",
    body: "Play equal or lower than the stack top — or go higher and scoop the pile into your hand.",
  },
  {
    icon: "💥",
    title: "Four-of-a-kind clears",
    body: "Four matching ranks on the stack sweep the pile away and you play again.",
  },
  {
    icon: "✨",
    title: "Undercut & Overcut",
    body: "Clear the stack or skip an opponent, then keep your turn.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="min-h-[100dvh] lobby-bg overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="text-amber-400/80 text-xs uppercase tracking-[0.35em] mb-3">
            {BRAND_NAME}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-amber-50 leading-tight mb-4">
            A shedding-style
            <br />
            <span className="text-amber-300">card duel.</span>
          </h1>
          <p className="text-amber-200/70 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Empty your hand, dodge the pile, and finish with the lowest score. Play
            against CPU opponents or host an online room for friends.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              href="/play"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-amber-400 transition text-center"
            >
              Play vs CPU
            </Link>
            <Link
              href="/online"
              className="px-8 py-3 rounded-xl border border-amber-500/40 bg-black/30 text-amber-100 font-semibold hover:bg-amber-950/40 transition text-center"
            >
              Play online
            </Link>
          </div>
        </motion.header>

        <section className="grid sm:grid-cols-2 gap-4 mb-14">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              className="rounded-2xl border border-amber-500/15 bg-black/35 backdrop-blur-sm p-5"
            >
              <span className="text-2xl" aria-hidden>
                {f.icon}
              </span>
              <h2 className="font-serif text-xl text-amber-100 mt-2 mb-1">{f.title}</h2>
              <p className="text-amber-200/60 text-sm leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </section>

        <p className="text-center text-amber-200/40 text-xs">
          Special cards: Undercut clears the stack · Overcut skips a turn
        </p>
      </div>
    </div>
  );
}