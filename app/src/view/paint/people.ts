// People and a dog in the comic style: clear line, one ink weight, flat colour.
//
// A body is built from filled shapes, not stroked lines, and each body mass is inked as a
// unit: every shape in a group is stroked in ink first and filled after, so the group gets
// one outline and no seams where its parts meet (thigh into hip, neck into head). Groups
// go back to front, so a near arm keeps its own outline against the chest.
//
// One procedural rig with two-bone IK arms and legs: walking, sitting, belaying and
// climbing are poses of the same figure rather than drawn frames.

import { lerp, shadeHex, trace, type G, type Pt } from '../kit/geom';

export const INK = '#1B1B1F';
// Outline width, in logical pixels outside each shape.
const LW = 1.05;
const TAU = Math.PI * 2;

export interface Look {
  skin: string;
  shirt: string;
  pants: string;
  shoe: string;
  hair: string;
  // A slouch beanie, or bare-headed.
  hat: string | null;
  // A tee, a long-sleeve, or a tank top.
  sleeve: 'short' | 'long' | 'none';
  pony?: boolean;
  // Hair tie.
  tie?: string;
}

// Strangers at the base of a crag (Phase 21.6's crowds): nobody you know, dressed for it.
export const STRANGERS: Look[] = [
  {
    skin: '#C98E6B',
    shirt: '#7A8B4E',
    pants: '#5B5048',
    shoe: '#2B2A33',
    hair: '#2E2320',
    hat: null,
    sleeve: 'long',
  },
  {
    skin: '#F0C8A4',
    shirt: '#B8483A',
    pants: '#39424F',
    shoe: '#2B2A33',
    hair: '#C79A55',
    hat: null,
    sleeve: 'none',
    pony: true,
    tie: '#2B2A33',
  },
  {
    skin: '#6E4630',
    shirt: '#E4D6B8',
    pants: '#4A5A6A',
    shoe: '#2B2A33',
    hair: '#1E1816',
    hat: '#8A4B7A',
    sleeve: 'short',
  },
  {
    skin: '#D9A07A',
    shirt: '#3F6F8F',
    pants: '#6B5B3E',
    shoe: '#2B2A33',
    hair: '#6A4A2E',
    hat: null,
    sleeve: 'short',
  },
  {
    skin: '#A8704E',
    shirt: '#D98A3A',
    pants: '#2F3440',
    shoe: '#2B2A33',
    hair: '#2A201C',
    hat: '#3E5A3A',
    sleeve: 'long',
  },
];

export const LOOK: Record<string, Look> = {
  you: {
    skin: '#E2AE86',
    shirt: '#E9A23B',
    pants: '#3E4A5E',
    shoe: '#2B2A33',
    hair: '#5A3A22',
    hat: '#2F6F73',
    sleeve: 'short',
  },
  hazel: {
    skin: '#8E5E40',
    shirt: '#4F7FA8',
    pants: '#6A5440',
    shoe: '#2B2A33',
    hair: '#231913',
    hat: null,
    sleeve: 'long',
    pony: true,
    tie: '#B23A2C',
  },
  // Dex: power, and he knows it. Charcoal tank, oxblood pants, a buzz cut.
  dex: {
    skin: '#D39B72',
    shirt: '#34343C',
    pants: '#7A2F2A',
    shoe: '#1F1F24',
    hair: '#1E1612',
    hat: null,
    sleeve: 'none',
  },
  // Wren, on the bar at the coffee shop: the teal apron, sleeves pushed up, hair tied back.
  wren: {
    skin: '#B77E5A',
    shirt: '#2F6F73',
    pants: '#3A3440',
    shoe: '#2B2A33',
    hair: '#2B1D16',
    hat: null,
    sleeve: 'long',
    pony: true,
    tie: '#E9A23B',
  },
  // Otis, at the diner with the paper: a flannel shirt and grey hair.
  otis: {
    skin: '#E0B08F',
    shirt: '#8A4B3C',
    pants: '#4B4F5E',
    shoe: '#2B2A33',
    hair: '#C9C4BA',
    hat: null,
    sleeve: 'long',
  },
  // Sage: technical, patient, reads everything first. Green tee, plum pants, copper hair.
  sage: {
    skin: '#C98E6B',
    shirt: '#6E9F62',
    pants: '#4A4456',
    shoe: '#3A3440',
    hair: '#B8733A',
    hat: null,
    sleeve: 'short',
  },
};

