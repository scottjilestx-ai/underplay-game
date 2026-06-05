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
import { ScrollPage } from "./ScrollPage";

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
    <ScrollPage>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div className="min-w-0 flex-1 max-w-md">
            <div className="mb-3 max-w-[14rem] sm:max-w-xs">
              <UnderPlayLogo variant={logoVariant} size="header" priority />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-theme-ink leading-tight">
              A shedding-style{" "}
              <span style={{ color: "var(--theme-accent)" }}>card duel.</span>
            </h1>
            <p className="text-theme-muted text-sm sm:text-base mt-2 leading-relaxed max-w-md">
              Empty your hand, dodge the pile, and finish with the lowest score.
            </p>
          </div>
          <div className="shrink-0 flex flex-col gap-3 sm:items-end">
            <ThemeSelector compact />
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
            </div>
          </div>
        </motion.header>

        <section className="mb-10" aria-labelledby="logo-styles-heading">
          <h2
            id="logo-styles-heading"
            className="font-serif text-lg text-theme-ink/90 mb-1"
          >
            Logo styles
          </h2>
          <p className="text-theme-muted text-xs sm:text-sm mb-4 max-w-xl">
            Rock-band inspired marks for {BRAND_NAME}. AC/DC and Queen skin the deck and table.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {LOGO_VARIANTS.map((v, i) => {
              const selected = logoVariant === v;
              const isPlayable = v === "acdc" || v === "queen";
              return (
                <motion.button
                  key={v}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  onClick={() => pickLogo(v)}
                  className={`rounded-xl border overflow-hidden text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                    selected
                      ? "border-[var(--theme-accent)] bg-theme-panel shadow-[0_0_20px_var(--theme-glow)]"
                      : "border-theme-border bg-black/40 hover:border-[var(--theme-accent)]/50"
                  }`}
                >
                  <div className="px-2 pt-2 pb-1 sm:px-3 sm:pt-3">
                    <UnderPlayLogo variant={v} size="card" />
                  </div>
                  <div className="px-2 pb-2 sm:px-3 sm:pb-3">
                    <p
                      className={`text-[10px] sm:text-xs font-medium leading-tight ${selected ? "text-theme-ink" : "text-theme-muted"}`}
                    >
                      {logoVariantLabel(v).split(" (")[0]}
                    </p>
                    {isPlayable && selected && (
                      <p
                        className="text-[10px] mt-0.5 hidden sm:block"
                        style={{ color: "var(--theme-accent)" }}
                      >
                        Active theme
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
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
          Special cards: Undercut clears the stack · Overcut skips a turn
        </p>
      </div>
    </ScrollPage>
  );
}