// Phase 15.1: the store pages say what the game has. The copy in docs/STORE.md is written by
// hand, in the game's voice; this holds every number and name in it to the content, so a
// crag added or a Record Book entry cut fails here rather than on a store page.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMP_TIERS, EXPEDITIONS, MONEY, PEOPLE, PLACES, RECORD, ROUTES, STORY } from './sim';

const md = readFileSync(join(__dirname, '..', '..', 'docs', 'STORE.md'), 'utf8');
// Phase 15.4: the press kit's own words, beside the store's.
const kit = readFileSync(join(__dirname, '..', '..', 'docs', 'PRESSKIT.md'), 'utf8');
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>;
};
const ledger = JSON.parse(readFileSync(join(__dirname, 'audio', 'ledger.json'), 'utf8')) as {
  sounds: Record<string, { made: string }>;
  recordings: unknown[];
};
const block = (key: string): string => {
  const m = md.match(new RegExp('```text ' + key + '\\n([\\s\\S]*?)\\n```'));
  if (!m) throw new Error(`no ${key} block in docs/STORE.md`);
  return m[1]!;
};
// Phase 19.3: Play's listing for launch is held to the same facts.
const LONG = ['steam-about', 'full', 'full-launch'];
const WORD: Record<number, string> = { 5: 'Five', 9: 'Nine', 52: 'Fifty-two' };
const word = (n: number): string => {
  const w = WORD[n];
  if (!w) throw new Error(`${n}: the copy has no word for it; write the new number into STORE.md`);
  return w;
};

const crags = Object.values(PLACES).filter((p) => p.crag && !p.hidden);
const hidden = Object.values(PLACES).filter((p) => p.crag && p.hidden);

describe('the press kit', () => {
  it('names every typeface the game bundles', () => {
    const faces = Object.keys(pkg.dependencies)
      .filter((d) => d.startsWith('@fontsource/'))
      .map((d) =>
        d
          .slice('@fontsource/'.length)
          .split('-')
          .map((w) => (w === 'sc' ? 'SC' : w[0]!.toUpperCase() + w.slice(1)))
          .join(' '),
      );
    expect(faces.length).toBeGreaterThan(0);
    for (const f of faces) expect(kit, f).toContain(f);
  });

  it('says no recordings only while there are none', () => {
    expect(kit).toContain('no recordings');
    expect(ledger.recordings).toEqual([]);
    expect(Object.values(ledger.sounds).every((s) => s.made === 'code')).toBe(true);
  });
});

describe('the store copy', () => {
  it('starts you with the cash the game does', () => {
    for (const k of ['steam-short', ...LONG]) expect(block(k), k).toContain(`$${MONEY.start},`);
  });

  it('names every crag, and keeps the one nobody’s mapped off the list', () => {
    expect(crags.length).toBeGreaterThan(0);
    for (const k of LONG) {
      for (const p of crags) expect(block(k), `${k}: ${p.name}`).toContain(p.name);
      for (const p of hidden) expect(block(k), `${k}: ${p.name}`).not.toContain(p.name);
      if (hidden.length) expect(block(k)).toContain('a canyon that isn’t on the map');
    }
    expect(md).toContain(
      `${word(crags.length)} crags, and ${hidden.length === 1 ? 'one' : hidden.length} nobody’s mapped`,
    );
  });

  it('counts the acts and ends on the last one', () => {
    for (const k of LONG) {
      expect(block(k)).toContain(`${word(STORY.length)} acts`);
      expect(block(k)).toContain(STORY[STORY.length - 1]!.title);
    }
  });

  it('tops out at the hardest grade there is', () => {
    const top = Math.max(
      ...Object.values(ROUTES)
        .filter((r) => r.disc === 'boulder')
        .map((r) => r.grade),
    );
    for (const k of ['short', 'short-launch']) expect(block(k), k).toContain(`to V${top}.`);
  });

  it('counts the Record Book', () => {
    expect(block('steam-about')).toContain(`${word(RECORD.length)} entries`);
  });

  it('names the comps, the expeditions and the people as the game does', () => {
    const about = block('steam-about').toLowerCase();
    for (const t of COMP_TIERS.slice(0, 5)) expect(about, t.name).toContain(t.name.toLowerCase());
    for (const e of Object.values(EXPEDITIONS)) expect(block('steam-about'), e.name).toContain(e.name);
    const names = Object.values(PEOPLE).map((p) => p.name);
    for (const k of LONG)
      for (const who of ['Hazel', 'Sage', 'Dex']) expect(names, `${k}: ${who}`).toContain(who);
  });
});
