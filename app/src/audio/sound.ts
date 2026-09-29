// The game's sound, all of it made in code with Web Audio, like the art: no files, no
// licences, nothing to download. One context, started on the first tap or key (browsers
// won't play before one), silent while the app is hidden. Two buses under the master: the
// effects, and the ambience (13.2), which ducks under dialogue.
import type { Settings } from '../game/persist';
import type { Cue } from './cues';

// Where a voice plays: a live context, or an offline one (the dev sound sheet renders them).
export interface V {
  ctx: BaseAudioContext;
  out: AudioNode;
  noise: AudioBuffer;
  t: number;
}

// The master level for each setting.
const LEVEL: Record<Settings['sound'], number> = { on: 0.9, quiet: 0.35, off: 0 };
// How far the ambience drops while someone's talking to you.
const DUCKED = 0.3;

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private amb: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private level = LEVEL.on;
  private buzz = true;
  private charging: { o: OscillatorNode; g: GainNode } | null = null;

  constructor() {
    if (typeof document !== 'undefined')
      document.addEventListener('visibilitychange', () => this.visible(!document.hidden));
  }

  configure(s: Settings): void {
    this.level = LEVEL[s.sound];
    this.buzz = s.buzz === 'on';
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.level, this.ctx.currentTime, 0.05);
  }

  // Called on the player's first tap or key, and every one after: cheap once it's running.
  unlock(): void {
    if (typeof AudioContext === 'undefined') return;
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.master = ctx.createGain();
      this.master.gain.value = this.level;
      this.master.connect(ctx.destination);
      this.sfx = ctx.createGain();
      this.sfx.connect(this.master);
      this.amb = ctx.createGain();
      this.amb.connect(this.master);
      // Two seconds of white noise: chalk, breath, wind and rain are all it, filtered.
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.ctx = ctx;
    }
    if (this.ctx.state === 'suspended' && !document.hidden) void this.ctx.resume();
  }

  private visible(on: boolean): void {
    if (!this.ctx) return;
    if (on) void this.ctx.resume();
    else void this.ctx.suspend();
    if (!on) this.charge(null);
  }

  // Someone's talking: the ambience drops under them, and comes back after.
  duck(on: boolean): void {
    if (this.amb && this.ctx) this.amb.gain.setTargetAtTime(on ? DUCKED : 1, this.ctx.currentTime, 0.15);
  }

  private live(): V | null {
    const { ctx, sfx, noise } = this;
    if (!ctx || !sfx || !noise || ctx.state !== 'running' || this.level === 0) return null;
    return { ctx, out: sfx, noise, t: ctx.currentTime };
  }

  // Plays a cue. `k` (0..1) is how hard: a heavier breath, a longer drive. Says so on the
  // window, for the e2e and for captions one day.
  play(cue: Cue, k = 1): void {
    const v = this.live();
    if (!v) return;
    VOICES[cue](v, k);
    window.dispatchEvent(new CustomEvent('dirtbag:sound', { detail: cue }));
  }

  // A hold-to-load's rising note while you charge: `k` 0..1 how far, null to stop.
  charge(k: number | null): void {
    const v = k === null ? null : this.live();
    if (!v || k === null) {
      if (this.charging && this.ctx) {
        this.charging.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
        this.charging.o.stop(this.ctx.currentTime + 0.1);
      }
      this.charging = null;
      return;
    }
    if (!this.charging) {
      const o = v.ctx.createOscillator();
      const g = v.ctx.createGain();
      o.type = 'triangle';
      g.gain.value = 0;
      g.gain.setTargetAtTime(0.2, v.t, 0.03);
      o.connect(g).connect(v.out);
      o.start();
      this.charging = { o, g };
      window.dispatchEvent(new CustomEvent('dirtbag:sound', { detail: 'charge' }));
    }
    this.charging.o.frequency.setTargetAtTime(170 + 360 * k, v.t, 0.02);
  }

  // A buzz in the hand, where the device has one and the player wants it.
  vibrate(ms: number | number[]): void {
    if (this.buzz && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
  }
}

// ---- the voices ----

interface ToneOpts {
  type?: OscillatorType;
  f: number;
  f2?: number;
  dur: number;
  gain: number;
  delay?: number;
  attack?: number;
}

function tone(v: V, o: ToneOpts): void {
  const t = v.t + (o.delay ?? 0);
  const osc = v.ctx.createOscillator();
  const g = v.ctx.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.f, t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
  envelope(g, t, o.gain, o.attack ?? 0.004, o.dur);
  osc.connect(g).connect(v.out);
  osc.start(t);
  osc.stop(t + o.dur + 0.05);
}

interface NoiseOpts {
  filter: BiquadFilterType;
  f: number;
  f2?: number;
  q?: number;
  dur: number;
  gain: number;
  delay?: number;
  attack?: number;
}

function burst(v: V, o: NoiseOpts): void {
  const t = v.t + (o.delay ?? 0);
  const src = v.ctx.createBufferSource();
  src.buffer = v.noise;
  const f = v.ctx.createBiquadFilter();
  f.type = o.filter;
  f.frequency.setValueAtTime(o.f, t);
  if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
  f.Q.value = o.q ?? 1;
  const g = v.ctx.createGain();
  envelope(g, t, o.gain, o.attack ?? 0.003, o.dur);
  src.connect(f).connect(g).connect(v.out);
  // Start somewhere different in the noise each time, so no two chalk puffs match.
  src.start(t, Math.random() * 1.5);
  src.stop(t + o.dur + 0.05);
}

// Up to `peak` over `attack`, then an exponential fall to silence by `dur`.
function envelope(g: GainNode, t: number, peak: number, attack: number, dur: number): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

