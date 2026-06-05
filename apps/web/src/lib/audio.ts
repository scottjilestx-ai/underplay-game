type Sfx = "deal" | "play" | "pickup" | "clear" | "skip" | "flip" | "win" | "tap";

let ctx: AudioContext | null = null;
let muted = false;
let volume = 0.6;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.08) {
  if (muted) return;
  const ac = getCtx();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain * volume;
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  o.connect(g);
  g.connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + dur);
}

export function setMuted(v: boolean) {
  muted = v;
}

export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
}

export function playSfx(name: Sfx) {
  if (typeof window === "undefined") return;
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
      [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.2), i * 120));
    },
  };
  map[name]?.();
  if (ctx?.state === "suspended") void ctx.resume();
}