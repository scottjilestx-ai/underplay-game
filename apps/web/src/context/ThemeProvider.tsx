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
  GAME_THEME_IDS,
  getGameTheme,
  type GameTheme,
  type GameThemeId,
} from "@/lib/themes";

const STORAGE_KEY = "underplay-game-theme";

interface ThemeContextValue {
  themeId: GameThemeId;
  theme: GameTheme;
  setThemeId: (id: GameThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): GameThemeId {
  if (typeof window === "undefined") return "acdc";
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === "queen" ? "queen" : "acdc";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<GameThemeId>("acdc");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeIdState(stored);
    document.documentElement.dataset.theme = stored;
    setReady(true);
  }, []);

  const setThemeId = useCallback((id: GameThemeId) => {
    if (!GAME_THEME_IDS.includes(id)) return;
    setThemeIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
    document.documentElement.dataset.theme = id;
  }, []);

  useEffect(() => {
    if (ready) document.documentElement.dataset.theme = themeId;
  }, [themeId, ready]);

  const value = useMemo(
    () => ({
      themeId,
      theme: getGameTheme(themeId),
      setThemeId,
    }),
    [themeId, setThemeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}