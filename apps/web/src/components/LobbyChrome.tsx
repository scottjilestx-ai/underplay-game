"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeProvider";
import { UnderPlayLogo } from "./UnderPlayLogo";
import { DeckSelector } from "./DeckSelector";
import { ThemeSelector } from "./ThemeSelector";

interface Props {
  backHref?: string;
  backLabel?: string;
  tagline?: string;
}

/** Compact header shared by CPU and online lobbies. */
export function LobbyChrome({
  backHref = "/",
  backLabel = "Home",
  tagline,
}: Props) {
  const { themeId } = useTheme();

  return (
    <header className="shrink-0 mb-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <Link
          href={backHref}
          className="text-theme-muted text-sm hover:text-theme-ink transition shrink-0"
        >
          ← {backLabel}
        </Link>
        <div className="ml-auto shrink-0 flex flex-col items-end gap-2">
          <DeckSelector compact showBrowseLink={false} />
          <ThemeSelector compact />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-[7.5rem] shrink-0">
          <UnderPlayLogo themeId={themeId} size="header" />
        </div>
        {tagline && (
          <p className="text-theme-muted text-sm leading-snug min-w-0">{tagline}</p>
        )}
      </div>
    </header>
  );
}