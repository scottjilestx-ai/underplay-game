export type Sfx = "deal" | "play" | "pickup" | "clear" | "skip" | "flip" | "win" | "tap";

export const SFX_IDS: Sfx[] = [
  "deal",
  "play",
  "pickup",
  "clear",
  "skip",
  "flip",
  "tap",
  "win",
];

export type SfxPlayResult =
  | { ok: true; contextState: AudioContextState }
  | {
      ok: false;
      reason: "muted" | "volume-zero" | "context-blocked" | "unsupported" | "error";
      contextState?: AudioContextState | "none";
      detail?: string;
    };

export interface SfxCatalogEntry {
  id: Sfx;
  label: string;
  description: string;
  gameTrigger: string;
}

/** All wired game sounds and when they fire in GameApp. */
export const SFX_CATALOG: SfxCatalogEntry[] = [
  {
    id: "deal",
    label: "Deal",
    description: "Two short triangle tones (220 Hz + 330 Hz).",
    gameTrigger: "Shuffle / deal animation (Deal cards, opening deal-stock phase).",
  },
  {
    id: "play",
    label: "Play card",
    description: "Single sine tone (~440 Hz).",
    gameTrigger:
      "Normal card play, higher-confirm add/complete, CPU/human after move resolution.",
  },
  {
    id: "pickup",
    label: "Pickup pile",
    description: "Low sawtooth dip (180 Hz + 140 Hz).",
    gameTrigger: "Higher play that sends the stack to your hand (pending confirm).",
  },
  {
    id: "clear",
    label: "Clear / tap-out",
    description: "Rising sine pair (520 Hz + 780 Hz).",
    gameTrigger: "Undercut card or stack cleared — extra turn.",
  },
  {
    id: "skip",
    label: "Skip / Overcut",
    description: "Square wave (~300 Hz).",
    gameTrigger: "Overcut (skip) card played.",
  },
  {
    id: "flip",
    label: "Flip face-down",
    description: "Triangle tone (~360 Hz).",
    gameTrigger: "Card played from a face-down table slot.",
  },
  {
    id: "tap",
    label: "Tap / UI",
    description: "Bright double tone (600 Hz + 900 Hz).",
    gameTrigger: "Unmute, volume slider preview, tap-out after Confirm.",
  },
  {
    id: "win",
    label: "Win round",
    description: "Arpeggio C–E–G (523 / 659 / 784 Hz).",
    gameTrigger: "Round over or match over.",
  },
];

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
let gesturePrimed = false;
let resumePromise: Promise<AudioContext> | null = null;
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

function playSilentPrime(ac: AudioContext) {
  if (gesturePrimed || ac.state !== "running") return;
  const buf = ac.createBuffer(1, 1, ac.sampleRate);
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.connect(getMaster());
  src.start(ac.currentTime);
  gesturePrimed = true;
}

function kickResume(ac: AudioContext) {
  if (ac.state === "suspended") void ac.resume();
}

/** Resume context; dedupes concurrent resume() calls. */
function whenRunning(): Promise<AudioContext> {
  const ac = getCtx();
  if (ac.state === "running") {
    playSilentPrime(ac);
    return Promise.resolve(ac);
  }
  if (!resumePromise) {
    kickResume(ac);
    resumePromise = ac.resume().then(
      () => {
        resumePromise = null;
        const live = getCtx();
        playSilentPrime(live);
        return live;
      },
      (err) => {
        resumePromise = null;
        throw err;
      },
    );
  }
  return resumePromise;
}

/** Synchronous kick — call at pointerdown before any await. */
export function unlockAudioSync(): AudioContextState | "none" {
  if (typeof window === "undefined") return "none";
  if (muted || volume <= 0) return getCtx().state;
  try {
    const ac = getCtx();
    kickResume(ac);
    if (ac.state === "running") playSilentPrime(ac);
    return ac.state;
  } catch {
    return "none";
  }
}

/** @deprecated Prefer unlockAudioSync + playSfxWithFeedback from click handlers. */
export function primeAudioFromGesture(): void {
  unlockAudioSync();
}

/** Resume AudioContext after a user gesture (required by Chrome, Safari, Edge). */
export async function unlockAudio(): Promise<boolean> {
  if (typeof window === "undefined" || muted || volume <= 0) return false;
  try {
    const ac = await whenRunning();
    return ac.state === "running";
  } catch {
    return false;
  }
}

