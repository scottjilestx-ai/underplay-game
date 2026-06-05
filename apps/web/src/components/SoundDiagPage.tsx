"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeProvider";
import {
  getAudioDebugStatus,
  loadAudioPrefs,
  playSfxWithFeedback,
  primeAudioFromGesture,
  setMuted,
  setVolume,
  SFX_CATALOG,
  type Sfx,
  type SfxPlayResult,
} from "@/lib/audio";
import { ScrollPage } from "./ScrollPage";
import { UnderPlayLogo } from "./UnderPlayLogo";

type PlayLog = {
  id: Sfx;
  at: string;
  result: SfxPlayResult;
};

export function SoundDiagPage() {
  const { themeId, theme } = useTheme();
  const [muted, setMutedState] = useState(() => loadAudioPrefs().muted);
  const [vol, setVol] = useState(() => loadAudioPrefs().volume);
  const [status, setStatus] = useState(getAudioDebugStatus);
  const [lastPlay, setLastPlay] = useState<PlayLog | null>(null);
  const [playingId, setPlayingId] = useState<Sfx | null>(null);

  const refreshStatus = useCallback(() => {
    setStatus(getAudioDebugStatus());
  }, []);

  useEffect(() => {
    setMuted(muted);
    setVolume(vol);
    refreshStatus();
  }, [muted, vol, refreshStatus]);

  useEffect(() => {
    const t = window.setInterval(refreshStatus, 400);
    return () => clearInterval(t);
  }, [refreshStatus]);

  const handlePlay = async (id: Sfx) => {
    setPlayingId(id);
    primeAudioFromGesture();
    const result = await playSfxWithFeedback(id);
    setLastPlay({ id, at: new Date().toLocaleTimeString(), result });
    refreshStatus();
    setPlayingId(null);
  };

  const handlePrime = () => {
    primeAudioFromGesture();
    refreshStatus();
  };

  const statusTone = (ok: boolean) => (ok ? "text-emerald-300" : "text-rose-300");

  return (
    <ScrollPage>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-12">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link
            href="/"
            className="text-theme-muted text-sm hover:text-theme-ink transition shrink-0"
          >
            ← Home
          </Link>
          <div className="w-[8rem] shrink-0">
            <UnderPlayLogo themeId={themeId} size="header" />
          </div>
        </div>

        <h1 className="font-serif text-2xl text-theme-ink mb-1">Sound diagnostics</h1>
        <p className="text-theme-muted text-sm mb-6 leading-relaxed">
          Test every game sound in isolation. If Play works here but not in a match, the issue is
          timing or triggers — not your speakers. Each Play click also primes Web Audio (same as
          in-game).
        </p>

        <section className="rounded-2xl border border-theme-border bg-theme-panel p-4 sm:p-5 mb-6">
          <h2 className="text-[10px] uppercase tracking-widest text-theme-muted mb-3">
            Engine status
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm font-mono">
            <div className="flex justify-between gap-2">
              <span className="text-theme-muted">Web Audio</span>
              <span className={statusTone(status.supported)}>
                {status.supported ? "yes" : "no"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-theme-muted">Context</span>
              <span className={statusTone(status.contextState === "running")}>
                {status.contextState}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-theme-muted">Gesture primed</span>
              <span className={statusTone(status.gesturePrimed)}>
                {status.gesturePrimed ? "yes" : "no"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-theme-muted">localStorage</span>
              <span className="text-theme-ink truncate">{status.storageKey}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-theme-muted">Muted (module)</span>
              <span className={statusTone(!status.muted)}>{String(status.muted)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-theme-muted">Volume (module)</span>
              <span className="text-theme-ink">{status.volume.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-theme-border">
            <button
              type="button"
              onClick={handlePrime}
              className="px-4 py-2 rounded-lg border border-theme-border bg-black/40 text-theme-ink text-sm font-semibold hover:bg-black/55 transition"
            >
              Prime audio
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !muted;
                setMutedState(next);
                setMuted(next);
                if (!next) void playSfxWithFeedback("tap");
              }}
              className="px-4 py-2 rounded-lg border border-amber-500/35 bg-black/40 text-amber-100 text-sm font-semibold hover:bg-amber-950/50 transition"
            >
              {muted ? "Unmute" : "Mute"}
            </button>
            <label className="flex items-center gap-2 text-sm text-theme-muted">
              Volume
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
                  if (v > 0 && !muted) void playSfxWithFeedback("tap");
                }}
                className="w-28 accent-amber-400"
                disabled={muted}
              />
              <span className="tabular-nums text-theme-ink w-8">{Math.round(vol * 100)}%</span>
            </label>
          </div>

          {lastPlay && (
            <p
              className={`mt-3 text-xs font-mono rounded-lg px-3 py-2 border ${
                lastPlay.result.ok
                  ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-200"
                  : "border-rose-500/30 bg-rose-950/30 text-rose-200"
              }`}
            >
              Last: <strong>{lastPlay.id}</strong> @ {lastPlay.at} —{" "}
              {lastPlay.result.ok
                ? `played (context ${lastPlay.result.contextState})`
                : `${lastPlay.result.reason}${lastPlay.result.detail ? `: ${lastPlay.result.detail}` : ""}${lastPlay.result.contextState ? ` [${lastPlay.result.contextState}]` : ""}`}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-theme-border bg-theme-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-theme-border bg-black/25">
            <h2 className="font-serif text-lg text-theme-ink">Sound chart</h2>
            <p className="text-theme-muted text-xs mt-0.5">
              Synthetic Web Audio tones — no MP3 files.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-theme-muted border-b border-theme-border">
                  <th className="px-4 py-2 font-medium w-24">Sound</th>
                  <th className="px-4 py-2 font-medium">Character</th>
                  <th className="px-4 py-2 font-medium">Wired in game</th>
                  <th className="px-4 py-2 font-medium w-24 text-right">Test</th>
                </tr>
              </thead>
              <tbody>
                {SFX_CATALOG.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-theme-border/60 hover:bg-black/20 transition"
                  >
                    <td className="px-4 py-3 align-top">
                      <span className="font-semibold text-theme-ink">{row.label}</span>
                      <span className="block text-[10px] font-mono text-theme-muted mt-0.5">
                        {row.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-theme-muted text-xs leading-relaxed">
                      {row.description}
                    </td>
                    <td className="px-4 py-3 align-top text-theme-ink/85 text-xs leading-relaxed">
                      {row.gameTrigger}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <button
                        type="button"
                        disabled={playingId !== null || muted || vol <= 0}
                        onClick={() => void handlePlay(row.id)}
                        className={`min-w-[4.5rem] px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-40 ${
                          playingId === row.id
                            ? "bg-amber-600/50 text-amber-100"
                            : `bg-gradient-to-r ${theme.buttonGradient} text-black hover:opacity-90`
                        }`}
                      >
                        {playingId === row.id ? "…" : "Play"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-center text-theme-muted text-xs mt-6">
          <Link href="/play" className="hover:text-theme-ink transition" style={{ color: "var(--theme-accent)" }}>
            Back to Play vs CPU
          </Link>
        </p>
      </div>
    </ScrollPage>
  );
}