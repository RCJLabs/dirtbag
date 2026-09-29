// The installable shell, made at build time: the web manifest, its icons, and a service
// worker that precaches exactly what this build emitted.
//
// The icons are drawn here, in code, like the rest of the rebuild's art: the favicon's
// scene (a granite ridge at sunset, the ground, the van) rasterised with 4x4 supersampling
// and written as PNG with node:zlib. Nothing binary is committed.
//
// The manifest keeps the live site's id, scope and icon paths, so when the rebuild replaces
// v0.956 (R3) an installed copy updates in place instead of becoming a second app.

import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import type { Plugin } from 'vite';

// ---- the icon ----

type RGBA = [number, number, number, number];
const hex = (h: string, a = 255): RGBA => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
};

// Signed distance to a rounded box (negative inside), in the icon's 64-unit space.
function box(x: number, y: number, bx: number, by: number, w: number, h: number, r: number): number {
  const qx = Math.abs(x - (bx + w / 2)) - (w / 2 - r);
  const qy = Math.abs(y - (by + h / 2)) - (h / 2 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function inPoly(x: number, y: number, pts: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!;
    const [xj, yj] = pts[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const RIDGE: [number, number][] = [
  [-2, 50],
  [20, 20],
  [30, 32],
  [42, 12],
  [66, 50],
];
const SHADE: [number, number][] = [
  [42, 12],
  [66, 50],
  [48, 50],
];

// The colour at a point of the favicon's scene, or null outside the icon.
function scene(x: number, y: number, maskable: boolean): RGBA | null {
  if (!maskable && box(x, y, 0, 0, 64, 64, 10) > 0) return null;
  // A maskable icon keeps its content inside the middle 80%: scale the scene into it.
  if (maskable) {
    x = 32 + (x - 32) / 0.8;
    y = 32 + (y - 32) / 0.8;
  }
  if (Math.hypot(x - 17, y - 52) <= 3.5 || Math.hypot(x - 33, y - 52) <= 3.5) return hex('#1B1B1F');
  const van = box(x, y, 10, 38, 30, 13, 4);
  if (Math.abs(van) <= 1.25) return hex('#1B1B1F');
  if (van < 0) return x >= 11 && x <= 39 && y >= 45 && y <= 48 ? hex('#4F9A9E') : hex('#FFFDF5');
  if (y >= 48) return hex('#6B5A48');
  if (inPoly(x, y, SHADE)) return hex('#4E4F58');
  if (inPoly(x, y, RIDGE)) return hex('#8F939D');
  return hex('#EFA46C');
}

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

export function iconPng(size: number, maskable = false): Buffer {
  const SS = 4;
  const rows: Buffer[] = [];
  for (let py = 0; py < size; py++) {
    const row = Buffer.alloc(1 + size * 4);
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const c = scene(
            ((px + (sx + 0.5) / SS) / size) * 64,
            ((py + (sy + 0.5) / SS) / size) * 64,
            maskable,
          );
          if (!c) continue;
          r += c[0] * c[3];
          g += c[1] * c[3];
          b += c[2] * c[3];
          a += c[3];
        }
      const o = 1 + px * 4;
      row[o] = a ? Math.round(r / a) : 0;
      row[o + 1] = a ? Math.round(g / a) : 0;
      row[o + 2] = a ? Math.round(b / a) : 0;
      row[o + 3] = Math.round(a / (SS * SS));
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', new Uint8Array()),
  ]);
}

// Browsers still ask for /favicon.ico wherever a page doesn't say otherwise (bookmarks, the
// tab strip on some); an ICO holding one PNG is enough for all of them.
export function ico(png: Buffer): Buffer {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); // reserved
  head.writeUInt16LE(1, 2); // an icon
  head.writeUInt16LE(1, 4); // one image
  head[6] = 32; // width
  head[7] = 32; // height
  head.writeUInt16LE(1, 10); // colour planes
  head.writeUInt16LE(32, 12); // bits per pixel
  head.writeUInt32LE(png.length, 14);
  head.writeUInt32LE(22, 18); // where the PNG starts
  return Buffer.concat([head, png]);
}

// ---- the manifest ----

const ICONS = [
  { src: 'icons/icon-192.png', size: 192, purpose: 'any' },
  { src: 'icons/icon-512.png', size: 512, purpose: 'any' },
  { src: 'icons/icon-192-maskable.png', size: 192, purpose: 'maskable' },
  { src: 'icons/icon-512-maskable.png', size: 512, purpose: 'maskable' },
] as const;

const MANIFEST = {
  name: 'Dirtbag',
  short_name: 'Dirtbag',
  description:
    'A climbing life-sim. Live out of your van, work shifts, and push your grade from gym plastic to the crag.',
  id: '/',
  start_url: './index.html',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#15161a',
  theme_color: '#15161a',
  categories: ['games', 'entertainment'],
  icons: ICONS.map((i) => ({
    src: i.src,
    sizes: `${i.size}x${i.size}`,
    type: 'image/png',
    purpose: i.purpose,
  })),
};

// ---- the service worker ----

// Cache-first for this build's files; a navigation offline gets the cached page. Caches
// from other rebuild builds go when this one activates, and so does v0.956's ("dirtbag-v…",
// about 10 MB), which R3 retired.
//
// It ships as service-worker.js, the name v0.956's worker had, so a browser that installed
// v0.956 finds new bytes at the URL it already checks and swaps workers in place: the next
// launch is the rebuild. Nothing reloads a page that's open; an old session plays out.
const worker = (
  cache: string,
  files: string[],
) => `// Generated by the build (build/pwa.ts). Precaches this build and serves it offline.
const CACHE = ${JSON.stringify(cache)};
const FILES = ${JSON.stringify(files, null, 2)};

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => (k.startsWith('dirtbag-app-') && k !== CACHE) || /^dirtbag-v\\d+$/.test(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches
      .match(req, { ignoreSearch: true })
      .then(
        (hit) =>
          hit ||
          fetch(req).catch(() =>
            req.mode === 'navigate' ? caches.match('./index.html') : Response.error(),
          ),
      ),
  );
});
`;

export function pwa(): Plugin {
  return {
    name: 'dirtbag-pwa',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const extra = new Map<string, string | Buffer>([
        ['manifest.webmanifest', `${JSON.stringify(MANIFEST, null, 2)}\n`],
        ['favicon.ico', ico(iconPng(32))],
        ...ICONS.map((i): [string, Buffer] => [i.src, iconPng(i.size, i.purpose === 'maskable')]),
      ]);
      for (const [fileName, source] of extra) this.emitFile({ type: 'asset', fileName, source });
      // Everything this build emitted, plus the public files Vite copies alongside. WOFF
      // fallbacks are left out: every browser with a service worker takes WOFF2.
      const names = [...Object.keys(bundle), ...extra.keys(), 'favicon.svg']
        .filter((n, i, all) => all.indexOf(n) === i && !n.endsWith('.map') && !n.endsWith('.woff'))
        .sort();
      const h = createHash('sha256');
      for (const n of names) {
        h.update(n);
        const f = bundle[n];
        const x = extra.get(n);
        if (x !== undefined) h.update(x);
        else if (f?.type === 'asset')
          h.update(typeof f.source === 'string' ? f.source : Buffer.from(f.source));
        else if (f?.type === 'chunk') h.update(f.code);
      }
      const files = ['./', ...names.map((n) => `./${n}`)];
      this.emitFile({
        type: 'asset',
        fileName: 'service-worker.js',
        source: worker(`dirtbag-app-${h.digest('hex').slice(0, 10)}`, files),
      });
    },
  };
}