const SOLE = '#E6DFD0';
const dark = (c: string) => shadeHex(c, 0.8);

// ---- shapes ----

type Piece = { p: Path2D; fill: string } | { p: Path2D; line: number; col: string };

// Inks a group as one silhouette: all outlines first, then all fills over them.
function inked(g: G, pieces: Piece[]): void {
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.strokeStyle = INK;
  for (const q of pieces) {
    g.lineWidth = ('line' in q ? q.line : 0) + 2 * LW;
    g.stroke(q.p);
  }
  for (const q of pieces) {
    if ('line' in q) {
      g.strokeStyle = q.col;
      g.lineWidth = q.line;
      g.stroke(q.p);
    } else {
      g.fillStyle = q.fill;
      g.fill(q.p);
    }
  }
  g.restore();
}

// A plain line on top: hems, cuffs, faces.
function ink(g: G, pts: Pt[], w = 0.9, col = INK): void {
  g.save();
  g.strokeStyle = col;
  g.lineWidth = w;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i]![0], pts[i]![1]);
  g.stroke();
  g.restore();
}

// Circles at a and b joined by their outer tangents: a limb that tapers.
function capsule(a: Pt, ra: number, b: Pt, rb: number): Path2D {
  const p = new Path2D();
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy);
  if (d <= Math.abs(ra - rb) + 0.01) {
    const [c, r] = ra > rb ? [a, ra] : [b, rb];
    p.arc(c[0], c[1], r, 0, TAU);
    return p;
  }
  const th = Math.atan2(dy, dx);
  const ph = Math.acos((ra - rb) / d);
  p.moveTo(a[0] + ra * Math.cos(th + ph), a[1] + ra * Math.sin(th + ph));
  p.lineTo(b[0] + rb * Math.cos(th + ph), b[1] + rb * Math.sin(th + ph));
  p.arc(b[0], b[1], rb, th + ph, th - ph, true);
  p.lineTo(a[0] + ra * Math.cos(th - ph), a[1] + ra * Math.sin(th - ph));
  p.arc(a[0], a[1], ra, th - ph, th + ph, true);
  p.closePath();
  return p;
}

// A tube with a round start and a flat end: a trouser leg or a sleeve with a hem. Returns
// the path and the hem's two corners, so the hem can be inked where it crosses a shoe or
// a wrist.
function tube(a: Pt, ra: number, b: Pt, rb: number): { p: Path2D; hem: [Pt, Pt] } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d;
  const ny = dx / d;
  // One contour (a half circle round the start, straight sides, a flat end), so the fill
  // never cancels itself where parts of the path overlap.
  const th = Math.atan2(ny, nx);
  const p = new Path2D();
  p.moveTo(a[0] + nx * ra, a[1] + ny * ra);
  p.lineTo(b[0] + nx * rb, b[1] + ny * rb);
  p.lineTo(b[0] - nx * rb, b[1] - ny * rb);
  p.lineTo(a[0] - nx * ra, a[1] - ny * ra);
  p.arc(a[0], a[1], ra, th + Math.PI, th, dx * ny - dy * nx > 0);
  p.closePath();
  return {
    p,
    hem: [
      [b[0] + nx * rb, b[1] + ny * rb],
      [b[0] - nx * rb, b[1] - ny * rb],
    ],
  };
}

function disc(c: Pt, r: number): Path2D {
  const p = new Path2D();
  p.arc(c[0], c[1], r, 0, TAU);
  return p;
}

function oval(c: Pt, rx: number, ry: number, rot = 0): Path2D {
  const p = new Path2D();
  p.ellipse(c[0], c[1], rx, ry, rot, 0, TAU);
  return p;
}

// A smooth closed shape through the points.
function blob(pts: Pt[]): Path2D {
  const p = new Path2D();
  trace(p, pts, true);
  return p;
}

function polygon(pts: Pt[]): Path2D {
  const p = new Path2D();
  p.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i]![0], pts[i]![1]);
  p.closePath();
  return p;
}

// Knee or elbow for a limb from h to f; `bend` picks the side the joint folds to.
function ik2(h: Pt, f: Pt, a: number, b: number, bend: number): [Pt, Pt, Pt] {
  let dx = f[0] - h[0];
  let dy = f[1] - h[1];
  let d = Math.hypot(dx, dy) || 0.01;
  const m = a + b - 0.05;
  if (d > m) {
    dx *= m / d;
    dy *= m / d;
    d = m;
  }
  const cos = Math.min(1, Math.max(-1, (a * a + d * d - b * b) / (2 * a * d)));
  const ang = Math.atan2(dy, dx) + bend * Math.acos(cos);
  return [h, [h[0] + Math.cos(ang) * a, h[1] + Math.sin(ang) * a], [h[0] + dx, h[1] + dy]];
}

