/** Playable skins — each ships a full SVG deck + room/table styling. */
export type GameThemeId = "acdc" | "queen";

/** Marketing logo marks (includes non-playable styles). */
export type LogoVariant = GameThemeId | "vanhalen" | "kiss" | "metallica" | "stones";

export interface GameTheme {
  id: GameThemeId;
  name: string;
  shortName: string;
  logoSrc: string;
  /** Tailwind ring/accent token for controls */
  accentClass: string;
  buttonGradient: string;
  buttonBorder: string;
}

export const GAME_THEMES: Record<GameThemeId, GameTheme> = {
  acdc: {
    id: "acdc",
    name: "High voltage",
    shortName: "AC/DC",
    logoSrc: "/logos/acdc.jpg",
    accentClass: "ring-red-500",
    buttonGradient: "from-red-600 to-red-500",
    buttonBorder: "border-red-500/40",
  },
  queen: {
    id: "queen",
    name: "Arena royalty",
    shortName: "Queen",
    logoSrc: "/logos/queen.jpg",
    accentClass: "ring-amber-400",
    buttonGradient: "from-violet-600 to-amber-500",
    buttonBorder: "border-violet-400/40",
  },
};

export const GAME_THEME_IDS: GameThemeId[] = ["acdc", "queen"];

export const LOGO_VARIANT_LABELS: Record<LogoVariant, string> = {
  acdc: "High voltage (AC/DC)",
  queen: "Arena royalty (Queen)",
  vanhalen: "Striped chrome (Van Halen)",
  kiss: "Arena chrome (KISS)",
  metallica: "Thrash metal (Metallica)",
  stones: "Classic rock (Rolling Stones)",
};

export const LOGO_SRC: Record<LogoVariant, string> = {
  acdc: "/logos/acdc.jpg",
  queen: "/logos/queen.jpg",
  vanhalen: "/logos/vanhalen.jpg",
  kiss: "/logos/kiss.jpg",
  metallica: "/logos/metallica.jpg",
  stones: "/logos/stones.jpg",
};

/** Featured logos on the marketing page. */
export const FEATURED_LOGO_VARIANTS: LogoVariant[] = ["acdc", "queen", "vanhalen"];

export function getGameTheme(id: GameThemeId): GameTheme {
  return GAME_THEMES[id];
}

export function logoForGameTheme(id: GameThemeId): string {
  return GAME_THEMES[id].logoSrc;
}

export function usesThemedSvgDeck(themeId: GameThemeId): boolean {
  return themeId === "acdc" || themeId === "queen";
}