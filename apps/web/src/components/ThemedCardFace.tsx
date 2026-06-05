"use client";

import type { Card } from "@underplay/engine";
import { RANK_LABELS } from "@underplay/engine";
import { displaySuitForValue } from "@/lib/cardSuits";
import type { GameThemeId } from "@/lib/themes";

type Pip = { x: number; y: number; invert?: boolean };

const PIP_LAYOUTS: Record<number, Pip[]> = {
  2: [{ x: 0.5, y: 0.28 }, { x: 0.5, y: 0.72, invert: true }],
  3: [{ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.8, invert: true }],
  4: [
    { x: 0.34, y: 0.28 },
    { x: 0.66, y: 0.28 },
    { x: 0.34, y: 0.72, invert: true },
    { x: 0.66, y: 0.72, invert: true },
  ],
  5: [
    { x: 0.34, y: 0.26 },
    { x: 0.66, y: 0.26 },
    { x: 0.5, y: 0.5 },
    { x: 0.34, y: 0.74, invert: true },
    { x: 0.66, y: 0.74, invert: true },
  ],
  6: [
    { x: 0.34, y: 0.22 },
    { x: 0.66, y: 0.22 },
    { x: 0.34, y: 0.5 },
    { x: 0.66, y: 0.5 },
    { x: 0.34, y: 0.78, invert: true },
    { x: 0.66, y: 0.78, invert: true },
  ],
  7: [
    { x: 0.34, y: 0.2 },
    { x: 0.66, y: 0.2 },
    { x: 0.5, y: 0.34 },
    { x: 0.34, y: 0.5 },
    { x: 0.66, y: 0.5 },
    { x: 0.34, y: 0.8, invert: true },
    { x: 0.66, y: 0.8, invert: true },
  ],
  8: [
    { x: 0.34, y: 0.18 },
    { x: 0.66, y: 0.18 },
    { x: 0.34, y: 0.36 },
    { x: 0.66, y: 0.36 },
    { x: 0.34, y: 0.64, invert: true },
    { x: 0.66, y: 0.64, invert: true },
    { x: 0.34, y: 0.82, invert: true },
    { x: 0.66, y: 0.82, invert: true },
  ],
  9: [
    { x: 0.34, y: 0.18 },
    { x: 0.5, y: 0.18 },
    { x: 0.66, y: 0.18 },
    { x: 0.34, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.66, y: 0.5 },
    { x: 0.34, y: 0.82, invert: true },
    { x: 0.5, y: 0.82, invert: true },
    { x: 0.66, y: 0.82, invert: true },
  ],
  10: [
    { x: 0.34, y: 0.16 },
    { x: 0.66, y: 0.16 },
    { x: 0.5, y: 0.28 },
    { x: 0.34, y: 0.4 },
    { x: 0.66, y: 0.4 },
    { x: 0.34, y: 0.6, invert: true },
    { x: 0.66, y: 0.6, invert: true },
    { x: 0.5, y: 0.72, invert: true },
    { x: 0.34, y: 0.84, invert: true },
    { x: 0.66, y: 0.84, invert: true },
  ],
};

const W = 90;
const H = 130;

interface Palette {
  face: string;
  ink: string;
  accent: string;
  accentAlt: string;
  border: string;
}

const PALETTES: Record<GameThemeId, Palette> = {
  acdc: {
    face: "#141414",
    ink: "#f4efe3",
    accent: "#dc2626",
    accentAlt: "#fbbf24",
    border: "#7f1d1d",
  },
  queen: {
    face: "#2a1848",
    ink: "#f5e6c8",
    accent: "#d4af37",
    accentAlt: "#c4b5fd",
    border: "#5b3a8c",
  },
};

function suitColor(suit: ReturnType<typeof displaySuitForValue>, p: Palette): string {
  if (suit === "hearts" || suit === "diamonds") return p.accent;
  return p.ink;
}

function LightningGlyph({
  cx,
  cy,
  size,
  fill,
  invert,
}: {
  cx: number;
  cy: number;
  size: number;
  fill: string;
  invert?: boolean;
}) {
  const s = size;
  const d = `M${cx} ${cy - s * 0.45} L${cx - s * 0.28} ${cy + s * 0.05} H${cx + s * 0.08} L${cx - s * 0.12} ${cy + s * 0.48} L${cx + s * 0.32} ${cy - s * 0.12} H${cx - s * 0.02} Z`;
  return (
    <path
      d={d}
      fill={fill}
      transform={invert ? `rotate(180 ${cx} ${cy})` : undefined}
    />
  );
}

