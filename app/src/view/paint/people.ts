// People and a dog, side-on, in the comic style: clear line, one ink weight, flat colour.
// One procedural rig with two-bone IK arms and legs, so walking, sitting, belaying and
// climbing are poses of the same figure, not drawn frames.

import { clamp, poly, shadeHex, type G, type Pt } from '../kit/geom';

export const INK = '#1B1B1F';

export interface Look {
  skin: string;
  shirt: string;
  pants: string;
  hat: string | null;
  hair: string;
  shoe: string;
  pony?: boolean;
}

export const LOOK: Record<string, Look> = {
  you: {
    skin: '#E2AE86',
    shirt: '#E9A23B',
    pants: '#3E4A5E',
    hat: '#2F6F73',
    hair: '#5A3A22',
    shoe: '#2B2A33',
  },
  hazel: {
    skin: '#8E5E40',
    shirt: '#4F7FA8',
    pants: '#6A5440',
    hat: null,
    hair: '#231913',
    shoe: '#2B2A33',
    pony: true,
  },
};

// Knee or elbow for a limb from the hip/shoulder (h) to the foot/hand (f); `bend` picks
// the side the joint folds to.
function ik2(hx: number, hy: number, fx: number, fy: number, a: number, b: number, bend: number): Pt[] {
  let dx = fx - hx;
  let dy = fy - hy;
  let d = Math.hypot(dx, dy) || 0.01;
  const m = a + b - 0.05;
  if (d > m) {
    dx *= m / d;
    dy *= m / d;
    d = m;
  }
  const ang = Math.atan2(dy, dx) + bend * Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  return [
    [hx, hy],
    [hx + Math.cos(ang) * a, hy + Math.sin(ang) * a],
    [hx + dx, hy + dy],
  ];
}

// An inked stroke: the ink underneath, a little wider, then the colour.
function limb(g: G, pts: Pt[], col: string, w: number): void {
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = INK;
  g.lineWidth = w + 2.4;
  g.beginPath();
  poly(g, pts, false);
  g.stroke();
  g.strokeStyle = col;
  g.lineWidth = w;
  g.beginPath();
  poly(g, pts, false);
  g.stroke();
}

function dot(g: G, x: number, y: number, r: number, col: string, lw = 1): void {
  g.beginPath();
  g.arc(x, y, r, 0, 6.2832);
  g.fillStyle = col;
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = lw;
  g.stroke();
}

function inkFill(g: G, draw: (g: G) => void, col: string, lw = 1.3): void {
  g.beginPath();
  draw(g);
  g.fillStyle = col;
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = lw;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.stroke();
}

function inkLine(g: G, draw: (g: G) => void, col: string, w: number): void {
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = INK;
  g.lineWidth = w + 2.2;
  g.beginPath();
  draw(g);
  g.stroke();
  g.strokeStyle = col;
  g.lineWidth = w;
  g.beginPath();
  draw(g);
  g.stroke();
}

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

