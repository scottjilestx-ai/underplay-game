"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { loadStoredDisplayName, storeDisplayName } from "@/lib/gameSetup";
import { useTheme } from "@/context/ThemeProvider";
import { LobbyChrome } from "./LobbyChrome";
import { ScrollPage } from "./ScrollPage";

function randomRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function OnlineLobby() {
  const { theme } = useTheme();
  const [name, setName] = useState("You");

  useEffect(() => {
    setName(loadStoredDisplayName());
  }, []);
  const [joinCode, setJoinCode] = useState("");
  const [hostedCode, setHostedCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const requireName = useCallback((): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage("Enter your name first.");
      return null;
    }
    setMessage(null);
    return trimmed;
  }, [name]);

  const createRoom = useCallback(() => {
    const trimmed = requireName();
    if (!trimmed) return;
    storeDisplayName(trimmed);
    const code = randomRoomCode();
    setHostedCode(code);
    setJoinCode("");
    setMessage("You are in the room. Share the code below with friends.");
  }, [requireName]);

  const leaveRoom = useCallback(() => {
    setHostedCode(null);
    setMessage(null);
  }, []);

  const joinRoom = useCallback(() => {
    const trimmed = requireName();
    if (!trimmed) return;
    storeDisplayName(trimmed);
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setMessage("Enter the room code you were given.");
      return;
    }
    setMessage(
      "Online sync is not wired up yet — room API and live updates are the next build step.",
    );
  }, [requireName, joinCode]);

  const isHost = hostedCode != null;

  return (
    <ScrollPage>
      <div className="max-w-md mx-auto px-4 pt-4 pb-8">
        <LobbyChrome
          tagline={
            isHost
              ? "Hosting — share your room code with friends."
              : "Create a room or join with a code."
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-theme-panel backdrop-blur-md border border-theme-border p-6 shadow-2xl"
        >
          <h1 className="font-serif text-2xl text-theme-ink tracking-tight mb-1">
            Play online
          </h1>
          <p className="text-theme-muted text-sm mb-5">
            {isHost
              ? "You are hosting — friends join with your code."
              : "Create a room and share the code, or join one you were given."}
          </p>

          <label className="block text-theme-muted text-xs uppercase tracking-widest mb-2">
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
            maxLength={24}
            className="w-full mb-5 bg-black/40 border border-theme-border rounded-lg px-3 py-2.5 text-theme-ink placeholder:text-theme-muted/50 focus:border-[var(--theme-accent)] focus:outline-none"
          />

          {isHost ? (
            <div className="space-y-4">
              <div
                className="rounded-xl border px-4 py-3 text-center"
                style={{
                  borderColor: "color-mix(in srgb, var(--theme-accent) 35%, transparent)",
                  background: "color-mix(in srgb, var(--theme-accent) 12%, transparent)",
                }}
              >
                <p className="text-theme-ink text-sm font-medium">You are in the room as host</p>
                <p className="text-theme-muted text-xs mt-1">
                  Waiting for friends to join with this code
                </p>
              </div>

              <div className="rounded-xl border border-theme-border bg-black/35 px-4 py-4 text-center">
                <p className="text-theme-muted text-xs uppercase tracking-widest mb-2">
                  Room code
                </p>
                <p
                  className="font-mono text-3xl font-bold tracking-[0.2em]"
                  style={{ color: "var(--theme-accent)" }}
                >
                  {hostedCode}
                </p>
                <p className="text-theme-muted text-xs mt-3 leading-relaxed">
                  Live room sync requires the server layer (next step) — this preview creates the
                  room locally and puts you in automatically.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(hostedCode);
                    setMessage("Code copied.");
                  }}
                  className="mt-4 text-sm underline transition hover:opacity-80"
                  style={{ color: "var(--theme-accent)" }}
                >
                  Copy code
                </button>
              </div>

              <Link
                href="/play"
                className={`block w-full py-3.5 rounded-xl bg-gradient-to-r ${theme.buttonGradient} text-black font-bold text-center hover:opacity-90 transition`}
              >
                Deal cards (local preview)
              </Link>

              <button
                type="button"
                onClick={leaveRoom}
                className="w-full py-2.5 rounded-xl border border-theme-border text-theme-muted text-sm hover:bg-black/30 hover:text-theme-ink transition"
              >
                Leave room
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={createRoom}
                className={`w-full py-3 rounded-xl bg-gradient-to-r ${theme.buttonGradient} text-black font-semibold hover:opacity-90 transition mb-5`}
              >
                Create a room
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-theme-border" />
                <span className="text-theme-muted text-xs uppercase">or join</span>
                <div className="flex-1 h-px bg-theme-border" />
              </div>

              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Room code"
                maxLength={6}
                className="w-full mb-3 bg-black/40 border border-theme-border rounded-lg px-3 py-2.5 text-theme-ink font-mono tracking-widest uppercase placeholder:text-theme-muted/50 placeholder:tracking-normal placeholder:font-sans"
              />
              <button
                type="button"
                onClick={joinRoom}
                className={`w-full py-3 rounded-xl border ${theme.buttonBorder} bg-black/30 text-theme-ink font-semibold hover:bg-black/45 transition`}
              >
                Join with code
              </button>
            </>
          )}

          {message && (
            <p className="mt-4 text-theme-ink/90 text-sm rounded-lg bg-black/30 border border-theme-border px-3 py-2">
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-theme-muted text-xs">
            <Link
              href="/play"
              className="hover:text-theme-ink transition"
              style={{ color: "var(--theme-accent)" }}
            >
              Play vs CPU instead
            </Link>
          </p>
        </motion.div>
      </div>
    </ScrollPage>
  );
}