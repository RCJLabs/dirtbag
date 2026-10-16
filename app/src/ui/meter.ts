// Phase 14.6: the frame meter, for checking a Steam Deck holds 60 fps (Done-when 2). Over the
// last second: frames a second, the slowest frame, and how many ran long enough to show as a
// stutter.

// Half again a 60 Hz frame (16.7 ms): past it, a frame was missed.
export const SLOW_MS = 25;
// How often the meter's line changes: quick enough to see a stutter, slow enough to read.
const EVERY_MS = 500;

export interface FrameStats {
  fps: number;
  worst: number;
  slow: number;
}

// The gaps between frames, in milliseconds, as a second's worth.
export function frameStats(gaps: number[]): FrameStats {
  const total = gaps.reduce((a, b) => a + b, 0);
  return {
    fps: total > 0 ? Math.round((gaps.length * 1000) / total) : 0,
    worst: Math.round(Math.max(0, ...gaps)),
    slow: gaps.filter((g) => g > SLOW_MS).length,
  };
}

export const meterLine = (f: FrameStats): string => `${f.fps} fps · slowest ${f.worst} ms · ${f.slow} slow`;

// Fed each frame's time stamp; says what to show every half second, and nothing between.
export class Meter {
  private stamps: number[] = [];
  private shown = 0;

  frame(ms: number): FrameStats | null {
    this.stamps.push(ms);
    while (this.stamps.length > 2 && ms - this.stamps[0]! > 1000) this.stamps.shift();
    if (ms - this.shown < EVERY_MS || this.stamps.length < 2) return null;
    this.shown = ms;
    return frameStats(this.stamps.slice(1).map((t, i) => t - this.stamps[i]!));
  }
}
