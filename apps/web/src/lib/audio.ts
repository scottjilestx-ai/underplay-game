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
const winTimers: ReturnType<typeof setTimeout>[] = [];

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
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
    /* ignore quota / private mode */
  }
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.08) {
  if (muted) return;
  const ac = getCtx();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  o.connect(g);
  g.connect(getMaster());
  o.start();
  o.stop(ac.currentTime + dur);
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
  if (typeof window === "undefined" || muted) return;
  const map: Record<Sfx, () => void> = {
    deal: () => {
      tone(220, 0.05, "triangle");
      tone(330, 0.06, "triangle");
    },
    play: () => tone(440, 0.07, "sine"),
    pickup: () => {
      tone(180, 0.12, "sawtooth", 0.05);
      tone(140, 0.15, "sawtooth", 0.04);
    },
    clear: () => {
      tone(520, 0.1);
      tone(780, 0.12);
    },
    skip: () => tone(300, 0.14, "square", 0.04),
    flip: () => tone(360, 0.05, "triangle"),
    tap: () => {
      tone(600, 0.08);
      tone(900, 0.1);
    },
    win: () => {
      clearWinTimers();
      [523, 659, 784].forEach((f, i) => {
        const t = setTimeout(() => tone(f, 0.2), i * 120);
        winTimers.push(t);
      });
    },
  };
  map[name]?.();
  if (ctx?.state === "suspended") void ctx.resume();
}

if (typeof window !== "undefined") {
  const prefs = loadAudioPrefs();
  muted = prefs.muted;
  volume = prefs.volume;
}