// Send City, in the poster style: flat shapes, no outlines. Two paintings: the side-view
// scene you walk around in (the desk, the wall, the mats) and the face-on wall you look up
// at when you pick a problem. The six problems keep their places and tape colours from week
// to week; what changes with the set is the names and the moves, which live in the sim.

import { BOARD_WEEKS, TEXT_VALUES } from '../../sim';
import { lin, mk, poly, rad, rr, spline, type G, type Pt } from '../kit/geom';
import { mulberry32 } from '../kit/noise';
import { BOARD_X0, BOARD_X1, DESK_X, GND, GYM_W, H, PROBLEM_X, W } from '../layout';
import { label } from './fx';
import { FEET, FLOOR_Y, FT, REACH } from './scale';

// Tape colours, V0 to V5, as most gyms run them.
export const TAPE = ['#E8C547', '#5AA469', '#3F7FB0', '#D8553F', '#8A5AA8', '#2B2A33'];
const PLY = '#D9BC90';
const PLY_DARK = '#C9A777';
const PLY_LIGHT = '#E4CBA2';
const STEEL = '#3A3E48';
const MAT = '#3E6FA3';
const WALL_X0 = 326;
const WALL_X1 = 930;
// A bouldering wall stands about 16 ft: the scene's people are 12 px to the foot.
const WALL_TOP = GND - 196;

// A climbing hold: a lumpy blob, seeded so each one keeps its shape.
export function hold(g: G, x: number, y: number, s: number, seed: number): void {
  const r = mulberry32(seed);
  const n = 7;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = s * (0.7 + r() * 0.5);
    pts.push([x + Math.cos(a) * k * 1.25, y + Math.sin(a) * k]);
  }
  g.beginPath();
  g.moveTo((pts[0]![0] + pts[n - 1]![0]) / 2, (pts[0]![1] + pts[n - 1]![1]) / 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % n]!;
    g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  g.closePath();
}

// A problem's holds, bottom to top, as a zigzag up its slot.
function holdsFor(slot: number, x: number, y0: number, y1: number): { at: Pt; s: number }[] {
  const r = mulberry32(900 + slot * 17);
  const n = 8;
  const out: { at: Pt; s: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const side = i % 2 ? 1 : -1;
    out.push({ at: [x + side * (8 + r() * 14), y0 + (y1 - y0) * t], s: 4.5 + r() * 3.5 - t * 1.2 });
  }
  return out;
}

// ---- the scene: a sky layer (the building's back wall) and the room ----

export function paintGymBack(): HTMLCanvasElement {
  const [c, g] = mk(W, H, 2);
  g.fillStyle = '#E6DCC7';
  g.fillRect(0, 0, W, H);
  g.fillStyle = STEEL;
  g.fillRect(0, 0, W, 132);
  // Roof trusses.
  g.strokeStyle = '#50555F';
  g.lineWidth = 3;
  for (let x = -40; x < W + 40; x += 60) {
    g.beginPath();
    g.moveTo(x, 132);
    g.lineTo(x + 30, 40);
    g.lineTo(x + 60, 132);
    g.stroke();
  }
  g.fillStyle = '#2E323B';
  g.fillRect(0, 124, W, 10);
  // High windows, then the lamps.
  g.fillStyle = '#BFD6DF';
  for (let x = 14; x < W; x += 86) g.fillRect(x, 150, 64, 34);
  g.fillStyle = '#E6DCC7';
  for (let x = 14; x < W; x += 86) g.fillRect(x + 30, 150, 4, 34);
  for (const x of [60, 180, 300]) {
    g.strokeStyle = '#2B2A33';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 96);
    g.stroke();
    g.fillStyle = rad(g, x, 110, 4, 120, [
      [0, 'rgba(255,236,190,.55)'],
      [1, 'rgba(255,236,190,0)'],
    ]);
    g.fillRect(x - 130, 90, 260, 220);
    g.fillStyle = '#2B2A33';
    g.beginPath();
    g.moveTo(x - 6, 96);
    g.lineTo(x + 6, 96);
    g.lineTo(x + 14, 110);
    g.lineTo(x - 14, 110);
    g.closePath();
    g.fill();
    g.fillStyle = '#FFE7B0';
    g.fillRect(x - 12, 109, 24, 3);
  }
  return c;
}

