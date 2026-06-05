"use client";

import { motion } from "framer-motion";
import type { Card } from "@underplay/engine";
import { RANK_LABELS } from "@underplay/engine";

interface Props {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  small?: boolean;
  onClick?: () => void;
  layoutId?: string;
  reducedMotion?: boolean;
}

export function PlayingCard({
  card,
  faceDown = false,
  selected,
  small,
  onClick,
  layoutId,
  reducedMotion,
}: Props) {
  const w = small ? "w-14 h-20" : "w-[4.5rem] h-[6.5rem]";
  const showBack = faceDown || !card;

  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      onClick={onClick}
      disabled={!onClick}
      whileHover={onClick && !reducedMotion ? { y: -8, scale: 1.03 } : undefined}
      whileTap={onClick && !reducedMotion ? { scale: 0.97 } : undefined}
      className={`${w} relative shrink-0 rounded-lg perspective-1000 ${onClick ? "cursor-pointer" : "cursor-default"} ${selected ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-950" : ""}`}
      style={{ perspective: 800 }}
    >
      <div
        className={`absolute inset-0 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.45),0_2px_4px_rgba(0,0,0,0.3)] transition-transform ${showBack ? "card-back" : "card-face"}`}
      >
        {showBack ? (
          <div className="h-full w-full rounded-lg border border-amber-900/40 bg-gradient-to-br from-[#1a2744] via-[#243b6b] to-[#152238] p-2">
            <div className="h-full w-full rounded-md border border-amber-600/30 bg-[radial-gradient(circle_at_30%_30%,#c9a227_0%,transparent_50%),repeating-conic-gradient(from_0deg,#1e3a5f_0deg_10deg,#162d4d_10deg_20deg)] opacity-90" />
            <div className="absolute inset-0 flex items-center justify-center text-amber-200/80 text-xs font-serif tracking-widest">
              UNDERPLAY
            </div>
          </div>
        ) : (
          <CardFace card={card!} />
        )}
      </div>
    </motion.button>
  );
}

function CardFace({ card }: { card: Card }) {
  if (card.kind === "clear") {
    return (
      <div className="card-face-inner bg-gradient-to-br from-slate-100 to-slate-300 text-slate-900 flex flex-col items-center justify-center gap-1 p-2">
        <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold">Undercut</span>
        <span className="text-2xl">↓</span>
        <span className="text-[9px] text-center opacity-70">Clears pile</span>
      </div>
    );
  }
  if (card.kind === "skip") {
    return (
      <div className="card-face-inner bg-gradient-to-br from-rose-50 to-rose-200 text-rose-950 flex flex-col items-center justify-center gap-1 p-2">
        <span className="text-[10px] uppercase tracking-wider font-bold">Overcut</span>
        <span className="text-2xl">⊘</span>
        <span className="text-[9px] text-center opacity-70">Skip turn</span>
      </div>
    );
  }
  const label = RANK_LABELS[card.value ?? 0] ?? "?";
  const red = [2, 4, 6, 8, 10, 12].includes(card.value ?? 0);
  return (
    <div
      className={`card-face-inner flex flex-col justify-between p-2 ${red ? "text-red-800" : "text-slate-900"} bg-gradient-to-br from-[#faf8f5] via-[#f0ebe3] to-[#e8e0d4]`}
    >
      <span className="text-lg font-bold leading-none">{label}</span>
      <span className="text-3xl font-serif self-center opacity-90">{suitGlyph(card.value ?? 0)}</span>
      <span className="text-lg font-bold leading-none self-end rotate-180">{label}</span>
    </div>
  );
}

function suitGlyph(v: number): string {
  const suits = ["♠", "♥", "♦", "♣"];
  return suits[v % 4];
}