"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Card } from "@underplay/engine";
import { RANK_LABELS } from "@underplay/engine";

const CARD_BACK = "/cards/bicycle-back.jpg";
const CARD_FACE = "/cards/bicycle-face.jpg";

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
      className={`${w} relative shrink-0 ${onClick ? "cursor-pointer" : "cursor-default"} ${selected ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-950 z-10" : ""}`}
    >
      <div className="absolute inset-0 rounded-[0.35rem] shadow-[0_10px_28px_rgba(0,0,0,0.5),0_2px_6px_rgba(0,0,0,0.35)] overflow-hidden">
        {showBack ? <CardBack small={small} /> : <CardFace card={card!} small={small} />}
      </div>
    </motion.button>
  );
}

function CardBack({ small }: { small?: boolean }) {
  return (
    <div className="relative h-full w-full">
      <Image
        src={CARD_BACK}
        alt="Card back"
        fill
        className="object-cover"
        sizes={small ? "56px" : "72px"}
        priority
      />
    </div>
  );
}

function CardFace({ card, small }: { card: Card; small?: boolean }) {
  if (card.kind === "clear") return <SpecialFace kind="clear" small={small} />;
  if (card.kind === "skip") return <SpecialFace kind="skip" small={small} />;
  return <NumberFace card={card} small={small} />;
}

function NumberFace({ card, small }: { card: Card; small?: boolean }) {
  const label = RANK_LABELS[card.value ?? 0] ?? "?";
  const suitIndex = (card.value ?? 0) % 4;
  const suit = SUITS[suitIndex];
  const red = suit.color === "red";
  const pipSize = small ? "text-lg" : "text-3xl";
  const cornerSize = small ? "text-[9px] leading-none" : "text-sm leading-none";

  return (
    <div className="relative h-full w-full">
      <Image src={CARD_FACE} alt="" fill className="object-cover" sizes={small ? "56px" : "72px"} />
      <div
        className={`absolute inset-0 flex flex-col justify-between p-1.5 font-[Georgia,Times,'Times_New_Roman',serif] ${red ? "text-[#c41e3a]" : "text-[#1a1a1a]"}`}
      >
        <div className={`${cornerSize} font-bold flex flex-col items-start`}>
          <span>{label}</span>
          <span className={small ? "text-[10px]" : "text-base"}>{suit.glyph}</span>
        </div>
        <span className={`${pipSize} self-center drop-shadow-sm`}>{suit.glyph}</span>
        <div className={`${cornerSize} font-bold flex flex-col items-end rotate-180`}>
          <span>{label}</span>
          <span className={small ? "text-[10px]" : "text-base"}>{suit.glyph}</span>
        </div>
      </div>
    </div>
  );
}

function SpecialFace({ kind, small }: { kind: "clear" | "skip"; small?: boolean }) {
  const isClear = kind === "clear";
  return (
    <div className="relative h-full w-full">
      <Image src={CARD_FACE} alt="" fill className="object-cover" sizes={small ? "56px" : "72px"} />
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-1 text-center font-[Georgia,serif] ${
          isClear ? "text-emerald-950" : "text-rose-950"
        }`}
      >
        <span className={small ? "text-[7px] uppercase tracking-wide font-bold" : "text-[9px] uppercase tracking-wider font-bold"}>
          {isClear ? "Undercut" : "Overcut"}
        </span>
        <span className={small ? "text-xl" : "text-3xl"}>{isClear ? "↓" : "⊘"}</span>
        <span className={small ? "text-[6px] opacity-80" : "text-[8px] opacity-75"}>
          {isClear ? "Clears pile" : "Skip turn"}
        </span>
      </div>
    </div>
  );
}

const SUITS = [
  { glyph: "♠", color: "black" as const },
  { glyph: "♥", color: "red" as const },
  { glyph: "♦", color: "red" as const },
  { glyph: "♣", color: "black" as const },
];