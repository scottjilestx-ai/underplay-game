"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
function randomRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function OnlineLobby() {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [hostedCode, setHostedCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const createRoom = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage("Enter your name before creating a room.");
      return;
    }
    setMessage(null);
    setHostedCode(randomRoomCode());
  }, [name]);

  const joinRoom = useCallback(() => {
    const trimmed = name.trim();
    const code = joinCode.trim().toUpperCase();
    if (!trimmed) {
      setMessage("Enter your name to join.");
      return;
    }
    if (code.length < 4) {
      setMessage("Enter the room code you were given.");
      return;
    }
    setMessage(
      "Online sync is not wired up yet — room API and live updates are the next build step.",
    );
  }, [name, joinCode]);

  return (
    <div className="min-h-[100dvh] lobby-bg flex items-center justify-center p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full rounded-2xl bg-black/40 backdrop-blur-md border border-amber-500/20 p-8 shadow-2xl"
      >
        <Link
          href="/"
          className="text-amber-200/50 text-sm hover:text-amber-200/80 transition mb-6 inline-block"
        >
          ← Home
        </Link>
        <h1 className="font-serif text-3xl text-amber-100 tracking-tight mb-1">
          Play online
        </h1>
        <p className="text-amber-200/65 text-sm mb-6">
          Create a room and share the code, or join one you were given.
        </p>

        <label className="block text-amber-100/80 text-sm mb-2">Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Display name"
          maxLength={24}
          className="w-full mb-6 bg-black/30 border border-amber-500/30 rounded-lg px-3 py-2.5 text-amber-50 placeholder:text-amber-200/30"
        />

        {hostedCode ? (
          <div className="mb-6 rounded-xl border border-amber-400/35 bg-amber-950/40 px-4 py-4 text-center">
            <p className="text-amber-200/60 text-xs uppercase tracking-widest mb-2">
              Room code
            </p>
            <p className="font-mono text-3xl font-bold text-amber-100 tracking-[0.2em]">
              {hostedCode}
            </p>
            <p className="text-amber-200/50 text-xs mt-3 leading-relaxed">
              Share this code with friends. Live room sync requires the server
              layer (next step) — this preview only generates the code locally.
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(hostedCode);
                setMessage("Code copied.");
              }}
              className="mt-4 text-sm text-amber-300 hover:text-amber-200 underline"
            >
              Copy code
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={createRoom}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-semibold hover:from-amber-500 hover:to-amber-400 transition mb-6"
          >
            Create a room
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-amber-500/20" />
          <span className="text-amber-200/40 text-xs uppercase">or join</span>
          <div className="flex-1 h-px bg-amber-500/20" />
        </div>

        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Room code"
          maxLength={6}
          className="w-full mb-3 bg-black/30 border border-amber-500/30 rounded-lg px-3 py-2.5 text-amber-50 font-mono tracking-widest uppercase placeholder:text-amber-200/30 placeholder:tracking-normal placeholder:font-sans"
        />
        <button
          type="button"
          onClick={joinRoom}
          className="w-full py-3 rounded-xl border border-amber-500/40 bg-black/30 text-amber-100 font-semibold hover:bg-amber-950/50 transition"
        >
          Join
        </button>

        {message && (
          <p className="mt-4 text-amber-200/80 text-sm rounded-lg bg-black/30 border border-amber-500/20 px-3 py-2">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-amber-200/40 text-xs">
          <Link href="/play" className="text-amber-300/80 hover:text-amber-200">
            Play vs CPU instead
          </Link>
        </p>
      </motion.div>
    </div>
  );
}