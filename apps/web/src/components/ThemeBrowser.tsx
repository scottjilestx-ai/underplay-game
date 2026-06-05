"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { GAME_THEME_IDS, getGameTheme } from "@/lib/themes";
import { LobbyChrome } from "./LobbyChrome";
import { ScrollPage } from "./ScrollPage";
import { ThemeCardStrip } from "./ThemeCardPreview";

function Swatches({ colors }: { colors: [string, string, string] }) {
  return (
    <div className="flex gap-1.5 mt-3">
      {colors.map((c) => (
        <span
          key={c}
          className="w-6 h-6 rounded-full border border-white/15 shadow-inner"
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
    </div>
  );
}

export function ThemeBrowser() {
  const { themeId, setThemeId, theme } = useTheme();

  return (
    <ScrollPage>
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-10">
        <LobbyChrome
          backHref="/"
          tagline="Every theme is a full SVG deck, table tint, and UI palette."
        />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-theme-ink">Deck themes</h1>
            <p className="text-theme-muted text-sm mt-1">
              Active: <span className="text-theme-ink font-medium">{theme.name}</span>
            </p>
          </div>
          <Link
            href="/play"
            className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${theme.buttonGradient} text-black text-sm font-semibold hover:opacity-90 transition`}
          >
            Play with this theme
          </Link>
        </div>

        <div className="space-y-4">
          {GAME_THEME_IDS.map((id, i) => {
            const t = getGameTheme(id);
            const selected = themeId === id;
            return (
              <motion.article
                key={id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                className={`rounded-2xl border p-5 transition ${
                  selected
                    ? "border-[var(--theme-accent)] bg-theme-panel shadow-[0_0_24px_var(--theme-glow)]"
                    : "border-theme-border bg-black/35 hover:border-[var(--theme-accent)]/40"
                }`}
                style={
                  selected
                    ? undefined
                    : {
                        borderColor: "var(--theme-border)",
                      }
                }
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-serif text-xl text-theme-ink">{t.name}</h2>
                      {selected && (
                        <span
                          className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: "var(--theme-accent)",
                            border: "1px solid var(--theme-accent)",
                          }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-theme-muted text-sm mt-1">{t.tagline}</p>
                    <p className="text-theme-muted text-xs mt-2 capitalize">
                      Pip style: {t.pipStyle}
                    </p>
                    <Swatches colors={t.swatches} />
                  </div>
                  <ThemeCardStrip themeId={id} />
                </div>
                <button
                  type="button"
                  onClick={() => setThemeId(id)}
                  className={`mt-4 w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
                    selected
                      ? "border border-theme-border text-theme-muted cursor-default"
                      : `bg-gradient-to-r ${t.buttonGradient} text-black hover:opacity-90`
                  }`}
                  disabled={selected}
                >
                  {selected ? "Currently selected" : `Use ${t.shortName}`}
                </button>
              </motion.article>
            );
          })}
        </div>

        <p className="text-center text-theme-muted text-xs mt-8">
          Themes apply in CPU games, online lobby, and the table. SVG only — no photo card assets.
        </p>
      </div>
    </ScrollPage>
  );
}