const unit = (a: Pt, b: Pt): Pt => {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
};

// ---- side view ----

export type Pose = 'walk' | 'stand' | 'sit' | 'mug' | 'belay';

export interface PersonAt {
  x: number;
  y: number;
  dir: number;
  phase?: number;
  speed?: number;
  pose?: Pose;
  t?: number;
}

// A sneaker in profile. Local coords: forward, up, from the sole under the ankle; `tilt`
// turns the toe down when the foot is in the air.
function shoe(ankle: Pt, d: number, tilt: number, fill: string): { pieces: Piece[] } {
  const base: Pt = [ankle[0], ankle[1] + 2.3];
  const c = Math.cos(tilt);
  const s = Math.sin(tilt);
  const S = (fx: number, fy: number): Pt => {
    const ay = fy - 2.3;
    return [base[0] + d * (fx * c + ay * s), base[1] - (ay * c - fx * s + 2.3)];
  };
  const body = blob([
    S(-3.2, 0.5),
    S(-2, 0),
    S(6.4, 0),
    S(8.1, 0.6),
    S(8.7, 2),
    S(7.5, 3.3),
    S(3.8, 4.3),
    S(1.8, 5.8),
    S(-2.2, 6),
    S(-3.4, 3.4),
  ]);
  const sole = polygon([S(-2.8, 0.05), S(6.6, 0.05), S(7.7, 1.05), S(-3.1, 1.15)]);
  return {
    pieces: [
      { p: body, fill },
      { p: sole, fill: SOLE },
    ],
  };
}

