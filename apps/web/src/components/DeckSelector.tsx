"use client";

import Link from "next/link";
import { CARD_DECK_IDS, getCardDeck } from "@/lib/cardDecks";
import { useTheme } from "@/context/ThemeProvider";
import { DeckCardMini } from "./ThemeCardPreview";

interface Props {
  compact?: boolean;
  className?: string;
  showBrowseLink?: boolean;
}

export function DeckSelector({
  compact = false,
  className = "",
  showBrowseLink = compact,
}: Props) {
  const { deckId, setDeckId } = useTheme();

  return (
    <div className={`${compact ? "inline-flex flex-col items-end gap-1" : "block"} ${className}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-widest text-theme-muted">Card deck</p>
          <Link href="/themes" className="text-[10px] text-theme-muted hover:text-theme-ink underline">
            Browse decks
          </Link>
        </div>
      )}
      <div
        className={`flex gap-1.5 ${compact ? "flex-wrap justify-end max-w-[min(100%,22rem)]" : "flex-wrap"}`}
      >
        {CARD_DECK_IDS.map((id) => {
          const d = getCardDeck(id);
          const selected = deckId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setDeckId(id)}
              aria-pressed={selected}
              title={d.name}
              className={`flex items-center gap-1.5 rounded-lg border px-1.5 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                selected
                  ? "border-[var(--theme-accent)] bg-theme-panel shadow-[0_0_12px_var(--theme-glow)]"
                  : "border-theme-border bg-black/30 hover:border-[var(--theme-accent)]/50"
              }`}
            >
              <DeckCardMini deckId={id} />
              {!compact && (
                <span
                  className={`text-xs font-semibold pr-1 ${selected ? "text-theme-ink" : "text-theme-muted"}`}
                >
                  {d.shortName}
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
          All decks
        </Link>
      )}
    </div>
  );
}