"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CARD_DECK_IDS,
  getCardDeck,
  normalizeDeckId,
  type CardDeck,
  type CardDeckId,
} from "@/lib/cardDecks";
import {
  GAME_THEME_IDS,
  getGameTheme,
  normalizeThemeId,
  type GameTheme,
  type GameThemeId,
} from "@/lib/themes";

const THEME_STORAGE_KEY = "underplay-game-theme";
const DECK_STORAGE_KEY = "underplay-card-deck";

interface ThemeContextValue {
  themeId: GameThemeId;
  theme: GameTheme;
  setThemeId: (id: GameThemeId) => void;
  deckId: CardDeckId;
  deck: CardDeck;
  setDeckId: (id: CardDeckId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): GameThemeId {
  if (typeof window === "undefined") return "casino";
  return normalizeThemeId(localStorage.getItem(THEME_STORAGE_KEY));
}

function readStoredDeck(): CardDeckId {
  if (typeof window === "undefined") return "bicycle";
  return normalizeDeckId(localStorage.getItem(DECK_STORAGE_KEY));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<GameThemeId>("casino");
  const [deckId, setDeckIdState] = useState<CardDeckId>("bicycle");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedTheme = readStoredTheme();
    const storedDeck = readStoredDeck();
    setThemeIdState(storedTheme);
    setDeckIdState(storedDeck);
    document.documentElement.dataset.theme = storedTheme;
    setReady(true);
  }, []);

  const setThemeId = useCallback((id: GameThemeId) => {
    if (!GAME_THEME_IDS.includes(id)) return;
    setThemeIdState(id);
    localStorage.setItem(THEME_STORAGE_KEY, id);
    document.documentElement.dataset.theme = id;
  }, []);

  const setDeckId = useCallback((id: CardDeckId) => {
    if (!CARD_DECK_IDS.includes(id)) return;
    setDeckIdState(id);
    localStorage.setItem(DECK_STORAGE_KEY, id);
  }, []);

  useEffect(() => {
    if (ready) document.documentElement.dataset.theme = themeId;
  }, [themeId, ready]);

  const value = useMemo(
    () => ({
      themeId,
      theme: getGameTheme(themeId),
      setThemeId,
      deckId,
      deck: getCardDeck(deckId),
      setDeckId,
    }),
    [themeId, deckId, setThemeId, setDeckId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}