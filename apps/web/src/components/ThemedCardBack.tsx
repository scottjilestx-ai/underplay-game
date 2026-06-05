"use client";

import { useId } from "react";
import { getGameTheme, type GameThemeId } from "@/lib/themes";

interface Props {
  themeId: GameThemeId;
  className?: string;
}

export function ThemedCardBack({ themeId, className = "" }: Props) {
  const uid = useId().replace(/:/g, "");
  const theme = getGameTheme(themeId);
  const { palette } = theme;

  switch (themeId) {
    case "volt":
      return (
        <svg viewBox="0 0 90 130" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id={`${uid}-bolt`} width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M12 2 L8 14 H14 L10 22 L18 10 H12 Z"
                fill="none"
                stroke="rgba(220,38,38,0.35)"
                strokeWidth="1.2"
              />
            </pattern>
          </defs>
          <rect width={90} height={130} fill="#0c0c0c" rx={4} />
          <rect width={90} height={130} fill={`url(#${uid}-bolt)`} rx={4} />
          <rect x={6} y={6} width={78} height={118} fill="none" stroke={palette.accent} strokeWidth={1.5} rx={3} opacity={0.7} />
          <path d="M45 28 L32 68 H42 L38 102 L58 58 H48 Z" fill={palette.accent} opacity={0.85} />
          <text x={45} y={118} textAnchor="middle" fill={palette.accentAlt} fontSize={7} fontWeight={700} letterSpacing={2} fontFamily="Georgia, serif">
            UNDERPLAY
          </text>
        </svg>
      );

    case "regal":
      return (
        <svg viewBox="0 0 90 130" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${uid}-velvet`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b1f6e" />
              <stop offset="100%" stopColor="#1a0f33" />
            </linearGradient>
          </defs>
          <rect width={90} height={130} fill={`url(#${uid}-velvet)`} rx={4} />
          <rect x={5} y={5} width={80} height={120} fill="none" stroke={palette.accent} strokeWidth={1.2} rx={3} opacity={0.65} />
          <path d="M45 32 L32 48 L36 68 L28 78 L45 70 L62 78 L54 68 L58 48 Z" fill="none" stroke={palette.accent} strokeWidth={1.8} />
          <circle cx={45} cy={44} r={4} fill={palette.accent} opacity={0.9} />
          <text x={45} y={112} textAnchor="middle" fill={palette.ink} fontSize={7} fontWeight={600} letterSpacing={2} fontFamily="Georgia, serif">
            UNDERPLAY
          </text>
        </svg>
      );

    case "casino":
      return (
        <svg viewBox="0 0 90 130" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id={`${uid}-diamond`} width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M8 2 L14 8 L8 14 L2 8 Z" fill="none" stroke="rgba(22,101,52,0.25)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width={90} height={130} fill="#14532d" rx={4} />
          <rect width={90} height={130} fill={`url(#${uid}-diamond)`} rx={4} />
          <rect x={8} y={8} width={74} height={114} fill="none" stroke="#86efac" strokeWidth={1.2} rx={3} />
          <text x={45} y={68} textAnchor="middle" fill="#f8faf5" fontSize={11} fontWeight={700} fontFamily="Georgia, serif">
            UNDERPLAY
          </text>
        </svg>
      );

    case "neon":
      return (
        <svg viewBox="0 0 90 130" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
          <rect width={90} height={130} fill={palette.face} rx={4} />
          <rect x={4} y={4} width={82} height={122} fill="none" stroke={palette.accent} strokeWidth={1} rx={3} opacity={0.8} />
          <rect x={7} y={7} width={76} height={116} fill="none" stroke={palette.accentAlt} strokeWidth={0.6} rx={2} opacity={0.5} />
          <circle cx={45} cy={58} r={18} fill="none" stroke={palette.accent} strokeWidth={1.2} opacity={0.6} />
          <text x={45} y={62} textAnchor="middle" fill={palette.accent} fontSize={9} fontWeight={800} letterSpacing={3} fontFamily="DM Sans, sans-serif">
            UP
          </text>
        </svg>
      );

    case "vintage":
      return (
        <svg viewBox="0 0 90 130" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
          <rect width={90} height={130} fill="#e7e0d4" rx={4} />
          <rect x={6} y={6} width={78} height={118} fill="#f5f0e6" stroke={palette.border} strokeWidth={1} rx={3} />
          <ellipse cx={45} cy={58} rx={22} ry={28} fill="none" stroke={palette.ink} strokeWidth={0.8} opacity={0.35} />
          <text x={45} y={64} textAnchor="middle" fill={palette.ink} fontSize={10} fontWeight={600} letterSpacing={1} fontFamily="Georgia, serif">
            UnderPlay
          </text>
        </svg>
      );

    case "ocean":
      return (
        <svg viewBox="0 0 90 130" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${uid}-sea`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c4a6e" />
              <stop offset="100%" stopColor="#042f2e" />
            </linearGradient>
          </defs>
          <rect width={90} height={130} fill={`url(#${uid}-sea)`} rx={4} />
          <path d="M0 72 Q22 58 45 72 T90 72 V130 H0 Z" fill={palette.accent} opacity={0.25} />
          <path d="M0 88 Q30 74 60 88 T90 88 V130 H0 Z" fill={palette.accentAlt} opacity={0.2} />
          <text x={45} y={48} textAnchor="middle" fill={palette.ink} fontSize={8} fontWeight={600} letterSpacing={2} fontFamily="DM Sans, sans-serif">
            UNDERPLAY
          </text>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 90 130" className={className} aria-hidden>
          <rect width={90} height={130} fill={palette.face} rx={4} />
        </svg>
      );
  }
}