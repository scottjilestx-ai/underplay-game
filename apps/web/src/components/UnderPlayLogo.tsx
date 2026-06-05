"use client";

import { getGameTheme, type GameThemeId } from "@/lib/themes";

interface Props {
  themeId: GameThemeId;
  size?: "hero" | "card" | "header";
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  hero: "w-full max-w-md h-14",
  card: "w-full h-10",
  header: "w-full h-8",
};

/** SVG wordmark — follows active game theme colors. */
export function UnderPlayLogo({ themeId, size = "hero", className = "" }: Props) {
  const theme = getGameTheme(themeId);
  const accent = theme.palette.accent;
  const accentAlt = theme.palette.accentAlt;
  const ink = theme.palette.ink;

  return (
    <svg
      viewBox="0 0 240 48"
      className={`${SIZE_CLASS[size]} ${className}`}
      role="img"
      aria-label={`${theme.name} — UnderPlay`}
    >
      <text
        x={0}
        y={34}
        fill={ink}
        fontSize={32}
        fontWeight={700}
        fontFamily="Georgia, 'Cormorant Garamond', serif"
        letterSpacing={-0.5}
      >
        UNDER
      </text>
      <text
        x={118}
        y={34}
        fill={accent}
        fontSize={32}
        fontWeight={700}
        fontFamily="Georgia, 'Cormorant Garamond', serif"
        letterSpacing={-0.5}
      >
        PLAY
      </text>
      <path
        d="M108 8 L100 28 H106 L102 40 L116 18 H110 Z"
        fill={accentAlt}
        opacity={0.9}
      />
    </svg>
  );
}