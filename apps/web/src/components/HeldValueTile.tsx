"use client";

interface Props {
  value: number;
}

/** Sum of hand + face-up card points (game scoring values). */
export function HeldValueTile({ value }: Props) {
  return (
    <div
      className="ml-8 pl-6 flex flex-col items-center justify-center border-l border-amber-500/15 min-w-[4.5rem] pointer-events-none select-none"
      title="Total value of cards in your hand and face-up row"
      aria-label={`Held points: ${value}`}
    >
      <span className="text-[10px] uppercase tracking-widest text-amber-200/40">Held</span>
      <span className="text-xl font-medium tabular-nums text-amber-200/85 leading-tight mt-0.5">
        {value}
      </span>
    </div>
  );
}