export function drawPerson(
  g: G,
  L: Look,
  { x, y, dir, phase = 0, speed = 0, pose = 'stand', t = 0 }: PersonAt,
): void {
  const d = dir < 0 ? -1 : 1;
  const walk = pose === 'walk' && speed > 0.05;
  const sit = pose === 'sit' || pose === 'mug';
  const breathe = walk || sit ? 0 : Math.sin(t * 1.7) * 0.35;
  const bob = walk ? Math.abs(Math.sin(phase)) * 1.3 * speed : 0;
  const lean = walk ? 0.07 * speed : sit ? -0.1 : 0;

  const hip: Pt = [x, sit ? y - 14.6 : y - 30.6 - bob];
  const waist: Pt = [hip[0] + d * 0.4, hip[1] - 4.2];
  // The torso's own frame: forward and up from the waist, tilted by the lean.
  const cs = Math.cos(lean);
  const sn = Math.sin(lean);
  const T = (fx: number, fy: number): Pt => [
    waist[0] + d * (fx * cs + fy * sn),
    waist[1] - (fy * cs - fx * sn) - (fy > 2 ? breathe : 0),
  ];
  const shoulder = T(0.2, 12.4);
  const neck = T(-0.3, 15.2);
  const head: Pt = [neck[0] + d * 1.1, neck[1] - 7.4];
  const Hd = (fx: number, fy: number): Pt => [head[0] + d * fx, head[1] + fy];

  // Legs: near first. Ankles sit 2.3 above the ground; the IK folds knees forward.
  let ankles: Pt[];
  const lift = [0, 0];
  if (sit)
    ankles = [
      [hip[0] + d * 14.4, y - 2.3],
      [hip[0] + d * 12.2, y - 2.3],
    ];
  else if (walk)
    ankles = [0, 1].map((i): Pt => {
      const ph = phase + i * Math.PI;
      lift[i] = Math.max(0, Math.cos(ph)) * 4.2 * speed;
      return [x + d * Math.sin(ph) * 8.6 * speed, y - 2.3 - lift[i]!];
    });
  else
    ankles = [
      [x + d * 2, y - 2.3],
      [x - d * 1.6, y - 2.3],
    ];
  const legs = ankles.map((a) => ik2(hip, a, 14.6, 14.3, -d));

  // Hands: near first. Elbows fold back.
  let hands: Pt[];
  if (pose === 'mug') hands = [T(8.6, 9), [hip[0] + d * 10.5, hip[1] - 3.6]];
  else if (sit)
    hands = [
      [hip[0] + d * 11, hip[1] - 3.8],
      [hip[0] + d * 9, hip[1] - 3.4],
    ];
  else if (pose === 'belay') hands = [T(8.8, 18.8), T(5.4, 1.2)];
  else if (walk)
    hands = [0, 1].map((i): Pt => {
      const s = Math.sin(phase + Math.PI + i * Math.PI);
      return [shoulder[0] + d * s * 6.6 * speed, shoulder[1] + 19.2 - Math.abs(s) * 1.2];
    });
  else
    hands = [
      [shoulder[0] + d * 2.4, shoulder[1] + 19.4],
      [shoulder[0] - d * 0.9, shoulder[1] + 19.6],
    ];
  const arms = hands.map((h) => ik2(shoulder, h, 10.6, 10.2, d));

  const legGroup = (leg: [Pt, Pt, Pt], i: number, pants: string, shoeCol: string, extra: Piece[] = []) => {
    const [h, k, a] = leg;
    const cuff: Pt = [a[0], a[1] - 1.4];
    const low = tube(k, 3, cuff, 2.55);
    const tilt = walk ? (lift[i]! / 4.2) * 0.32 : 0;
    const sh = shoe(a, d, tilt, shoeCol);
    inked(g, [...sh.pieces, ...extra, { p: capsule(h, 4.1, k, 3), fill: pants }, { p: low.p, fill: pants }]);
    ink(g, low.hem, 0.9);
  };

  const armGroup = (arm: [Pt, Pt, Pt], skin: string, shirt: string, props?: () => void) => {
    const [s, e, w] = arm;
    const u = unit(e, w);
    const hand = capsule(w, 1.95, [w[0] + u[0] * 2.3, w[1] + u[1] * 2.3], 1.65);
    if (L.sleeve === 'long') {
      const up = capsule(s, 2.6, e, 2.15);
      const fore = tube(e, 2.15, w, 1.9);
      inked(g, [
        { p: hand, fill: skin },
        { p: up, fill: shirt },
        { p: fore.p, fill: shirt },
      ]);
      ink(g, fore.hem, 0.85);
    } else if (L.sleeve === 'none') {
      // Bare arms, and a power climber's shoulders.
      inked(g, [
        { p: capsule(s, 2.75, e, 2.1), fill: skin },
        { p: capsule(e, 2.1, w, 1.6), fill: skin },
        { p: hand, fill: skin },
      ]);
    } else {
      const mid = 0.55;
      const sleeveEnd: Pt = [s[0] + (e[0] - s[0]) * mid, s[1] + (e[1] - s[1]) * mid];
      const sleeve = tube(s, 3.05, sleeveEnd, 2.7);
      inked(g, [
        { p: capsule(s, 2.25, e, 1.85), fill: skin },
        { p: capsule(e, 1.85, w, 1.5), fill: skin },
        { p: hand, fill: skin },
        { p: sleeve.p, fill: shirt },
      ]);
      ink(g, sleeve.hem, 0.85);
    }
    props?.();
  };

  // Far arm and far leg, a shade darker, behind everything.
  armGroup(arms[1]!, dark(L.skin), dark(L.shirt));
  legGroup(legs[1]!, 1, dark(L.pants), dark(L.shoe));

  // Hazel's ponytail hangs behind her head and shoulders.
  if (L.pony) {
    inked(g, [
      { p: capsule(Hd(-6.4, -3.2), 2.1, Hd(-8.6, 3.4), 1.9), fill: L.hair },
      { p: capsule(Hd(-8.6, 3.4), 1.9, Hd(-8.4, 9.6), 0.8), fill: L.hair },
    ]);
  }

  // The seat of the trousers and the near leg, one garment, one outline.
  const pelvis = blob(
    [
      [-4.4, -4.8],
      [4.6, -4.8],
      [5.1, -1.4],
      [3.4, 2.5],
      [-1.2, 3.4],
      [-4.6, 1.6],
      [-4.9, -1.8],
    ].map(([fx, fy]): Pt => [hip[0] + d * fx!, hip[1] + fy!]),
  );
  legGroup(legs[0]!, 0, L.pants, L.shoe, [{ p: pelvis, fill: L.pants }]);

  // Belayers hold the rope: it runs up from the brake hand, through the device, to the
  // guide hand and on up the wall.
  if (pose === 'belay') {
    const [gh, bh] = [hands[0]!, hands[1]!];
    const dev = T(6.4, 0.6);
    g.save();
    g.strokeStyle = '#C8553F';
    g.lineWidth = 1.5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(bh[0], bh[1]);
    g.lineTo(dev[0], dev[1]);
    g.quadraticCurveTo(gh[0] - d * 1, gh[1] + 4, gh[0], gh[1]);
    g.quadraticCurveTo(gh[0] + d * 26, gh[1] - 70, gh[0] + d * 34, gh[1] - 190);
    g.stroke();
    g.restore();
  }

  // Torso: a t-shirt or a flannel, with a crew neck.
  const torso = blob([
    T(-4.8, -1.9),
    T(-5.3, 1),
    T(-5.6, 6),
    T(-5.2, 10.6),
    T(-3.8, 14.2),
    T(-1.6, 15.8),
    T(1.8, 15.6),
    T(4.4, 13.4),
    T(5.9, 9.6),
    T(5.4, 5),
    T(4.9, 1),
    T(4.8, -1.9),
  ]);
  inked(g, [{ p: torso, fill: L.shirt }]);
  ink(g, [T(-1.5, 15.1), T(0.2, 14.3), T(1.8, 14.8)], 0.8);

  // Head: neck, skull, jaw and nose as one outline; then ear, face and hair on top.
  inked(g, [
    { p: capsule(neck, 2.1, Hd(-0.5, 3.6), 2), fill: L.skin },
    { p: disc(head, 6.3), fill: L.skin },
    { p: capsule(Hd(1, 1.4), 5, Hd(3.5, 3.7), 2.3), fill: L.skin },
    { p: capsule(Hd(5.6, -0.9), 1.15, Hd(7.1, 1.3), 0.95), fill: L.skin },
  ]);
  if (L.hat) {
    // A little hair shows under the back of the beanie.
    inked(g, [
      {
        p: blob([Hd(-6.1, -0.6), Hd(-5, 3.1), Hd(-3.1, 2.4), Hd(-3.4, -0.8)]),
        fill: L.hair,
      },
    ]);
  } else {
    inked(g, [
      {
        p: blob([
          Hd(5.8, -2.9),
          Hd(6.6, -5.6),
          Hd(4.2, -8.2),
          Hd(-0.8, -8.8),
          Hd(-5.8, -6.4),
          Hd(-7.3, -1.6),
          Hd(-6.6, 2.8),
          Hd(-4.2, 4),
          Hd(-2.6, 1.6),
          Hd(-1, -1.4),
          Hd(2.2, -3),
          Hd(4.2, -3.4),
        ]),
        fill: L.hair,
      },
    ]);
  }
  // Ear.
  inked(g, [{ p: oval(Hd(-1.1, 0.7), 1.45, 1.95), fill: L.skin }]);
  {
    const c = Hd(-1.1, 0.7);
    g.save();
    g.strokeStyle = INK;
    g.lineWidth = 0.6;
    g.lineCap = 'round';
    g.beginPath();
    if (d > 0) g.arc(c[0] - 0.2, c[1], 0.9, -0.45 * Math.PI, 0.45 * Math.PI);
    else g.arc(c[0] + 0.2, c[1], 0.9, 0.55 * Math.PI, 1.45 * Math.PI);
    g.stroke();
    g.restore();
  }
  // Eye, brow, mouth.
  g.fillStyle = INK;
  g.fill(oval(Hd(3.9, -0.2), 0.72, 1.02));
  if (!L.hat) ink(g, [Hd(2.6, -2.9), Hd(4.9, -2.6)], 0.9);
  ink(g, [Hd(4.7, 3.4), Hd(5.7, 3.2)], 0.8);
  if (L.pony && L.tie) inked(g, [{ p: capsule(Hd(-6.3, -2.6), 0.7, Hd(-7.6, -0.9), 0.7), fill: L.tie }]);
  if (L.hat) beanie(g, Hd, L.hat);

  // Near arm, and whatever it's holding.
  armGroup(arms[0]!, L.skin, L.shirt, () => {
    if (pose !== 'mug') return;
    const h = hands[0]!;
    const m = (fx: number, fy: number): Pt => [h[0] + d * fx, h[1] + fy];
    inked(g, [
      { p: blob([m(-0.2, -4.4), m(4.2, -4.4), m(4, 1.4), m(0, 1.4)]), fill: '#2F5E8C' },
      { p: capsule(m(-1.5, -2.6), 1.3, m(-1.5, -0.4), 1.3), fill: '#2F5E8C' },
    ]);
  });
}

