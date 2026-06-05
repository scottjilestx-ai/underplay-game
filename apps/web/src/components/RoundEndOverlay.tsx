"use client";

import { motion } from "framer-motion";
import type { GameState } from "@underplay/engine";

interface Props {
  state: GameState;
  humanSeat: number;
  onNextRound: () => void;
  onExitToLobby: () => void;
}

function playerLabel(name: string, seat: number, humanSeat: number): string {
  return seat === humanSeat ? "You" : name;
}

export function RoundEndOverlay({
  state,
  humanSeat,
  onNextRound,
  onExitToLobby,
}: Props) {
  const isMatchEnd = state.phase === "matchOver";
  const roundWon = state.roundWinner === humanSeat;
  const matchWon = state.matchWinner === humanSeat;
  const matchTie =
    isMatchEnd && state.matchWinner === null && state.matchTiedWinners.length > 1;

  const headline = isMatchEnd
    ? matchTie
      ? "It's a tie!"
      : matchWon
        ? "You Win!"
        : "You Lose!"
    : roundWon
      ? "You Win!"
      : "You Lose!";

  const phaseLabel = isMatchEnd ? "Match over" : "Round over";

  const roundRows = state.players.map((p, i) => ({
    seat: i,
    label: playerLabel(p.name, i, humanSeat),
    roundPoints: state.roundScores?.[i] ?? 0,
    totalPoints: state.scores[i] ?? 0,
    isRoundWinner: state.roundWinner === i,
    isHuman: i === humanSeat,
  }));

  roundRows.sort((a, b) => a.roundPoints - b.roundPoints || a.seat - b.seat);

  const won = isMatchEnd ? matchWon || (matchTie && state.matchTiedWinners.includes(humanSeat)) : roundWon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-labelledby="round-end-title"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-amber-500/35 bg-gradient-to-b from-amber-950/95 via-zinc-950/98 to-black shadow-2xl shadow-amber-950/50 overflow-hidden"
      >
        <div
          className={`px-6 py-5 text-center border-b ${
            won
              ? "border-emerald-500/30 bg-emerald-950/40"
              : "border-rose-500/20 bg-rose-950/25"
          }`}
        >
          <p className="text-[10px] uppercase tracking-[0.35em] text-amber-400/70 mb-2">
            {phaseLabel}
          </p>
          <h2
            id="round-end-title"
            className={`font-serif text-4xl sm:text-5xl font-bold tracking-tight ${
              won ? "text-emerald-300" : "text-amber-100/90"
            }`}
          >
            {headline}
          </h2>
          {!isMatchEnd && roundWon && (
            <p className="text-emerald-200/70 text-sm mt-2">You went out first this round.</p>
          )}
          {!isMatchEnd && !roundWon && state.roundWinner != null && (
            <p className="text-amber-200/60 text-sm mt-2">
              {playerLabel(
                state.players[state.roundWinner].name,
                state.roundWinner,
                humanSeat,
              )}{" "}
              went out first.
            </p>
          )}
          {isMatchEnd && !matchTie && (
            <p className="text-amber-200/60 text-sm mt-2">
              Lowest total score wins the match.
            </p>
          )}
        </div>

        <div className="px-6 py-5">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3 text-center">
            {isMatchEnd ? "Final standings" : "Round points"}
          </p>
          <ul className="space-y-2">
            {roundRows.map((row) => (
              <li
                key={row.seat}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 border ${
                  row.isHuman
                    ? "border-amber-400/40 bg-amber-500/10"
                    : row.isRoundWinner
                      ? "border-emerald-500/25 bg-emerald-500/5"
                      : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                <span
                  className={`font-medium truncate ${
                    row.isHuman ? "text-amber-100" : "text-zinc-300"
                  }`}
                >
                  {row.label}
                  {row.isRoundWinner && !isMatchEnd && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-emerald-400/90">
                      Out
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-right shrink-0">
                  <span
                    className={`text-lg font-semibold ${
                      row.roundPoints === 0 ? "text-emerald-300" : "text-amber-200"
                    }`}
                  >
                    {row.roundPoints}
                  </span>
                  {isMatchEnd && (
                    <span className="block text-[10px] text-zinc-500">
                      total {row.totalPoints}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          {!isMatchEnd && (
            <button
              type="button"
              onClick={onNextRound}
              className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition shadow-lg shadow-amber-900/30"
            >
              Next Round
            </button>
          )}
          <button
            type="button"
            onClick={onExitToLobby}
            className={`flex-1 py-3.5 rounded-xl font-semibold transition border ${
              isMatchEnd
                ? "bg-amber-500 hover:bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-900/30"
                : "bg-zinc-900/80 hover:bg-zinc-800 text-amber-100 border-zinc-600"
            }`}
          >
            Exit to Lobby
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}