function tnuts(g: G, x0: number, x1: number, y0: number, y1: number): void {
  g.fillStyle = 'rgba(60,44,28,.28)';
  for (let y = y0 + 9; y < y1; y += 17) for (let x = x0 + 9; x < x1; x += 17) g.fillRect(x, y, 1.6, 1.6);
}

export function paintGymGround(): HTMLCanvasElement {
  const [c, g] = mk(GYM_W, H, 2);
  // Floor: concrete by the door, rubber under the wall.
  g.fillStyle = '#8C8A84';
  g.fillRect(-10, GND - 6, GYM_W + 20, H);
  g.fillStyle = '#7C7A74';
  g.fillRect(-10, GND + 30, GYM_W + 20, H);

  // The sign, the hangboard and the door on the back wall.
  label(g, 'poster', 'SEND CITY', 186, 262, { size: 46, color: '#D8553F', halo: '#E6DCC7' });
  label(g, 'poster', 'BOULDERING · EST. 2009', 186, 284, { size: 12, color: '#5E5A52', halo: '#E6DCC7' });
  g.fillStyle = '#8C5A3A';
  rr(g, 238, 322, 64, 16, 3);
  g.fill();
  g.fillStyle = '#6E4630';
  for (let k = 0; k < 4; k++) g.fillRect(244 + k * 15, 326, 9, 4);
  g.fillStyle = '#6B7480';
  g.fillRect(14, GND - 124, 52, 124);
  g.fillStyle = '#BFD6DF';
  g.fillRect(24, GND - 112, 32, 40);
  g.fillStyle = '#B23A2C';
  g.fillRect(22, GND - 146, 36, 14);
  label(g, 'poster', 'EXIT', 40, GND - 135, { size: 10, color: '#FFFFFF', halo: '#B23A2C' });

  // The desk: counter, till, the pass sign hung above it.
  const dx = DESK_X;
  g.fillStyle = '#8C5A3A';
  g.fillRect(dx - 52, GND - 46, 104, 46);
  g.fillStyle = '#E9DCC2';
  g.fillRect(dx - 56, GND - 50, 112, 7);
  g.fillStyle = '#6E4630';
  for (let x = dx - 44; x < dx + 44; x += 22) g.fillRect(x, GND - 38, 14, 30);
  g.fillStyle = '#2B2A33';
  rr(g, dx + 14, GND - 66, 24, 16, 2);
  g.fill();
  g.fillStyle = '#9FD3FF';
  g.fillRect(dx + 17, GND - 63, 18, 8);
  g.fillStyle = '#F4F1EA';
  rr(g, dx - 40, GND - 60, 22, 10, 2);
  g.fill();
  g.strokeStyle = '#2B2A33';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(dx - 30, GND - 190);
  g.lineTo(dx - 30, GND - 150);
  g.moveTo(dx + 30, GND - 190);
  g.lineTo(dx + 30, GND - 150);
  g.stroke();
  g.fillStyle = '#FFFDF5';
  g.fillRect(dx - 48, GND - 150, 96, 34);
  label(g, 'poster', `DAY PASS ${TEXT_VALUES.pass}`, dx, GND - 127, {
    size: 15,
    color: '#1E2B2B',
    halo: '#FFFDF5',
  });

  // A bench and a chalk bucket.
  g.fillStyle = '#6E4630';
  g.fillRect(250, GND - 18, 60, 5);
  g.fillRect(256, GND - 13, 4, 13);
  g.fillRect(300, GND - 13, 4, 13);
  g.fillStyle = '#F4F1EA';
  rr(g, 270, GND - 30, 14, 12, 2);
  g.fill();

  // The wall: plywood in three angles (lighter slab, plain vertical, darker overhang).
  const sections: [number, number, string][] = [
    [WALL_X0, 510, PLY_LIGHT],
    [510, 700, PLY],
    [700, WALL_X1, PLY_DARK],
  ];
  for (const [x0, x1, col] of sections) {
    g.fillStyle = col;
    g.fillRect(x0, WALL_TOP, x1 - x0, GND - WALL_TOP);
    tnuts(g, x0, x1, WALL_TOP, GND);
  }
  g.strokeStyle = 'rgba(80,58,36,.35)';
  g.lineWidth = 1.2;
  for (let x = WALL_X0 + 100; x < WALL_X1; x += 100) {
    g.beginPath();
    g.moveTo(x, WALL_TOP);
    g.lineTo(x, GND);
    g.stroke();
  }
  for (const y of [GND - 130, GND - 64]) {
    g.beginPath();
    g.moveTo(WALL_X0, y);
    g.lineTo(WALL_X1, y);
    g.stroke();
  }
  g.fillStyle = STEEL;
  g.fillRect(WALL_X0 - 4, WALL_TOP - 10, WALL_X1 - WALL_X0 + 8, 12);

  // A scatter of old holds from other sets, then the six problems in their tape colours.
  const r = mulberry32(404);
  const old = ['#A7A39A', '#C9C3B6', '#8C8A84', '#B7A58A'];
  for (let i = 0; i < 70; i++) {
    g.fillStyle = old[i % old.length]!;
    hold(
      g,
      WALL_X0 + 10 + r() * (WALL_X1 - WALL_X0 - 20),
      WALL_TOP + 20 + r() * (GND - WALL_TOP - 50),
      3 + r() * 3,
      i,
    );
    g.fill();
  }
  PROBLEM_X.forEach((x, slot) => {
    g.fillStyle = TAPE[slot]!;
    for (const [i, h] of holdsFor(slot, x, GND - 30, WALL_TOP + 40).entries()) {
      hold(g, h.at[0], h.at[1], h.s, slot * 31 + i);
      g.fill();
    }
  });

  // Mats along the whole wall, with their seams.
  g.fillStyle = MAT;
  g.fillRect(WALL_X0 - 14, GND - 8, WALL_X1 - WALL_X0 + 28, 24);
  g.fillStyle = '#5585B8';
  g.fillRect(WALL_X0 - 14, GND - 8, WALL_X1 - WALL_X0 + 28, 4);
  g.fillStyle = 'rgba(20,30,50,.35)';
  for (let x = WALL_X0 + 106; x < WALL_X1; x += 120) g.fillRect(x, GND - 8, 2, 24);

  paintBoardInScene(g);
  return c;
}

