"use client";

import type { GameThemeId } from "@/lib/themes";

interface Props {
  themeId: GameThemeId;
  className?: string;
}

export function ThemedCardBack({ themeId, className = "" }: Props) {
  if (themeId === "acdc") {
    return (
      <svg
        viewBox="0 0 90 130"
        className={className}
        aria-hidden
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="acdc-bolt" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M12 2 L8 14 H14 L10 22 L18 10 H12 Z"
              fill="none"
              stroke="rgba(220,38,38,0.35)"
              strokeWidth="1.2"
            />
          </pattern>
        </defs>
        <rect width={90} height={130} fill="#0c0c0c" rx={4} />
        <rect width={90} height={130} fill="url(#acdc-bolt)" rx={4} />
        <rect
          x={6}
          y={6}
          width={78}
          height={118}
          fill="none"
          stroke="#dc2626"
          strokeWidth={1.5}
          rx={3}
          opacity={0.7}
        />
        <path
          d="M45 28 L32 68 H42 L38 102 L58 58 H48 Z"
          fill="#dc2626"
          opacity={0.85}
        />
        <text
          x={45}
          y={118}
          textAnchor="middle"
          fill="#fbbf24"
          fontSize={7}
          fontWeight={700}
          letterSpacing={2}
          fontFamily="Georgia, serif"
        >
          UNDERPLAY
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 90 130"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="queen-velvet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b1f6e" />
          <stop offset="100%" stopColor="#1a0f33" />
        </linearGradient>
      </defs>
      <rect width={90} height={130} fill="url(#queen-velvet)" rx={4} />
      <rect
        x={5}
        y={5}
        width={80}
        height={120}
        fill="none"
        stroke="#d4af37"
        strokeWidth={1.2}
        rx={3}
        opacity={0.65}
      />
      <path
        d="M45 32 L32 48 L36 68 L28 78 L45 70 L62 78 L54 68 L58 48 Z"
        fill="none"
        stroke="#d4af37"
        strokeWidth={1.8}
      />
      <circle cx={45} cy={44} r={4} fill="#d4af37" opacity={0.9} />
      <text
        x={45}
        y={112}
        textAnchor="middle"
        fill="#f5e6c8"
        fontSize={7}
        fontWeight={600}
        letterSpacing={2}
        fontFamily="Georgia, serif"
      >
        UNDERPLAY
      </text>
    </svg>
  );
}