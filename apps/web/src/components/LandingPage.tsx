"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BRAND_NAME } from "@/lib/brand";
import { useTheme } from "@/context/ThemeProvider";
import { UnderPlayLogo } from "./UnderPlayLogo";
import { DeckSelector } from "./DeckSelector";
import { ThemeSelector } from "./ThemeSelector";
import { ScrollPage } from "./ScrollPage";
import { DeckCardStrip } from "./ThemeCardPreview";

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
  const { themeId, theme, deckId, deck } = useTheme();

  return (
    <ScrollPage>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div className="min-w-0 flex-1 max-w-md">
            <div className="mb-3 max-w-[14rem] sm:max-w-xs">
              <UnderPlayLogo themeId={themeId} size="header" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-theme-ink leading-tight">
              A shedding-style{" "}
              <span style={{ color: "var(--theme-accent)" }}>card duel.</span>
            </h1>
            <p className="text-theme-muted text-sm sm:text-base mt-2 leading-relaxed max-w-md">
              Realistic card decks plus table themes. SVG wordmark only — cards are photo-style
              images.
            </p>
          </div>
          <div className="shrink-0 flex flex-col gap-3 sm:items-end">
            <DeckSelector compact />
            <ThemeSelector compact />
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
              <Link
                href="/play"
                className={`px-6 py-2.5 rounded-xl bg-gradient-to-r ${theme.buttonGradient} text-black font-semibold hover:opacity-90 transition text-center text-sm sm:text-base`}
              >
                Play vs CPU
              </Link>
              <Link
                href="/online"
                className={`px-6 py-2.5 rounded-xl border ${theme.buttonBorder} bg-black/30 text-theme-ink font-semibold hover:bg-black/45 transition text-center text-sm sm:text-base`}
              >
                Play online
              </Link>
              <Link
                href="/sounds"
                className="px-6 py-2.5 rounded-xl border border-theme-border bg-black/30 text-theme-muted font-semibold hover:text-theme-ink hover:bg-black/45 transition text-center text-sm sm:text-base"
              >
                Sound test
              </Link>
            </div>
          </div>
        </motion.header>

        <section className="mb-10 rounded-2xl border border-theme-border bg-theme-panel p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="font-serif text-lg text-theme-ink">Current deck</h2>
              <p className="text-theme-muted text-sm">
                {deck.name} — {deck.tagline}
              </p>
            </div>
            <Link
              href="/themes"
              className="text-sm font-semibold shrink-0"
              style={{ color: "var(--theme-accent)" }}
            >
              Compare all decks →
            </Link>
          </div>
          <DeckCardStrip deckId={deckId} />
        </section>

        <section className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-xl border border-theme-border bg-theme-panel backdrop-blur-sm p-4 sm:p-5"
            >
              <span className="text-xl" aria-hidden>
                {f.icon}
              </span>
              <h2 className="font-serif text-lg text-theme-ink mt-2 mb-1">{f.title}</h2>
              <p className="text-theme-muted text-sm leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </section>

        <p className="text-center text-theme-muted text-xs pb-4">
          {BRAND_NAME}: Undercut clears the stack · Overcut skips a turn ·{" "}
          <Link href="/sounds" className="underline hover:text-theme-ink transition">
            Sound diagnostics
          </Link>
        </p>
      </div>
    </ScrollPage>
  );
}