// ---- the board ----

// Where it hangs in the room, and its lights: start, hand, foot and finish, as boards light them.
const BOARD_TOP = WALL_TOP + 20;
const KICK = 30;
const BOARD_DARK = '#34302C';
const BOARD_HOLD = '#CFC8BA';
export const LED = { start: '#36C27A', hand: '#3AA0E8', foot: '#E8C547', finish: '#C04FD1' };

// The board from across the room: a dark panel on a steel frame, wider at the top because it
// leans out over the mats, a kicker at its foot, a grid of holds and a few of them lit.
function paintBoardInScene(g: G): void {
  const x0 = BOARD_X0;
  const x1 = BOARD_X1;
  const lean = 16;
  const base = GND - KICK;
  // The frame's legs, splayed toward you.
  g.fillStyle = STEEL;
  g.beginPath();
  poly(
    g,
    [
      [x0 - lean - 6, BOARD_TOP - 6],
      [x0 - lean + 2, BOARD_TOP - 6],
      [x0 + 8, GND],
      [x0, GND],
    ],
    true,
  );
  poly(
    g,
    [
      [x1 + lean + 6, BOARD_TOP - 6],
      [x1 + lean - 2, BOARD_TOP - 6],
      [x1 - 8, GND],
      [x1, GND],
    ],
    true,
  );
  g.fill();
  g.fillRect(x0 - lean - 6, BOARD_TOP - 12, x1 - x0 + 2 * lean + 12, 8);
  // The panel and its kicker.
  g.fillStyle = BOARD_DARK;
  g.beginPath();
  poly(
    g,
    [
      [x0 - lean, BOARD_TOP],
      [x1 + lean, BOARD_TOP],
      [x1, base],
      [x0, base],
    ],
    true,
  );
  g.fill();
  g.fillStyle = '#2B2825';
  g.fillRect(x0 + 4, base, x1 - x0 - 8, KICK - 6);
  // The grid, and the lit holds of whatever problem's up.
  const rows = 9;
  const cols = 11;
  const lit = mulberry32(77);
  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    const y = BOARD_TOP + 10 + (base - BOARD_TOP - 18) * t;
    const w0 = x0 - lean + 8 + lean * t;
    const w1 = x1 + lean - 8 - lean * t;
    for (let c = 0; c < cols; c++) {
      const x = w0 + ((w1 - w0) * c) / (cols - 1);
      g.fillStyle = BOARD_HOLD;
      hold(g, x, y, 2.4, 1000 + r * cols + c);
      g.fill();
      if (lit() < 0.11) {
        const col = r === 0 ? LED.finish : r === rows - 1 ? LED.start : r > rows - 3 ? LED.foot : LED.hand;
        g.strokeStyle = col;
        g.lineWidth = 1.4;
        g.beginPath();
        g.arc(x, y, 4, 0, 6.2832);
        g.stroke();
      }
    }
  }
  label(g, 'poster', 'THE BOARD', (x0 + x1) / 2, BOARD_TOP - 38, {
    size: 17,
    color: '#2B2A33',
    halo: '#E6DCC7',
  });
  label(g, 'poster', `RESET EVERY ${BOARD_WEEKS} WEEKS`, (x0 + x1) / 2, BOARD_TOP - 22, {
    size: 9,
    color: '#5E5A52',
    halo: '#E6DCC7',
  });
  // Mats under it.
  g.fillStyle = MAT;
  g.fillRect(x0 - lean - 20, GND - 8, x1 - x0 + 2 * lean + 40, 24);
  g.fillStyle = '#5585B8';
  g.fillRect(x0 - lean - 20, GND - 8, x1 - x0 + 2 * lean + 40, 4);
}