// A slouch beanie: a knit dome whose top sags to the back, with a folded cuff.
function beanie(g: G, Hd: (fx: number, fy: number) => Pt, col: string): void {
  const hat = blob([
    Hd(6.2, -2.3),
    Hd(6.9, -4.8),
    Hd(4.9, -8.1),
    Hd(0.4, -10),
    Hd(-5.2, -9.7),
    Hd(-9.1, -7),
    Hd(-8.9, -3.8),
    Hd(-6.7, 0.7),
  ]);
  inked(g, [{ p: hat, fill: col }]);
  // The cuff: a darker band along the bottom, ribbed, with its fold inked.
  g.save();
  g.clip(hat);
  g.fillStyle = shadeHex(col, 0.82);
  g.fill(polygon([Hd(7.4, -1.6), Hd(-7.4, 1.6), Hd(-7.9, -2.2), Hd(7.1, -5.3)]));
  g.strokeStyle = 'rgba(27,27,31,.32)';
  g.lineWidth = 0.55;
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const k = i / 5;
    const top = [lerp(6.4, -7.2, k), lerp(-5, -1.9, k)] as const;
    const bot = [lerp(6, -6.7, k), lerp(-2.3, 0.8, k)] as const;
    const a = Hd(top[0], top[1] + 0.5);
    const b = Hd(bot[0], bot[1] - 0.4);
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
  }
  g.stroke();
  g.restore();
  ink(g, [Hd(6.8, -5), Hd(0, -3.6), Hd(-7.6, -2)], 0.85);
}