function CrownGlyph({
  cx,
  cy,
  size,
  fill,
  invert,
}: {
  cx: number;
  cy: number;
  size: number;
  fill: string;
  invert?: boolean;
}) {
  const s = size * 0.5;
  const d = `M${cx - s} ${cy + s * 0.3} L${cx - s * 0.5} ${cy - s * 0.5} L${cx} ${cy - s * 0.1} L${cx + s * 0.5} ${cy - s * 0.5} L${cx + s} ${cy + s * 0.3} L${cx + s * 0.7} ${cy + s * 0.55} L${cx - s * 0.7} ${cy + s * 0.55} Z`;
  return (
    <path
      d={d}
      fill={fill}
      transform={invert ? `rotate(180 ${cx} ${cy})` : undefined}
    />
  );
}

function SuitGlyph(props: {
  themeId: GameThemeId;
  suit: ReturnType<typeof displaySuitForValue>;
  cx: number;
  cy: number;
  size: number;
  palette: Palette;
  invert?: boolean;
}) {
  const fill = suitColor(props.suit, props.palette);
  if (props.themeId === "acdc") {
    return (
      <LightningGlyph
        cx={props.cx}
        cy={props.cy}
        size={props.size}
        fill={fill}
        invert={props.invert}
      />
    );
  }
  return (
    <CrownGlyph
      cx={props.cx}
      cy={props.cy}
      size={props.size}
      fill={fill}
      invert={props.invert}
    />
  );
}

function Corner({
  label,
  themeId,
  value,
  palette,
  invert,
}: {
  label: string;
  themeId: GameThemeId;
  value: number;
  palette: Palette;
  invert?: boolean;
}) {
  const suit = displaySuitForValue(value);
  const yLabel = 18;
  const yGlyph = 26;

  return (
    <g transform={invert ? `translate(${W} ${H}) rotate(180)` : undefined}>
      <text
        x={9}
        y={yLabel}
        fill={palette.ink}
        fontSize={label.length > 1 ? 13 : 16}
        fontWeight={700}
        fontFamily="Georgia, 'Times New Roman', serif"
        textAnchor="start"
      >
        {label}
      </text>
      <SuitGlyph
        themeId={themeId}
        suit={suit}
        cx={14}
        cy={yGlyph}
        size={10}
        palette={palette}
      />
    </g>
  );
}

function SpecialFace({
  title,
  subtitle,
  palette,
  themeId,
}: {
  title: string;
  subtitle: string;
  palette: Palette;
  themeId: GameThemeId;
}) {
  return (
    <>
      <rect width={W} height={H} fill={palette.face} rx={4} />
      <rect
        x={4}
        y={4}
        width={W - 8}
        height={H - 8}
        fill="none"
        stroke={palette.border}
        strokeWidth={1}
        rx={3}
      />
      <SuitGlyph
        themeId={themeId}
        suit="hearts"
        cx={W / 2}
        cy={H / 2 - 6}
        size={36}
        palette={palette}
      />
      <text
        x={W / 2}
        y={H / 2 + 22}
        textAnchor="middle"
        fill={palette.accent}
        fontSize={14}
        fontWeight={800}
        letterSpacing={1}
        fontFamily="Georgia, serif"
      >
        {title}
      </text>
      <text
        x={W / 2}
        y={H / 2 + 38}
        textAnchor="middle"
        fill={palette.ink}
        fontSize={9}
        opacity={0.85}
        fontFamily="DM Sans, sans-serif"
      >
        {subtitle}
      </text>
    </>
  );
}

interface Props {
  card: Card;
  themeId: GameThemeId;
  className?: string;
}

export function ThemedCardFace({ card, themeId, className = "" }: Props) {
  const palette = PALETTES[themeId];

  if (card.kind === "clear") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
        <SpecialFace title="UNDERCUT" subtitle="Clear the stack" palette={palette} themeId={themeId} />
      </svg>
    );
  }

  if (card.kind === "skip") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
        <SpecialFace title="OVERCUT" subtitle="Skip opponent" palette={palette} themeId={themeId} />
      </svg>
    );
  }

  const value = card.value ?? 2;
  const label = RANK_LABELS[value] ?? String(value);
  const suit = displaySuitForValue(value);
  const pips = PIP_LAYOUTS[value];
  const isCourt = value >= 11;
  const mainSize = value >= 10 ? 11 : value >= 7 ? 12 : 13;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width={W} height={H} fill={palette.face} rx={4} />
      <rect
        x={3}
        y={3}
        width={W - 6}
        height={H - 6}
        fill="none"
        stroke={palette.border}
        strokeWidth={0.8}
        rx={3}
        opacity={0.6}
      />

      <Corner label={label} themeId={themeId} value={value} palette={palette} />
      <Corner label={label} themeId={themeId} value={value} palette={palette} invert />

      {isCourt ? (
        <SuitGlyph
          themeId={themeId}
          suit={suit}
          cx={W / 2}
          cy={H / 2}
          size={44}
          palette={palette}
        />
      ) : (
        (pips ?? []).map((pip, i) => (
          <SuitGlyph
            key={i}
            themeId={themeId}
            suit={suit}
            cx={pip.x * W}
            cy={pip.y * H}
            size={mainSize}
            palette={palette}
            invert={pip.invert}
          />
        ))
      )}
    </svg>
  );
}