export function drawPerson(
  g: G,
  L: Look,
  { x, y, dir, phase = 0, speed = 0, pose = 'stand', t = 0 }: PersonAt,
): void {
  const walk = pose === 'walk' && speed > 0.05;
  const sit = pose === 'sit' || pose === 'mug';
  const bob = walk ? Math.abs(Math.sin(phase)) * 1.6 : Math.sin(t * 1.7) * 0.5;
  const lean = walk ? 0.09 * speed : sit ? -0.06 : 0;
  const hip: Pt = [x, sit ? y - 17 : y - 31 - bob];
  const sh: Pt = [hip[0] + Math.sin(lean) * 19 * dir, hip[1] - 19];
  const head: Pt = [sh[0] + dir * 1.6, sh[1] - 10.5];
  const far = (c: string) => shadeHex(c, 0.78);

  let legs: Pt[][];
  if (sit) {
    const k: Pt = [hip[0] + dir * 15, hip[1] - 1];
    legs = [
      [hip, k, [k[0] + dir * 2, y - 1]],
      [hip, [k[0] - dir * 3, k[1] + 1], [k[0] - dir * 1, y - 1]],
    ];
  } else {
    const feet: Pt[] = walk
      ? [0, 1].map((i) => {
          const ph = phase + i * Math.PI;
          return [x + dir * Math.sin(ph) * 8.5 * speed, y - Math.max(0, Math.cos(ph)) * 4.5 * speed];
        })
      : [
          [x + dir * 3, y],
          [x - dir * 2.5, y],
        ];
    legs = feet.map((f) => ik2(hip[0], hip[1], f[0], f[1], 15.5, 15, -dir));
  }

  let hands: Pt[];
  if (pose === 'mug')
    hands = [
      [sh[0] + dir * 11, sh[1] + 9],
      [hip[0] + dir * 12, hip[1] - 2],
    ];
  else if (sit)
    hands = [
      [hip[0] + dir * 13, hip[1] - 3],
      [hip[0] + dir * 10, hip[1] - 2],
    ];
  else if (pose === 'belay')
    hands = [
      [sh[0] + dir * 11, sh[1] + 6],
      [sh[0] + dir * 5, sh[1] + 19],
    ];
  else if (walk)
    hands = [0, 1].map((i) => [
      sh[0] + dir * Math.sin(phase + Math.PI + i * Math.PI) * 7 * speed,
      sh[1] + 21.5,
    ]);
  else
    hands = [
      [sh[0] + dir * 2, sh[1] + 22],
      [sh[0] - dir * 1, sh[1] + 22],
    ];
  const arms = hands.map((h) => ik2(sh[0], sh[1], h[0], h[1], 12.5, 12, dir));

  const shoe = (f: Pt, c: string) => {
    g.beginPath();
    g.ellipse(f[0] + dir * 2.5, f[1] - 1.6, 4.6, 2.4, 0, 0, 6.2832);
    g.fillStyle = c;
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1;
    g.stroke();
  };

  // Far limbs first, a shade darker.
  limb(g, arms[1]!, far(L.skin), 3.1);
  limb(g, legs[1]!, far(L.pants), 4.4);
  shoe(legs[1]![2]!, far(L.shoe));
  limb(g, [sh, hip], L.shirt, 11);
  limb(
    g,
    [
      [hip[0], hip[1] - 2.5],
      [hip[0] + dir * 0.5, hip[1] + 1],
    ],
    L.pants,
    10,
  );
  if (L.pony)
    limb(
      g,
      [
        [head[0] - dir * 5, head[1] - 2],
        [head[0] - dir * 10, head[1] + 3],
        [head[0] - dir * 9, head[1] + 9],
      ],
      L.hair,
      3.2,
    );
  dot(g, head[0], head[1], 6.8, L.skin, 1.2);
  if (L.hat) {
    g.beginPath();
    g.arc(head[0], head[1] - 1, 7.1, Math.PI, 0);
    g.closePath();
    g.fillStyle = L.hat;
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1.1;
    g.stroke();
    g.fillStyle = L.hat;
    g.fillRect(head[0] - 7.6, head[1] - 2.2, 15.2, 2.6);
    dot(g, head[0] - dir * 1, head[1] - 8.6, 2, L.hat, 0.9);
  } else {
    g.beginPath();
    if (dir > 0) g.arc(head[0], head[1] - 0.5, 7.1, 0.62 * Math.PI, 1.85 * Math.PI, false);
    else g.arc(head[0], head[1] - 0.5, 7.1, 0.38 * Math.PI, -0.85 * Math.PI, true);
    g.closePath();
    g.fillStyle = L.hair;
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1.1;
    g.stroke();
  }
  // Eye and nose.
  g.fillStyle = INK;
  g.beginPath();
  g.arc(head[0] + dir * 3.2, head[1] + 0.2, 1.1, 0, 6.2832);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(head[0] + dir * 6.4, head[1] + 1);
  g.lineTo(head[0] + dir * 7.6, head[1] + 2.8);
  g.lineTo(head[0] + dir * 6, head[1] + 3.3);
  g.stroke();

  limb(g, legs[0]!, L.pants, 4.4);
  shoe(legs[0]![2]!, L.shoe);
  limb(g, arms[0]!, L.skin, 3.1);
  dot(g, arms[0]![2]![0], arms[0]![2]![1], 2.3, L.skin, 0.9);
  if (pose === 'mug') dot(g, hands[0]![0] + dir * 2, hands[0]![1] - 1, 2.8, '#2F5E8C', 1);
  if (pose === 'belay') {
    g.strokeStyle = '#C8553F';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(hands[0]![0], hands[0]![1]);
    g.quadraticCurveTo(
      hands[0]![0] + dir * 30,
      hands[0]![1] - 70,
      hands[0]![0] + dir * 38,
      hands[0]![1] - 190,
    );
    g.moveTo(hands[1]![0], hands[1]![1]);
    g.lineTo(hip[0] + dir * 2, hip[1] + 2);
    g.stroke();
  }
}