const jitter = (x: number, by = 0.08) => x * (1 + (Math.random() * 2 - 1) * by);

export const VOICES: Record<Cue, (v: V, k: number) => void> = {
  // A pencil tick on paper.
  tap: (v) => tone(v, { f: 1500, f2: 1150, dur: 0.035, gain: 0.25 }),
  // A boot on dirt.
  step: (v) => burst(v, { filter: 'lowpass', f: jitter(360, 0.2), q: 0.8, dur: 0.07, gain: 0.9 }),
  // A speech bubble opening.
  talk: (v) => tone(v, { f: 520, f2: 760, dur: 0.09, gain: 0.35 }),
  // The map unfolding.
  paper: (v) =>
    burst(v, { filter: 'bandpass', f: 2600, f2: 1300, q: 0.6, dur: 0.3, gain: 0.5, attack: 0.04 }),
  // The van turns over twice, catches, and pulls away for `k` of two seconds.
  drive: (v, k) => {
    burst(v, { filter: 'lowpass', f: 900, dur: 0.08, gain: 1 });
    burst(v, { filter: 'lowpass', f: 900, dur: 0.08, gain: 1, delay: 0.14 });
    tone(v, { type: 'sawtooth', f: 46, f2: 70, dur: 0.3 + 1.7 * k, gain: 0.35, delay: 0.26, attack: 0.1 });
  },
  // Ramen on the stove, or a plate put down.
  eat: (v) => {
    burst(v, { filter: 'highpass', f: 3200, dur: 0.6, gain: 0.25, attack: 0.05 });
    for (let i = 0; i < 4; i++)
      burst(v, {
        filter: 'bandpass',
        f: jitter(4200, 0.3),
        q: 4,
        dur: 0.03,
        gain: 0.4,
        delay: 0.1 + i * 0.11,
      });
  },
  // Coins in the jar.
  earn: (v) => {
    tone(v, { f: 2093, dur: 0.12, gain: 0.3 });
    tone(v, { f: 2637, dur: 0.2, gain: 0.3, delay: 0.07 });
  },
  // Coins on the counter.
  pay: (v) => {
    tone(v, { f: 1568, dur: 0.1, gain: 0.25 });
    tone(v, { f: 1318, dur: 0.14, gain: 0.25, delay: 0.06 });
  },
  // Lights out.
  sleep: (v) => {
    tone(v, { f: 330, f2: 220, dur: 0.9, gain: 0.25, attack: 0.08 });
    tone(v, { f: 247, f2: 165, dur: 1.1, gain: 0.2, delay: 0.15, attack: 0.08 });
  },
  // A long breath out.
  rest: (v) => burst(v, { filter: 'lowpass', f: 700, f2: 400, dur: 0.9, gain: 0.4, attack: 0.3 }),
  // Scout, twice.
  dog: (v) => {
    tone(v, { type: 'sawtooth', f: 430, f2: 220, dur: 0.11, gain: 0.25 });
    tone(v, { type: 'sawtooth', f: 450, f2: 230, dur: 0.12, gain: 0.25, delay: 0.18 });
  },
  // Chalked hands clapped off, then the first hold.
  pullon: (v) => {
    burst(v, { filter: 'bandpass', f: 1800, q: 0.8, dur: 0.12, gain: 0.6 });
    burst(v, { filter: 'bandpass', f: 1600, q: 0.8, dur: 0.1, gain: 0.5, delay: 0.16 });
  },
  // A shoe scraping onto the next hold.
  move: (v) => burst(v, { filter: 'bandpass', f: jitter(3200, 0.15), q: 1.2, dur: 0.06, gain: 0.5 }),
  // The gate of a quickdraw, and the rope through it.
  clip: (v) => {
    tone(v, { f: 4200, dur: 0.03, gain: 0.3 });
    tone(v, { f: 5600, dur: 0.04, gain: 0.25, delay: 0.05 });
  },
  // Here's the hard bit.
  crux: (v) => tone(v, { type: 'triangle', f: 220, dur: 0.16, gain: 0.3 }),
  // Through it.
  cleared: (v) => {
    tone(v, { type: 'triangle', f: 440, dur: 0.1, gain: 0.3 });
    tone(v, { type: 'triangle', f: 660, dur: 0.16, gain: 0.3, delay: 0.08 });
  },
  // Rubber squeaking as you bear down.
  grip: (v) => tone(v, { type: 'triangle', f: 880, f2: 1250, dur: 0.05, gain: 0.2 }),
  // A hand slapped onto a hold.
  slap: (v) => burst(v, { filter: 'bandpass', f: 1100, q: 1.5, dur: 0.05, gain: 1.2 }),
  // Stands for the rising note; Sound.charge() plays it.
  charge: () => {},
  // The throw.
  release: (v) => burst(v, { filter: 'bandpass', f: 900, f2: 2600, q: 1.2, dur: 0.18, gain: 0.9 }),
  // A breath, harder as the pump builds.
  breath: (v, k) =>
    burst(v, { filter: 'lowpass', f: 700 + 500 * k, dur: 0.45, gain: 0.15 + 0.35 * k, attack: 0.15 }),
  // Air going past.
  fell: (v) => burst(v, { filter: 'bandpass', f: 1300, f2: 280, q: 0.9, dur: 0.45, gain: 0.7 }),
  // The pad, or the rope catching.
  land: (v) => {
    tone(v, { f: 95, f2: 40, dur: 0.25, gain: 0.45 });
    burst(v, { filter: 'lowpass', f: 320, dur: 0.15, gain: 0.4 });
  },
  // A plucked chord going up: you're on top.
  send: (v) =>
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(v, { type: 'triangle', f, dur: 0.4, gain: 0.3, delay: i * 0.09 }),
    ),
};
