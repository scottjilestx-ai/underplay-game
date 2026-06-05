"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
import { buildSlotMap, type SlotMap } from "@/lib/cardSlots";
import { sortHand } from "@/lib/sortCards";
import { DeckAnimation } from "./DeckAnimation";
import { PlayerTableSlots } from "./PlayerTableSlots";
import { PlayingCard } from "./PlayingCard";
import { StackPile } from "./StackPile";

const CPU_NAMES = ["Alex", "Jordan", "Riley", "Casey"];
const CPU_PORTRAITS = [
  "from-amber-700 to-amber-900",
  "from-slate-600 to-slate-800",
  "from-emerald-700 to-emerald-900",
  "from-violet-700 to-violet-900",
];

function initSlotMaps(state: GameState): Record<number, SlotMap> {
  const maps: Record<number, SlotMap> = {};
  for (const p of state.players) {
    maps[p.seat] = buildSlotMap(p.faceDown, p.faceUp);
  }
  return maps;
}

export function GameApp() {
  const [screen, setScreen] = useState<"lobby" | "game">("lobby");
  const [playerCount, setPlayerCount] = useState(2);
  const [cpuCount, setCpuCount] = useState(1);
  const [difficulty, setDifficulty] = useState<CpuDifficulty>("medium");
  const [state, setState] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [skipTarget, setSkipTarget] = useState<number | null>(null);
  const [muted, setMutedState] = useState(false);
  const [vol, setVol] = useState(0.6);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lastEvent, setLastEvent] = useState("");
  const [deckPhase, setDeckPhase] = useState<"shuffle" | "deal" | null>(null);
  const slotMapsRef = useRef<Record<number, SlotMap>>({});
  const humanSeat = 0;

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

  const runDealAnimation = useCallback(() => {
    if (reducedMotion) return;
    setDeckPhase("shuffle");
    playSfx("deal");
    const t1 = setTimeout(() => setDeckPhase("deal"), 900);
    const t2 = setTimeout(() => setDeckPhase(null), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reducedMotion]);

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
    slotMapsRef.current = initSlotMaps(g);
    setState(g);
    setSelected([]);
    setScreen("game");
    setLastEvent("");
    runDealAnimation();
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
      setState(next);
      setSelected([]);
      setSkipTarget(null);
    },
    [state],
  );

  useEffect(() => {
    if (!state || state.phase !== "playing") return;
    const p = state.players[state.currentSeat];
    if (!p.isCpu) return;

    const delay = reducedMotion ? 80 : 750;
    const t = setTimeout(() => {
      const moves = legalMoves(state, state.currentSeat);
      const move = chooseMove(state, state.currentSeat, p.difficulty ?? "medium") ?? moves[0];
      if (!move) return;
      const next = applyMove(state, move);
      detectSfx(state, next, move);
      setState(next);
    }, delay);
    return () => clearTimeout(t);
  }, [state, reducedMotion]);

  function detectSfx(prev: GameState, next: GameState, move: Move) {
    const seat = prev.currentSeat;
    const played = move.cardIds
      .map((id) => findInZones(prev.players[seat], id))
      .filter(Boolean);
    const stillYourTurn = next.currentSeat === seat && seat === humanSeat && next.phase === "playing";

    if (played.some((c) => c?.kind === "clear") || (next.stack.length === 0 && prev.stack.length > 0 && played[0]?.kind !== "skip")) {
      playSfx(next.deadPile.length > prev.deadPile.length ? "tap" : "clear");
      setLastEvent(next.stack.length === 0 && prev.stack.length > 0 ? "Tap-out! Play again." : "Stack cleared — play again.");
    } else if (played.some((c) => c?.kind === "skip")) {
      playSfx("skip");
      setLastEvent(stillYourTurn ? "Skip played — your turn continues." : "Skip played.");
    } else if (move.cardIds.some((id) => prev.players[seat].faceDown.some((c) => c.id === id))) {
      playSfx("flip");
      setLastEvent(stillYourTurn ? "Flipped — your turn continues." : "Face-down played.");
    } else if (next.players[seat].hand.length > prev.players[seat].hand.length) {
      playSfx("pickup");
      setLastEvent("Higher play — pile to your hand. Play again.");
    } else if (stillYourTurn) {
      playSfx("play");
      setLastEvent("Play again (extra turn).");
    } else {
      playSfx("play");
      setLastEvent("Card played.");
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
  const activePlayer = state.players[state.currentSeat];
  const sortedHand = sortHand(me.hand);
  const mySlotMap = slotMapsRef.current[humanSeat] ?? buildSlotMap(me.faceDown, me.faceUp);
  const dealing = deckPhase !== null;

  return (
    <div className="min-h-screen table-bg flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2 border-b border-amber-900/30 bg-black/30">
        <div>
          <span className="font-serif text-amber-100 text-lg">Underplay</span>
          <span className="ml-3 text-amber-200/60 text-sm">
            Round {state.roundNumber} · Top {T ?? "—"}
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
            <span key={i} className={i === humanSeat ? "text-amber-300 font-medium" : ""}>
              {state.players[i].name}: {s}
            </span>
          ))}
        </div>
      </header>

      <AnimatePresence>
        {state.phase === "playing" && (
          <motion.div
            key={myTurn ? "you" : activePlayer.seat}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mx-4 mt-3 rounded-xl px-4 py-2 text-center text-sm font-semibold tracking-wide ${
              myTurn
                ? "bg-amber-400/25 text-amber-100 border border-amber-400/50 shadow-[0_0_24px_rgba(251,191,36,0.25)]"
                : "bg-black/35 text-amber-200/90 border border-white/10"
            }`}
          >
            {myTurn ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Your turn
                {lastEvent.includes("Play again") || lastEvent.includes("continues") ? (
                  <span className="font-normal text-amber-200/80">— {lastEvent}</span>
                ) : null}
              </span>
            ) : (
              <span>
                {activePlayer.name}
                {activePlayer.isCpu ? " is playing" : "'s turn"}
                …
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 relative p-4 flex flex-col min-h-0">
        <DeckAnimation phase={deckPhase} reducedMotion={reducedMotion} />

        <div className="flex justify-center gap-6 mb-2 flex-wrap">
          {state.players
            .filter((p) => p.seat !== humanSeat)
            .map((p) => (
              <OpponentPanel
                key={p.seat}
                player={p}
                slotMap={slotMapsRef.current[p.seat] ?? buildSlotMap(p.faceDown, p.faceUp)}
                active={state.currentSeat === p.seat}
                portrait={CPU_PORTRAITS[p.seat % 4]}
                reducedMotion={reducedMotion}
                dealing={dealing}
              />
            ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative">
          <p className="text-amber-200/50 text-xs mb-2 uppercase tracking-widest">Stack</p>
          <StackPile stack={state.stack} reducedMotion={reducedMotion} />
          <p className="mt-4 text-amber-100/60 text-sm min-h-[1.25rem] max-w-md text-center">{lastEvent}</p>
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
                slotMapsRef.current = initSlotMaps(n);
                setState(n);
                setLastEvent("");
                runDealAnimation();
              }
            }}
          />
        )}

        <div className="mt-auto pt-2 border-t border-amber-900/20">
          <p className="text-center text-amber-200/40 text-[10px] uppercase tracking-widest mb-2">
            Your table
          </p>
          <PlayerTableSlots
            faceDown={me.faceDown}
            faceUp={me.faceUp}
            slotMap={mySlotMap}
            selected={selected}
            interactive={myTurn && !dealing}
            reducedMotion={reducedMotion}
            dealing={dealing}
            onSelect={(id) => toggleSelect(id)}
          />

          <div className="flex justify-center gap-1 flex-wrap pb-3 pt-4 px-2 min-h-[5.5rem]">
            {sortedHand.map((c, i) => (
              <motion.div
                key={c.id}
                layout
                layoutId={`card-${c.id}`}
                initial={dealing && !reducedMotion ? { opacity: 0, y: 40 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dealing ? 0.5 + i * 0.04 : 0 }}
              >
                <PlayingCard
                  card={c}
                  selected={selected.includes(c.id)}
                  onClick={myTurn && !dealing ? () => toggleSelect(c.id) : undefined}
                  reducedMotion={reducedMotion}
                  layoutId={`card-${c.id}`}
                />
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center gap-3 pb-6 flex-wrap items-center">
            {isSkipSelection && (
              <div className="flex gap-2 items-center w-full justify-center mb-1">
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
            {myTurn && !dealing && (
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
  slotMap,
  active,
  portrait,
  reducedMotion,
  dealing,
}: {
  player: GameState["players"][0];
  slotMap: SlotMap;
  active: boolean;
  portrait: string;
  reducedMotion?: boolean;
  dealing?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-shadow ${
        active
          ? "ring-2 ring-amber-400 bg-amber-500/15 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
          : "bg-black/25 opacity-90"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-full bg-gradient-to-br ${portrait} shadow-lg border-2 ${
          active ? "border-amber-400" : "border-amber-600/30"
        }`}
      />
      <span className={`text-sm font-medium ${active ? "text-amber-100" : "text-amber-200/80"}`}>
        {player.name}
        {active ? " ●" : ""}
      </span>
      <span className="text-amber-200/50 text-xs">
        Hand {player.hand.length}
      </span>
      <PlayerTableSlots
        faceDown={player.faceDown}
        faceUp={player.faceUp}
        slotMap={slotMap}
        selected={[]}
        interactive={false}
        reducedMotion={reducedMotion}
        dealing={dealing}
        onSelect={() => {}}
        compact
      />
      {player.pendingSkip && <span className="text-rose-300 text-xs">Skip pending</span>}
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
          {state.roundScores ? `Round points: ${state.roundScores.join(", ")}` : ""}
        </p>
        {state.phase === "matchOver" && (
          <p className="text-xl text-amber-300 mb-6">{won ? "You win!" : "Match complete"}</p>
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

function findInZones(player: GameState["players"][0], id: string): Card | undefined {
  return (
    player.hand.find((c) => c.id === id) ??
    player.faceUp.find((c) => c.id === id) ??
    player.faceDown.find((c) => c.id === id)
  );
}