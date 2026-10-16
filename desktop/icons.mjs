// The desktop build's icons (Phase 15.3), drawn by the game's own icon painter (app/build/pwa.ts,
// the one the site's home-screen icons come from), so the exe, the dock and Steam's shortcuts
// show the game and not Electron's. Windows takes an .ico, macOS an .icns, Linux's window a
// .png; each holds PNGs, which every current system reads. Node loads the painter's TypeScript
// as it is (Node 22's type stripping).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { iconPng } from '../app/build/pwa.ts';

// An .ico of PNGs, each its own size; 256 is written as 0, as the format has it.
function ico(images) {
  const head = Buffer.alloc(6 + images.length * 16);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(images.length, 4);
  let at = head.length;
  images.forEach(([size, png], i) => {
    const e = 6 + i * 16;
    head[e] = size >= 256 ? 0 : size;
    head[e + 1] = size >= 256 ? 0 : size;
    head.writeUInt16LE(1, e + 4);
    head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(png.length, e + 8);
    head.writeUInt32LE(at, e + 12);
    at += png.length;
  });
  return Buffer.concat([head, ...images.map(([, png]) => png)]);
}

// An .icns of PNGs, by the type each size goes under.
function icns(images) {
  const parts = images.map(([type, png]) => {
    const h = Buffer.alloc(8);
    h.write(type, 0, 'latin1');
    h.writeUInt32BE(png.length + 8, 4);
    return Buffer.concat([h, png]);
  });
  const h = Buffer.alloc(8);
  h.write('icns', 0, 'latin1');
  h.writeUInt32BE(8 + parts.reduce((n, p) => n + p.length, 0), 4);
  return Buffer.concat([h, ...parts]);
}

// Draws the three into `dir`, as dirtbag.ico, dirtbag.icns and dirtbag.png; their stem.
export function drawIcons(dir) {
  mkdirSync(dir, { recursive: true });
  const png = new Map([16, 32, 48, 128, 256, 512, 1024].map((s) => [s, iconPng(s)]));
  writeFileSync(join(dir, 'dirtbag.ico'), ico([16, 32, 48, 256].map((s) => [s, png.get(s)])));
  writeFileSync(
    join(dir, 'dirtbag.icns'),
    icns([
      ['ic07', png.get(128)],
      ['ic08', png.get(256)],
      ['ic09', png.get(512)],
      ['ic10', png.get(1024)],
    ]),
  );
  writeFileSync(join(dir, 'dirtbag.png'), png.get(512));
  return join(dir, 'dirtbag');
}