// ---- Scout ----

// Asleep by the fire, eyes shut, unless something's worth a wag.
export function drawDog(g: G, x: number, y: number, dir: number, t: number, wag: number): void {
  const d = dir < 0 ? -1 : 1;
  const fur = '#C98A4B';
  const awake = wag > 0;
  const P = (fx: number, fy: number): Pt => [x + d * fx, y + fy];
  const hx = 14.5;
  const hy = awake ? -12.8 : -11.2;
  const Hd = (fx: number, fy: number): Pt => P(hx + fx, hy + fy);
  const ta = awake ? Math.sin(t * 16) * 0.9 : Math.sin(t * 1.3) * 0.1;
  const tail0 = P(-16.8, -7.4);
  const tail1 = P(-23.4, -9.6 + ta * 3.4);
  const tail2 = P(-28.2, -13.4 + ta * 6.2);
  inked(g, [
    { p: capsule(tail0, 2.2, tail1, 1.8), fill: fur },
    { p: capsule(tail1, 1.8, tail2, 1.2), fill: fur },
    { p: oval(P(-2, -6.6), 16.5, 6.8), fill: fur },
    { p: disc(P(-11, -7.6), 6.3), fill: fur },
    { p: disc(P(8, -7), 6), fill: fur },
    { p: capsule(P(-6.5, -2.2), 2.3, P(1, -1.9), 2), fill: fur },
    { p: capsule(P(9, -2.4), 2.3, P(19.6, -2), 2), fill: fur },
    { p: disc(Hd(0, 0), 6.2), fill: fur },
    { p: capsule(Hd(3.4, 1.8), 3.9, Hd(9.2, 2.6), 2.7), fill: fur },
  ]);
  // Collar, ear, nose, and an eye: shut while asleep.
  inked(g, [{ p: capsule(Hd(-4.6, -0.6), 1.1, Hd(-3.2, 5), 1.1), fill: '#D8553F' }]);
  // A soft ear that hangs down behind the eye.
  inked(g, [
    {
      p: blob([Hd(-2.6, -4.6), Hd(0.6, -5.4), Hd(1.2, -1.6), Hd(-0.2, 3.6), Hd(-2, 4.2), Hd(-3, 0.2)]),
      fill: '#8A5A30',
    },
  ]);
  g.fillStyle = INK;
  g.fill(oval(Hd(11.7, 1.8), 1.35, 1.1));
  if (awake) g.fill(oval(Hd(4.2, -1.2), 0.8, 1));
  else {
    const e = Hd(4.2, -1);
    g.save();
    g.strokeStyle = INK;
    g.lineWidth = 0.85;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(e[0], e[1] - 0.6, 1.3, 0.25 * Math.PI, 0.75 * Math.PI);
    g.stroke();
    g.restore();
  }
  ink(g, [Hd(8.4, 4.4), Hd(10.8, 4.1)], 0.75);
}

// ---- on the wall, from behind ----

