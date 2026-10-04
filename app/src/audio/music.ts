// Phase 25 (Evan's call, 4 Oct 2026): music made in code, like the art and the effects, to
// hear how it turns out. A mood's chords on a soft pad, a bass on the beat, a plucked tune
// made up a phrase at a time and repeated with a change, and in town a brushed beat. It
// plays in stretches with quiet between, so it never wears; a new mood waits for the bar.
import { MOODS, type Mood, type MoodDef } from './moods';

const AHEAD = 0.4;
// How long a stretch plays, in bars, and the quiet after it, in seconds.
const PLAY: [number, number] = [16, 32];
const REST: [number, number] = [25, 60];

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const pick = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

// A note of a mood's scale, `deg` steps up from its root (negative goes down).
export function noteAt(m: MoodDef, deg: number): number {
  const n = m.scale.length;
  const oct = Math.floor(deg / n);
  return m.root + oct * 12 + m.scale[((deg % n) + n) % n]!;
}

// A chord on a scale degree: root, third and fifth, as notes.
export const chordOf = (m: MoodDef, deg: number): number[] => [0, 2, 4].map((i) => noteAt(m, deg + i));

// A bar's tune: eight eighths, a scale step each or a rest (null), wandering from where the
// last one ended and leaning on the chord's tones. `rnd` so a test can drive it.
export function phrase(m: MoodDef, chord: number, from: number, rnd: () => number): (number | null)[] {
  let at = from;
  return Array.from({ length: 8 }, (_, i) => {
    if (rnd() > m.busy * (i % 2 ? 0.8 : 1.2)) return null;
    at += Math.round((rnd() - 0.5) * 4);
    // Back toward the middle, and onto a chord tone on the strong beats.
    if (at > 9) at -= 3;
    if (at < 0) at += 3;
    if (i % 4 === 0) at = chord + [0, 2, 4][Math.floor(rnd() * 3)]! + 7;
    return at;
  });
}

export class Music {
  private mood: Mood | null = null;
  private next: Mood | null = null;
  // When the next bar starts, which it is, and how many are left in this stretch.
  private at = 0;
  private bar = 0;
  private left = 0;
  private motif: (number | null)[][] = [];
  private last = 7;

  constructor(
    private ctx: BaseAudioContext,
    private out: GainNode,
    private noise: AudioBuffer,
  ) {}

  // What should be playing; it changes at the next bar, or after the quiet.
  set(m: Mood): void {
    this.next = m;
    if (!this.mood) this.start(this.ctx.currentTime + 0.5);
  }

  private start(t: number): void {
    this.mood = this.next;
    this.at = t;
    this.bar = 0;
    this.left = Math.round(pick(...PLAY));
    this.motif = [];
  }

  // `now`: the context's clock, or a rendered one (the dev sound sheet plays it offline).
  tick(now = this.ctx.currentTime): void {
    if (!this.mood) return;
    while (this.at < now + AHEAD) {
      const m = MOODS[this.mood];
      const len = (60 / m.bpm) * 4;
      if (this.left <= 0 || this.next !== this.mood) {
        // A stretch ends, or the place has changed: a rest, then whatever's asked for.
        const rest = this.next !== this.mood ? 2 : pick(...REST);
        this.start(this.at + rest);
        continue;
      }
      this.playBar(m, this.at, len);
      this.at += len;
      this.bar++;
      this.left--;
    }
  }

  private playBar(m: MoodDef, t: number, len: number): void {
    const deg = m.chords[this.bar % m.chords.length]!;
    // The pad: the chord, low and slow.
    for (const n of chordOf(m, deg)) this.pad(hz(n - 12), t, len, m.bright);
    if (m.bass) {
      this.pluck(hz(noteAt(m, deg) - 24), t, 0.9, 0.16, 300);
      this.pluck(hz(noteAt(m, deg + 4) - 24), t + len / 2, 0.7, 0.11, 300);
    }
    // The tune: a phrase made fresh every four bars, then repeated with a note or two moved.
    const slot = this.bar % 4;
    if (slot === 0 && this.bar % 8 === 0) this.motif = [];
    let notes = this.motif[slot];
    if (!notes) {
      notes = phrase(m, deg, this.last, Math.random);
      this.motif[slot] = notes;
    } else if (Math.random() < 0.4) notes = phrase(m, deg, this.last, Math.random);
    const eighth = len / 8;
    notes.forEach((d, i) => {
      if (d === null) return;
      this.last = d;
      this.pluck(hz(noteAt(m, d)), t + i * eighth + (Math.random() - 0.5) * 0.012, 0.6, 0.07, 2600);
    });
    if (m.beat)
      for (let i = 0; i < 4; i++) {
        if (i % 2 === 0) this.kick(t + i * (len / 4));
        this.hat(t + i * (len / 4) + len / 8);
      }
  }

  // A soft chord tone: two detuned triangles through a low filter, slow in and out.
  private pad(f: number, t: number, len: number, bright: number): void {
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = bright;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.035, t + len * 0.3);
    g.gain.linearRampToValueAtTime(0, t + len * 1.15);
    lp.connect(g).connect(this.out);
    for (const d of [-6, 6]) {
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = d;
      o.connect(lp);
      o.start(t);
      o.stop(t + len * 1.2);
    }
  }

  // A plucked string, near enough: a bright attack that closes and fades.
  private pluck(f: number, t: number, dur: number, gain: number, bright: number): void {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.value = f;
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(bright, t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(120, f * 1.5), t + dur * 0.6);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp).connect(g).connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private kick(t: number): void {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + 0.25);
  }

  // A brush on a snare, off the beat.
  private hat(t: number): void {
    const s = this.ctx.createBufferSource();
    const hp = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    s.buffer = this.noise;
    hp.type = 'highpass';
    hp.frequency.value = 5000;
    g.gain.setValueAtTime(0.025, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    s.connect(hp).connect(g).connect(this.out);
    s.start(t, Math.random(), 0.1);
  }
}
