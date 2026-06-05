type Sfx = "deal" | "play" | "pickup" | "clear" | "skip" | "flip" | "win" | "tap";

const STORAGE_KEY = "underplay-audio-v1";

export type AudioPrefs = {
  muted: boolean;
  volume: number;
};

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;
let volume = 0.6;
let unlockListenersInstalled = false;
let resumePromise: Promise<void> | null = null;
const winTimers: ReturnType<typeof setTimeout>[] = [];

function createCtx(): AudioContext {
  const AC =
    typeof window !== "undefined"
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      : undefined;
  if (!AC) throw new Error("Web Audio not supported");
  return new AC();
}

function getCtx(): AudioContext {
  if (!ctx) ctx = createCtx();
  return ctx;
}

function getMaster(): GainNode {
  const ac = getCtx();
  if (!masterGain) {
    masterGain = ac.createGain();
    masterGain.connect(ac.destination);
  }
  masterGain.gain.value = muted ? 0 : volume;
  return masterGain;
}

function applyMaster() {
  if (masterGain) masterGain.gain.value = muted ? 0 : volume;
}

function clearWinTimers() {
  for (const t of winTimers) clearTimeout(t);
  winTimers.length = 0;
}

/** Resume AudioContext after a user gesture (required by Chrome, Safari, Edge). */
export async function unlockAudio(): Promise<boolean> {
  if (typeof window === "undefined" || muted) return false;
  const ac = getCtx();
  if (ac.state === "running") return true;
  try {
    if (!resumePromise) {
      resumePromise = ac.resume().finally(() => {
        resumePromise = null;
      });
    }
    await resumePromise;
    return getCtx().state === "running";
  } catch {
    return false;
  }
}

/** Call once at app load — any click/key unlocks audio for the session. */
export function installAudioUnlock(): void {
  if (typeof window === "undefined" || unlockListenersInstalled) return;
  unlockListenersInstalled = true;

  const onGesture = () => {
    void unlockAudio();
  };

  window.addEventListener("pointerdown", onGesture, { capture: true, passive: true });
  window.addEventListener("keydown", onGesture, { capture: true, passive: true });
}

export function loadAudioPrefs(): AudioPrefs {
  if (typeof window === "undefined") return { muted: false, volume: 0.6 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { muted: false, volume: 0.6 };
    const parsed = JSON.parse(raw) as Partial<AudioPrefs>;
    return {
      muted: Boolean(parsed.muted),
      volume:
        typeof parsed.volume === "number"
          ? Math.max(0, Math.min(1, parsed.volume))
          : 0.6,
    };
  } catch {
    return { muted: false, volume: 0.6 };
  }
}

function saveAudioPrefs() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ muted, volume }));
  } catch {
    /* ignore */
  }
}

function playTone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  peak = 0.12,
) {
  const ac = getCtx();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = ac.currentTime;
  const attack = 0.008;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(getMaster());
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function playTones(name: Sfx) {
  const map: Record<Sfx, () => void> = {
    deal: () => {
      playTone(220, 0.06, "triangle");
      playTone(330, 0.07, "triangle");
    },
    play: () => playTone(440, 0.08, "sine"),
    pickup: () => {
      playTone(180, 0.14, "sawtooth", 0.07);
      playTone(140, 0.16, "sawtooth", 0.06);
    },
    clear: () => {
      playTone(520, 0.11);
      playTone(780, 0.13);
    },
    skip: () => playTone(300, 0.15, "square", 0.06),
    flip: () => playTone(360, 0.06, "triangle"),
    tap: () => {
      playTone(600, 0.09);
      playTone(900, 0.1);
    },
    win: () => {
      clearWinTimers();
      [523, 659, 784].forEach((f, i) => {
        const t = setTimeout(() => playTone(f, 0.22), i * 120);
        winTimers.push(t);
      });
    },
  };
  map[name]?.();
}

export function getMuted(): boolean {
  return muted;
}

export function setMuted(v: boolean) {
  muted = v;
  applyMaster();
  if (muted) clearWinTimers();
  saveAudioPrefs();
}

export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  applyMaster();
  saveAudioPrefs();
}

export function playSfx(name: Sfx) {
  if (typeof window === "undefined" || muted || volume <= 0) return;
  void unlockAudio().then((ok) => {
    if (!ok || muted) return;
    playTones(name);
  });
}

if (typeof window !== "undefined") {
  const prefs = loadAudioPrefs();
  muted = prefs.muted;
  volume = prefs.volume;
}