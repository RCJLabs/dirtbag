// The ambience engine: continuous layers (wind, rain, the room, voices, water, the fire's
// hiss) made from looped noise through filters, and the things that happen now and then
// (a bird, crickets, a crackle, a cup, a hawk, a drip, a fall onto the pads) scattered over
// them. A new bed
// crossfades in over a second or so; nothing stops dead.
import { QUIET, type Bed } from './beds';
import { burst, jitter, tone, type V } from './voices';

type Loop = 'wind' | 'rain' | 'room' | 'murmur' | 'creek' | 'fire';

// Each loop's filter, and how loud it is at a bed's 1.
const LOOPS: Record<Loop, { type: BiquadFilterType; f: number; q: number; gain: number }> = {
  wind: { type: 'lowpass', f: 480, q: 0.4, gain: 0.5 },
  rain: { type: 'highpass', f: 1300, q: 0.3, gain: 0.07 },
  room: { type: 'lowpass', f: 170, q: 0.5, gain: 0.7 },
  // Voices: a narrower band that comes and goes quickly (WANDER), so it reads as talk and
  // not as a breeze, which a slow wide band of noise always sounds like.
  murmur: { type: 'bandpass', f: 800, q: 2.4, gain: 0.3 },
  creek: { type: 'bandpass', f: 1700, q: 0.7, gain: 0.3 },
  fire: { type: 'bandpass', f: 900, q: 0.5, gain: 0.08 },
};

// The things that happen now and then: how often at a bed's 1 (per second), and how. Each
// kind plays through a gain at its layer's level, so a quieter bed has quieter birds too.
type Event = 'birds' | 'crickets' | 'fire' | 'clinks' | 'hawk' | 'rain' | 'gym';
const EVENTS: { layer: Event; rate: number; play: (v: V) => void }[] = [
  {
    layer: 'birds',
    rate: 0.5,
    play: (v) => {
      const f = jitter(3200, 0.25);
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++)
        tone(v, {
          f: f * (i % 2 ? 1.2 : 1),
          f2: f * (i % 2 ? 1 : 1.3),
          dur: 0.06,
          gain: 0.06,
          delay: i * 0.09,
        });
    },
  },
  {
    layer: 'crickets',
    rate: 1.4,
    play: (v) => {
      for (let i = 0; i < 4; i++) tone(v, { f: 4400, dur: 0.025, gain: 0.025, delay: i * 0.055 });
    },
  },
  {
    layer: 'fire',
    rate: 6,
    play: (v) =>
      burst(v, { filter: 'highpass', f: 2400, q: 0.5, dur: 0.02, gain: 0.03 + Math.random() * 0.06 }),
  },
  {
    layer: 'clinks',
    rate: 0.35,
    play: (v) => tone(v, { f: jitter(3100, 0.15), dur: 0.15, gain: 0.06 }),
  },
  {
    layer: 'hawk',
    rate: 0.04,
    play: (v) => tone(v, { f: 2000, f2: 1300, dur: 0.9, gain: 0.05, attack: 0.1 }),
  },
  // The gym: someone coming off onto the pads (a low thump and the pad's huff), a chalk clap,
  // and hands slapping plastic.
  {
    layer: 'gym',
    rate: 0.18,
    play: (v) => {
      tone(v, { f: jitter(85, 0.15), f2: 45, dur: 0.22, gain: 0.16 });
      burst(v, { filter: 'lowpass', f: 320, q: 0.7, dur: 0.18, gain: 0.12 });
    },
  },
  {
    layer: 'gym',
    rate: 0.22,
    play: (v) => {
      const n = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++)
        burst(v, {
          filter: 'bandpass',
          f: jitter(1400, 0.2),
          q: 0.9,
          dur: 0.05,
          gain: 0.05,
          delay: i * 0.14,
        });
    },
  },
  {
    layer: 'gym',
    rate: 0.7,
    play: (v) => burst(v, { filter: 'bandpass', f: jitter(2300, 0.25), q: 2, dur: 0.018, gain: 0.03 }),
  },
  {
    layer: 'rain',
    rate: 5,
    play: (v) => tone(v, { f: jitter(1800, 0.3), f2: 900, dur: 0.03, gain: 0.04 }),
  },
];

// How far the loops wander, and how often they pick a new place to wander to: wind gusts,
// voices come and go, water burbles.
const WANDER: Partial<Record<Loop, { every: number; by: number }>> = {
  wind: { every: 1.6, by: 0.45 },
  murmur: { every: 0.12, by: 0.75 },
  creek: { every: 0.15, by: 0.3 },
  fire: { every: 0.2, by: 0.5 },
};

export class Ambience {
  private loops: Record<Loop, { g: GainNode; f: BiquadFilterNode }>;
  private events: Record<Event, GainNode>;
  private bed: Bed = QUIET;
  private next: Partial<Record<Loop, number>> = {};

  constructor(
    private ctx: BaseAudioContext,
    private out: AudioNode,
    private noise: AudioBuffer,
  ) {
    const mk = (l: Loop) => {
      const spec = LOOPS[l];
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = spec.type;
      f.frequency.value = spec.f;
      f.Q.value = spec.q;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(f).connect(g).connect(out);
      // Each loop starts somewhere different in the noise, so no two layers line up.
      src.start(0, Math.random() * 1.5);
      return { g, f };
    };
    const bus = () => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(out);
      return g;
    };
    this.events = {
      birds: bus(),
      crickets: bus(),
      fire: bus(),
      clinks: bus(),
      hawk: bus(),
      rain: bus(),
      gym: bus(),
    };
    this.loops = {
      wind: mk('wind'),
      rain: mk('rain'),
      room: mk('room'),
      murmur: mk('murmur'),
      creek: mk('creek'),
      fire: mk('fire'),
    };
  }

  set(bed: Bed): void {
    this.bed = bed;
    const t = this.ctx.currentTime;
    for (const l of Object.keys(LOOPS) as Loop[])
      this.loops[l].g.gain.setTargetAtTime(LOOPS[l].gain * bed[l], t, 0.4);
    for (const e of Object.keys(this.events) as Event[]) this.events[e].gain.setTargetAtTime(bed[e], t, 0.4);
  }

  // Once a frame: the now-and-then things, and the loops wandering. `now` is the context's
  // clock, or a rendered one (the dev sound sheet plays a bed offline).
  tick(dt: number, now = this.ctx.currentTime): void {
    const v: V = { ctx: this.ctx, out: this.out, noise: this.noise, t: now };
    for (const e of EVENTS) {
      const level = this.bed[e.layer];
      if (level > 0 && Math.random() < e.rate * level * dt) e.play({ ...v, out: this.events[e.layer] });
    }
    for (const [l, w] of Object.entries(WANDER) as [Loop, { every: number; by: number }][]) {
      if (this.bed[l] <= 0 || v.t < (this.next[l] ?? 0)) continue;
      this.next[l] = v.t + w.every * (0.5 + Math.random());
      const level = LOOPS[l].gain * this.bed[l] * (1 - w.by * Math.random());
      this.loops[l].g.gain.setTargetAtTime(level, v.t, w.every / 3);
    }
  }
}
