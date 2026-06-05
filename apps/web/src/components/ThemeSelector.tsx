"use client";

import Image from "next/image";
import { GAME_THEME_IDS, getGameTheme, type GameThemeId } from "@/lib/themes";
import { useTheme } from "@/context/ThemeProvider";

interface Props {
  compact?: boolean;
  className?: string;
}

export function ThemeSelector({ compact = false, className = "" }: Props) {
  const { themeId, setThemeId } = useTheme();

  return (
    <div className={className}>
      {!compact && (
        <p className="text-[10px] uppercase tracking-widest text-theme-muted mb-2">
          Game theme
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {GAME_THEME_IDS.map((id) => {
          const t = getGameTheme(id);
          const selected = themeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setThemeId(id)}
              aria-pressed={selected}
              className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent ${
                selected
                  ? "border-theme-accent bg-theme-panel shadow-[0_0_20px_var(--theme-glow)]"
                  : "border-theme-border bg-black/30 hover:border-theme-accent/50"
              }`}
            >
              <span className="relative w-16 h-7 shrink-0">
                <Image
                  src={t.logoSrc}
                  alt=""
                  fill
                  className="object-contain object-left"
                  sizes="64px"
                />
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
    </div>
  );
}

export function syncLogoVariantToTheme(variant: string): GameThemeId | null {
  if (variant === "acdc" || variant === "queen") return variant;
  return null;
}