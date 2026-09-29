// The game's sound, all of it made in code with Web Audio, like the art: no files, no
// licences, nothing to download. One context, started on the first tap or key (browsers
// won't play before one), silent while the app is hidden. Two buses under the master: the
// effects, and the ambience (13.2), which ducks under dialogue.
import type { Settings } from '../game/persist';
import type { Cue } from './cues';
import { Ambience } from './ambience';
import type { Bed } from './beds';
import { VOICES, type V } from './voices';

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
  private ambience: Ambience | null = null;
  // The bed asked for, by name: kept till the context exists, and so a repeat is free.
  private bed: { key: string; bed: Bed } | null = null;

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
      this.ambience = new Ambience(ctx, this.amb, this.noise);
      if (this.bed) {
        this.ambience.set(this.bed.bed);
        window.dispatchEvent(new CustomEvent('dirtbag:ambience', { detail: this.bed.key }));
      }
    }
    if (this.ctx.state === 'suspended' && !document.hidden) void this.ctx.resume();
  }

  private visible(on: boolean): void {
    if (!this.ctx) return;
    if (on) void this.ctx.resume();
    else void this.ctx.suspend();
    if (!on) this.charge(null);
  }

  // What's playing under everything, by a name for it (the place, or the map). Says so on
  // the window when it's playing, for the e2e.
  setBed(key: string, bed: Bed): void {
    if (this.bed?.key === key) return;
    this.bed = { key, bed };
    if (!this.ambience) return;
    this.ambience.set(bed);
    window.dispatchEvent(new CustomEvent('dirtbag:ambience', { detail: key }));
  }

  // Once a frame.
  tick(dt: number): void {
    if (this.ctx?.state === 'running' && this.level > 0) this.ambience?.tick(dt);
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
