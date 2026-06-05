"use client";

import { useEffect } from "react";
import { installAudioUnlock } from "@/lib/audio";

/** Registers global gesture handlers so Web Audio can start after browser autoplay rules. */
export function AudioUnlock() {
  useEffect(() => {
    installAudioUnlock();
  }, []);
  return null;
}