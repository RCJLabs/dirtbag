// Phase 14.1 (Evan's call): a controller moves focus to the nearest button in the
// direction pressed, as the eye would. Pure geometry, so it can be tested without a page.

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

// How far off the line of travel counts against a candidate, per pixel of travel. Two:
// a button straight below beats one a little nearer but well off to the side, the way a
// list of rows reads.
const OFF_AXIS = 2;

// The gap between two spans on one axis: 0 when they overlap.
const gap = (a0: number, a1: number, b0: number, b1: number) =>
  Math.max(0, Math.max(a0, b0) - Math.min(a1, b1));

// The index of the box nearest `from` in `dir`, or -1 when nothing lies that way. A
// candidate must lie wholly past the middle of `from` that way, so a tall thing standing
// beside you in a scene never counts as above you, nor a row beside you as below.
export function nearest(from: Box, boxes: Box[], dir: Dir): number {
  const fx = from.x + from.w / 2;
  const fy = from.y + from.h / 2;
  let best = -1;
  let score = Infinity;
  boxes.forEach((b, i) => {
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    const across = dir === 'left' || dir === 'right';
    const past =
      dir === 'right'
        ? b.x >= fx
        : dir === 'left'
          ? b.x + b.w <= fx
          : dir === 'down'
            ? b.y >= fy
            : b.y + b.h <= fy;
    if (!past) return;
    const ahead = Math.abs(across ? bx - fx : by - fy);
    const off = across
      ? gap(from.y, from.y + from.h, b.y, b.y + b.h)
      : gap(from.x, from.x + from.w, b.x, b.x + b.w);
    // Ties go to the one most nearly in line, centre to centre.
    const drift = across ? Math.abs(by - fy) : Math.abs(bx - fx);
    const s = ahead + OFF_AXIS * off + drift / 100;
    if (s < score) {
      score = s;
      best = i;
    }
  });
  return best;
}
