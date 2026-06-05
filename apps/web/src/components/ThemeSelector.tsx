"use client";

import Link from "next/link";
import { GAME_THEME_IDS, getGameTheme } from "@/lib/themes";
import { useTheme } from "@/context/ThemeProvider";

interface Props {
  compact?: boolean;
  className?: string;
}

/** Table / UI color theme (SVG title uses these colors). */
export function ThemeSelector({ compact = false, className = "" }: Props) {
  const { themeId, setThemeId } = useTheme();

  return (
    <div className={`${compact ? "inline-flex flex-col items-end gap-1" : "block"} ${className}`}>
      {!compact && (
        <p className="text-[10px] uppercase tracking-widest text-theme-muted mb-2">Table theme</p>
      )}
      <div className={`flex flex-wrap gap-1.5 ${compact ? "justify-end" : ""}`}>
        {GAME_THEME_IDS.map((id) => {
          const t = getGameTheme(id);
          const selected = themeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setThemeId(id)}
              aria-pressed={selected}
              title={t.name}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent ${
                selected
                  ? "border-theme-accent bg-theme-panel shadow-[0_0_12px_var(--theme-glow)]"
                  : "border-theme-border bg-black/30 hover:border-theme-accent/50"
              }`}
            >
              <span className="flex gap-0.5">
                {t.swatches.map((c) => (
                  <span
                    key={c}
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span
                className={`text-xs font-semibold ${selected ? "text-theme-ink" : "text-theme-muted"}`}
              >
                {t.shortName}
              </span>
            </button>
          );
        })}
      </div>
      {!compact && (
        <Link
          href="/themes"
          className="text-[10px] text-theme-muted hover:text-theme-ink underline mt-1 inline-block"
        >
          Table + deck browser
        </Link>
      )}
    </div>
  );
}