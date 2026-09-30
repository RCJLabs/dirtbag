// How each cue sounds: small synth recipes on Web Audio, noise and tones through filters
// and envelopes. Shared by the effects, the ambience and the dev sound sheet.
import type { Cue } from './cues';

// Where a voice plays: a live context, or an offline one (the dev sound sheet renders them).
export interface V {
  ctx: BaseAudioContext;
  out: AudioNode;
  noise: AudioBuffer;
  t: number;
}

interface ToneOpts {
  type?: OscillatorType;
  f: number;
  f2?: number;
  dur: number;
  gain: number;
  delay?: number;
  attack?: number;
}

export function tone(v: V, o: ToneOpts): void {
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

export function burst(v: V, o: NoiseOpts): void {
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
// It starts at zero, not at a gain node's default of 1: otherwise a source that starts
// between two samples lets its first one through at full volume, a click up to 0.8.
function envelope(g: GainNode, t: number, peak: number, attack: number, dur: number): void {
  g.gain.value = 0;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

export const jitter = (x: number, by = 0.08) => x * (1 + (Math.random() * 2 - 1) * by);

export const VOICES: Record<Cue, (v: V, k: number) => void> = {
  // A chord: six strings a few milliseconds apart, a G, ringing when it's clean (k = 1) and
  // choked to a dull chunk when it's off (k = 0).
  strum: (v, k) => {
    const ring = 0.15 + 0.85 * k;
    [98, 123.5, 147, 196, 247, 392].forEach((f, i) =>
      tone(v, {
        type: 'triangle',
        f: k > 0 ? f : jitter(f, 0.04),
        dur: 0.12 + 0.9 * ring,
        gain: 0.12 + 0.06 * k,
        delay: i * 0.012,
      }),
    );
    if (k < 1) burst(v, { filter: 'bandpass', f: 900, q: 1.2, dur: 0.06, gain: 0.5 * (1 - k) });
  },
  // A low open chord, held and let go slowly: nothing else.
  farewell: (v) => {
    [98, 147, 196].forEach((f, i) =>
      tone(v, { type: 'sine', f, dur: 2.6, gain: 0.16, delay: i * 0.05, attack: 0.4 }),
    );
  },
  // Four boots on loose ground in the dark, under a long gust through the trees.
  walkout: (v) => {
    burst(v, { filter: 'bandpass', f: 500, f2: 300, q: 0.7, dur: 1.6, gain: 0.3, attack: 0.5 });
    for (let i = 0; i < 4; i++)
      burst(v, {
        filter: 'lowpass',
        f: jitter(420, 0.2),
        q: 0.8,
        dur: 0.08,
        gain: 0.7,
        delay: 0.2 + i * 0.38,
      });
  },
  // A van's side door: the long roll of the runner, and the thunk as it latches.
  door: (v) => {
    burst(v, { filter: 'bandpass', f: 700, f2: 1100, q: 1.4, dur: 0.45, gain: 0.35, attack: 0.05 });
    burst(v, { filter: 'lowpass', f: 380, dur: 0.12, gain: 1, delay: 0.46 });
    tone(v, { type: 'triangle', f: 110, f2: 80, dur: 0.16, gain: 0.3, delay: 0.46 });
  },
  // Tires leaving the asphalt for gravel, slowing, and the handbrake's ratchet.
  pullover: (v) => {
    burst(v, { filter: 'highpass', f: 1800, f2: 900, dur: 0.9, gain: 0.35, attack: 0.08 });
    for (let i = 0; i < 5; i++)
      tone(v, { type: 'square', f: jitter(900, 0.06), dur: 0.02, gain: 0.08, delay: 1 + i * 0.045 });
  },
  // Two knuckle raps on sheet metal, and a third a beat later.
  knock: (v) => {
    [0, 0.16, 0.5].forEach((d) => {
      burst(v, { filter: 'bandpass', f: jitter(420, 0.05), q: 2.5, dur: 0.09, gain: 0.9, delay: d });
      tone(v, { type: 'triangle', f: jitter(190, 0.04), f2: 150, dur: 0.14, gain: 0.35, delay: d });
    });
  },
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
  // A bang, the engine coughing down to nothing, and hot metal ticking.
  breakdown: (v) => {
    burst(v, { filter: 'lowpass', f: 1400, f2: 300, dur: 0.25, gain: 1 });
    tone(v, { type: 'sawtooth', f: 70, f2: 30, dur: 0.9, gain: 0.35, delay: 0.1, attack: 0.02 });
    for (let i = 0; i < 4; i++)
      tone(v, { type: 'triangle', f: jitter(2400, 0.1), dur: 0.03, gain: 0.12, delay: 1.1 + i * 0.28 });
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
  // A board creaking under a hang, and the breath out after.
  train: (v) => {
    tone(v, { type: 'triangle', f: 180, f2: 150, dur: 0.35, gain: 0.25 });
    burst(v, { filter: 'lowpass', f: 600, f2: 350, dur: 0.6, gain: 0.35, delay: 0.3, attack: 0.2 });
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
  // A cam's lobes springing open in the crack, then the rope clipped to it.
  place: (v) => {
    burst(v, { filter: 'bandpass', f: 2600, q: 2.5, dur: 0.08, gain: 0.5 });
    tone(v, { f: 3800, dur: 0.03, gain: 0.25, delay: 0.14 });
    tone(v, { f: 5000, dur: 0.04, gain: 0.2, delay: 0.19 });
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