// ---- the face-on wall ----

// The wall face-on, one problem in the middle and its neighbours either side.
const SPACING = 118;
const cx = W / 2;
const finishY = (heightFt: number) => FLOOR_Y - heightFt * FT + 26;

// Where the climber's hips go, from feet on the mats to hands on the finish hold.
export function gymTopo(slot: number, heightFt: number): Pt[] {
  const hs = holdsFor(slot, cx, FLOOR_Y - 12, finishY(heightFt));
  const y0 = FLOOR_Y - FEET;
  const y1 = finishY(heightFt) + REACH;
  const pts: Pt[] = hs.map((h, i) => [cx + (h.at[0] - cx) * 0.35, y0 + ((y1 - y0) * i) / (hs.length - 1)]);
  return spline(pts, 10);
}

const walls = new Map<number, HTMLCanvasElement>();

// ---- the board, face-on ----

// The board's grid in the close-up, and where a problem's holds sit on it: the start near the
// kicker, hands zigzagging up to the finish on the top row, and a couple of feet lit low.
const BOARD_ROWS = 12;
const BOARD_COLS = 9;
const boardTop = (heightFt: number) => finishY(heightFt) - 20;
const boardKick = FLOOR_Y - 64;
function boardCell(r: number, c: number, heightFt: number): Pt {
  const t = r / (BOARD_ROWS - 1);
  const top = boardTop(heightFt);
  // Rows near the top look wider: it leans out over you.
  const half = (W / 2 - 22) * (1.06 - 0.12 * t);
  return [W / 2 - half + (2 * half * c) / (BOARD_COLS - 1), top + (boardKick - 18 - top) * t];
}

