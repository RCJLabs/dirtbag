// A Roadside boulder face-on, in the poster style: the view when you look up at a problem.
// The main wall stands behind it in the haze; pads at its foot. Each boulder's shape is
// seeded from its id, so the three look like three rocks.

import { lin, mk, spline, type G, type Pt } from '../kit/geom';
import { mulberry32 } from '../kit/noise';
import { H, W } from '../layout';
import { coniferPath, rock } from '../shapes';
import { FEET, FLOOR_Y, FT, REACH } from './scale';

const seedOf = (id: string) => [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
const lipY = (heightFt: number) => FLOOR_Y - heightFt * FT;

// The rock's outline, bottom-left round to bottom-right.
function outline(id: string, heightFt: number): Pt[] {
  const r = mulberry32(seedOf(id));
  const top = lipY(heightFt);
  const l = 26 + r() * 20;
  const rt = W - 26 - r() * 20;
  return [
    [l - 10, FLOOR_Y + 8],
    [l, FLOOR_Y - 80 - r() * 30],
    [l + 14 + r() * 16, top + 40 + r() * 20],
    [l + 70 + r() * 20, top + 4 + r() * 10],
    [W / 2 + (r() - 0.5) * 30, top - 6],
    [rt - 70 - r() * 20, top + 6 + r() * 12],
    [rt - 12 - r() * 12, top + 50 + r() * 24],
    [rt, FLOOR_Y - 60 - r() * 40],
    [rt + 10, FLOOR_Y + 8],
  ];
}

// Where the climber's hips go: feet on the pads to hands on the lip, wandering a little.
export function boulderTopo(id: string, heightFt: number): Pt[] {
  const r = mulberry32(seedOf(id) + 3);
  const y0 = FLOOR_Y - FEET;
  const y1 = lipY(heightFt) + REACH - 4;
  const n = 6;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    pts.push([W / 2 + (i === 0 || i === n - 1 ? 0 : (r() - 0.5) * 34), y0 + (y1 - y0) * t]);
  }
  return spline(pts, 10);
}

function paint(g: G, id: string, heightFt: number): void {
  const r = mulberry32(seedOf(id) + 11);
  g.fillStyle = lin(g, 0, 0, 0, 320, [
    [0, '#F2CF96'],
    [1, '#EFA46C'],
  ]);
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#FCEBC8';
  g.beginPath();
  g.arc(292, 74, 22, 0, 6.2832);
  g.fill();
  // The main wall, hazy behind.
  g.fillStyle = '#D9B8A0';
  g.beginPath();
  g.moveTo(-4, 150);
  for (let x = 0; x <= W + 8; x += 24) g.lineTo(x, 118 + Math.sin(x * 0.05 + 1) * 12 + r() * 8);
  g.lineTo(W + 4, 420);
  g.lineTo(-4, 420);
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(120,110,120,.18)';
  g.fillRect(210, 110, W, 320);
  g.fillStyle = '#B49B82';
  for (const [x, y, s] of [
    [30, 430, 1.4],
    [330, 424, 1.2],
    [110, 436, 0.9],
  ] as const) {
    g.beginPath();
    coniferPath(g, x, y, s);
    g.fill();
  }
  g.fillStyle = '#8A7865';
  g.fillRect(-4, 420, W + 8, H);
  g.fillStyle = '#6B5A48';
  g.fillRect(-4, FLOOR_Y + 10, W + 8, H);
  g.fillStyle = '#7E6A55';
  for (let i = 0; i < 16; i++) {
    g.beginPath();
    rock(g, r() * W, FLOOR_Y + 24 + r() * 150, 14 + r() * 26, 8 + r() * 10);
    g.fill();
  }

  // The boulder: lit face, shaded right side, lichen, a crack or two, chalk up the line.
  const o = outline(id, heightFt);
  const face = new Path2D();
  face.moveTo(o[0]![0], o[0]![1]);
  for (let i = 1; i < o.length - 1; i++) {
    const p = o[i]!;
    const q = o[i + 1]!;
    face.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  face.lineTo(o[o.length - 1]![0], o[o.length - 1]![1]);
  face.closePath();
  g.fillStyle = '#C3BAA9';
  g.fill(face);
  g.save();
  g.clip(face);
  g.fillStyle = '#9C968B';
  g.beginPath();
  g.moveTo(W * 0.66, 0);
  g.lineTo(W, 0);
  g.lineTo(W, H);
  g.lineTo(W * 0.58, H);
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.10)';
  g.fillRect(0, lipY(heightFt) - 20, W, 26);
  for (let i = 0; i < 26; i++) {
    g.fillStyle = r() < 0.6 ? 'rgba(156,175,122,.55)' : 'rgba(216,194,122,.5)';
    g.beginPath();
    g.ellipse(
      r() * W,
      lipY(heightFt) + r() * (FLOOR_Y - lipY(heightFt)),
      3 + r() * 7,
      2 + r() * 4,
      0,
      0,
      6.2832,
    );
    g.fill();
  }
  g.strokeStyle = 'rgba(50,48,52,.45)';
  g.lineWidth = 2;
  g.lineCap = 'round';
  for (let k = 0; k < 2; k++) {
    let x = 60 + r() * 240;
    let y = lipY(heightFt) + 30 + r() * 60;
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      x += (r() - 0.5) * 18;
      y += 16 + r() * 14;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.fillStyle = 'rgba(40,36,34,.22)';
  g.fillRect(0, FLOOR_Y - 26, W, 40);
  g.restore();

  // Chalk where the hands go.
  const topo = boulderTopo(id, heightFt);
  g.fillStyle = 'rgba(255,255,255,.55)';
  for (let i = 4; i < topo.length; i += 7) {
    const [x, y] = topo[i]!;
    for (const dx of [-22, 18]) {
      g.beginPath();
      g.ellipse(x + dx + (r() - 0.5) * 8, y - REACH + 8 + (r() - 0.5) * 10, 5, 3.5, 0, 0, 6.2832);
      g.fill();
    }
  }
  // A tuft on top.
  g.fillStyle = '#6F8A5A';
  const tx = W / 2 + 40;
  const ty = lipY(heightFt) - 2;
  for (let k = -3; k <= 3; k++) {
    g.beginPath();
    g.moveTo(tx + k * 4 - 2, ty + 4);
    g.lineTo(tx + k * 5, ty - 8 - Math.abs(3 - Math.abs(k)) * 2);
    g.lineTo(tx + k * 4 + 2, ty + 4);
    g.closePath();
    g.fill();
  }

  // Pads.
  for (const [x, w, col, top] of [
    [44, 150, '#3F7F6A', '#57977F'],
    [176, 150, '#C8553F', '#DB6E57'],
  ] as const) {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x + 8, FLOOR_Y - 2);
    g.lineTo(x + w - 8, FLOOR_Y - 2);
    g.lineTo(x + w, FLOOR_Y + 30);
    g.lineTo(x, FLOOR_Y + 30);
    g.closePath();
    g.fill();
    g.fillStyle = top;
    g.fillRect(x + 8, FLOOR_Y - 2, w - 16, 4);
  }
}

const cache = new Map<string, HTMLCanvasElement>();

export function boulderArt(id: string, heightFt: number): HTMLCanvasElement {
  let c = cache.get(id);
  if (!c) {
    const [cv, g] = mk(W, H, 2);
    paint(g, id, heightFt);
    c = cv;
    cache.set(id, c);
  }
  return c;
}
