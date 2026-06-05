"use client";

import type { Card } from "@underplay/engine";
import { PlayingCard } from "./PlayingCard";

interface Props {
  cards: Card[];
  selected: string[];
  interactive: boolean;
  reducedMotion?: boolean;
  onSelect: (id: string) => void;
}

/** Hand uses plain DOM (no shared layoutId) so cards never fly to the stack/table. */
export function HandRow({ cards, selected, interactive, reducedMotion, onSelect }: Props) {
  if (cards.length === 0) {
    return <p className="text-amber-200/50 text-sm italic py-6 text-center w-full">No cards in hand</p>;
  }

  return (
    <div className="flex gap-2 justify-start sm:justify-center px-3 py-2 min-h-[7rem] w-full overflow-x-auto overflow-y-visible">
      {cards.map((c) => (
        <div key={c.id} className="shrink-0">
          <PlayingCard
            card={c}
            selected={selected.includes(c.id)}
            onClick={interactive ? () => onSelect(c.id) : undefined}
            reducedMotion={reducedMotion}
          />
        </div>
      ))}
    </div>
  );
}