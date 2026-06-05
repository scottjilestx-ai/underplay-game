"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CpuDifficulty } from "@underplay/engine";
import { BRAND_NAME } from "@/lib/brand";
import {
  defaultOpponents,
  loadStoredDisplayName,
  PLAY_TO_SCORE_OPTIONS,
  STACK_DISPLAY_OPTIONS,
  storeDisplayName,
  type GameMode,
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
    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{children}</p>
  );
}

function Pill<T extends string | number>({
  value,
  selected,
  onSelect,
  children,
  className = "",
  solidWhenSelected = false,
}: {
  value: T;
  selected: boolean;
  onSelect: (v: T) => void;
  children: React.ReactNode;
  className?: string;
  solidWhenSelected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`min-w-[2.75rem] px-3 py-2 rounded-lg text-sm font-semibold transition border ${
        selected
          ? solidWhenSelected
            ? "border-emerald-400 bg-emerald-500 text-black"
            : "border-emerald-400 bg-emerald-500/20 text-emerald-100"
          : "border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
      } ${className}`}
    >
      {children}
    </button>
  );
}

const DIFFICULTIES: CpuDifficulty[] = ["easy", "medium", "hard"];

export function GameLobby({ startError, onStart }: Props) {
  const [mode, setMode] = useState<GameMode>("cpu");
  const [playerName, setPlayerName] = useState("You");
  const [opponentCount, setOpponentCount] = useState(3);
  const [opponents, setOpponents] = useState<OpponentSetup[]>(() => defaultOpponents(3));
  const [playToScore, setPlayToScore] = useState<PlayToScore>(250);
  const [stackDisplay, setStackDisplay] = useState<StackDisplayMode>("full");

  useEffect(() => {
    setPlayerName(loadStoredDisplayName());
  }, []);

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
    });
  };

  const stackHint = STACK_DISPLAY_OPTIONS.find((o) => o.id === stackDisplay)?.hint;

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center p-6 overflow-y-auto">
      <div className="w-full max-w-lg text-center mb-5 shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight">{BRAND_NAME}</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Play to the lowest score. Don&apos;t get stuck holding the pile.
        </p>
      </div>

      <div className="w-full max-w-lg rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl flex flex-col max-h-[calc(100dvh-7rem)]">
        <div className="overflow-y-auto p-6 flex-1 min-h-0">
          <Link
            href="/"
            className="text-zinc-500 text-sm hover:text-zinc-300 transition mb-4 inline-block"
          >
            ← Home
          </Link>

          <h2 className="text-xl font-bold text-white mb-0.5">New Game</h2>
          <p className="text-zinc-500 text-sm mb-6">Set up a local match and deal in.</p>

          <FieldLabel>Mode</FieldLabel>
          <div className="flex gap-2 mb-6">
            <Pill
              value="cpu"
              selected={mode === "cpu"}
              onSelect={setMode}
              className="flex-1"
              solidWhenSelected
            >
              vs CPU
            </Pill>
            <Pill
              value="hotseat"
              selected={mode === "hotseat"}
              onSelect={setMode}
              className="flex-1 text-xs sm:text-sm"
              solidWhenSelected
            >
              Hotseat (pass &amp; play)
            </Pill>
          </div>

          <FieldLabel>Your name</FieldLabel>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={24}
            placeholder="Display name"
            className="w-full mb-6 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none"
          />

          <FieldLabel>Opponents</FieldLabel>
          <div className="flex gap-2 mb-4">
            {([1, 2, 3] as const).map((n) => (
              <Pill
                key={n}
                value={n}
                selected={opponentCount === n}
                onSelect={setCount}
                solidWhenSelected
              >
                {n}
              </Pill>
            ))}
          </div>

          <div className="space-y-2.5 mb-6">
            {opponents.slice(0, opponentCount).map((opp, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5"
              >
                <input
                  type="text"
                  value={opp.name}
                  onChange={(e) => updateOpponent(i, { name: e.target.value })}
                  maxLength={20}
                  className="min-w-0 flex-1 bg-transparent text-white font-medium text-sm focus:outline-none"
                  aria-label={`Opponent ${i + 1} name`}
                />
                {mode === "cpu" && (
                  <div className="flex gap-1 shrink-0">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateOpponent(i, { difficulty: d })}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold capitalize transition ${
                          opp.difficulty === d
                            ? "bg-emerald-500 text-black"
                            : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                solidWhenSelected
              >
                {opt.shortLabel}
              </Pill>
            ))}
          </div>
          {stackHint && (
            <p className="text-zinc-600 text-xs mb-6 leading-relaxed">{stackHint}</p>
          )}

          <FieldLabel>Play to (match ends when a total hits this)</FieldLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {PLAY_TO_SCORE_OPTIONS.map((score) => (
              <Pill
                key={score}
                value={score}
                selected={playToScore === score}
                onSelect={setPlayToScore}
                solidWhenSelected
              >
                {score}
              </Pill>
            ))}
          </div>

          {startError && (
            <p className="mt-4 text-rose-300 text-sm rounded-lg bg-rose-950/50 border border-rose-500/30 px-3 py-2">
              {startError}
            </p>
          )}
        </div>

        <div className="shrink-0 p-6 pt-3 border-t border-zinc-800 bg-zinc-900/95 rounded-b-2xl">
          <button
            type="button"
            onClick={handleStart}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition"
          >
            Deal cards
          </button>

          <p className="mt-4 text-center text-zinc-600 text-xs">
            <Link href="/online" className="text-emerald-500/90 hover:text-emerald-400">
              Play online with friends
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}