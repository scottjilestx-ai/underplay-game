"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { CARD_DECK_IDS, getCardDeck } from "@/lib/cardDecks";
import { GAME_THEME_IDS, getGameTheme } from "@/lib/themes";
import { LobbyChrome } from "./LobbyChrome";
import { ScrollPage } from "./ScrollPage";
import { DeckCardStrip } from "./ThemeCardPreview";

function Swatches({ colors }: { colors: [string, string, string] }) {
  return (
    <div className="flex gap-1.5 mt-2">
      {colors.map((c) => (
        <span
          key={c}
          className="w-6 h-6 rounded-full border border-white/15"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

export function ThemeBrowser() {
  const { themeId, setThemeId, theme, deckId, setDeckId, deck } = useTheme();

  return (
    <ScrollPage>
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-10">
        <LobbyChrome backHref="/" tagline="Pick a photo card deck and a table color theme." />

        <section className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="font-serif text-2xl text-theme-ink">Card decks</h1>
              <p className="text-theme-muted text-sm">
                Active: <span className="text-theme-ink font-medium">{deck.name}</span>
              </p>
            </div>
            <Link
              href="/play"
              className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${theme.buttonGradient} text-black text-sm font-semibold hover:opacity-90 transition`}
            >
              Play with this deck
            </Link>
          </div>

          <div className="space-y-4">
            {CARD_DECK_IDS.map((id, i) => {
              const d = getCardDeck(id);
              const selected = deckId === id;
              return (
                <motion.article
                  key={id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                  className={`rounded-2xl border p-5 ${
                    selected
                      ? "border-[var(--theme-accent)] bg-theme-panel shadow-[0_0_24px_var(--theme-glow)]"
                      : "border-theme-border bg-black/35"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <h2 className="font-serif text-xl text-theme-ink">{d.name}</h2>
                      <p className="text-theme-muted text-sm mt-1">{d.tagline}</p>
                      <p className="text-theme-muted text-xs mt-2">{d.license}</p>
                    </div>
                    <DeckCardStrip deckId={id} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeckId(id)}
                    disabled={selected}
                    className={`mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold ${
                      selected
                        ? "border border-theme-border text-theme-muted"
                        : `bg-gradient-to-r ${theme.buttonGradient} text-black hover:opacity-90`
                    }`}
                  >
                    {selected ? "Active deck" : `Use ${d.shortName}`}
                  </button>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl text-theme-ink mb-1">Table themes</h2>
          <p className="text-theme-muted text-sm mb-4">
            Felt color and UI accents. Title stays SVG — colors follow the table theme.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {GAME_THEME_IDS.map((id) => {
              const t = getGameTheme(id);
              const selected = themeId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setThemeId(id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-[var(--theme-accent)] bg-theme-panel"
                      : "border-theme-border bg-black/35 hover:border-theme-accent/40"
                  }`}
                >
                  <p className="font-semibold text-theme-ink">{t.name}</p>
                  <p className="text-theme-muted text-xs mt-1">{t.tagline}</p>
                  <Swatches colors={t.swatches} />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </ScrollPage>
  );
}