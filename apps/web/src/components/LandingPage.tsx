"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BRAND_NAME } from "@/lib/brand";
import { useTheme } from "@/context/ThemeProvider";
import type { LogoVariant } from "@/lib/themes";
import {
  LOGO_VARIANTS,
  logoVariantLabel,
} from "./UnderPlayLogo";
import { UnderPlayLogo } from "./UnderPlayLogo";
import { ThemeSelector, syncLogoVariantToTheme } from "./ThemeSelector";

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
  const { themeId, setThemeId, theme } = useTheme();
  const [logoVariant, setLogoVariant] = useState<LogoVariant>(themeId);

  useEffect(() => {
    setLogoVariant(themeId);
  }, [themeId]);

  const pickLogo = (v: LogoVariant) => {
    setLogoVariant(v);
    const gameTheme = syncLogoVariantToTheme(v);
    if (gameTheme) setThemeId(gameTheme);
  };

  return (
    <div className="min-h-[100dvh] lobby-bg overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="mx-auto max-w-2xl mb-6 px-2">
            <UnderPlayLogo variant={logoVariant} size="hero" priority />
          </div>
          <div className="flex justify-center mb-8">
            <ThemeSelector compact />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-theme-ink leading-tight mb-4">
            A shedding-style
            <br />
            <span style={{ color: "var(--theme-accent)" }}>card duel.</span>
          </h1>
          <p className="text-theme-muted text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Empty your hand, dodge the pile, and finish with the lowest score. Play
            against CPU opponents or host an online room for friends.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              href="/play"
              className={`px-8 py-3 rounded-xl bg-gradient-to-r ${theme.buttonGradient} text-black font-semibold hover:opacity-90 transition text-center`}
            >
              Play vs CPU
            </Link>
            <Link
              href="/online"
              className={`px-8 py-3 rounded-xl border ${theme.buttonBorder} bg-black/30 text-theme-ink font-semibold hover:bg-black/45 transition text-center`}
            >
              Play online
            </Link>
          </div>
        </motion.header>

        <section className="mb-14" aria-labelledby="logo-styles-heading">
          <h2
            id="logo-styles-heading"
            className="text-center font-serif text-xl text-theme-ink/90 mb-2"
          >
            Logo styles — pick your era
          </h2>
          <p className="text-center text-theme-muted text-sm mb-6 max-w-lg mx-auto">
            Rock-band inspired marks for {BRAND_NAME}. AC/DC and Queen also skin the
            full card deck and table. Homage only — not official band logos.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {LOGO_VARIANTS.map((v, i) => {
              const selected = logoVariant === v;
              const isPlayable = v === "acdc" || v === "queen";
              return (
                <motion.button
                  key={v}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  onClick={() => pickLogo(v)}
                  className={`rounded-2xl border overflow-hidden text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                    selected
                      ? "border-[var(--theme-accent)] bg-theme-panel shadow-[0_0_28px_var(--theme-glow)]"
                      : "border-theme-border bg-black/40 hover:border-[var(--theme-accent)]/50 hover:bg-black/55"
                  }`}
                >
                  <div className="px-3 pt-3 pb-2">
                    <UnderPlayLogo variant={v} size="card" />
                  </div>
                  <div className="px-4 pb-4">
                    <p
                      className={`text-sm font-medium ${selected ? "text-theme-ink" : "text-theme-muted"}`}
                    >
                      {logoVariantLabel(v)}
                    </p>
                    {isPlayable && selected && (
                      <p className="text-xs mt-1" style={{ color: "var(--theme-accent)" }}>
                        Active game theme + deck
                      </p>
                    )}
                    {v === "vanhalen" && selected && (
                      <p className="text-theme-muted text-xs mt-1">Logo preview only</p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-4 mb-14">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              className="rounded-2xl border border-theme-border bg-theme-panel backdrop-blur-sm p-5"
            >
              <span className="text-2xl" aria-hidden>
                {f.icon}
              </span>
              <h2 className="font-serif text-xl text-theme-ink mt-2 mb-1">{f.title}</h2>
              <p className="text-theme-muted text-sm leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </section>

        <p className="text-center text-theme-muted text-xs">
          Special cards: Undercut clears the stack · Overcut skips a turn
        </p>
      </div>
    </div>
  );
}