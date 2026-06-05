"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  applyMove,
  chooseMove,
  confirmHigherPlay,
  cardPoints,
  createMatch,
  normalizeGameState,
  extendHigherPlay,
  isAwaitingHigherConfirm,
  legalHigherExtensions,
  legalMoves,
  resolveHigherConfirm,
  startNextRound,
  topValue,
  type Card,
  type CpuDifficulty,
  type GameState,
  type Move,
  type PlayerSetup,
} from "@underplay/engine";
import { playSfx, setMuted, setVolume } from "@/lib/audio";
import { BRAND_NAME } from "@/lib/brand";
import { buildSlotMap, opponentTableWidthRem, type SlotMap } from "@/lib/cardSlots";
import { sortHand } from "@/lib/sortCards";
import {
  appendTurnLog,
  turnLogConfirmAction,
  turnLogHigherExtension,
  turnLogHigherExtensionResult,
  turnLogMoveAction,
  type TurnLogEntry,
} from "@/lib/turnLog";
import { DeckAnimation } from "./DeckAnimation";
import { WelcomeSplash } from "./WelcomeSplash";
import { LetsPlaySplash } from "./LetsPlaySplash";
import {
  cardRevealLevel,
  deckAnimPhase,
  OPENING_TIMINGS,
  OPENING_TIMINGS_REDUCED,
  openingStatusText,
  showHandRow,
  showOpponentZone,
  showPlayerZone,
  showStackZone,
  type DeckPhase,
} from "@/lib/openingSequence";
import {
  cardsInEngineDealOrder,
  faceDownDealOrder,
  faceUpDealOrder,
  handDealOrder,
} from "@/lib/dealOrder";
import {
  buildOpeningDealFlySpecs,
  buildStockDealFlySpecs,
  buildTableDealFlySpecs,
  stockDealFlyDurationS,
  tableDealFlyDurationS,
  waitForHumanHandTargets,
  waitForStockTargets,
  type DealFlyFilter,
} from "@/lib/dealFly";
import { DealStockPile } from "./DealStockPile";
import { HandRow } from "./HandRow";
import { PlayerTableSlots } from "./PlayerTableSlots";
import { StackPile } from "./StackPile";
import { CardFlyOverlay } from "./CardFlyOverlay";
import { HeldValueTile } from "./HeldValueTile";
import { TurnHistory } from "./TurnHistory";
import { TurnStatusTile } from "./TurnStatusTile";
import { OpponentHandFan } from "./OpponentHandFan";
import { stackZoneHeightRem } from "@/lib/cardDimensions";
import { buildFlySpecs, type FlyingCardSpec } from "@/lib/cardFly";
import {
  PLAY_SUMMARY_HOLD_MS,
  summarizeHigherExtension,
  summarizeStackPlay,
} from "@/lib/playSummary";
import { PlaySummaryFly, type PlaySummaryPayload } from "./PlaySummaryFly";