// Back view, origin at the harness; `a` is the stride phase (-1..1).
export function drawClimber(g: G, L: Look, x: number, y: number, a: number, falling: boolean): void {
  const P = (fx: number, fy: number): Pt => [x + fx, y + fy];
  const hipL = P(-2.7, 1.3);
  const hipR = P(2.7, 1.3);
  const fl = falling ? P(-5.4, 13.4) : P(-8.6, 11.2 + 3.4 * a);
  const fr = falling ? P(5.4, 13.4) : P(8.2, 12.2 - 3.4 * a);
  const legL = ik2(hipL, fl, 7.4, 7.1, 1);
  const legR = ik2(hipR, fr, 7.4, 7.1, -1);
  const shL = P(-4.6, -11.2);
  const shR = P(4.6, -11.2);
  const hl = falling ? P(-9, -25.5) : P(-9, -24.5 - 5 * a);
  const hr = falling ? P(9, -25.5) : P(8, -22.5 + 5 * a);
  const armL = ik2(shL, hl, 6.9, 6.7, -1);
  const armR = ik2(shR, hr, 6.9, 6.7, 1);
  const chalk = shadeHex(L.skin, 1.18);

  // Legs and the seat, one outline; climbing shoes turned out.
  const legPieces = (leg: [Pt, Pt, Pt], side: number): Piece[] => {
    const [h, k, f] = leg;
    return [
      { p: capsule(f, 1.9, [f[0] + side * 0.9, f[1] + 2.7], 1.35), fill: L.shoe },
      { p: capsule(h, 2.7, k, 2.1), fill: L.pants },
      { p: capsule(k, 2.1, f, 1.75), fill: L.pants },
    ];
  };
  inked(g, [
    ...legPieces(legL, -1),
    ...legPieces(legR, 1),
    { p: blob([P(-4.6, -1.8), P(4.6, -1.8), P(4.8, 2.6), P(0, 3.8), P(-4.8, 2.6)]), fill: L.pants },
  ]);
  // Torso, back of the shirt.
  inked(g, [
    {
      p: blob([
        P(-4.1, -1.2),
        P(-4.8, -6.8),
        P(-5.4, -11.1),
        P(-3.3, -13.2),
        P(3.3, -13.2),
        P(5.4, -11.1),
        P(4.8, -6.8),
        P(4.1, -1.2),
      ]),
      fill: L.shirt,
    },
  ]);
  // Harness: waist belt and leg loops, and the chalk bag hanging at the back.
  inked(g, [{ p: blob([P(-4.7, -2.3), P(4.7, -2.3), P(4.8, -0.3), P(-4.8, -0.3)]), fill: '#2B2A33' }]);
  for (const [h, side] of [
    [hipL, -1],
    [hipR, 1],
  ] as const) {
    g.save();
    g.strokeStyle = '#2B2A33';
    g.lineWidth = 1.2;
    g.beginPath();
    g.ellipse(h[0] + side * 0.4, h[1] + 1.4, 2.9, 1.3, side * 0.5, 0, Math.PI);
    g.stroke();
    g.restore();
  }
  inked(g, [
    { p: blob([P(-2.1, -0.9), P(2.1, -0.9), P(1.8, 3.4), P(-1.8, 3.4)]), fill: '#D8553F' },
    { p: blob([P(-2.2, -1.1), P(2.2, -1.1), P(2.1, 0.1), P(-2.1, 0.1)]), fill: '#F4F1EA' },
  ]);
  // Arms reaching up, chalked hands.
  for (const arm of [armL, armR]) {
    const [s, e, w] = arm;
    const pieces: Piece[] = [
      { p: capsule(s, 1.95, e, 1.6), fill: L.sleeve === 'long' ? L.shirt : L.skin },
      { p: capsule(e, 1.6, w, 1.35), fill: L.sleeve === 'long' ? L.shirt : L.skin },
      { p: disc(w, 1.8), fill: chalk },
    ];
    if (L.sleeve === 'short') {
      const m: Pt = [lerp(s[0], e[0], 0.55), lerp(s[1], e[1], 0.55)];
      pieces.push({ p: tube(s, 2.5, m, 2.2).p, fill: L.shirt });
    }
    inked(g, pieces);
  }
  // Head from behind: ears, then hair or a beanie; a ponytail down the back.
  inked(g, [
    { p: capsule(P(0, -12.6), 1.6, P(0, -15.4), 1.7), fill: L.skin },
    { p: disc(P(-4.2, -17), 1.15), fill: L.skin },
    { p: disc(P(4.2, -17), 1.15), fill: L.skin },
    { p: disc(P(0, -17.6), 4.4), fill: L.hair },
  ]);
  if (L.hat) {
    const cap = blob([
      P(-4.8, -17.3),
      P(-4.6, -21),
      P(-1.6, -23.1),
      P(1.8, -23.1),
      P(4.7, -21),
      P(4.8, -17.3),
      P(2.2, -15.2),
      P(-2.2, -15.2),
    ]);
    inked(g, [{ p: cap, fill: L.hat }]);
    g.save();
    g.clip(cap);
    g.fillStyle = shadeHex(L.hat, 0.82);
    g.fillRect(x - 6, y - 18.4, 12, 3.4);
    g.restore();
    ink(g, [P(-4.7, -18.4), P(0, -18.8), P(4.7, -18.4)], 0.8);
  } else if (L.pony) {
    inked(g, [{ p: capsule(P(0, -16.2), 2.1, P(0.6, -10.2), 1.1), fill: L.hair }]);
    if (L.tie) inked(g, [{ p: capsule(P(-1, -15.2), 0.6, P(1.2, -15.2), 0.6), fill: L.tie }]);
  }
}

