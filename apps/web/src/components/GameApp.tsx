"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  advanceUntilHuman,
  applyMove,
  chooseMove,
  createMatch,
  legalMoves,
  startNextRound,
  topValue,
  type Card,
  type CpuDifficulty,
  type GameState,
  type Move,
  type PlayerSetup,
} from "@underplay/engine";
import { playSfx, setMuted, setVolume } from "@/lib/audio";
import { PlayingCard } from "./PlayingCard";

const CPU_NAMES = ["Alex", "Jordan", "Riley", "Casey"];
const CPU_PORTRAITS = [
  "from-amber-700 to-amber-900",
  "from-slate-600 to-slate-800",
  "from-emerald-700 to-emerald-900",
  "from-violet-700 to-violet-900",
];

export function GameApp() {
  const [screen, setScreen] = useState<"lobby" | "game">("lobby");
  const [playerCount, setPlayerCount] = useState(2);
  const [cpuCount, setCpuCount] = useState(1);
  const [difficulty, setDifficulty] = useState<CpuDifficulty>("medium");
  const [state, setState] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [skipTarget, setSkipTarget] = useState<number | null>(null);
  const [hideHand, setHideHand] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [vol, setVol] = useState(0.6);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lastEvent, setLastEvent] = useState("");
  const humanSeat = 0;
  const prevRef = useRef<GameState | null>(null);

  useEffect(() => {
    setMuted(muted);
    setVolume(vol);
  }, [muted, vol]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const startGame = () => {
    const setups: PlayerSetup[] = [];
    setups.push({ name: "You", isCpu: false });
    for (let i = 1; i < playerCount; i++) {
      const isCpu = i <= cpuCount;
      setups.push({
        name: isCpu ? CPU_NAMES[i - 1] : `Player ${i + 1}`,
        isCpu,
        difficulty: isCpu ? difficulty : undefined,
      });
    }
    const g = createMatch(setups, undefined, Date.now());
    setState(advanceUntilHuman(g));
    setSelected([]);
    setScreen("game");
    playSfx("deal");
  };

  const humanMoves = useMemo(() => {
    if (!state || state.phase !== "playing" || state.currentSeat !== humanSeat) return [];
    return legalMoves(state, humanSeat);
  }, [state]);

  const canPlay = useMemo(() => {
    if (!selected.length || !state) return false;
    return humanMoves.some(
      (m) =>
        m.cardIds.length === selected.length &&
        m.cardIds.every((id) => selected.includes(id)) &&
        (m.targetSeat == null || m.targetSeat === skipTarget),
    );
  }, [humanMoves, selected, skipTarget, state]);

  const isSkipSelection = useMemo(() => {
    if (!state || selected.length !== 1) return false;
    const c = findInZones(state.players[humanSeat], selected[0]);
    return c?.kind === "skip";
  }, [state, selected]);

  const applyHumanMove = useCallback(
    (move: Move) => {
      if (!state) return;
      const prev = state;
      const next = applyMove(state, move);
      detectSfx(prev, next, move);
      setState(advanceUntilHuman(next));
      setSelected([]);
      setSkipTarget(null);
    },
    [state],
  );

  useEffect(() => {
    if (!state || state.phase !== "playing") return;
    const p = state.players[state.currentSeat];
    if (!p.isCpu) return;
    const t = setTimeout(() => {
      const move = chooseMove(state, state.currentSeat, p.difficulty ?? "medium");
      if (!move) return;
      const next = applyMove(state, move);
      detectSfx(state, next, move);
      setState(advanceUntilHuman(next));
    }, reducedMotion ? 50 : 650);
    return () => clearTimeout(t);
  }, [state, reducedMotion]);

  useEffect(() => {
    prevRef.current = state;
  }, [state]);

  function detectSfx(prev: GameState, next: GameState, move: Move) {
    const played = move.cardIds.map((id) => findInZones(prev.players[prev.currentSeat], id)).filter(Boolean);
    if (played.some((c) => c?.kind === "clear") || next.stack.length === 0 && prev.stack.length > 0) {
      playSfx("clear");
      setLastEvent("Stack cleared");
    } else if (played.some((c) => c?.kind === "skip")) {
      playSfx("skip");
      setLastEvent("Skip played");
    } else if (move.cardIds.some((id) => prev.players[prev.currentSeat].faceDown.some((c) => c.id === id))) {
      playSfx("flip");
      setLastEvent("Face-down flipped");
    } else if (next.deadPile.length > prev.deadPile.length && next.stack.length === 0) {
      playSfx("tap");
      setLastEvent("Tap-out!");
    } else if (
      next.players[prev.currentSeat].hand.length > prev.players[prev.currentSeat].hand.length
    ) {
      playSfx("pickup");
      setLastEvent("Picked up pile");
    } else {
      playSfx("play");
      setLastEvent("Card played");
    }
    if (next.phase === "roundOver" || next.phase === "matchOver") playSfx("win");
  }

  if (screen === "lobby") {
    return (
      <div className="min-h-screen lobby-bg flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full rounded-2xl bg-black/40 backdrop-blur-md border border-amber-500/20 p-8 shadow-2xl"
        >
          <h1 className="font-serif text-4xl text-amber-100 tracking-tight mb-1">Underplay</h1>
          <p className="text-amber-200/70 text-sm mb-8">Play under the top card — or pick up the pile.</p>
          <label className="block text-amber-100/80 text-sm mb-2">Players ({playerCount})</label>
          <input
            type="range"
            min={2}
            max={4}
            value={playerCount}
            onChange={(e) => {
              const n = Number(e.target.value);
              setPlayerCount(n);
              if (cpuCount > n - 1) setCpuCount(n - 1);
            }}
            className="w-full mb-6 accent-amber-400"
          />
          <label className="block text-amber-100/80 text-sm mb-2">CPU opponents ({cpuCount})</label>
          <input
            type="range"
            min={0}
            max={playerCount - 1}
            value={cpuCount}
            onChange={(e) => setCpuCount(Number(e.target.value))}
            className="w-full mb-6 accent-amber-400"
          />
          <label className="block text-amber-100/80 text-sm mb-2">CPU difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as CpuDifficulty)}
            className="w-full mb-8 bg-black/30 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-50"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button
            type="button"
            onClick={startGame}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-amber-400 transition"
          >
            Deal & Play
          </button>
        </motion.div>
      </div>
    );
  }

  if (!state) return null;
  const me = state.players[humanSeat];
  const T = topValue(state.stack);
  const myTurn = state.currentSeat === humanSeat && state.phase === "playing";

  return (
    <div className="min-h-screen table-bg flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2 border-b border-amber-900/30 bg-black/30">
        <div>
          <span className="font-serif text-amber-100 text-lg">Underplay</span>
          <span className="ml-3 text-amber-200/60 text-sm">
            Round {state.roundNumber} · T={T ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-amber-100/80">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={muted} onChange={(e) => setMutedState(e.target.checked)} />
            Mute
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={vol}
            onChange={(e) => setVol(Number(e.target.value))}
            className="w-20 accent-amber-400"
            disabled={muted}
          />
          {state.scores.map((s, i) => (
            <span key={i} className={i === humanSeat ? "text-amber-300" : ""}>
              {state.players[i].name}: {s}
            </span>
          ))}
        </div>
      </header>

      <div className="flex-1 relative p-4 flex flex-col">
        <div className="flex justify-center gap-8 mb-4">
          {state.players
            .filter((p) => p.seat !== humanSeat)
            .map((p) => (
              <OpponentPanel
                key={p.seat}
                player={p}
                active={state.currentSeat === p.seat}
                portrait={CPU_PORTRAITS[p.seat % 4]}
              />
            ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-amber-200/50 text-xs mb-2 uppercase tracking-widest">Stack</p>
          <div className="relative min-h-[7rem] flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              {state.stack.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-amber-200/40 text-sm italic"
                >
                  Empty — play anything
                </motion.p>
              ) : (
                <div className="flex -space-x-10">
                  {state.stack.slice(-5).map((c, i) => (
                    <PlayingCard
                      key={`${c.id}-${i}`}
                      card={c}
                      small={i < state.stack.slice(-5).length - 1}
                      layoutId={c.id}
                      reducedMotion={reducedMotion}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-3 text-amber-100/60 text-sm h-5">{lastEvent}</p>
        </div>

        {(state.phase === "roundOver" || state.phase === "matchOver") && (
          <EndOverlay
            state={state}
            humanSeat={humanSeat}
            onNext={() => {
              if (state.phase === "matchOver") {
                setScreen("lobby");
                setState(null);
              } else {
                const n = startNextRound(state);
                setState(advanceUntilHuman(n));
                playSfx("deal");
              }
            }}
          />
        )}

        <div className="mt-auto">
          {hideHand && myTurn && (
            <div className="text-center mb-4">
              <button
                type="button"
                onClick={() => setHideHand(false)}
                className="px-6 py-2 rounded-full bg-amber-500 text-black font-medium"
              >
                Show my hand
              </button>
            </div>
          )}
          {!hideHand && (
            <>
              <div className="flex justify-center gap-1 flex-wrap mb-2 min-h-[5rem]">
                {me.faceUp.map((c) => (
                  <PlayingCard
                    key={c.id}
                    card={c}
                    selected={selected.includes(c.id)}
                    onClick={myTurn ? () => toggleSelect(c.id) : undefined}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </div>
              <div className="flex justify-center gap-1 flex-wrap mb-4">
                {me.faceDown.map((c, i) => {
                  const uncovered = me.faceDown.length - me.faceUp.length;
                  const canFlip = i >= me.faceDown.length - uncovered;
                  return (
                    <PlayingCard
                      key={c.id}
                      faceDown
                      selected={selected.includes(c.id)}
                      onClick={myTurn && canFlip ? () => setSelected([c.id]) : undefined}
                      reducedMotion={reducedMotion}
                    />
                  );
                })}
              </div>
              <div className="flex justify-center gap-1 flex-wrap pb-4 px-2">
                {me.hand.map((c) => (
                  <PlayingCard
                    key={c.id}
                    card={c}
                    selected={selected.includes(c.id)}
                    onClick={myTurn ? () => toggleSelect(c.id) : undefined}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </div>
            </>
          )}
          <div className="flex justify-center gap-3 pb-6">
            {isSkipSelection && (
              <div className="flex gap-2 items-center">
                <span className="text-amber-200/70 text-sm">Skip target:</span>
                {state.players
                  .filter((p) => p.seat !== humanSeat && !p.pendingSkip)
                  .map((p) => (
                    <button
                      key={p.seat}
                      type="button"
                      onClick={() => setSkipTarget(p.seat)}
                      className={`px-3 py-1 rounded-lg text-sm ${skipTarget === p.seat ? "bg-rose-500 text-white" : "bg-black/40 text-amber-100"}`}
                    >
                      {p.name}
                    </button>
                  ))}
              </div>
            )}
            {myTurn && (
              <>
                <button
                  type="button"
                  disabled={!canPlay}
                  onClick={() => {
                    const move = humanMoves.find(
                      (m) =>
                        m.cardIds.length === selected.length &&
                        [...m.cardIds].sort().join() === [...selected].sort().join() &&
                        (m.targetSeat == null || m.targetSeat === skipTarget),
                    );
                    if (move) applyHumanMove(move);
                  }}
                  className="px-8 py-2 rounded-xl bg-amber-500 text-black font-semibold disabled:opacity-40"
                >
                  Play
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelected([]);
                    setSkipTarget(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-black/40 text-amber-100"
                >
                  Clear
                </button>
              </>
            )}
            {!myTurn && state.phase === "playing" && (
              <p className="text-amber-200/70">
                {state.players[state.currentSeat].name}&apos;s turn…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const card = state && findInZones(state.players[humanSeat], id);
      if (card?.kind === "clear" || card?.kind === "skip") return [id];
      if (prev.length && state) {
        const first = findInZones(state.players[humanSeat], prev[0]);
        if (first?.kind !== "play" || card?.kind !== "play" || first.value !== card.value) return [id];
      }
      return [...prev, id];
    });
  }
}

function OpponentPanel({
  player,
  active,
  portrait,
}: {
  player: GameState["players"][0];
  active: boolean;
  portrait: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 p-3 rounded-xl ${active ? "ring-2 ring-amber-400/80 bg-amber-500/10" : "bg-black/20"}`}
    >
      <div
        className={`w-14 h-14 rounded-full bg-gradient-to-br ${portrait} shadow-lg border-2 border-amber-600/40`}
      />
      <span className="text-amber-100 text-sm font-medium">{player.name}</span>
      <span className="text-amber-200/50 text-xs">
        Hand: {player.hand.length} · Up: {player.faceUp.length} · Down: {player.faceDown.length}
      </span>
      <div className="flex gap-0.5">
        {player.faceUp.map((c) => (
          <PlayingCard key={c.id} card={c} small reducedMotion />
        ))}
      </div>
      {player.pendingSkip && (
        <span className="text-rose-300 text-xs">Skip pending</span>
      )}
    </div>
  );
}

function EndOverlay({
  state,
  humanSeat,
  onNext,
}: {
  state: GameState;
  humanSeat: number;
  onNext: () => void;
}) {
  const won =
    state.matchWinner === humanSeat ||
    (state.matchTiedWinners.includes(humanSeat) && state.phase === "matchOver");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-amber-900/80 to-black/80 border border-amber-500/30">
        <h2 className="font-serif text-3xl text-amber-100 mb-2">
          {state.phase === "matchOver" ? "Match Over" : "Round Over"}
        </h2>
        <p className="text-amber-200/80 mb-4">
          {state.roundScores
            ? `Round points: ${state.roundScores.join(", ")}`
            : ""}
        </p>
        {state.phase === "matchOver" && (
          <p className="text-xl text-amber-300 mb-6">
            {won ? "You win!" : "Match complete"}
          </p>
        )}
        <button
          type="button"
          onClick={onNext}
          className="px-8 py-3 rounded-xl bg-amber-500 text-black font-semibold"
        >
          {state.phase === "matchOver" ? "Back to Lobby" : "Next Round"}
        </button>
      </div>
    </motion.div>
  );
}

function findInZones(
  player: GameState["players"][0],
  id: string,
): Card | undefined {
  return (
    player.hand.find((c) => c.id === id) ??
    player.faceUp.find((c) => c.id === id) ??
    player.faceDown.find((c) => c.id === id)
  );
}