const CPU_TURN_DELAY_MS = 1400;
const CPU_TURN_DELAY_REDUCED_MS = 120;

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
  const router = useRouter();
  const [screen, setScreen] = useState<"lobby" | "game">("lobby");
  const [playerCount, setPlayerCount] = useState(4);
  const [difficulty, setDifficulty] = useState<CpuDifficulty>("medium");
  const [state, setState] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [skipTarget, setSkipTarget] = useState<number | null>(null);
  const [muted, setMutedState] = useState(false);
  const [vol, setVol] = useState(0.6);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lastEvent, setLastEvent] = useState("");
  const [deckPhase, setDeckPhase] = useState<DeckPhase>(null);
  const [openingDeal, setOpeningDeal] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [turnLog, setTurnLog] = useState<TurnLogEntry[]>([]);
  const [playAnimating, setPlayAnimating] = useState(false);
  const [flyingSpecs, setFlyingSpecs] = useState<FlyingCardSpec[] | null>(null);
  const [flyDeal, setFlyDeal] = useState(false);
  const [stockDealFly, setStockDealFly] = useState(false);
  const [stockDealDurationS, setStockDealDurationS] = useState(0.05);
  const [hiddenFlyIds, setHiddenFlyIds] = useState<Set<string>>(new Set());
  const dealFlyStartedRef = useRef<DeckPhase | null>(null);
  const [landedCardIds, setLandedCardIds] = useState<Set<string>>(new Set());
  const slotMapsRef = useRef<Record<number, SlotMap>>({});
  const flyCommitRef = useRef<(() => void) | null>(null);
  const dealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const summaryTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const summaryQueueRef = useRef<
    { player: string; action: string; line: string }[]
  >([]);
  /** Sync flag — React playSummary state lags behind startPlaySummary by a frame. */
  const summaryBusyRef = useRef(false);
  const [playSummary, setPlaySummary] = useState<PlaySummaryPayload | null>(null);
  const [dealtDownIds, setDealtDownIds] = useState<Set<string>>(new Set());
  const [dealtUpIds, setDealtUpIds] = useState<Set<string>>(new Set());
  const [stockCounts, setStockCounts] = useState<Record<number, number>>({});
  const [handFaceDown, setHandFaceDown] = useState(false);
  const humanSeat = 0;
  const stateRef = useRef(state);
  stateRef.current = state;

  const OPENING_ANIM_PHASES: DeckPhase[] = [
    "shuffle",
    "deal-stock",
    "deal-down",
    "deal-up",
    "hand-reveal",
    "hand-sort",
  ];

  const clearSummaryTimers = useCallback(() => {
    for (const t of summaryTimersRef.current) clearTimeout(t);
    summaryTimersRef.current = [];
  }, []);

  const quitToMenu = useCallback(() => {
    if (
      state &&
      !window.confirm("Leave this game and return to the menu? Progress will be lost.")
    ) {
      return;
    }
    for (const t of dealTimersRef.current) clearTimeout(t);
    dealTimersRef.current = [];
    clearSummaryTimers();
    summaryBusyRef.current = false;
    setPlaySummary(null);
    summaryQueueRef.current = [];
    setFlyingSpecs(null);
    setFlyDeal(false);
    setStockDealFly(false);
    setOpeningDeal(false);
    setDeckPhase(null);
    setState(null);
    setScreen("lobby");
    setSelected([]);
    setTurnLog([]);
    router.push("/");
  }, [state, clearSummaryTimers, router]);

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

  useEffect(() => () => clearSummaryTimers(), [clearSummaryTimers]);

  const runDealAnimation = useCallback(() => {
    for (const t of dealTimersRef.current) clearTimeout(t);
    dealTimersRef.current = [];
    dealFlyStartedRef.current = null;
    setOpeningDeal(false);
    if (reducedMotion) {
      setDeckPhase(null);
      return;
    }
    setDeckPhase("shuffle");
    playSfx("deal");
    dealTimersRef.current.push(setTimeout(() => setDeckPhase("deal-down"), 900));
  }, [reducedMotion]);

  const runOpeningSequence = useCallback(() => {
    for (const t of dealTimersRef.current) clearTimeout(t);
    dealTimersRef.current = [];
    dealFlyStartedRef.current = null;
    setOpeningDeal(true);
    const t = reducedMotion ? OPENING_TIMINGS_REDUCED : OPENING_TIMINGS;
    let at = 0;
    const schedule = (fn: () => void, delay: number) => {
      at += delay;
      dealTimersRef.current.push(setTimeout(fn, at));
    };

    setDeckPhase("welcome");
    schedule(() => {
      setDeckPhase("shuffle");
      if (!reducedMotion) playSfx("deal");
    }, t.welcomeMs);
    if (reducedMotion) {
      schedule(() => {
        setDeckPhase("lets-play");
        setHandFaceDown(false);
      }, t.welcomeMs + t.shuffleMs);
      schedule(() => {
        setDeckPhase(null);
        setOpeningDeal(false);
      }, t.welcomeMs + t.shuffleMs + t.letsPlayMs);
    }
  }, [reducedMotion]);

  const runStockDealFly = useCallback((): Promise<void> => {
    if (!state || reducedMotion) return Promise.resolve();
    const cardDur = stockDealFlyDurationS(state);
    setStockDealDurationS(cardDur);
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const specs = buildStockDealFlySpecs(state, humanSeat);
          if (!specs.length) {
            resolve();
            return;
          }
          setHiddenFlyIds(new Set(specs.map((s) => s.id)));
          setFlyDeal(true);
          setStockDealFly(true);
          flyCommitRef.current = () => {
            setHiddenFlyIds(new Set());
            setFlyingSpecs(null);
            setFlyDeal(false);
            setStockDealFly(false);
            const counts: Record<number, number> = {};
            for (const item of cardsInEngineDealOrder(state)) {
              counts[item.seat] = (counts[item.seat] ?? 0) + 1;
            }
            setStockCounts(counts);
            resolve();
          };
          setFlyingSpecs(specs);
        });
      });
    });
  }, [state, reducedMotion, humanSeat]);

  const commitTableDeal = useCallback(
    (phase: "down" | "up", items: ReturnType<typeof faceDownDealOrder>) => {
      const ids = new Set(items.map((i) => i.card.id));
      if (phase === "down") {
        setDealtDownIds(ids);
      } else {
        setDealtUpIds(ids);
      }
      const dec: Record<number, number> = {};
      for (const item of items) {
        dec[item.seat] = (dec[item.seat] ?? 0) + 1;
      }
      setStockCounts((prev) => {
        const next = { ...prev };
        for (const [seat, n] of Object.entries(dec)) {
          const s = Number(seat);
          next[s] = Math.max(0, (next[s] ?? 1) - n);
        }
        return next;
      });
    },
    [],
  );

  const runTableDealFly = useCallback(
    (phase: "down" | "up"): Promise<void> => {
      if (!state || reducedMotion) return Promise.resolve();
      const items = phase === "down" ? faceDownDealOrder(state) : faceUpDealOrder(state);
      const cardDur = tableDealFlyDurationS(items.length);
      setStockDealDurationS(cardDur);
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const specs = buildTableDealFlySpecs(state, phase, humanSeat);
            if (!specs.length) {
              resolve();
              return;
            }
            setHiddenFlyIds(new Set(specs.map((s) => s.id)));
            setFlyDeal(true);
            setStockDealFly(true);
            flyCommitRef.current = () => {
              setHiddenFlyIds(new Set());
              setFlyingSpecs(null);
              setFlyDeal(false);
              setStockDealFly(false);
              commitTableDeal(phase, items);
              resolve();
            };
            setFlyingSpecs(specs);
          });
        });
      });
    },
    [state, reducedMotion, humanSeat, commitTableDeal],
  );

  const runDealFly = useCallback(
    (phase: "down" | "up" | "hand", filter: DealFlyFilter = "all"): Promise<void> => {
      if (!state || reducedMotion) return Promise.resolve();
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const specs = buildOpeningDealFlySpecs(
              state,
              phase,
              humanSeat,
              filter,
            );
            const batchTable =
              phase === "down" || phase === "up";
            if (batchTable) {
              const items =
                phase === "down"
                  ? faceDownDealOrder(state)
                  : faceUpDealOrder(state);
              setStockDealDurationS(tableDealFlyDurationS(items.length));
            }
            const hidden = new Set(specs.map((s) => s.id));
            if (phase === "hand" && filter === "opponents") {
              for (const c of sortHand(state.players[humanSeat].hand)) {
                hidden.add(c.id);
              }
            }
            if (phase === "hand" && filter === "human") {
              for (const c of sortHand(state.players[humanSeat].hand)) {
                hidden.add(c.id);
              }
            }
            if (!specs.length) {
              if (phase === "hand" && filter === "opponents") {
                setHiddenFlyIds(
                  new Set(sortHand(state.players[humanSeat].hand).map((c) => c.id)),
                );
              } else {
                setHiddenFlyIds(new Set());
              }
              resolve();
              return;
            }
            setHiddenFlyIds(hidden);
            setFlyDeal(true);
            setStockDealFly(batchTable);
            flyCommitRef.current = () => {
              setFlyingSpecs(null);
              setFlyDeal(false);
              setStockDealFly(false);
              if (batchTable) {
                const items =
                  phase === "down"
                    ? faceDownDealOrder(state)
                    : faceUpDealOrder(state);
                commitTableDeal(phase, items);
              }
              if (phase === "hand" && filter === "opponents") {
                setHiddenFlyIds(
                  new Set(sortHand(state.players[humanSeat].hand).map((c) => c.id)),
                );
              } else {
                setHiddenFlyIds(new Set());
              }
              resolve();
            };
            setFlyingSpecs(specs);
          });
        });
      });
    },
    [state, reducedMotion, commitTableDeal],
  );

  useEffect(() => {
    if (!state || reducedMotion) return;

    if (openingDeal && deckPhase && OPENING_ANIM_PHASES.includes(deckPhase)) {
      if (dealFlyStartedRef.current === deckPhase) return;
      dealFlyStartedRef.current = deckPhase;

      const pause = (ms: number) =>
        new Promise<void>((r) => {
          dealTimersRef.current.push(setTimeout(r, ms));
        });

      void (async () => {
        if (deckPhase === "shuffle") {
          await pause(OPENING_TIMINGS.shuffleMs);
          setDeckPhase("deal-stock");
          playSfx("deal");
          return;
        }
        if (deckPhase === "deal-stock") {
          await waitForStockTargets(state);
          await runStockDealFly();
          setDeckPhase("deal-down");
          return;
        }
        if (deckPhase === "deal-down") {
          await runTableDealFly("down");
          setDeckPhase("deal-up");
          return;
        }
        if (deckPhase === "deal-up") {
          await runTableDealFly("up");
          setHandFaceDown(true);
          setDeckPhase("hand-reveal");
          return;
        }
        if (deckPhase === "hand-reveal") {
          await waitForHumanHandTargets(state, humanSeat);
          await pause(OPENING_TIMINGS.handRevealMs);
          setHandFaceDown(false);
          setDeckPhase("hand-sort");
          return;
        }
        if (deckPhase === "hand-sort") {
          await pause(OPENING_TIMINGS.handSortMs);
          setDeckPhase("lets-play");
        }
      })();
      return;
    }

    if (deckPhase === "deal-down" || deckPhase === "deal-up") {
      if (dealFlyStartedRef.current === deckPhase) return;
      dealFlyStartedRef.current = deckPhase;
      const tablePhase = deckPhase === "deal-down" ? "down" : "up";
      void (async () => {
        await runTableDealFly(tablePhase);
        setDeckPhase(tablePhase === "down" ? "deal-up" : null);
      })();
      return;
    }

    dealFlyStartedRef.current = null;
  }, [
    deckPhase,
    state,
    reducedMotion,
    openingDeal,
    runDealFly,
    runTableDealFly,
    runStockDealFly,
    humanSeat,
  ]);

  useEffect(() => {
    if (deckPhase !== "lets-play") return;
    const ms = reducedMotion ? OPENING_TIMINGS_REDUCED.letsPlayMs : OPENING_TIMINGS.letsPlayMs;
    const t = setTimeout(() => {
      setDeckPhase(null);
      setOpeningDeal(false);
      dealFlyStartedRef.current = null;
    }, ms);
    return () => clearTimeout(t);
  }, [deckPhase, reducedMotion]);

  const patchState = useCallback((next: GameState) => {
    setState(normalizeGameState(next));
  }, []);

  const startGame = () => {
    setStartError(null);
    try {
      const setups: PlayerSetup[] = [];
      setups.push({ name: "You", isCpu: false });
      for (let i = 1; i < playerCount; i++) {
        setups.push({
          name: CPU_NAMES[(i - 1) % CPU_NAMES.length],
          isCpu: true,
          difficulty,
        });
      }
      const g = normalizeGameState(createMatch(setups, undefined, Date.now()));
      slotMapsRef.current = initSlotMaps(g);
      for (const t of dealTimersRef.current) clearTimeout(t);
      dealTimersRef.current = [];
      setDeckPhase(null);
      setState(g);
      setSelected([]);
      setScreen("game");
      setLastEvent("");
      setTurnLog([]);
      clearSummaryTimers();
      summaryBusyRef.current = false;
      setPlaySummary(null);
      summaryQueueRef.current = [];
      setDealtDownIds(new Set());
      setDealtUpIds(new Set());
      setStockCounts({});
      setHandFaceDown(false);
      runOpeningSequence();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start game";
      setStartError(msg);
      console.error("startGame failed:", err);
    }
  };

  const awaitingConfirm = Boolean(
    state && state.currentSeat === humanSeat && isAwaitingHigherConfirm(state),
  );
  const confirmRank = state?.pendingHigherConfirm?.rank ?? null;

  const humanMoves = useMemo(() => {
    if (!state || state.phase !== "playing" || state.currentSeat !== humanSeat) return [];
    if (awaitingConfirm) return [];
    return legalMoves(state, humanSeat);
  }, [state, awaitingConfirm]);

  const canPlay = useMemo(() => {
    if (!selected.length || !state) return false;
    return humanMoves.some(
      (m) =>
        m.cardIds.length === selected.length &&
        m.cardIds.every((id) => selected.includes(id)) &&
        (m.targetSeat == null || m.targetSeat === skipTarget),
    );
  }, [humanMoves, selected, skipTarget, state]);

  const canAddToHigher = useMemo(() => {
    if (!state || !awaitingConfirm || !selected.length) return false;
    const key = [...selected].sort().join(",");
    return legalHigherExtensions(state, humanSeat).some(
      (ids) => [...ids].sort().join(",") === key,
    );
  }, [state, awaitingConfirm, selected]);

  const isSkipSelection = useMemo(() => {
    if (!state || selected.length !== 1) return false;
    const c = findInZones(state.players[humanSeat], selected[0]);
    return c?.kind === "skip";
  }, [state, selected]);

  const heldValue = useMemo(() => {
    if (!state) return 0;
    const p = state.players[humanSeat];
    return [...p.hand, ...p.faceUp].reduce(
      (sum, c) => sum + cardPoints(c, state.rules),
      0,
    );
  }, [state]);

  const pushTurn = useCallback((player: string, action: string) => {
    setTurnLog((log) => appendTurnLog(log, player, action));
  }, []);

  const startPlaySummary = useCallback(
    (player: string, historyAction: string, line: string) => {
      clearSummaryTimers();
      summaryBusyRef.current = true;
      const id = `ps-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setPlaySummary({ id, player, action: historyAction, line, phase: "hold" });
      summaryTimersRef.current.push(
        setTimeout(() => {
          setPlaySummary((s) => (s?.id === id ? { ...s, phase: "fly" } : s));
        }, PLAY_SUMMARY_HOLD_MS),
      );
    },
    [clearSummaryTimers],
  );

  const enqueuePlaySummary = useCallback(
    (player: string, historyAction: string, line: string) => {
      if (reducedMotion) return;
      const item = { player, action: historyAction, line };
      if (summaryBusyRef.current) {
        summaryQueueRef.current.push(item);
        return;
      }
      startPlaySummary(player, historyAction, line);
    },
    [reducedMotion, startPlaySummary],
  );

  const completePlaySummary = useCallback(() => {
    if (!playSummary) return;
    clearSummaryTimers();
    setPlaySummary(null);
    const next = summaryQueueRef.current.shift();
    if (next) {
      startPlaySummary(next.player, next.action, next.line);
    } else {
      summaryBusyRef.current = false;
    }
  }, [playSummary, clearSummaryTimers, startPlaySummary]);

  const finishFly = useCallback((cardIds: string[], commit: () => void) => {
    setLandedCardIds(new Set(cardIds));
    commit();
    setHiddenFlyIds(new Set());
    setFlyingSpecs(null);
    window.setTimeout(() => setLandedCardIds(new Set()), 500);
  }, []);

  const runWithFly = useCallback(
    (
      seat: number,
      cardIds: string[],
      cards: Card[],
      commit: () => void,
      afterCommit?: () => void,
    ) => {
      if (!state) return;
      if (flyCommitRef.current) {
        const pending = flyCommitRef.current;
        flyCommitRef.current = null;
        pending();
      }
      const done = () => {
        commit();
        afterCommit?.();
      };
      if (reducedMotion) {
        done();
        if (seat === humanSeat) setPlayAnimating(false);
        return;
      }
      const hideIds = seat === humanSeat ? cardIds : [];
      if (hideIds.length) setHiddenFlyIds(new Set(hideIds));
      if (seat === humanSeat) setPlayAnimating(true);

      requestAnimationFrame(() => {
        const specs = buildFlySpecs(cardIds, cards, seat !== humanSeat ? seat : undefined);
        if (!specs) {
          finishFly(cardIds, done);
          if (seat === humanSeat) setPlayAnimating(false);
          return;
        }
        setFlyDeal(false);
        flyCommitRef.current = () => {
          finishFly(cardIds, done);
          if (seat === humanSeat) setPlayAnimating(false);
        };
        setFlyingSpecs(specs);
      });
    },
    [state, reducedMotion, finishFly],
  );

  const applyHumanMove = useCallback(
    (move: Move) => {
      if (!state || playAnimating || deckPhase !== null) return;
      const prev = state;
      const playerName = prev.players[prev.currentSeat].name;

      const cards = move.cardIds
        .map((id) => findInPlayerZones(prev.players[prev.currentSeat], id))
        .filter((c): c is Card => !!c);

      const commit = () => {
        const next = applyMove(prev, move);
        detectSfx(prev, next, move);
        patchState(next);
        setSelected([]);
        setSkipTarget(null);
      };

      runWithFly(prev.currentSeat, move.cardIds, cards, commit, () => {
        const next = applyMove(prev, move);
        const action = turnLogMoveAction(prev, next, move);
        pushTurn(playerName, action);
        enqueuePlaySummary(
          playerName,
          action,
          summarizeStackPlay(playerName, prev, next, move),
        );
      });
    },
    [state, deckPhase, patchState, enqueuePlaySummary, playAnimating, runWithFly, pushTurn],
  );

  const runCpuTurn = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "playing" || deckPhase !== null) return;
    const seat = s.currentSeat;
    const p = s.players[seat];
    if (!p?.isCpu) return;
    const playerName = p.name;

    if (isAwaitingHigherConfirm(s)) {
      const next = resolveHigherConfirm(s, seat);
      detectHigherConfirmSfx(s, next);
      pushTurn(playerName, turnLogConfirmAction(s, next));
      patchState(next);
      setSelected([]);
      return;
    }

    const moves = legalMoves(s, seat);
    const move = chooseMove(s, seat, p.difficulty ?? "medium") ?? moves[0];
    if (!move) return;

    const cards = move.cardIds
      .map((id) => findInPlayerZones(s.players[seat], id))
      .filter((c): c is Card => !!c);

    const commit = () => {
      const next = applyMove(s, move);
      detectSfx(s, next, move);
      patchState(next);
    };

    runWithFly(seat, move.cardIds, cards, commit, () => {
      const next = applyMove(s, move);
      const action = turnLogMoveAction(s, next, move);
      pushTurn(playerName, action);
      enqueuePlaySummary(
        playerName,
        action,
        summarizeStackPlay(playerName, s, next, move),
      );
    });
  }, [deckPhase, patchState, enqueuePlaySummary, runWithFly, pushTurn]);

  useEffect(() => {
    const s = state;
    if (!s || s.phase !== "playing" || deckPhase !== null) return;
    if (!s.players[s.currentSeat]?.isCpu) return;

    const delay = reducedMotion ? CPU_TURN_DELAY_REDUCED_MS : CPU_TURN_DELAY_MS;
    const t = setTimeout(runCpuTurn, delay);
    return () => clearTimeout(t);
  }, [
    state?.version,
    state?.currentSeat,
    state?.phase,
    state?.pendingHigherConfirm,
    deckPhase,
    reducedMotion,
    runCpuTurn,
  ]);

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
      if (next.pendingHigherConfirm) {
        const rank = next.pendingHigherConfirm.rank;
        const handGrew = next.players[seat].hand.length > prev.players[seat].hand.length;
        setLastEvent(
          handGrew
            ? `Higher flip — pile to your hand. Add ${rank}s from hand, then Confirm.`
            : `Flipped a ${rank} onto the stack. Add other ${rank}s from hand, then Confirm.`,
        );
      } else if (stillYourTurn) {
        setLastEvent("Flipped — your turn continues.");
      } else {
        setLastEvent("Face-down played.");
      }
    } else if (next.pendingHigherConfirm) {
      playSfx("pickup");
      setLastEvent(
        `Higher play — pile to your hand. Add ${next.pendingHigherConfirm.rank}s, then Confirm.`,
      );
    } else if (stillYourTurn) {
      playSfx("play");
      setLastEvent("Play again (extra turn).");
    } else {
      playSfx("play");
      setLastEvent("Card played.");
    }
    if (next.phase === "roundOver" || next.phase === "matchOver") playSfx("win");
  }

  function detectHigherConfirmSfx(prev: GameState, next: GameState) {
    if (
      next.stack.length === 0 &&
      prev.stack.length > 0 &&
      !isAwaitingHigherConfirm(next) &&
      next.currentSeat === prev.currentSeat
    ) {
      playSfx("tap");
      setLastEvent("Tap-out! Play again from your hand.");
    } else if (next.stack.length > prev.stack.length) {
      playSfx("play");
      setLastEvent("Cards added — Confirm when ready.");
    } else {
      playSfx("play");
      setLastEvent("Turn complete.");
    }
  }

  if (screen === "lobby") {
    return (
      <div className="min-h-screen lobby-bg flex items-center justify-center p-6">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full rounded-2xl bg-black/40 backdrop-blur-md border border-amber-500/20 p-8 shadow-2xl"
        >
          <Link
            href="/"
            className="text-amber-200/50 text-sm hover:text-amber-200/80 transition mb-4 inline-block"
          >
            ← Home
          </Link>
          <h1 className="font-serif text-4xl text-amber-100 tracking-tight mb-1">{BRAND_NAME}</h1>
          <p className="text-amber-200/70 text-sm mb-8">Play under the top card — or pick up the pile.</p>
          <label className="block text-amber-100/80 text-sm mb-2">
            Table size ({playerCount} players)
          </label>
          <input
            type="range"
            min={2}
            max={4}
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
            className="w-full mb-2 accent-amber-400"
          />
          <p className="text-amber-200/50 text-xs mb-6">
            You plus {playerCount - 1} CPU opponent{playerCount > 2 ? "s" : ""} — all seats are
            played by the computer in solo mode.
          </p>
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
          {startError && (
            <p className="mb-4 text-rose-300 text-sm rounded-lg bg-rose-950/50 border border-rose-500/30 px-3 py-2">
              {startError}
            </p>
          )}
          <button
            type="button"
            onClick={startGame}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-amber-400 transition"
          >
            Deal & Play
          </button>
          <p className="mt-4 text-amber-200/40 text-xs text-center">
            <Link href="/online" className="text-amber-300/80 hover:text-amber-200">
              Play online with friends
            </Link>
          </p>
        </motion.div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen table-bg flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-amber-100 mb-4">Game session was lost.</p>
          <button
            type="button"
            onClick={() => {
              for (const t of dealTimersRef.current) clearTimeout(t);
              dealTimersRef.current = [];
              setDeckPhase(null);
              setScreen("lobby");
              setState(null);
            }}
            className="px-6 py-2 rounded-xl bg-amber-500 text-black font-semibold"
          >
            Back to lobby
          </button>
        </div>
      </div>
    );
  }
  const me = state.players[humanSeat];
  const T = topValue(state.stack);
  const myTurn = state.currentSeat === humanSeat && state.phase === "playing";
  const activePlayer = state.players[state.currentSeat];
  const sortedHand = sortHand(me.hand);
  const handInDealOrder = handDealOrder(state, humanSeat);
  const displayHand =
    deckPhase === "hand-sort" || deckPhase === "lets-play" || deckPhase === null
      ? sortedHand
      : handInDealOrder;
  const mySlotMap = slotMapsRef.current[humanSeat] ?? buildSlotMap(me.faceDown, me.faceUp);
  const introActive = deckPhase !== null;
  const reveal = cardRevealLevel(deckPhase);
  const animPhase = deckAnimPhase(deckPhase);
  const showFloaters = deckPhase === null;
  const handVisible = !openingDeal || showHandRow(deckPhase, openingDeal);
  const waitingOnHumanOpponent =
    state.phase === "playing" &&
    !myTurn &&
    !activePlayer.isCpu;

  return (
    <div className="h-[100dvh] table-bg flex flex-col overflow-hidden">
      {flyingSpecs && (
        <CardFlyOverlay
          specs={flyingSpecs}
          reducedMotion={reducedMotion}
          dealFlight={flyDeal}
          stockDealFlight={stockDealFly}
          stockDealDurationS={stockDealDurationS}
          onComplete={() => {
            flyCommitRef.current?.();
            flyCommitRef.current = null;
          }}
        />
      )}
      <header className="flex items-center justify-between gap-3 px-4 py-2 border-b border-amber-900/30 bg-black/30 shrink-0">
        <div className="min-w-0">
          <span className="font-serif text-amber-100 text-2xl tracking-tight">{BRAND_NAME}</span>
          <span className="ml-3 text-amber-200/60 text-sm">
            Round {state.roundNumber} · Top {T ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-amber-100/80 shrink-0 flex-wrap justify-end">
          <button
            type="button"
            onClick={quitToMenu}
            className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-black/40 text-amber-200/90 hover:bg-amber-950/50 hover:text-amber-100 transition"
          >
            Quit
          </button>
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

      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col py-2 px-3 overflow-hidden relative">
          <div
            className="absolute top-4 left-4 z-30 pointer-events-none w-fit h-fit"
            aria-label="Turn status"
          >
            <TurnStatusTile
              floating
              visible={state.phase === "playing" && showFloaters}
              myTurn={myTurn}
              activeName={activePlayer.name}
              activeIsCpu={activePlayer.isCpu}
              waitingOnHumanOpponent={waitingOnHumanOpponent}
            />
          </div>
          <div
            className="absolute top-4 right-4 z-30 pointer-events-none w-fit h-fit"
            aria-label="Recent plays"
          >
            {showFloaters && (
              <TurnHistory entries={turnLog} reducedMotion={reducedMotion} floating />
            )}
          </div>

          <AnimatePresence>
            {deckPhase === "welcome" && (
              <WelcomeSplash key="welcome" reducedMotion={reducedMotion} />
            )}
            {deckPhase === "lets-play" && (
              <LetsPlaySplash key="lets-play" reducedMotion={reducedMotion} />
            )}
          </AnimatePresence>
          <DeckAnimation phase={animPhase} reducedMotion={reducedMotion} />

          <div className="flex-1 min-h-0 flex flex-col">
            {showOpponentZone(deckPhase) && (
              <OpponentZone
                players={state.players.filter((p) => p.seat !== humanSeat)}
                currentSeat={state.currentSeat}
                slotMapsRef={slotMapsRef}
                reducedMotion={reducedMotion}
                reveal={reveal}
                hiddenFlyIds={hiddenFlyIds}
                openingDeal={openingDeal}
                deckPhase={deckPhase}
                stockCounts={stockCounts}
                dealtDownIds={dealtDownIds}
                dealtUpIds={dealtUpIds}
              />
            )}

            {showStackZone(deckPhase, openingDeal) && (
              <section
                className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 z-10 isolate py-2"
                style={{ minHeight: `${stackZoneHeightRem + 2}rem` }}
              >
                <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto relative z-20">
                  <StackPile
                    stack={reveal >= 3 ? state.stack : []}
                    reducedMotion={reducedMotion}
                    landedCardIds={landedCardIds}
                  />
                  {playSummary && showFloaters && (
                    <PlaySummaryFly
                      summary={playSummary}
                      reducedMotion={reducedMotion}
                      onFlyComplete={completePlaySummary}
                    />
                  )}
                  {awaitingConfirm && reveal >= 3 && (
                    <motion.button
                      type="button"
                      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        if (!state || playAnimating) return;
                        const prev = state;
                        const playerName = prev.players[prev.currentSeat].name;
                        const commit = () => {
                          const next = confirmHigherPlay(prev);
                          detectHigherConfirmSfx(prev, next);
                          pushTurn(playerName, turnLogConfirmAction(prev, next));
                          patchState(next);
                          setSelected([]);
                        };
                        if (reducedMotion) commit();
                        else {
                          setPlayAnimating(true);
                          commit();
                          setPlayAnimating(false);
                        }
                      }}
                      className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-900/40 border border-emerald-400/50"
                    >
                      Confirm
                    </motion.button>
                  )}
                </div>
                <p className="text-amber-100/60 text-sm min-h-[1.25rem] max-w-lg text-center px-2">
                  {introActive && deckPhase !== "lets-play"
                    ? openingStatusText(deckPhase, state)
                    : lastEvent || "\u00a0"}
                </p>
              </section>
            )}
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
                setDeckPhase(null);
                patchState(n);
                setLastEvent("");
                setTurnLog([]);
                clearSummaryTimers();
                summaryBusyRef.current = false;
                setPlaySummary(null);
                summaryQueueRef.current = [];
                runDealAnimation();
              }
            }}
          />
        )}

          {showPlayerZone(deckPhase, openingDeal) && (
            <section className="shrink-0 z-20 flex flex-col gap-1 pt-2 border-t border-amber-900/20">
              <div className="shrink-0">
                <PlayerTableSlots
                  seat={humanSeat}
                  faceDown={
                    introActive
                      ? me.faceDown.filter((c) => dealtDownIds.has(c.id))
                      : reveal >= 1
                        ? me.faceDown
                        : []
                  }
                  faceUp={
                    introActive
                      ? me.faceUp.filter((c) => dealtUpIds.has(c.id))
                      : reveal >= 2
                        ? me.faceUp
                        : []
                  }
                  slotMap={mySlotMap}
                  selected={selected}
                  interactive={myTurn && !playAnimating && !introActive}
                  reducedMotion={reducedMotion}
                  hiddenCardIds={hiddenFlyIds}
                  onSelect={(id) => toggleSelect(id)}
                />
              </div>

              <div className="shrink-0">
                {handVisible ? (
                  <HandRow
                    seat={humanSeat}
                    cards={displayHand}
                    selected={selected}
                    interactive={myTurn && !playAnimating && !introActive}
                    reducedMotion={reducedMotion}
                    hiddenCardIds={hiddenFlyIds}
                    faceDown={handFaceDown}
                    layoutSort={deckPhase === "hand-sort"}
                    onSelect={(id) => toggleSelect(id)}
                  />
                ) : (
                  <div className="flex justify-center py-2 min-h-[7rem]">
                    <DealStockPile
                      seat={humanSeat}
                      count={stockCounts[humanSeat] ?? 0}
                      reducedMotion={reducedMotion}
                    />
                  </div>
                )}
              </div>

            <div className="flex flex-col items-center pt-2 pb-1 shrink-0 border-t border-amber-900/25 w-full">
            {isSkipSelection && (
              <div className="flex gap-2 items-center justify-center mb-2 w-full">
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
            <div className="flex items-center justify-center w-full max-w-lg px-2">
              <div className="flex items-center gap-3 flex-1 justify-center min-h-[2.5rem]">
            {myTurn && (
              <>
                {awaitingConfirm ? (
                  <>
                    <button
                      type="button"
                      disabled={!canAddToHigher || playAnimating || introActive}
                      onClick={() => {
                        if (!state || !canAddToHigher || playAnimating) return;
                        const prev = state;
                        const playerName = prev.players[prev.currentSeat].name;
                        const ids = [...selected];
                        const commit = () => {
                          const next = extendHigherPlay(prev, ids);
                          detectHigherConfirmSfx(prev, next);
                          patchState(next);
                          setSelected([]);
                        };
                        const cards = ids
                          .map((id) => findInPlayerZones(prev.players[humanSeat], id))
                          .filter((c): c is Card => !!c);
                        runWithFly(humanSeat, ids, cards, commit, () => {
                          const next = extendHigherPlay(prev, ids);
                          const suffix = turnLogHigherExtensionResult(prev, next);
                          const action = turnLogHigherExtension(prev, ids) + suffix;
                          pushTurn(playerName, action);
                          enqueuePlaySummary(
                            playerName,
                            action,
                            summarizeHigherExtension(playerName, prev, ids, suffix),
                          );
                        });
                      }}
                      className="px-6 py-2 rounded-xl bg-amber-500 text-black font-semibold disabled:opacity-40"
                    >
                      Add to stack
                    </button>
                    <button
                      type="button"
                      disabled={playAnimating || introActive}
                      onClick={() => {
                        if (!state || playAnimating) return;
                        const prev = state;
                        const playerName = prev.players[prev.currentSeat].name;
                        const commit = () => {
                          const next = confirmHigherPlay(prev);
                          detectHigherConfirmSfx(prev, next);
                          pushTurn(playerName, turnLogConfirmAction(prev, next));
                          patchState(next);
                          setSelected([]);
                        };
                        if (reducedMotion) commit();
                        else {
                          setPlayAnimating(true);
                          commit();
                          setPlayAnimating(false);
                        }
                      }}
                      className="px-8 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-40 border border-emerald-400/50"
                    >
                      Confirm
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={!canPlay || playAnimating || introActive}
                    title={
                      !selected.length
                        ? "Select card(s) from your hand or face-up row"
                        : !canPlay
                          ? "That selection is not a legal play"
                          : undefined
                    }
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
                )}
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
              <HeldValueTile value={heldValue} />
            </div>
            </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const card = state && findInZones(state.players[humanSeat], id);
      if (awaitingConfirm && confirmRank != null) {
        const fromHandOrUp =
          state &&
          (state.players[humanSeat].hand.some((c) => c.id === id) ||
            state.players[humanSeat].faceUp.some((c) => c.id === id));
        if (!fromHandOrUp || card?.kind !== "play" || card.value !== confirmRank) return prev;
        if (prev.length && state) {
          const first = findInZones(state.players[humanSeat], prev[0]);
          if (first?.value !== confirmRank) return [id];
        }
        return [...prev, id];
      }
      if (card?.kind === "clear" || card?.kind === "skip") return [id];
      if (prev.length && state) {
        const first = findInZones(state.players[humanSeat], prev[0]);
        if (first?.kind !== "play" || card?.kind !== "play" || first.value !== card.value) return [id];
      }
      return [...prev, id];
    });
  }
}

function OpponentZone({
  players,
  currentSeat,
  slotMapsRef,
  reducedMotion,
  reveal,
  hiddenFlyIds,
  openingDeal,
  deckPhase,
  stockCounts,
  dealtDownIds,
  dealtUpIds,
}: {
  players: GameState["players"];
  currentSeat: number;
  slotMapsRef: { current: Record<number, SlotMap> };
  reducedMotion?: boolean;
  reveal: 0 | 1 | 2 | 3;
  hiddenFlyIds: Set<string>;
  openingDeal: boolean;
  deckPhase: DeckPhase;
  stockCounts: Record<number, number>;
  dealtDownIds: Set<string>;
  dealtUpIds: Set<string>;
}) {
  const count = players.length;
  const dense = count >= 3;

  const panel = (p: GameState["players"][0], align?: "start" | "center" | "end") => (
    <div
      key={p.seat}
      className={
        align === "start"
          ? "flex justify-end"
          : align === "end"
            ? "flex justify-start"
            : "flex justify-center"
      }
    >
      <OpponentPanel
        player={p}
        dense={dense}
        slotMap={slotMapsRef.current[p.seat] ?? buildSlotMap(p.faceDown, p.faceUp)}
        active={currentSeat === p.seat}
        portrait={CPU_PORTRAITS[p.seat % 4]}
        reducedMotion={reducedMotion}
        reveal={reveal}
        hiddenCardIds={hiddenFlyIds}
        openingDeal={openingDeal}
        deckPhase={deckPhase}
        stockCount={stockCounts[p.seat] ?? 0}
        dealtDownIds={dealtDownIds}
        dealtUpIds={dealtUpIds}
      />
    </div>
  );

  if (count >= 3) {
    return (
      <section className="shrink-0 w-full px-2 sm:px-4 overflow-visible">
        <div
          className="w-full max-w-5xl mx-auto grid grid-cols-3 items-end gap-x-4 sm:gap-x-8 md:gap-x-12"
          role="group"
          aria-label="Opponents"
        >
          {panel(players[0], "start")}
          {panel(players[1], "center")}
          {panel(players[2], "end")}
        </div>
      </section>
    );
  }

  return (
    <section className="shrink-0 flex justify-center px-2 overflow-visible">
      <div
        className={`flex justify-center items-end ${count === 2 ? "gap-10 sm:gap-16 md:gap-20" : ""}`}
        role="group"
        aria-label="Opponents"
      >
        {players.map((p) => panel(p))}
      </div>
    </section>
  );
}

function OpponentPanel({
  player,
  slotMap,
  active,
  portrait,
  dense,
  reducedMotion,
  reveal,
  hiddenCardIds,
  openingDeal,
  deckPhase,
  stockCount,
  dealtDownIds,
  dealtUpIds,
}: {
  player: GameState["players"][0];
  slotMap: SlotMap;
  active: boolean;
  portrait: string;
  dense?: boolean;
  reducedMotion?: boolean;
  reveal: 0 | 1 | 2 | 3;
  hiddenCardIds?: ReadonlySet<string>;
  openingDeal?: boolean;
  deckPhase: DeckPhase;
  stockCount: number;
  dealtDownIds: Set<string>;
  dealtUpIds: Set<string>;
}) {
  const handVisible = !openingDeal || showHandRow(deckPhase, openingDeal);
  const tableWidthRem = opponentTableWidthRem(dense);
  return (
    <div
      data-fly-source={`opponent-${player.seat}`}
      className={`inline-flex flex-col items-center gap-1 py-2 px-2 transition-shadow rounded-xl border ${
        active
          ? "ring-2 ring-amber-400/80 border-amber-400/50 bg-amber-500/15 shadow-[0_0_14px_rgba(251,191,36,0.15)]"
          : "border-amber-500/20 bg-black/30"
      }`}
      style={{ width: `${tableWidthRem}rem` }}
    >
      <div className="flex flex-col items-center gap-0.5 w-full">
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${portrait} shadow border-2 shrink-0 ${
            active ? "border-amber-400" : "border-amber-600/30"
          }`}
        />
        <span
          className={`text-sm font-medium text-center leading-tight ${
            active ? "text-amber-100" : "text-amber-200/80"
          }`}
        >
          {player.name}
          {active ? " ●" : ""}
        </span>
      </div>
      <div className="w-full shrink-0">
        {handVisible ? (
          <OpponentHandFan
            count={reveal >= 3 ? player.hand.length : 0}
            reducedMotion={reducedMotion}
            dense={dense}
          />
        ) : (
          <DealStockPile
            seat={player.seat}
            count={stockCount}
            reducedMotion={reducedMotion}
          />
        )}
      </div>
      <div className="w-full shrink-0 pt-2">
        <PlayerTableSlots
          seat={player.seat}
          faceDown={
            openingDeal
              ? player.faceDown.filter((c) => dealtDownIds.has(c.id))
              : reveal >= 1
                ? player.faceDown
                : []
          }
          faceUp={
            openingDeal
              ? player.faceUp.filter((c) => dealtUpIds.has(c.id))
              : reveal >= 2
                ? player.faceUp
                : []
          }
          slotMap={slotMap}
          selected={[]}
          interactive={false}
          reducedMotion={reducedMotion}
          hiddenCardIds={hiddenCardIds}
          onSelect={() => {}}
          compact={!dense}
          dense={dense}
        />
      </div>
      {player.pendingSkip && (
        <span className="text-rose-300 text-[10px] text-center">Skip pending</span>
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

function findInPlayerZones(player: GameState["players"][0], id: string): Card | undefined {
  return (
    player.hand.find((c) => c.id === id) ??
    player.faceUp.find((c) => c.id === id) ??
    player.faceDown.find((c) => c.id === id)
  );
}

/** @deprecated use findInPlayerZones */
function findInZones(player: GameState["players"][0], id: string): Card | undefined {
  return findInPlayerZones(player, id);
}