type Lit = { at: Pt; role: keyof typeof LED };
function boardHolds(slot: number, heightFt: number): Lit[] {
  const r = mulberry32(1300 + slot * 29);
  const out: Lit[] = [];
  let c = 3 + Math.floor(r() * 3);
  out.push({ at: boardCell(BOARD_ROWS - 2, c, heightFt), role: 'start' });
  for (let row = BOARD_ROWS - 4; row > 0; row -= 2) {
    c = Math.max(1, Math.min(BOARD_COLS - 2, c + (r() < 0.5 ? -1 : 1) * (1 + Math.floor(r() * 2))));
    out.push({ at: boardCell(row, c, heightFt), role: 'hand' });
  }
  out.push({
    at: boardCell(0, Math.max(1, Math.min(BOARD_COLS - 2, c + (r() < 0.5 ? -1 : 1))), heightFt),
    role: 'finish',
  });
  for (const fc of [2 + Math.floor(r() * 2), 5 + Math.floor(r() * 2)])
    out.push({ at: boardCell(BOARD_ROWS - 1, fc, heightFt), role: 'foot' });
  return out;
}

// Where the climber's hips go on a board problem: up its lit hand holds, leaning further
// toward them than on the wall, because a board problem wanders across the whole grid.
export function boardTopo(slot: number, heightFt: number): Pt[] {
  const hs = boardHolds(slot, heightFt).filter((h) => h.role !== 'foot');
  const y0 = FLOOR_Y - FEET;
  const y1 = finishY(heightFt) + REACH;
  const pts: Pt[] = hs.map((h, i) => [cx + (h.at[0] - cx) * 0.6, y0 + ((y1 - y0) * i) / (hs.length - 1)]);
  return spline(pts, 10);
}

const boards = new Map<string, HTMLCanvasElement>();

export function boardWallArt(slot: number, heightFt: number): HTMLCanvasElement {
  const key = `${slot}:${heightFt}`;
  const hit = boards.get(key);
  if (hit) return hit;
  const [c, g] = mk(W, H, 2);
  paintBoardWall(g, slot, heightFt);
  boards.set(key, c);
  return c;
}

// A board problem face-on: the dark panel filling the view, its grid of holds, and this
// problem's holds lit in their colours.
export function paintBoardWall(g: G, slot: number, heightFt: number): void {
  const top = boardTop(heightFt) - 34;
  g.fillStyle = '#E6DCC7';
  g.fillRect(0, 0, W, H);
  g.fillStyle = STEEL;
  g.fillRect(0, 0, W, 70);
  g.fillRect(0, top - 14, W, 14);
  label(g, 'poster', 'THE BOARD', W / 2, top - 44, { size: 24, color: '#2B2A33', halo: '#E6DCC7' });
  label(g, 'poster', `RESET EVERY ${BOARD_WEEKS} WEEKS`, W / 2, top - 26, {
    size: 11,
    color: '#5E5A52',
    halo: '#E6DCC7',
  });
  g.fillStyle = BOARD_DARK;
  g.beginPath();
  poly(
    g,
    [
      [-12, top],
      [W + 12, top],
      [W - 8, boardKick],
      [8, boardKick],
    ],
    true,
  );
  g.fill();
  g.fillStyle = '#2B2825';
  g.fillRect(8, boardKick, W - 16, FLOOR_Y - boardKick);
  for (let r = 0; r < BOARD_ROWS; r++)
    for (let c = 0; c < BOARD_COLS; c++) {
      const [x, y] = boardCell(r, c, heightFt);
      g.fillStyle = BOARD_HOLD;
      hold(g, x, y, 6.2 - (r / BOARD_ROWS) * 1.4, 2000 + r * BOARD_COLS + c);
      g.fill();
    }
  for (const h of boardHolds(slot, heightFt)) {
    const col = LED[h.role];
    g.fillStyle = rad(g, h.at[0], h.at[1], 4, 22, [
      [0, `${col}88`],
      [1, `${col}00`],
    ]);
    g.fillRect(h.at[0] - 22, h.at[1] - 22, 44, 44);
    g.strokeStyle = col;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(h.at[0], h.at[1], 11, 0, 6.2832);
    g.stroke();
  }
  // Mats.
  g.fillStyle = MAT;
  g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
  g.fillStyle = '#5585B8';
  g.fillRect(0, FLOOR_Y, W, 6);
  g.fillStyle = 'rgba(20,30,50,.35)';
  for (const x of [60, 180, 300]) g.fillRect(x, FLOOR_Y, 2, H - FLOOR_Y);
}