/** Call once at app load — any click/key unlocks audio for the session. */
export function installAudioUnlock(): void {
  if (typeof window === "undefined" || unlockListenersInstalled) return;
  unlockListenersInstalled = true;

  const onGesture = () => {
    unlockAudioSync();
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
  if (ac.state !== "running") return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = ac.currentTime;
  const attack = 0.01;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(getMaster());
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}

function playTones(name: Sfx) {
  const map: Record<Sfx, () => void> = {
    deal: () => {
      playTone(220, 0.07, "triangle", 0.14);
      playTone(330, 0.08, "triangle", 0.14);
    },
    play: () => playTone(440, 0.12, "sine", 0.22),
    pickup: () => {
      playTone(180, 0.14, "sawtooth", 0.12);
      playTone(140, 0.16, "sawtooth", 0.1);
    },
    clear: () => {
      playTone(520, 0.12, "sine", 0.18);
      playTone(780, 0.14, "sine", 0.16);
    },
    skip: () => playTone(300, 0.16, "square", 0.1),
    flip: () => playTone(360, 0.1, "triangle", 0.2),
    tap: () => {
      playTone(600, 0.1, "sine", 0.16);
      playTone(900, 0.11, "sine", 0.14);
    },
    win: () => {
      clearWinTimers();
      [523, 659, 784].forEach((f, i) => {
        const t = setTimeout(() => playTone(f, 0.24, "sine", 0.2), i * 120);
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

export function getAudioDebugStatus(): {
  supported: boolean;
  contextState: AudioContextState | "none";
  muted: boolean;
  volume: number;
  gesturePrimed: boolean;
  storageKey: string;
} {
  if (typeof window === "undefined") {
    return {
      supported: false,
      contextState: "none",
      muted,
      volume,
      gesturePrimed: false,
      storageKey: STORAGE_KEY,
    };
  }
  try {
    const ac = ctx;
    return {
      supported: true,
      contextState: ac?.state ?? "none",
      muted,
      volume,
      gesturePrimed,
      storageKey: STORAGE_KEY,
    };
  } catch {
    return {
      supported: false,
      contextState: "none",
      muted,
      volume,
      gesturePrimed,
      storageKey: STORAGE_KEY,
    };
  }
}

function deliverSfx(name: Sfx): SfxPlayResult {
  const ac = getCtx();
  if (ac.state !== "running") {
    return { ok: false, reason: "context-blocked", contextState: ac.state };
  }
  playTones(name);
  return { ok: true, contextState: ac.state };
}

/**
 * Play from a click/tap handler. Never await resume() before scheduling tones —
 * use resume().then(play) so the first click both unlocks and plays.
 */
export function playSfxWithFeedback(name: Sfx): Promise<SfxPlayResult> {
  if (typeof window === "undefined") {
    return Promise.resolve({ ok: false, reason: "unsupported", contextState: "none" });
  }
  if (muted) {
    return Promise.resolve({ ok: false, reason: "muted", contextState: ctx?.state ?? "none" });
  }
  if (volume <= 0) {
    return Promise.resolve({
      ok: false,
      reason: "volume-zero",
      contextState: ctx?.state ?? "none",
    });
  }

  try {
    const ac = getCtx();
    if (ac.state === "running") {
      return Promise.resolve(deliverSfx(name));
    }
    return whenRunning()
      .then(() => deliverSfx(name))
      .catch((e) => ({
        ok: false as const,
        reason: "error" as const,
        contextState: ctx?.state ?? "none",
        detail: e instanceof Error ? e.message : String(e),
      }));
  } catch (e) {
    return Promise.resolve({
      ok: false,
      reason: "error",
      contextState: ctx?.state ?? "none",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

export function playSfx(name: Sfx) {
  if (typeof window === "undefined" || muted || volume <= 0) return;
  unlockAudioSync();
  try {
    const ac = getCtx();
    if (ac.state === "running") {
      playTones(name);
      return;
    }
    void whenRunning().then(() => {
      if (!muted && volume > 0) playTones(name);
    });
  } catch {
    /* ignore */
  }
}

if (typeof window !== "undefined") {
  const prefs = loadAudioPrefs();
  muted = prefs.muted;
  volume = prefs.volume;
}