// Your belayer at the foot of the wall, from behind: feet apart, guide hand up on the rope,
// brake hand low. Returns where the rope leaves the guide hand.
export function drawBelayerBack(g: G, L: Look, x: number, y: number): Pt {
  const P = (fx: number, fy: number): Pt => [x + fx, y + fy];
  const legs: [Pt, Pt, Pt][] = [
    ik2(P(-2.4, -15), P(-4.4, -2), 7.4, 7.2, 1),
    ik2(P(2.4, -15), P(4.4, -2), 7.4, 7.2, -1),
  ];
  const pieces: Piece[] = [];
  for (const [[h, k, f], side] of [
    [legs[0]!, -1],
    [legs[1]!, 1],
  ] as const) {
    pieces.push(
      { p: capsule(f, 2, [f[0] + side * 1.2, f[1] + 1.4], 1.7), fill: L.shoe },
      { p: capsule(h, 2.7, k, 2.1), fill: L.pants },
      { p: tube(k, 2.1, [f[0], f[1] - 0.6], 1.9).p, fill: L.pants },
    );
  }
  pieces.push({
    p: blob([P(-4.5, -18.6), P(4.5, -18.6), P(4.6, -14.4), P(0, -13.4), P(-4.6, -14.4)]),
    fill: L.pants,
  });
  inked(g, pieces);
  inked(g, [
    {
      p: blob([
        P(-4.1, -16.4),
        P(-4.6, -22),
        P(-5.1, -27.2),
        P(-3, -29.4),
        P(3, -29.4),
        P(5.1, -27.2),
        P(4.6, -22),
        P(4.1, -16.4),
      ]),
      fill: L.shirt,
    },
  ]);
  inked(g, [{ p: blob([P(-4.4, -17.5), P(4.4, -17.5), P(4.5, -15.8), P(-4.5, -15.8)]), fill: '#2B2A33' }]);
  const guide = P(4.2, -37);
  const armL = ik2(P(-4.3, -27.4), P(-2.2, -17.4), 6.6, 6.4, 1);
  const armR = ik2(P(4.3, -27.4), guide, 6.6, 6.4, 1);
  for (const [s, e, w] of [armL, armR]) {
    const long = L.sleeve === 'long';
    inked(g, [
      { p: capsule(s, 1.9, e, 1.6), fill: long ? L.shirt : L.skin },
      { p: capsule(e, 1.6, w, 1.35), fill: long ? L.shirt : L.skin },
      { p: disc(w, 1.75), fill: L.skin },
    ]);
  }
  inked(g, [
    { p: capsule(P(0, -28.8), 1.6, P(0, -31.4), 1.7), fill: L.skin },
    { p: disc(P(-4, -33.6), 1.1), fill: L.skin },
    { p: disc(P(4, -33.6), 1.1), fill: L.skin },
    { p: disc(P(0, -34), 4.2), fill: L.hair },
  ]);
  if (L.pony) {
    inked(g, [{ p: capsule(P(0, -32.8), 1.9, P(0.5, -27.2), 1), fill: L.hair }]);
    if (L.tie) inked(g, [{ p: capsule(P(-0.9, -31.8), 0.55, P(1.1, -31.8), 0.55), fill: L.tie }]);
  }
  return guide;
}
