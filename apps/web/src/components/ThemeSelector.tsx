"use client";

import Link from "next/link";
import { GAME_THEME_IDS, getGameTheme } from "@/lib/themes";
import { useTheme } from "@/context/ThemeProvider";
import { ThemeCardMini } from "./ThemeCardPreview";

interface Props {
  compact?: boolean;
  className?: string;
  showBrowseLink?: boolean;
}

export function ThemeSelector({
  compact = false,
  className = "",
  showBrowseLink = compact,
}: Props) {
  const { themeId, setThemeId } = useTheme();

  return (
    <div className={`${compact ? "inline-flex flex-col items-end gap-1" : "block"} ${className}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-widest text-theme-muted">Deck theme</p>
          <Link href="/themes" className="text-[10px] text-theme-muted hover:text-theme-ink underline">
            Browse all
          </Link>
        </div>
      )}
      <div
        className={`flex gap-1.5 ${compact ? "flex-wrap justify-end max-w-[min(100%,20rem)]" : "flex-wrap"}`}
      >
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
              className={`flex items-center gap-1.5 rounded-lg border px-1.5 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                selected
                  ? "border-[var(--theme-accent)] bg-theme-panel shadow-[0_0_12px_var(--theme-glow)]"
                  : "border-theme-border bg-black/30 hover:border-[var(--theme-accent)]/50"
              }`}
            >
              <ThemeCardMini themeId={id} />
              {!compact && (
                <span
                  className={`text-xs font-semibold pr-1 ${selected ? "text-theme-ink" : "text-theme-muted"}`}
                >
                  {t.shortName}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {showBrowseLink && (
        <Link
          href="/themes"
          className="text-[10px] text-theme-muted hover:text-theme-ink underline"
        >
          All themes
        </Link>
      )}
    </div>
  );
}