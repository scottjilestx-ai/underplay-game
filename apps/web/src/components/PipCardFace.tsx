import { RANK_LABELS } from "@underplay/engine";

type Pip = { x: number; y: number; invert?: boolean };

/** Normalized pip centers (0–1) for standard US layouts. */
const PIP_LAYOUTS: Record<number, Pip[]> = {
  2: [
    { x: 0.5, y: 0.28 },
    { x: 0.5, y: 0.72, invert: true },
  ],
  3: [
    { x: 0.5, y: 0.2 },
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 0.8, invert: true },
  ],
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
const RED = "#c41e3a";
const CREAM = "#f4efe3";

function DiamondGlyph({
  cx,
  cy,
  size,
  invert,
}: {
  cx: number;
  cy: number;
  size: number;
  invert?: boolean;
}) {
  const r = size / 2;
  const rot = invert ? 180 : 0;
  return (
    <polygon
      points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
      fill={RED}
      transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}
    />
  );
}

interface Props {
  value: number;
  className?: string;
}

/** Solid red diamond pips on cream — matches hearts/spades/clubs JPEG style. */
export function PipCardFace({ value, className = "" }: Props) {
  const label = RANK_LABELS[value] ?? String(value);
  const pips = PIP_LAYOUTS[value] ?? [];
  const mainSize = value >= 10 ? 11 : value >= 7 ? 12 : 13;
  const cornerSize = 5;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width={W} height={H} fill={CREAM} rx={4} />

      <text
        x={9}
        y={18}
        fill={RED}
        fontSize={value >= 10 ? 13 : 16}
        fontWeight={700}
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        {label}
      </text>
      <DiamondGlyph cx={14} cy={26} size={cornerSize} />

      <g transform={`translate(${W} ${H}) rotate(180)`}>
        <text
          x={9}
          y={18}
          fill={RED}
          fontSize={value >= 10 ? 13 : 16}
          fontWeight={700}
          fontFamily="Georgia, 'Times New Roman', serif"
        >
          {label}
        </text>
        <DiamondGlyph cx={14} cy={26} size={cornerSize} />
      </g>

      {pips.map((pip, i) => (
        <DiamondGlyph
          key={i}
          cx={pip.x * W}
          cy={pip.y * H}
          size={mainSize}
          invert={pip.invert}
        />
      ))}
    </svg>
  );
}