// Scout, asleep by the fire unless something's worth a wag.
export function drawDog(g: G, x: number, y: number, dir: number, t: number, wag: number): void {
  const col = '#C98A4B';
  const dark = '#8A5A30';
  const ta = wag > 0 ? Math.sin(t * 16) * 0.9 : Math.sin(t * 1.3) * 0.12;
  const tb: Pt = [x - dir * 18, y - 6];
  inkLine(
    g,
    (gg) => {
      gg.moveTo(tb[0], tb[1]);
      gg.quadraticCurveTo(tb[0] - dir * 8, tb[1] - 3 + ta * 5, tb[0] - dir * 14, tb[1] - 8 + ta * 9);
    },
    col,
    3.4,
  );
  inkFill(g, (gg) => gg.ellipse(x - dir * 2, y - 7, 18, 7.5, 0, 0, 6.2832), col, 1.2);
  inkFill(g, (gg) => gg.ellipse(x + dir * 15, y - 11, 7.2, 6.2, 0, 0, 6.2832), col, 1.2);
  inkFill(g, (gg) => gg.ellipse(x + dir * 21.5, y - 9, 4.6, 3.1, 0, 0, 6.2832), col, 1);
  inkFill(
    g,
    (gg) => {
      gg.moveTo(x + dir * 12, y - 16);
      gg.lineTo(x + dir * 9, y - 9);
      gg.lineTo(x + dir * 15.5, y - 12);
      gg.closePath();
    },
    dark,
    1,
  );
  dot(g, x + dir * 25.5, y - 10, 1.5, INK, 0.5);
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x + dir * 16, y - 12.5);
  g.lineTo(x + dir * 19, y - 12);
  g.stroke();
}

// Back view on the wall, origin at the harness; `a` is the stride phase (-1..1).
export function drawClimber(g: G, L: Look, x: number, y: number, a: number, falling: boolean): void {
  g.save();
  g.translate(x, y);
  const hl: Pt = falling ? [-9, -25] : [-9, -24 - 5 * a];
  const hr: Pt = falling ? [9, -25] : [8, -22 + 5 * a];
  const fl: Pt = falling ? [-6, 8] : [-8, 9 + 4 * a];
  const fr: Pt = falling ? [6, 8] : [7, 10 - 4 * a];
  const q = (sx: number, sy: number, cx: number, cy: number, ex: number, ey: number) => (gg: G) => {
    gg.moveTo(sx, sy);
    gg.quadraticCurveTo(cx, cy, ex, ey);
  };
  inkLine(g, q(-3, 0, fl[0] / 2 - 5, fl[1] / 2 - 1, fl[0], fl[1]), L.pants, 3.6);
  inkLine(g, q(3, 0, fr[0] / 2 + 5, fr[1] / 2 - 1, fr[0], fr[1]), L.pants, 3.6);
  for (const f of [fl, fr]) dot(g, f[0], f[1] + 1, 2.2, L.shoe, 0.8);
  inkLine(
    g,
    (gg) => {
      gg.moveTo(0, -2);
      gg.lineTo(0, -13);
    },
    L.shirt,
    7.4,
  );
  inkLine(g, q(-4.5, -13, hl[0] / 2 - 5, (hl[1] - 13) / 2 + 1, hl[0], hl[1]), L.skin, 2.8);
  inkLine(g, q(4.5, -13, hr[0] / 2 + 5, (hr[1] - 13) / 2 + 1, hr[0], hr[1]), L.skin, 2.8);
  for (const h of [hl, hr]) dot(g, h[0], h[1], 1.9, L.skin, 0.8);
  g.fillStyle = '#2B2A33';
  g.fillRect(-4, -3, 8, 2.6);
  dot(g, 3.8, -1.5, 2.2, '#F4F1EA', 0.8);
  dot(g, 0, -19, 4.4, L.hat || L.hair, 1.1);
  g.restore();
}
