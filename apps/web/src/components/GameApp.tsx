"use client";

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
  DEFAULT_RULES,
  type GameState,
  type Move,
  type PlayerSetup,
} from "@underplay/engine";
import {
  loadAudioPrefs,
  playSfx,
  primeAudioFromGesture,
  setMuted,
  setVolume,
} from "@/lib/audio";
import {
  isRoundOrMatchWin,
  resolveHigherConfirmSfx,
  resolveMoveSfx,
} from "@/lib/moveSfx";
import { useTheme } from "@/context/ThemeProvider";
import { UnderPlayLogo } from "./UnderPlayLogo";
import { buildSlotMap, opponentTableWidthRem, type SlotMap } from "@/lib/cardSlots";
import { sortHand } from "@/lib/sortCards";
import {
  cardsForMove,
  isSkipMove,
  recordTurnPlay,
  turnEndedAfterConfirm,
  turnEndedAfterMove,
  turnLogConfirmAction,
  turnLogHigherExtension,
  turnLogHigherExtensionResult,
  turnLogMoveAction,
  pileToHandPhrase,
  type TurnLogTurn,
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
import { GameLobby } from "./GameLobby";
import { nextLastPlayStackCount, type GameSetupConfig } from "@/lib/gameSetup";
import {
  createOvercutHold,

  overcutHeldIncoming,
  overcutHeldOnTarget,
  type OvercutHold,
} from "@/lib/overcutHold";
import {
  buildTargetedMove,
  canPlaySelection,
  selectionRequiresTarget,
} from "@/lib/playMove";
import { OvercutPlaySlot } from "./OvercutPlaySlot";
import { RoundEndOverlay } from "./RoundEndOverlay";

const CPU_TURN_DELAY_MS = 1400;
const CPU_TURN_DELAY_REDUCED_MS = 120;
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
  const { themeId, deck } = useTheme();
  const [screen, setScreen] = useState<"lobby" | "game">("lobby");
  const [state, setState] = useState<GameState | null>(null);
  const gameConfigRef = useRef<GameSetupConfig | null>(null);
  const [stackLastPlayCount, setStackLastPlayCount] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [skipTarget, setSkipTarget] = useState<number | null>(null);
  const skipTargetRef = useRef<number | null>(null);
  skipTargetRef.current = skipTarget;
  const [muted, setMutedState] = useState(() => loadAudioPrefs().muted);
  const [vol, setVol] = useState(() => loadAudioPrefs().volume);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lastEvent, setLastEvent] = useState("");
  const [deckPhase, setDeckPhase] = useState<DeckPhase>(null);
  const [openingDeal, setOpeningDeal] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [turnLog, setTurnLog] = useState<TurnLogTurn[]>([]);
  const [playAnimating, setPlayAnimating] = useState(false);
  const [flyingSpecs, setFlyingSpecs] = useState<FlyingCardSpec[] | null>(null);
  const [flyDeal, setFlyDeal] = useState(false);
  const [stockDealFly, setStockDealFly] = useState(false);
  const [stockDealDurationS, setStockDealDurationS] = useState(0.05);
  const [hiddenFlyIds, setHiddenFlyIds] = useState<Set<string>>(new Set());
  const [overcutHeld, setOvercutHeld] = useState<OvercutHold[]>([]);
  const overcutReleaseScheduled = useRef<Set<string>>(new Set());
  const dealFlyStartedRef = useRef<DeckPhase | null>(null);
  const [landedCardIds, setLandedCardIds] = useState<Set<string>>(new Set());
  const slotMapsRef = useRef<Record<number, SlotMap>>({});
  const flyCommitRef = useRef<(() => void) | null>(null);
  const dealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [dealtDownIds, setDealtDownIds] = useState<Set<string>>(new Set());
  const [dealtUpIds, setDealtUpIds] = useState<Set<string>>(new Set());
  const [stockCounts, setStockCounts] = useState<Record<number, number>>({});
  const [handFaceDown, setHandFaceDown] = useState(false);
  const humanSeat = 0;
  const isHotseat = gameConfigRef.current?.mode === "hotseat";
  const viewSeat =
    state != null && isHotseat && deckPhase === null
      ? state.currentSeat
      : humanSeat;
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

  const quitToMenu = useCallback(() => {
    if (
      state &&
      !window.confirm("Leave this game and return to the menu? Progress will be lost.")
    ) {
      return;
    }
    for (const t of dealTimersRef.current) clearTimeout(t);
    dealTimersRef.current = [];
    setFlyingSpecs(null);
    setFlyDeal(false);
    setStockDealFly(false);
    setOpeningDeal(false);
    setDeckPhase(null);
    setOvercutHeld([]);
    overcutReleaseScheduled.current.clear();
    setState(null);
    setScreen("lobby");
    setSelected([]);
    setTurnLog([]);
    router.push("/");
  }, [state, router]);

  const exitToLobby = useCallback(() => {
    for (const t of dealTimersRef.current) clearTimeout(t);
    dealTimersRef.current = [];
    setFlyingSpecs(null);
    setFlyDeal(false);
    setStockDealFly(false);
    setOpeningDeal(false);
    setDeckPhase(null);
    setOvercutHeld([]);
    overcutReleaseScheduled.current.clear();
    setState(null);
    setScreen("lobby");
    setSelected([]);
    setTurnLog([]);
    setStartError(null);
  }, []);
  useEffect(() => {
    setMuted(muted);
    setVolume(vol);
  }, [muted, vol]);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      setMuted(next);
      if (!next) {
        primeAudioFromGesture();
        playSfx("tap");
      }
      return next;
    });
  }, []);

  const playMoveSounds = useCallback(
    (prev: GameState, next: GameState, move: Move) => {
      primeAudioFromGesture();
      const sfx = resolveMoveSfx(prev, next, move);
      if (sfx) playSfx(sfx);
      if (isRoundOrMatchWin(next)) playSfx("win");
    },
    [],
  );

  const playConfirmSounds = useCallback((prev: GameState, next: GameState) => {
    primeAudioFromGesture();
    playSfx(resolveHigherConfirmSfx(prev, next));
    if (isRoundOrMatchWin(next)) playSfx("win");
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

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

  const onDealCardLand = useCallback((spec: FlyingCardSpec) => {
    if (spec.stockSeat == null) return;
    setStockCounts((prev) => ({
      ...prev,
      [spec.stockSeat!]: (prev[spec.stockSeat!] ?? 0) + 1,
    }));
  }, []);

  const runStockDealFly = useCallback((): Promise<void> => {
    if (!state || reducedMotion) return Promise.resolve();
    const cardDur = stockDealFlyDurationS(state);
    setStockDealDurationS(cardDur);
    setStockCounts({});
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
    setState((prev) => {
      if (prev) {
        setStackLastPlayCount((c) => nextLastPlayStackCount(prev, next, c));
      }
      return normalizeGameState(next);
    });
  }, []);

  const pendingSkipKey =
    state?.players.map((p) => (p.pendingSkip ? "1" : "0")).join("") ?? "";

  useEffect(() => {
    if (!state) return;
    for (const h of overcutHeld) {
      if (state.players[h.targetSeat]?.pendingSkip) continue;
      if (overcutReleaseScheduled.current.has(h.cardId)) continue;
      overcutReleaseScheduled.current.add(h.cardId);
      const ms = reducedMotion ? 0 : 320;
      window.setTimeout(() => {
        setOvercutHeld((prev) => prev.filter((x) => x.cardId !== h.cardId));
        overcutReleaseScheduled.current.delete(h.cardId);
      }, ms);
    }
  }, [state, state?.version, pendingSkipKey, overcutHeld, reducedMotion]);

  const registerOvercutHold = useCallback(
    (prev: GameState, next: GameState, move: Move, cards: Card[]) => {
      const hold = createOvercutHold(prev, next, move, cards);
      if (!hold) return;
      setOvercutHeld((holds) => [
        ...holds.filter((h) => h.cardId !== hold.cardId),
        hold,
      ]);
    },
    [],
  );

  const startGame = (config: GameSetupConfig) => {
    setStartError(null);
    try {
      gameConfigRef.current = config;
      setStackLastPlayCount(0);
      const setups: PlayerSetup[] = [{ name: config.playerName, isCpu: false }];
      for (let i = 0; i < config.opponentCount; i++) {
        const opp = config.opponents[i];
        setups.push({
          name: opp?.name?.trim() || `Player ${i + 2}`,
          isCpu: config.mode === "cpu",
          difficulty: config.mode === "cpu" ? opp?.difficulty ?? "medium" : undefined,
        });
      }
      const rules = { ...DEFAULT_RULES, endingScore: config.playToScore };
      const seed = Date.now();
      const g = normalizeGameState(
        createMatch(setups, rules, seed, config.firstPlayer),
      );
      slotMapsRef.current = initSlotMaps(g);
      for (const t of dealTimersRef.current) clearTimeout(t);
      dealTimersRef.current = [];
      setDeckPhase(null);
      setState(g);
      setSelected([]);
      setScreen("game");
      setLastEvent(`${g.players[g.currentSeat].name} plays first.`);
      setTurnLog([]);
      setDealtDownIds(new Set());
      setDealtUpIds(new Set());
      setStockCounts({});
      setHandFaceDown(false);
      setOvercutHeld([]);
      overcutReleaseScheduled.current.clear();
      runOpeningSequence();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start game";
      setStartError(msg);
      console.error("startGame failed:", err);
    }
  };

  const awaitingConfirm = Boolean(
    state && state.currentSeat === viewSeat && isAwaitingHigherConfirm(state),
  );
  const confirmRank = state?.pendingHigherConfirm?.rank ?? null;
  const myTurn = Boolean(
    state && state.phase === "playing" && state.currentSeat === viewSeat,
  );

  const humanMoves = useMemo(() => {
    if (!state || state.phase !== "playing" || state.currentSeat !== viewSeat) return [];
    if (awaitingConfirm) return [];
    return legalMoves(state, viewSeat);
  }, [state, awaitingConfirm, viewSeat]);

  const canAddToHigher = useMemo(() => {
    if (!state || !awaitingConfirm || !selected.length) return false;
    const key = [...selected].sort().join(",");
    return legalHigherExtensions(state, viewSeat).some(
      (ids) => [...ids].sort().join(",") === key,
    );
  }, [state, awaitingConfirm, selected, viewSeat]);

  const selectedSpecial = useMemo(() => {
    if (!state || selected.length !== 1 || !myTurn) return null;
    return findInZones(state.players[state.currentSeat], selected[0]) ?? null;
  }, [state, selected, myTurn]);

  const needsPlayTarget = useMemo(() => {
    if (!state || !selected.length || !myTurn) return false;
    return selectionRequiresTarget(
      legalMoves(state, state.currentSeat),
      selected,
    );
  }, [state, selected, myTurn]);

  const isSkipTargetPrompt =
    needsPlayTarget && selectedSpecial?.kind === "skip";
  const isStackToTargetPrompt =
    needsPlayTarget && selectedSpecial?.kind === "clear";
  const playTargetSeat = needsPlayTarget ? skipTarget : null;

  const targetPlayOptions = useMemo(
    () => ({
      needsTarget: needsPlayTarget,
      targetSeat: playTargetSeat,
    }),
    [needsPlayTarget, playTargetSeat],
  );

  const canPlay = useMemo(() => {
    if (!selected.length || !state || !myTurn) return false;
    const seat = state.currentSeat;
    return canPlaySelection(legalMoves(state, seat), selected, targetPlayOptions);
  }, [state, selected, myTurn, targetPlayOptions]);

  const resolveHumanMove = useCallback((): Move | undefined => {
    if (!state || !myTurn || !selected.length) return undefined;
    const seat = state.currentSeat;
    const targetSeat = needsPlayTarget ? skipTargetRef.current : null;
    return buildTargetedMove(state, seat, selected, {
      needsTarget: needsPlayTarget,
      targetSeat,
    });
  }, [state, myTurn, selected, needsPlayTarget]);

  const playTargetOptions = useMemo(() => {
    if (!state || !needsPlayTarget || !myTurn) return [];
    const actor = state.currentSeat;
    return state.players.filter((p) => {
      if (p.seat === actor) return false;
      if (isSkipTargetPrompt && p.pendingSkip) return false;
      return true;
    });
  }, [state, myTurn, needsPlayTarget, isSkipTargetPrompt]);

  useEffect(() => {
    if (!needsPlayTarget) {
      setSkipTarget(null);
      return;
    }
    if (playTargetOptions.length === 0) return;
    if (
      skipTarget != null &&
      playTargetOptions.some((p) => p.seat === skipTarget)
    ) {
      return;
    }
    setSkipTarget(playTargetOptions[0].seat);
  }, [needsPlayTarget, playTargetOptions, skipTarget, selected]);

  const heldValue = useMemo(() => {
    if (!state) return 0;
    const p = state.players[viewSeat];
    return [...p.hand, ...p.faceUp].reduce(
      (sum, c) => sum + cardPoints(c, state.rules),
      0,
    );
  }, [state]);

  const pushTurn = useCallback(
    (player: string, seat: number, action: string, endsTurn: boolean) => {
      setTurnLog((log) => recordTurnPlay(log, player, seat, action, endsTurn));
    },
    [],
  );

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
        if (seat === viewSeat) setPlayAnimating(false);
        return;
      }
      if (seat === viewSeat) setPlayAnimating(true);
      // Hide at source immediately so the table slot clears before/during the fly, not after it lands.
      setHiddenFlyIds(new Set(cardIds));

      requestAnimationFrame(() => {
        const revealBeforeFlyIds = new Set(
          cardIds.filter((id) =>
            state.players[seat]?.faceDown.some((c) => c.id === id),
          ),
        );
        const specs = buildFlySpecs(
          cardIds,
          cards,
          seat !== viewSeat ? seat : undefined,
          { revealBeforeFlyIds },
        );
        if (!specs) {
          finishFly(cardIds, done);
          if (seat === viewSeat) setPlayAnimating(false);
          return;
        }
        setFlyDeal(false);
        flyCommitRef.current = () => {
          finishFly(cardIds, done);
          if (seat === viewSeat) setPlayAnimating(false);
        };
        setFlyingSpecs(specs);
      });
    },
    [state, reducedMotion, finishFly, viewSeat],
  );

  const applyHumanMove = useCallback(
    (move: Move) => {
      if (!state || playAnimating || deckPhase !== null) return;
      const prev = state;
      const playerName = prev.players[prev.currentSeat].name;

      const seat = prev.currentSeat;
      const cards = cardsForMove(prev, seat, move);

      if (isSkipMove(prev, seat, move)) {
        const next = applyMove(prev, move);
        playMoveSounds(prev, next, move);
        detectSfx(prev, next, move, false);
        patchState(next);
        registerOvercutHold(prev, next, move, cards);
        pushTurn(
          playerName,
          seat,
          turnLogMoveAction(prev, next, move),
          turnEndedAfterMove(prev, next),
        );
        setSelected([]);
        setSkipTarget(null);
        return;
      }

      playMoveSounds(prev, applyMove(prev, move), move);

      let applied: GameState | null = null;
      const commit = () => {
        applied = applyMove(prev, move);
        detectSfx(prev, applied, move, false);
        patchState(applied);
        setSelected([]);
        setSkipTarget(null);
      };

      runWithFly(seat, move.cardIds, cards, commit, () => {
        if (!applied) return;
        pushTurn(
          playerName,
          seat,
          turnLogMoveAction(prev, applied, move),
          turnEndedAfterMove(prev, applied),
        );
      });
    },
    [
      state,
      deckPhase,
      patchState,
      playAnimating,
      runWithFly,
      pushTurn,
      registerOvercutHold,
      playMoveSounds,
    ],
  );

  const runCpuTurn = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "playing" || deckPhase !== null) return;
    const seat = s.currentSeat;
    const p = s.players[seat];
    if (!p?.isCpu) return;
    const playerName = p.name;

    if (isAwaitingHigherConfirm(s)) {
      const next = resolveHigherConfirm(s, seat, p.difficulty ?? "medium");
      detectHigherConfirmSfx(s, next, true);
      pushTurn(
        playerName,
        seat,
        turnLogConfirmAction(s, next),
        turnEndedAfterConfirm(s, next),
      );
      patchState(next);
      setSelected([]);
      return;
    }

    const moves = legalMoves(s, seat);
    const move = chooseMove(s, seat, p.difficulty ?? "medium") ?? moves[0];
    if (!move) return;

    const cards = cardsForMove(s, seat, move);

    if (isSkipMove(s, seat, move)) {
      const next = applyMove(s, move);
      detectSfx(s, next, move, true);
      patchState(next);
      registerOvercutHold(s, next, move, cards);
      pushTurn(
        playerName,
        seat,
        turnLogMoveAction(s, next, move),
        turnEndedAfterMove(s, next),
      );
      return;
    }

    let applied: GameState | null = null;
    const commit = () => {
      applied = applyMove(s, move);
      detectSfx(s, applied, move, true);
      patchState(applied);
    };

    runWithFly(seat, move.cardIds, cards, commit, () => {
      if (!applied) return;
      pushTurn(
        playerName,
        seat,
        turnLogMoveAction(s, applied, move),
        turnEndedAfterMove(s, applied),
      );
    });
  }, [deckPhase, patchState, runWithFly, pushTurn, registerOvercutHold]);

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

  function detectSfx(prev: GameState, next: GameState, move: Move, playSound: boolean) {
    const seat = prev.currentSeat;
    const played = move.cardIds
      .map((id) => findInZones(prev.players[seat], id))
      .filter(Boolean);
    const stillYourTurn =
      next.currentSeat === seat && seat === viewSeat && next.phase === "playing";

    if (playSound) {
      const sfx = resolveMoveSfx(prev, next, move);
      if (sfx) playSfx(sfx);
      if (isRoundOrMatchWin(next)) playSfx("win");
    }

    if (played.some((c) => c?.kind === "clear") || (next.stack.length === 0 && prev.stack.length > 0 && played[0]?.kind !== "skip")) {
      const flippedUndercut = move.cardIds.some((id) =>
        prev.players[seat].faceDown.some((c) => c.id === id),
      );
      if (flippedUndercut && move.targetSeat != null) {
        const name = next.players[move.targetSeat]?.name ?? "opponent";
        setLastEvent(`Undercut flipped — stack sent to ${name}. Play again.`);
      } else {
        setLastEvent(
          next.stack.length === 0 && prev.stack.length > 0
            ? "Tap-out! Play again."
            : "Stack cleared — play again.",
        );
      }
    } else if (played.some((c) => c?.kind === "skip")) {
      const targetName =
        move.targetSeat != null
          ? (next.players[move.targetSeat]?.name ?? "opponent")
          : "opponent";
      setLastEvent(
        stillYourTurn
          ? `Overcut on ${targetName} — skip pending. Your turn continues.`
          : `Overcut on ${targetName} — skip pending.`,
      );
    } else if (move.cardIds.some((id) => prev.players[seat].faceDown.some((c) => c.id === id))) {
      if (next.pendingHigherConfirm) {
        const rank = next.pendingHigherConfirm.rank;
        const handGrew = next.players[seat].hand.length > prev.players[seat].hand.length;
        setLastEvent(
          handGrew
            ? `Higher flip — ${pileToHandPhrase(prev, move)}. Add ${rank}s from hand, then Confirm.`
            : `Flipped a ${rank} onto the stack. Add other ${rank}s from hand, then Confirm.`,
        );
      } else if (stillYourTurn) {
        setLastEvent("Flipped — your turn continues.");
      } else {
        setLastEvent("Face-down played.");
      }
    } else if (next.pendingHigherConfirm) {
      setLastEvent(
        `Higher play — ${pileToHandPhrase(prev, move)}. Add ${next.pendingHigherConfirm.rank}s, then Confirm.`,
      );
    } else if (stillYourTurn) {
      setLastEvent("Play again (extra turn).");
    } else {
      setLastEvent("Card played.");
    }
  }

  function detectHigherConfirmSfx(prev: GameState, next: GameState, playSound: boolean) {
    if (playSound) {
      playSfx(resolveHigherConfirmSfx(prev, next));
      if (isRoundOrMatchWin(next)) playSfx("win");
    }
    if (
      next.stack.length === 0 &&
      prev.stack.length > 0 &&
      !isAwaitingHigherConfirm(next) &&
      next.currentSeat === prev.currentSeat
    ) {
      setLastEvent("Tap-out! Play again from your hand.");
    } else if (next.stack.length > prev.stack.length) {
      setLastEvent("Cards added — Confirm when ready.");
    } else {
      setLastEvent("Turn complete.");
    }
  }

  if (screen === "lobby") {
    return <GameLobby startError={startError} onStart={startGame} />;
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
  const stackDisplay = gameConfigRef.current?.stackDisplay ?? "full";
  const me = state.players[viewSeat];
  const incomingOvercut = overcutHeldIncoming(overcutHeld, viewSeat);
  const T = topValue(state.stack);
  const activePlayer = state.players[state.currentSeat];
  const sortedHand = sortHand(me.hand);
  const handInDealOrder = handDealOrder(state, viewSeat);
  const displayHand =
    deckPhase === "hand-sort" || deckPhase === "lets-play" || deckPhase === null
      ? sortedHand
      : handInDealOrder;
  const mySlotMap = slotMapsRef.current[viewSeat] ?? buildSlotMap(me.faceDown, me.faceUp);
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
          onCardLand={stockDealFly ? onDealCardLand : undefined}
          onComplete={() => {
            flyCommitRef.current?.();
            flyCommitRef.current = null;
          }}
        />
      )}
      <header className="relative z-40 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 border-b border-theme-border bg-black/30 shrink-0">
        <div className="min-w-0 flex-1 flex items-center gap-2 sm:gap-3">
          <UnderPlayLogo themeId={themeId} size="header" className="shrink-0" />
          <span className="text-theme-muted text-xs sm:text-sm truncate">
            Round {state.roundNumber} · Top {T ?? "—"} · {deck.shortName}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-theme-ink overflow-x-auto max-w-[min(9rem,30vw)] sm:max-w-[14rem] md:max-w-[20rem] lg:max-w-none">
            {state.scores.map((s, i) => (
              <span key={i} className={`whitespace-nowrap shrink-0 ${i === viewSeat ? "text-amber-300 font-medium" : ""}`}>
                {state.players[i].name}: {s}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              aria-pressed={muted}
              aria-label={muted ? "Unmute game sounds" : "Mute game sounds"}
              title={muted ? "Unmute" : "Mute"}
              className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-black/40 text-amber-200/90 hover:bg-amber-950/50 hover:text-amber-100 transition min-w-[2.5rem]"
            >
              {muted ? (
                <span className="inline-block opacity-70" aria-hidden>
                  Muted
                </span>
              ) : (
                <span aria-hidden>Sound</span>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={vol}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVol(v);
                setVolume(v);
                if (v > 0 && !muted) {
                  primeAudioFromGesture();
                  playSfx("tap");
                }
              }}
              className="w-14 sm:w-20 accent-amber-400"
              disabled={muted}
              aria-label="Sound volume"
            />
            <button
              type="button"
              onClick={quitToMenu}
              className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-black/50 text-amber-100 font-semibold hover:bg-amber-950/60 hover:border-amber-400/50 transition shrink-0"
            >
              Quit
            </button>
          </div>
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
          <DeckAnimation
            phase={animPhase}
            reducedMotion={reducedMotion}
            hidden={!!flyingSpecs && flyDeal}
          />

          <div className="flex-1 min-h-0 flex flex-col">
            {showOpponentZone(deckPhase) && (
              <OpponentZone
                players={state.players.filter((p) => p.seat !== viewSeat)}
                currentSeat={state.currentSeat}
                slotMapsRef={slotMapsRef}
                reducedMotion={reducedMotion}
                reveal={reveal}
                hiddenFlyIds={hiddenFlyIds}
                overcutHeld={overcutHeld}
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
                    displayMode={stackDisplay}
                    lastPlayCount={stackLastPlayCount}
                    reducedMotion={reducedMotion}
                    landedCardIds={landedCardIds}
                  />
                  {awaitingConfirm && reveal >= 3 && (
                    <motion.button
                      type="button"
                      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        if (!state || playAnimating) return;
                        const prev = state;
                        const playerName = prev.players[prev.currentSeat].name;
                        const nextPreview = confirmHigherPlay(prev);
                        playConfirmSounds(prev, nextPreview);
                        const commit = () => {
                          const next = confirmHigherPlay(prev);
                          detectHigherConfirmSfx(prev, next, false);
                          pushTurn(
                            playerName,
                            prev.currentSeat,
                            turnLogConfirmAction(prev, next),
                            turnEndedAfterConfirm(prev, next),
                          );
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
          <RoundEndOverlay
            state={state}
            humanSeat={viewSeat}
            onNextRound={() => {
              const n = startNextRound(state);
              slotMapsRef.current = initSlotMaps(n);
              setDeckPhase(null);
              patchState(n);
              setLastEvent("");
              setTurnLog([]);
              setOvercutHeld([]);
              overcutReleaseScheduled.current.clear();
              runDealAnimation();
            }}
            onExitToLobby={exitToLobby}
          />
        )}

          {showPlayerZone(deckPhase, openingDeal) && (
            <section className="shrink-0 z-20 flex flex-col gap-1 pt-2 border-t border-amber-900/20">
              <div className="shrink-0">
                <PlayerTableSlots
                  seat={viewSeat}
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

              <AnimatePresence>
                {incomingOvercut && (
                  <OvercutPlaySlot
                    key={incomingOvercut.cardId}
                    card={incomingOvercut.card}
                    reducedMotion={reducedMotion}
                  />
                )}
              </AnimatePresence>

              <div className="shrink-0">
                {handVisible ? (
                  <HandRow
                    seat={viewSeat}
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
                      seat={viewSeat}
                      count={stockCounts[viewSeat] ?? 0}
                      reducedMotion={reducedMotion}
                    />
                  </div>
                )}
              </div>

            <div className="flex flex-col items-center pt-2 pb-1 shrink-0 border-t border-amber-900/25 w-full">
            {needsPlayTarget && (
              <div className="flex flex-wrap gap-2 items-center justify-center mb-2 w-full px-2">
                <span className="text-amber-200/70 text-sm shrink-0">
                  {isStackToTargetPrompt
                    ? "Send stack to:"
                    : isSkipTargetPrompt
                      ? "Skip target:"
                      : "Target:"}
                </span>
                {playTargetOptions.map((p) => (
                  <button
                    key={p.seat}
                    type="button"
                    onClick={() => setSkipTarget(p.seat)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      skipTarget === p.seat
                        ? isStackToTargetPrompt
                          ? "bg-amber-500 text-black"
                          : "bg-rose-500 text-white"
                        : "bg-black/40 text-amber-100"
                    }`}
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
                        const nextPreview = extendHigherPlay(prev, ids);
                        playConfirmSounds(prev, nextPreview);
                        const commit = () => {
                          const next = extendHigherPlay(prev, ids);
                          detectHigherConfirmSfx(prev, next, false);
                          patchState(next);
                          setSelected([]);
                        };
                        const cards = ids
                          .map((id) => findInPlayerZones(prev.players[viewSeat], id))
                          .filter((c): c is Card => !!c);
                        runWithFly(viewSeat, ids, cards, commit, () => {
                          const next = extendHigherPlay(prev, ids);
                          const suffix = turnLogHigherExtensionResult(prev, next);
                          const action = turnLogHigherExtension(prev, ids) + suffix;
                          pushTurn(playerName, prev.currentSeat, action, false);
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
                        const nextPreview = confirmHigherPlay(prev);
                        playConfirmSounds(prev, nextPreview);
                        const commit = () => {
                          const next = confirmHigherPlay(prev);
                          detectHigherConfirmSfx(prev, next, false);
                          pushTurn(
                            playerName,
                            prev.currentSeat,
                            turnLogConfirmAction(prev, next),
                            turnEndedAfterConfirm(prev, next),
                          );
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
                      const move = resolveHumanMove();
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
      const card = state && findInZones(state.players[viewSeat], id);
      if (awaitingConfirm && confirmRank != null) {
        const fromHandOrUp =
          state &&
          (state.players[viewSeat].hand.some((c) => c.id === id) ||
            state.players[viewSeat].faceUp.some((c) => c.id === id));
        if (!fromHandOrUp || card?.kind !== "play" || card.value !== confirmRank) return prev;
        if (prev.length && state) {
          const first = findInZones(state.players[viewSeat], prev[0]);
          if (first?.value !== confirmRank) return [id];
        }
        return [...prev, id];
      }
      if (card?.kind === "clear" || card?.kind === "skip") return [id];
      if (prev.length && state) {
        const first = findInZones(state.players[viewSeat], prev[0]);
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
  overcutHeld,
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
  overcutHeld: OvercutHold[];
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
        overcutHeld={overcutHeldOnTarget(overcutHeld, p.seat)}
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
  overcutHeld,
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
  overcutHeld?: OvercutHold;
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
      <AnimatePresence>
        {overcutHeld && (
          <OvercutPlaySlot
            key={overcutHeld.cardId}
            card={overcutHeld.card}
            reducedMotion={reducedMotion}
            compact={dense}
          />
        )}
      </AnimatePresence>
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