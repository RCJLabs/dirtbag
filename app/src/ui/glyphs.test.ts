// Phase 14.6: every character the game's code spells out is in its fonts, or drawn by Glyph.tsx.
// Read from the fonts themselves (their character maps), so a new mark that a Deck would show
// as a box fails here rather than there.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { GLYPHS } from './marks';

const FONTS = join(__dirname, '..', '..', 'node_modules', '@fontsource');
const SRC = join(__dirname, '..');

// A WOFF's character map: every code point it has a glyph for.
function covered(file: string): Set<number> {
  const woff = readFileSync(file);
  const tables = woff.readUInt16BE(12);
  let cmap: Buffer | null = null;
  for (let i = 0; i < tables; i++) {
    const at = 44 + i * 20;
    if (woff.toString('latin1', at, at + 4) !== 'cmap') continue;
    const [offset, comp, orig] = [
      woff.readUInt32BE(at + 4),
      woff.readUInt32BE(at + 8),
      woff.readUInt32BE(at + 12),
    ];
    const raw = woff.subarray(offset, offset + comp);
    cmap = comp < orig ? inflateSync(raw) : raw;
  }
  if (!cmap) throw new Error(`${file}: no cmap`);
  const out = new Set<number>();
  for (let i = 0; i < cmap.readUInt16BE(2); i++) {
    const sub = cmap.readUInt32BE(4 + i * 8 + 4);
    const format = cmap.readUInt16BE(sub);
    if (format === 4) {
      const segs = cmap.readUInt16BE(sub + 6) / 2;
      const ends = sub + 14;
      const starts = ends + segs * 2 + 2;
      const deltas = starts + segs * 2;
      const ranges = deltas + segs * 2;
      for (let k = 0; k < segs; k++) {
        const [end, start] = [cmap.readUInt16BE(ends + k * 2), cmap.readUInt16BE(starts + k * 2)];
        const [delta, range] = [cmap.readInt16BE(deltas + k * 2), cmap.readUInt16BE(ranges + k * 2)];
        for (let c = start; c <= end && c !== 0xffff; c++) {
          const g = range
            ? cmap.readUInt16BE(ranges + k * 2 + range + (c - start) * 2)
            : (c + delta) & 0xffff;
          if (g !== 0) out.add(c);
        }
      }
    } else if (format === 12) {
      for (let k = 0; k < cmap.readUInt32BE(sub + 12); k++) {
        const g = sub + 16 + k * 12;
        for (let c = cmap.readUInt32BE(g); c <= cmap.readUInt32BE(g + 4); c++) out.add(c);
      }
    }
  }
  return out;
}

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory()
      ? f.name === 'dev'
        ? []
        : sources(join(dir, f.name))
      : /\.tsx?$/.test(f.name) && !/\.test\.tsx?$/.test(f.name)
        ? [join(dir, f.name)]
        : [],
  );
}

// What the code says, its comments aside: they're never on screen.
const uncommented = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

describe('the marks on screen', () => {
  it('are all in the fonts, or drawn', () => {
    // The panels' and people's hand; the poster's face covers at least as much.
    const hand = [
      covered(join(FONTS, 'patrick-hand-sc', 'files', 'patrick-hand-sc-latin-400-normal.woff')),
      covered(join(FONTS, 'patrick-hand', 'files', 'patrick-hand-latin-400-normal.woff')),
    ];
    expect(hand[0]!.has('A'.codePointAt(0)!)).toBe(true);
    const missing = new Map<string, string>();
    for (const f of sources(SRC))
      for (const ch of uncommented(readFileSync(f, 'utf8'))) {
        const c = ch.codePointAt(0)!;
        if (c < 0x80 || GLYPHS.includes(ch) || hand.every((h) => h.has(c))) continue;
        missing.set(ch, f.slice(SRC.length + 1));
      }
    expect([...missing].map(([ch, f]) => `${ch} (U+${ch.codePointAt(0)!.toString(16)}) in ${f}`)).toEqual([]);
  });

  it('draws what the fonts lack', () => {
    const hand = covered(join(FONTS, 'patrick-hand', 'files', 'patrick-hand-latin-400-normal.woff'));
    for (const g of GLYPHS) expect(hand.has(g.codePointAt(0)!), g).toBe(false);
  });
});
