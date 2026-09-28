// The valley map in the park-poster style: flat elevation bands, hillshade, lollipop
// forests, cream roads with dark edges, town blocks. Painted once; pins go on top live.

import { mk, rgb, trace, type G } from '../kit/geom';
import { fbm, grain, mulberry32 } from '../kit/noise';
import { H, W } from '../layout';
import { lpTree } from '../shapes';
import { BLOCKS, CREEK, hAt, LOT_RECT, rasterMap, RIVER, ROAD, SPUR, TRAILS } from '../valley';

const PO = {
  bands: ['#D9C98D', '#BCC287', '#91AE7D', '#6F9273', '#8D8A7B', '#B3AEA3'],
  water: '#4E87A8',
  road: '#F5E6C4',
  edge: '#2F2A26',
  tree: '#2C4A3B',
  treeLit: '#46684F',
  roof: '#B4553C',
  wall: '#EFE0C2',
  ink: '#1E2B2B',
};

function houses(g: G): void {
  for (const b of BLOCKS) {
    const n = Math.max(1, Math.round(b[2] / 10));
    for (let k = 0; k < n; k++) {
      const w = b[2] / n - 2;
      const x = b[0] + k * (b[2] / n) + 1;
      const hh = b[3] * 0.6;
      const y = b[1] + b[3] - hh;
      g.fillStyle = PO.wall;
      g.fillRect(x, y, w, hh);
      g.fillStyle = PO.roof;
      g.beginPath();
      g.moveTo(x - 1, y);
      g.lineTo(x + w / 2, y - b[3] * 0.38);
      g.lineTo(x + w + 1, y);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(30,43,43,.55)';
      g.fillRect(x + w * 0.35, y + hh * 0.45, w * 0.3, hh * 0.55);
    }
  }
}

function paintMap(g: G): void {
  const bands = PO.bands.map(rgb);
  const water = rgb(PO.water);
  rasterMap(g, (_x, _y, _h, s, b, lake) => {
    if (lake) return water;
    const f = s < 0.44 ? 0.8 : s > 0.74 ? 1.08 : 1;
    return bands[b]!.map((v) => v * f);
  });
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = PO.water;
  g.lineWidth = 4.2;
  g.beginPath();
  trace(g, RIVER, false);
  g.stroke();
  g.lineWidth = 2.2;
  g.beginPath();
  trace(g, CREEK, false);
  g.stroke();
  const r = mulberry32(55);
  for (let i = 0; i < 1500; i++) {
    const x = r() * W;
    const y = 70 + r() * 620;
    const h = hAt(x, y);
    if (h < 34 || h > 98 || fbm(x * 0.03, y * 0.03, 8) < 0.5) continue;
    lpTree(g, x, y, 3 + r() * 2.2, PO.tree, PO.treeLit, 2.2);
  }
  for (const [w, col] of [
    [6, PO.edge],
    [3.6, PO.road],
  ] as const)
    for (const rd of [ROAD, SPUR]) {
      g.strokeStyle = col;
      g.lineWidth = w;
      g.beginPath();
      trace(g, rd, false);
      g.stroke();
    }
  g.setLineDash([2.5, 3]);
  g.strokeStyle = PO.edge;
  g.lineWidth = 1.3;
  for (const t of TRAILS) {
    g.beginPath();
    trace(g, t, false);
    g.stroke();
  }
  g.setLineDash([]);
  houses(g);
  g.fillStyle = '#CDBB94';
  g.fillRect(...LOT_RECT);
  g.fillStyle = PO.ink;
  for (const [x, y] of [
    [248, 604],
    [258, 607],
    [268, 603],
  ] as const)
    g.fillRect(x, y, 7, 4);
  grain(g, 63, 0.05);
}

let cached: HTMLCanvasElement | null = null;

// The painted map, made on first use. It's the one slow painting (the terrain is shaded
// per pixel), so the game warms it up while you're still in the Lot.
export function mapArt(): HTMLCanvasElement {
  if (!cached) {
    const [c, g] = mk(W, H, 2);
    paintMap(g);
    cached = c;
  }
  return cached;
}
