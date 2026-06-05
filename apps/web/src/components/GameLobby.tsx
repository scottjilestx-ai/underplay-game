"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CpuDifficulty } from "@underplay/engine";
import { useTheme } from "@/context/ThemeProvider";
import { LobbyChrome } from "./LobbyChrome";
import { ScrollPage } from "./ScrollPage";
import {
  defaultOpponents,
  loadStoredDisplayName,
  PLAY_TO_SCORE_OPTIONS,
  STACK_DISPLAY_OPTIONS,
  storeDisplayName,
  type GameMode,
  type FirstPlayerChoice,
  type GameSetupConfig,
  type OpponentSetup,
  type PlayToScore,
  type StackDisplayMode,
} from "@/lib/gameSetup";

interface Props {
  startError: string | null;
  onStart: (config: GameSetupConfig) => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-theme-muted mb-2">
      {children}
    </p>
  );
}

function Pill<T extends string | number>({
  value,
  selected,
  onSelect,
  children,
  className = "",
}: {
  value: T;
  selected: boolean;
  onSelect: (v: T) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const { theme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`min-w-[2.75rem] px-3 py-2 rounded-lg text-sm font-semibold transition border ${
        selected
          ? `border-[var(--theme-accent)] bg-gradient-to-r ${theme.buttonGradient} text-black shadow-[0_0_16px_var(--theme-glow)]`
          : "border-theme-border bg-black/35 text-theme-muted hover:border-[var(--theme-accent)]/40 hover:text-theme-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}

const CPU_DIFFICULTY_OPTIONS: { id: CpuDifficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Med" },
  { id: "hard", label: "Hard" },
];

export function GameLobby({ startError, onStart }: Props) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<GameMode>("cpu");
  const [playerName, setPlayerName] = useState("You");
  const [opponentCount, setOpponentCount] = useState(3);
  const [opponents, setOpponents] = useState<OpponentSetup[]>(() => defaultOpponents(3));
  const [playToScore, setPlayToScore] = useState<PlayToScore>(250);
  const [stackDisplay, setStackDisplay] = useState<StackDisplayMode>("full");
  const [firstPlayer, setFirstPlayer] = useState<FirstPlayerChoice>("random");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setPlayerName(loadStoredDisplayName());
  }, []);

  useEffect(() => {
    if (firstPlayer === "random") return;
    if (typeof firstPlayer === "number" && firstPlayer > opponentCount) {
      setFirstPlayer("random");
    }
  }, [opponentCount, firstPlayer]);

  const syncOpponentRows = useCallback((count: number) => {
    setOpponents((prev) => {
      const next = defaultOpponents(count);
      for (let i = 0; i < count; i++) {
        if (prev[i]) {
          next[i] = {
            name: prev[i].name,
            difficulty: prev[i].difficulty,
          };
        }
      }
      return next;
    });
  }, []);

  const setCount = (n: number) => {
    setOpponentCount(n);
    syncOpponentRows(n);
  };

  const updateOpponent = (index: number, patch: Partial<OpponentSetup>) => {
    setOpponents((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const handleStart = () => {
    const trimmed = playerName.trim() || "You";
    storeDisplayName(trimmed);
    onStart({
      mode,
      playerName: trimmed,
      opponentCount,
      opponents: opponents.slice(0, opponentCount),
      playToScore,
      stackDisplay,
      firstPlayer,
    });
  };

  const stackHint = STACK_DISPLAY_OPTIONS.find((o) => o.id === stackDisplay)?.hint;

  return (
    <ScrollPage>
      <div className="max-w-lg mx-auto px-4 pt-4 pb-28 sm:pb-8 sm:min-h-0">
        <LobbyChrome tagline="Play to the lowest score. Don't get stuck holding the pile." />

        <div className="rounded-2xl bg-theme-panel backdrop-blur-md border border-theme-border shadow-2xl p-5 sm:p-6">
          <h2 className="font-serif text-2xl text-theme-ink mb-0.5">New Game</h2>
          <p className="text-theme-muted text-sm mb-5">Set up a local match and deal in.</p>

          <FieldLabel>Mode</FieldLabel>
          <div className="flex gap-2 mb-5">
            <Pill value="cpu" selected={mode === "cpu"} onSelect={setMode} className="flex-1">
              vs CPU
            </Pill>
            <Pill
              value="hotseat"
              selected={mode === "hotseat"}
              onSelect={setMode}
              className="flex-1 text-xs sm:text-sm"
            >
              Hotseat
            </Pill>
          </div>

          <FieldLabel>Your name</FieldLabel>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={24}
            placeholder="Display name"
            className="w-full mb-5 rounded-lg border border-theme-border bg-black/40 px-3 py-2.5 text-theme-ink placeholder:text-theme-muted/50 focus:border-[var(--theme-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
          />

          <FieldLabel>Opponents</FieldLabel>
          <div className="flex gap-2 mb-4">
            {([1, 2, 3] as const).map((n) => (
              <Pill key={n} value={n} selected={opponentCount === n} onSelect={setCount}>
                {n}
              </Pill>
            ))}
          </div>

          {mode === "cpu" && opponentCount > 0 && (
            <p className="text-theme-muted text-xs mb-2 -mt-1">
              Difficulty per CPU — each opponent plays at its own level.
            </p>
          )}

          <div className="space-y-2.5 mb-5">
            {opponents.slice(0, opponentCount).map((opp, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl border border-theme-border bg-black/35 px-3 py-2.5"
              >
                <input
                  type="text"
                  value={opp.name}
                  onChange={(e) => updateOpponent(i, { name: e.target.value })}
                  maxLength={20}
                  className="min-w-0 flex-1 bg-transparent text-theme-ink font-medium text-sm focus:outline-none"
                  aria-label={`Opponent ${i + 1} name`}
                />
                {mode === "cpu" && (
                  <div
                    className="flex gap-1 shrink-0"
                    role="group"
                    aria-label={`${opp.name || `Opponent ${i + 1}`} difficulty`}
                  >
                    {CPU_DIFFICULTY_OPTIONS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateOpponent(i, { difficulty: id })}
                        aria-pressed={opp.difficulty === id}
                        className={`min-w-[2.25rem] px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                          opp.difficulty === id
                            ? `bg-gradient-to-r ${theme.buttonGradient} text-black`
                            : "bg-black/50 text-theme-muted hover:text-theme-ink"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-between text-sm text-theme-muted hover:text-theme-ink transition mb-3 py-1"
            aria-expanded={showAdvanced}
          >
            <span>Advanced options</span>
            <span aria-hidden className="text-theme-muted">
              {showAdvanced ? "▾" : "▸"}
            </span>
          </button>

          {showAdvanced && (
            <div className="mb-2 border-t border-theme-border pt-4">
              <FieldLabel>Who plays first</FieldLabel>
              <div className="flex flex-wrap gap-2 mb-5">
                <Pill
                  value={"random" as const}
                  selected={firstPlayer === "random"}
                  onSelect={setFirstPlayer}
                >
                  Random
                </Pill>
                <Pill
                  value={0 as const}
                  selected={firstPlayer === 0}
                  onSelect={setFirstPlayer}
                >
                  {playerName.trim() || "You"}
                </Pill>
                {opponents.slice(0, opponentCount).map((opp, i) => (
                  <Pill
                    key={i}
                    value={(i + 1) as number}
                    selected={firstPlayer === i + 1}
                    onSelect={setFirstPlayer}
                  >
                    {opp.name.trim() || `Player ${i + 2}`}
                  </Pill>
                ))}
              </div>

              <FieldLabel>Stack on table</FieldLabel>
              <div className="flex flex-wrap gap-2 mb-1">
                {STACK_DISPLAY_OPTIONS.map((opt) => (
                  <Pill
                    key={opt.id}
                    value={opt.id}
                    selected={stackDisplay === opt.id}
                    onSelect={setStackDisplay}
                  >
                    {opt.shortLabel}
                  </Pill>
                ))}
              </div>
              {stackHint && (
                <p className="text-theme-muted text-xs mb-5 leading-relaxed">{stackHint}</p>
              )}

              <FieldLabel>Play to (match ends at this total)</FieldLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {PLAY_TO_SCORE_OPTIONS.map((score) => (
                  <Pill
                    key={score}
                    value={score}
                    selected={playToScore === score}
                    onSelect={setPlayToScore}
                  >
                    {score}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          {startError && (
            <p className="mt-4 text-rose-200 text-sm rounded-lg bg-rose-950/50 border border-rose-500/30 px-3 py-2">
              {startError}
            </p>
          )}

          <button
            type="button"
            onClick={handleStart}
            className={`hidden sm:block w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r ${theme.buttonGradient} text-black font-bold hover:opacity-90 transition`}
          >
            Deal cards
          </button>

          <p className="hidden sm:block mt-4 text-center text-theme-muted text-xs">
            <Link
              href="/online"
              className="hover:text-theme-ink transition"
              style={{ color: "var(--theme-accent)" }}
            >
              Play online with friends
            </Link>
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 p-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-[var(--lobby-gradient-mid)] via-[var(--lobby-gradient-mid)]/95 to-transparent sm:hidden pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <button
            type="button"
            onClick={handleStart}
            className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${theme.buttonGradient} text-black font-bold shadow-lg hover:opacity-90 transition`}
          >
            Deal cards
          </button>
          <p className="mt-2 text-center text-theme-muted text-xs">
            <Link
              href="/online"
              className="hover:text-theme-ink transition"
              style={{ color: "var(--theme-accent)" }}
            >
              Play online
            </Link>
          </p>
        </div>
      </div>
    </ScrollPage>
  );
}