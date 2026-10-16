// Phase 14.1 (Evan's call): a controller, read once a frame. The browser sends no events for
// a gamepad's buttons, only its state, so this turns the change since the last frame into
// presses and releases, and a held direction into moves that repeat like a held arrow key.
import type { Dir } from './spatial';

// The standard mapping's buttons (W3C Gamepad, "standard"), by name.
export const PAD = {
  a: 0,
  b: 1,
  x: 2,
  y: 3,
  lb: 4,
  rb: 5,
  lt: 6,
  rt: 7,
  select: 8,
  start: 9,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
} as const;
export type PadButton = keyof typeof PAD;

export type PadEvent =
  | { k: 'down' | 'up'; b: PadButton }
  // A direction, from the D-pad or the stick, the first time and then on repeat.
  | { k: 'move'; dir: Dir; stick: boolean }
  // Which way the stick leans across, when that changes: a scene walks by it.
  | { k: 'lean'; x: -1 | 0 | 1 };

// A held direction repeats after a beat, then quicker, in seconds.
const REPEAT = { first: 0.4, then: 0.13 };
// How far the stick must lean before it counts, and how far back it must come to let go:
// the gap keeps a stick resting near the line from flickering.
const LEAN = { on: 0.5, off: 0.35 };
// A trigger is analogue; past half is a press.
const PRESSED = 0.5;

const DIR_BUTTONS: [PadButton, Dir][] = [
  ['up', 'up'],
  ['down', 'down'],
  ['left', 'left'],
  ['right', 'right'],
];

export class Pad {
  private was = new Set<PadButton>();
  private held: { dir: Dir; stick: boolean; next: number } | null = null;
  private lx: -1 | 0 | 1 = 0;
  private ly: -1 | 0 | 1 = 0;

  // The first standard controller plugged in, or the first of any.
  private static read(): Gamepad | null {
    const all = (typeof navigator !== 'undefined' && navigator.getGamepads?.()) || [];
    const live = [...all].filter((g): g is Gamepad => !!g && g.connected);
    return live.find((g) => g.mapping === 'standard') ?? live[0] ?? null;
  }

  // What happened since the last frame; `now` in seconds.
  poll(now: number): PadEvent[] {
    const gp = Pad.read();
    const out: PadEvent[] = [];
    if (!gp) {
      for (const b of this.was) out.push({ k: 'up', b });
      this.was.clear();
      this.held = null;
      if (this.lx) out.push({ k: 'lean', x: 0 });
      this.lx = this.ly = 0;
      return out;
    }
    const is = new Set<PadButton>();
    for (const [name, i] of Object.entries(PAD) as [PadButton, number][]) {
      const b = gp.buttons[i];
      if (b && (b.pressed || b.value > PRESSED)) is.add(name);
    }
    for (const b of is) if (!this.was.has(b)) out.push({ k: 'down', b });
    for (const b of this.was) if (!is.has(b)) out.push({ k: 'up', b });
    this.was = is;

    const lean = (v: number, was: -1 | 0 | 1): -1 | 0 | 1 =>
      Math.abs(v) >= LEAN.on ? (v < 0 ? -1 : 1) : Math.abs(v) < LEAN.off ? 0 : was;
    const lx = lean(gp.axes[0] ?? 0, this.lx);
    const ly = lean(gp.axes[1] ?? 0, this.ly);
    if (lx !== this.lx) out.push({ k: 'lean', x: lx });
    this.lx = lx;
    this.ly = ly;

    // One direction at a time: the D-pad first, then the stick's stronger lean.
    const pad = DIR_BUTTONS.find(([b]) => is.has(b))?.[1];
    const stick: Dir | undefined =
      Math.abs(gp.axes[1] ?? 0) > Math.abs(gp.axes[0] ?? 0)
        ? ly < 0
          ? 'up'
          : ly > 0
            ? 'down'
            : undefined
        : lx < 0
          ? 'left'
          : lx > 0
            ? 'right'
            : undefined;
    const dir = pad ?? stick;
    if (!dir) this.held = null;
    else if (!this.held || this.held.dir !== dir) {
      this.held = { dir, stick: !pad, next: now + REPEAT.first };
      out.push({ k: 'move', dir, stick: !pad });
    } else if (now >= this.held.next) {
      this.held.next = now + REPEAT.then;
      out.push({ k: 'move', dir, stick: this.held.stick });
    }
    return out;
  }
}