export function gymWallArt(slot: number, heightFt: number): HTMLCanvasElement {
  const key = slot * 100 + heightFt;
  const hit = walls.get(key);
  if (hit) return hit;
  const [c, g] = mk(W, H, 2);
  paintGymWall(g, slot, heightFt);
  walls.set(key, c);
  return c;
}

// A problem's stretch of the gym wall, painted into any context (the wall view's cached art,
// or the send card at its own size).
export function paintGymWall(g: G, slot: number, heightFt: number): void {
  const top = finishY(heightFt) - 60;
  g.fillStyle = '#E6DCC7';
  g.fillRect(0, 0, W, H);
  g.fillStyle = STEEL;
  g.fillRect(0, 0, W, 70);
  g.fillStyle = lin(g, 0, top, 0, FLOOR_Y, [
    [0, PLY_DARK],
    [1, PLY],
  ]);
  g.fillRect(0, top, W, FLOOR_Y - top);
  tnuts(g, 0, W, top, FLOOR_Y);
  g.strokeStyle = 'rgba(80,58,36,.35)';
  g.lineWidth = 1.2;
  for (const x of [cx - 120, cx, cx + 120]) {
    g.beginPath();
    g.moveTo(x + 59, top);
    g.lineTo(x + 59, FLOOR_Y);
    g.stroke();
  }
  g.fillStyle = STEEL;
  g.fillRect(0, top - 10, W, 12);
  // Old holds, the neighbours faded, then this problem in full colour.
  const r = mulberry32(505 + slot);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = ['#A7A39A', '#C9C3B6', '#8C8A84'][i % 3]!;
    hold(g, r() * W, top + 16 + r() * (FLOOR_Y - top - 40), 5 + r() * 4, 700 + i);
    g.fill();
  }
  for (let k = 0; k < 6; k++) {
    const x = cx + (k - slot) * SPACING;
    if (x < -40 || x > W + 40) continue;
    g.globalAlpha = k === slot ? 1 : 0.4;
    g.fillStyle = TAPE[k]!;
    for (const [i, h] of holdsFor(k, x, FLOOR_Y - 12, finishY(heightFt)).entries()) {
      hold(g, h.at[0], h.at[1], h.s * 2.1, k * 31 + i);
      g.fill();
    }
  }
  g.globalAlpha = 1;
  // The start tape and the finish tape on this problem.
  const own = holdsFor(slot, cx, FLOOR_Y - 12, finishY(heightFt));
  g.fillStyle = TAPE[slot]!;
  for (const h of [own[0]!, own[own.length - 1]!]) g.fillRect(h.at[0] - 16, h.at[1] + 14, 32, 5);
  // Mats.
  g.fillStyle = MAT;
  g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
  g.fillStyle = '#5585B8';
  g.fillRect(0, FLOOR_Y, W, 6);
  g.fillStyle = 'rgba(20,30,50,.35)';
  for (const x of [60, 180, 300]) g.fillRect(x, FLOOR_Y, 2, H - FLOOR_Y);
}
