/** SVG deck + table styling — no raster card or band artwork. */
export type GameThemeId = "volt" | "regal" | "casino" | "neon" | "vintage" | "ocean";

export type PipStyle = "bolt" | "crown" | "diamond" | "star" | "spade" | "wave";

export interface CardPalette {
  face: string;
  ink: string;
  accent: string;
  accentAlt: string;
  border: string;
}

export interface GameTheme {
  id: GameThemeId;
  name: string;
  shortName: string;
  tagline: string;
  pipStyle: PipStyle;
  palette: CardPalette;
  /** Tailwind gradient classes for primary buttons */
  buttonGradient: string;
  buttonBorder: string;
  /** Swatches for theme browser */
  swatches: [string, string, string];
}

export const GAME_THEMES: Record<GameThemeId, GameTheme> = {
  volt: {
    id: "volt",
    name: "High Voltage",
    shortName: "Volt",
    tagline: "Black stage, red bolts, gold highlights.",
    pipStyle: "bolt",
    palette: {
      face: "#141414",
      ink: "#f4efe3",
      accent: "#dc2626",
      accentAlt: "#fbbf24",
      border: "#7f1d1d",
    },
    buttonGradient: "from-red-600 to-red-500",
    buttonBorder: "border-red-500/40",
    swatches: ["#dc2626", "#141414", "#fbbf24"],
  },
  regal: {
    id: "regal",
    name: "Regal",
    shortName: "Regal",
    tagline: "Velvet purple, gilt crowns, arena drama.",
    pipStyle: "crown",
    palette: {
      face: "#2a1848",
      ink: "#f5e6c8",
      accent: "#d4af37",
      accentAlt: "#c4b5fd",
      border: "#5b3a8c",
    },
    buttonGradient: "from-violet-600 to-amber-500",
    buttonBorder: "border-violet-400/40",
    swatches: ["#d4af37", "#2a1848", "#c4b5fd"],
  },
  casino: {
    id: "casino",
    name: "Casino",
    shortName: "Casino",
    tagline: "Classic felt green, crisp diamonds and hearts.",
    pipStyle: "diamond",
    palette: {
      face: "#f8faf5",
      ink: "#1a1a1a",
      accent: "#b91c1c",
      accentAlt: "#166534",
      border: "#86efac",
    },
    buttonGradient: "from-emerald-600 to-emerald-500",
    buttonBorder: "border-emerald-500/40",
    swatches: ["#166534", "#f8faf5", "#b91c1c"],
  },
  neon: {
    id: "neon",
    name: "Neon",
    shortName: "Neon",
    tagline: "Arcade glow — cyan and magenta on midnight.",
    pipStyle: "star",
    palette: {
      face: "#0a0f1a",
      ink: "#e0f2fe",
      accent: "#22d3ee",
      accentAlt: "#e879f9",
      border: "#312e81",
    },
    buttonGradient: "from-cyan-500 to-fuchsia-500",
    buttonBorder: "border-cyan-400/40",
    swatches: ["#22d3ee", "#0a0f1a", "#e879f9"],
  },
  vintage: {
    id: "vintage",
    name: "Vintage",
    shortName: "Vintage",
    tagline: "Cream stock, sepia ink, old-parlor spades.",
    pipStyle: "spade",
    palette: {
      face: "#f5f0e6",
      ink: "#3d2914",
      accent: "#92400e",
      accentAlt: "#78716c",
      border: "#d6d3d1",
    },
    buttonGradient: "from-amber-800 to-amber-700",
    buttonBorder: "border-amber-700/40",
    swatches: ["#92400e", "#f5f0e6", "#3d2914"],
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    shortName: "Ocean",
    tagline: "Deep teal felt, sea-glass waves, pearl white.",
    pipStyle: "wave",
    palette: {
      face: "#0f2a33",
      ink: "#ecfeff",
      accent: "#2dd4bf",
      accentAlt: "#38bdf8",
      border: "#155e75",
    },
    buttonGradient: "from-teal-500 to-sky-500",
    buttonBorder: "border-teal-400/40",
    swatches: ["#2dd4bf", "#0f2a33", "#38bdf8"],
  },
};

export const GAME_THEME_IDS: GameThemeId[] = [
  "volt",
  "regal",
  "casino",
  "neon",
  "vintage",
  "ocean",
];

const LEGACY_THEME_MAP: Record<string, GameThemeId> = {
  acdc: "volt",
  queen: "regal",
};

export function normalizeThemeId(raw: string | null | undefined): GameThemeId {
  if (!raw) return "casino";
  if (raw in GAME_THEMES) return raw as GameThemeId;
  return LEGACY_THEME_MAP[raw] ?? "casino";
}

export function getGameTheme(id: GameThemeId): GameTheme {
  return GAME_THEMES[id];
}

export function getCardPalette(id: GameThemeId): CardPalette {
  return GAME_THEMES[id].palette;
}