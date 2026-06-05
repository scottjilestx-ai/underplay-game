import type { PipStyle } from "@/lib/themes";
import type { CardPalette } from "@/lib/themes";
import { displaySuitForValue } from "@/lib/cardSuits";

export function pipFill(
  suit: ReturnType<typeof displaySuitForValue>,
  palette: CardPalette,
): string {
  if (suit === "hearts" || suit === "diamonds") return palette.accent;
  return palette.ink;
}

export function PipGlyph({
  style,
  cx,
  cy,
  size,
  fill,
  invert,
}: {
  style: PipStyle;
  cx: number;
  cy: number;
  size: number;
  fill: string;
  invert?: boolean;
}) {
  const rot = invert ? `rotate(180 ${cx} ${cy})` : undefined;
  const s = size;

  switch (style) {
    case "bolt": {
      const d = `M${cx} ${cy - s * 0.45} L${cx - s * 0.28} ${cy + s * 0.05} H${cx + s * 0.08} L${cx - s * 0.12} ${cy + s * 0.48} L${cx + s * 0.32} ${cy - s * 0.12} H${cx - s * 0.02} Z`;
      return <path d={d} fill={fill} transform={rot} />;
    }
    case "crown": {
      const h = s * 0.5;
      const d = `M${cx - h} ${cy + h * 0.3} L${cx - h * 0.5} ${cy - h * 0.5} L${cx} ${cy - h * 0.1} L${cx + h * 0.5} ${cy - h * 0.5} L${cx + h} ${cy + h * 0.3} L${cx + h * 0.7} ${cy + h * 0.55} L${cx - h * 0.7} ${cy + h * 0.55} Z`;
      return <path d={d} fill={fill} transform={rot} />;
    }
    case "diamond": {
      const d = `M${cx} ${cy - s * 0.42} L${cx + s * 0.32} ${cy} L${cx} ${cy + s * 0.42} L${cx - s * 0.32} ${cy} Z`;
      return <path d={d} fill={fill} transform={rot} />;
    }
    case "star": {
      const r = s * 0.38;
      const d = `M${cx} ${cy - r} L${cx + r * 0.28} ${cy - r * 0.28} L${cx + r} ${cy} L${cx + r * 0.28} ${cy + r * 0.28} L${cx} ${cy + r} L${cx - r * 0.28} ${cy + r * 0.28} L${cx - r} ${cy} L${cx - r * 0.28} ${cy - r * 0.28} Z`;
      return <path d={d} fill={fill} transform={rot} />;
    }
    case "spade": {
      const d = `M${cx} ${cy - s * 0.38} C${cx - s * 0.35} ${cy - s * 0.1} ${cx - s * 0.35} ${cy + s * 0.15} ${cx} ${cy + s * 0.22} C${cx + s * 0.35} ${cy + s * 0.15} ${cx + s * 0.35} ${cy - s * 0.1} ${cx} ${cy - s * 0.38} M${cx - s * 0.12} ${cy + s * 0.28} L${cx} ${cy + s * 0.48} L${cx + s * 0.12} ${cy + s * 0.28}`;
      return <path d={d} fill={fill} transform={rot} />;
    }
    case "wave": {
      const w = s * 0.55;
      const d = `M${cx - w} ${cy} Q${cx - w * 0.4} ${cy - s * 0.35} ${cx} ${cy} T${cx + w} ${cy} Q${cx + w * 0.4} ${cy + s * 0.35} ${cx} ${cy} T${cx - w} ${cy}`;
      return (
        <path
          d={d}
          fill="none"
          stroke={fill}
          strokeWidth={Math.max(1.2, s * 0.14)}
          strokeLinecap="round"
          transform={rot}
        />
      );
    }
    default:
      return <circle cx={cx} cy={cy} r={s * 0.2} fill={fill} transform={rot} />;
  }
}