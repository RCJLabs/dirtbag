// Phase 16.4: what became of you, from what the save kept; criterion 2 counts what it names.
import { describe, expect, it } from 'vitest';
import { CALLINGS } from './content/callings';
import { CALLING_END, ORIGIN_END } from './content/epilogue';
import { ORIGINS } from './content/origins';
import { OPEN_PATHS, PATHS } from './content/paths';
import { ROUTES } from './content/routes';
import { BOND, HOME } from './dials';
import { epilogue, namedDeeds } from './epilogue';
import { act, newGame } from './game';
import type { GameState } from './types';

const made = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('epi'), { t: 'create', name: 'Lee', start: 'allrounder', origin: 'quit' }).state,
  ...over,
});

describe('the epilogue', () => {
  it('has words for every origin and every calling you can take', () => {
    for (const id of Object.keys(ORIGINS)) expect(ORIGIN_END[id]).toBeTruthy();
    for (const id of Object.keys(CALLINGS).filter((c) => !CALLINGS[c]!.wait))
      expect(CALLING_END[id]).toHaveLength(4);
  });

  it('says who you were, and names nothing you did when you did nothing', () => {
    const e = epilogue(made());
    expect(e[0]).toEqual({ text: ORIGIN_END.quit, did: false });
    expect(namedDeeds(made())).toBe(0);
  });

  it('names what you did, from the save, and nothing it made up', () => {
    const open = Object.values(ROUTES).find((r) => r.open && r.place === 'road')!;
    const path = OPEN_PATHS[0]!;
    const close = { bond: BOND.tiers[HOME.tier]!, last: 1 };
    const s = made({
      firsts: { [open.id]: { name: 'Second Wind', call: 0, day: 40 } },
      book: [
        { id: 'elcap', day: 60, end: 'summit', high: 0, partner: null, nights: 4, seen: [], told: true },
      ],
      paths: { tiers: { [path]: PATHS[path]!.tiers.length }, told: [] },
      calling: { id: 'purist', since: 10, rungs: [80, 120], offered: true },
      scene: {
        old: 90,
        gym: 50,
        stances: [{ id: 'chip', opt: 0, day: 70 }],
        echoes: [],
        last: 70,
        echoLast: 0,
      },
      people: { hazel: close },
      dog: { name: 'Scout', since: 20, fed: 80, bond: 60 },
      year: { recapped: 1, home: 90 },
      record: { firstsend: 3, v5: 50 },
      quirk: 'purist',
      mastery: ['crimp'],
    });
    const text = epilogue(s).map((l) => l.text);
    expect(text).toContain(
      'Second Wind, at Roadside Crag, carries your name, and will on every topo anyone ever draws of it.',
    );
    expect(text).toContain('You stood on top of El Capitan.');
    expect(text).toContain(`They called you ${PATHS[path]!.title}.`);
    expect(text.some((t) => t.includes('two of the three hard lines'))).toBe(true);
    expect(text.some((t) => t.startsWith('In your own words: “Filled a chipped hold'))).toBe(true);
    expect(text.some((t) => t.startsWith('The old guard still tell your stories'))).toBe(true);
    expect(text.some((t) => t.startsWith('Hazel still has a coffee pot'))).toBe(true);
    expect(text.some((t) => t.startsWith('Scout went everywhere'))).toBe(true);
    expect(text).toContain('The day of the Homecoming, everyone came.');
    expect(text).toContain('The scene had a name for how you climbed: Stone Purist.');
    expect(text.some((t) => t.startsWith('You mastered '))).toBe(true);
    expect(text.some((t) => t.startsWith('The page in the Record Book you show people first'))).toBe(true);
    expect(text.join(' ')).not.toMatch(/\{/);
    expect(namedDeeds(s)).toBeGreaterThanOrEqual(5);
  });
});
