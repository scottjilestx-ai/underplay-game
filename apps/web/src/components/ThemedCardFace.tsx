"use client";

import { useId } from "react";
import type { Card } from "@underplay/engine";
import { RANK_LABELS } from "@underplay/engine";
import { PipGlyph, pipFill } from "@/lib/cardGlyphs";
import { displaySuitForValue } from "@/lib/cardSuits";
import { getGameTheme, type GameThemeId } from "@/lib/themes";

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

function Corner({
  label,
  themeId,
  value,
  invert,
}: {
  label: string;
  themeId: GameThemeId;
  value: number;
  invert?: boolean;
}) {
  const theme = getGameTheme(themeId);
  const palette = theme.palette;
  const suit = displaySuitForValue(value);

  return (
    <g transform={invert ? `translate(${W} ${H}) rotate(180)` : undefined}>
      <text
        x={9}
        y={18}
        fill={palette.ink}
        fontSize={label.length > 1 ? 13 : 16}
        fontWeight={700}
        fontFamily="Georgia, 'Times New Roman', serif"
        textAnchor="start"
      >
        {label}
      </text>
      <PipGlyph
        style={theme.pipStyle}
        cx={14}
        cy={26}
        size={10}
        fill={pipFill(suit, palette)}
      />
    </g>
  );
}

function SpecialFace({
  title,
  subtitle,
  themeId,
}: {
  title: string;
  subtitle: string;
  themeId: GameThemeId;
}) {
  const theme = getGameTheme(themeId);
  const palette = theme.palette;

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
      <PipGlyph
        style={theme.pipStyle}
        cx={W / 2}
        cy={H / 2 - 6}
        size={36}
        fill={palette.accent}
      />
      <text
        x={W / 2}
        y={H / 2 + 22}
        textAnchor="middle"
        fill={palette.accent}
        fontSize={13}
        fontWeight={800}
        letterSpacing={0.5}
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
  const uid = useId();
  const theme = getGameTheme(themeId);
  const palette = theme.palette;

  if (card.kind === "clear") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
        <SpecialFace title="UNDERCUT" subtitle="Clear the stack" themeId={themeId} />
      </svg>
    );
  }

  if (card.kind === "skip") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
        <SpecialFace title="OVERCUT" subtitle="Skip opponent" themeId={themeId} />
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
      {themeId === "neon" && (
        <rect
          x={5}
          y={5}
          width={W - 10}
          height={H - 10}
          fill="none"
          stroke={palette.accentAlt}
          strokeWidth={0.5}
          rx={2}
          opacity={0.35}
        />
      )}

      <Corner label={label} themeId={themeId} value={value} />
      <Corner label={label} themeId={themeId} value={value} invert />

      {isCourt ? (
        <PipGlyph
          style={theme.pipStyle}
          cx={W / 2}
          cy={H / 2}
          size={44}
          fill={pipFill(suit, palette)}
        />
      ) : (
        (pips ?? []).map((pip, i) => (
          <PipGlyph
            key={`${uid}-pip-${i}`}
            style={theme.pipStyle}
            cx={pip.x * W}
            cy={pip.y * H}
            size={mainSize}
            fill={pipFill(suit, palette)}
            invert={pip.invert}
          />
        ))
      )}
    </svg>
  );
}

/** Sample rank for previews (seven of themed suit cycle). */
export function samplePreviewCard(themeId: GameThemeId): Card {
  return { id: `preview-${themeId}`, kind: "play", value: 7 };
}