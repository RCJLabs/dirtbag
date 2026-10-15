// Phase 31.3: a name the old guard knows, and the line the old climber gives you at the fire.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { needFor } from './climber';
import { holds } from './cond';
import { QUEST_END } from './content/epilogue';
import { QUEST_GIVE, QUEST_SENT, QUEST_TOLD } from './content/forebear';
import { KIN_OLD_GUARD } from './content/kin';
import { PLACES } from './content/places';
import { recordById } from './content/record';
import { ROUTES } from './content/routes';
import { crowdLine } from './crowdtalk';
import { CROWD_PER_DAY } from './content/crowd';
import { epilogue } from './epilogue';
import { forebearAtFire, MET } from './forebear';
import { act, emptyLog, newGame, talkStart, talkValues } from './game';
import { questDone, questOf } from './heir';
import { keeperLine } from './keepers';
import { kinBand } from './kin';
import { fill } from './format';
import { fromSave } from './save';
import type { GameState, GoResult } from './types';

const V69 = readFileSync(new URL('./fixtures/save-v69.json', import.meta.url), 'utf8');
const sent = { ...emptyLog(), goes: 3, sent: { day: 50, go: 3, style: 'redpoint' as const } };
const made = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('kin'), { t: 'create', name: 'Robin', start: 'allrounder' }).state,
  ...over,
});
const robin = (old: number, over: Partial<GameState> = {}): GameState =>
  made({
    day: 300,
    routes: { pump: sent, testpiece: sent, rsopen: sent, project: { ...emptyLog(), goes: 12 } },
    firsts: { rsopen: { name: 'Second Wind', call: 0, day: 120 } },
    scene: { ...made().scene, old },
    life: { held: 0, told: 38, retired: { day: 300, forced: false } },
    ...over,
  });
const kidOf = (s: GameState): GameState =>
  act(act(s, { t: 'heir' }).state, { t: 'create', name: 'Jo', start: 'boulderer' }).state;
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const night = (s: GameState): GameState => ({
  ...s,
  at: 'lot',
  x: null,
  min: 20 * 60,
  energy: 80,
  today: [],
});

describe('a name the old guard knows', () => {
  it('has Ray and Frank say whose kid you are, once, as the old guard had them', () => {
    expect(kinBand(kidOf(robin(80)))).toBe('high');
    expect(kinBand(kidOf(robin(50)))).toBe('mid');
    expect(kinBand(kidOf(robin(30)))).toBe('low');
    for (const [old, band] of [
      [80, 'high'],
      [50, 'mid'],
      [30, 'low'],
    ] as const) {
      const k = {
        ...kidOf(robin(old)),
        people: { ray: { bond: 1, last: 1, talked: true }, frank: { bond: 1, last: 1, talked: true } },
      };
      for (const who of ['ray', 'frank']) {
        expect(talkStart(k, who)).toBe(`kin-${band}`);
        const text = fill(KIN_OLD_GUARD[who]![band].text, talkValues(k, who));
        expect(text).toContain('Robin');
        expect(text).not.toContain('{');
        expect(talkStart({ ...k, seen: [...k.seen, `kin-${who}`] }, who)).not.toMatch(/^kin-/);
      }
    }
    // Not a word for a climber nobody came before.
    expect(holds(made(), { kin: true })).toBe(false);
    expect(holds(made(), { kinBeat: 'ray/mid' })).toBe(false);
  });

  it('puts the name in the crowd at a crag and in the shops in town', () => {
    const k = kidOf(robin(50));
    const heard = Array.from({ length: 60 }, (_, d) =>
      Array.from({ length: CROWD_PER_DAY }, (_, n) => crowdLine({ ...k, day: k.day + d }, n)),
    ).flat();
    expect(heard.some((t) => t.includes('Robin'))).toBe(true);
    expect(heard.some((t) => t.includes('{'))).toBe(false);
    const diner = Array.from({ length: 60 }, (_, d) => keeperLine({ ...k, day: k.day + d }, 'diner') ?? '');
    expect(diner.some((t) => t.includes('Robin'))).toBe(true);
    // A first climber hears none of it.
    const first = made();
    const none = Array.from({ length: 60 }, (_, d) => crowdLine({ ...first, day: first.day + d }, 0));
    expect(none.some((t) => t.includes('{'))).toBe(false);
  });
});

describe('the line they give you', () => {
  it('is the one they never sent; else their hardest send; for an heir from before, their first ascent', () => {
    expect(questOf(kidOf(robin(50)))).toMatchObject({ kind: 'project', r: { id: 'project' } });
    const noProject = kidOf(robin(50, { routes: { pump: sent, testpiece: sent, rsopen: sent } }));
    // Their hardest outside: Second Wind (V7).
    expect(questOf(noProject)).toMatchObject({ kind: 'hardest', r: { id: 'rsopen' } });
    const r = fromSave(V69);
    if (!r.ok) throw new Error(r.why);
    expect(questOf(r.state)?.kind).toBe('fa');
    expect(r.state.family!.lines).toContain(questOf(r.state)!.r.id);
  });

  it('is given the first night at the fire, sent, heard about, and in the book and the epilogue', () => {
    let k = night(kidOf(robin(50)));
    const first = act(k, { t: 'forebear', do: 'talk' });
    const give = fill(QUEST_GIVE.project, {
      forebear: 'Robin',
      quest: ROUTES.project!.name,
      crag: PLACES[ROUTES.project!.place]!.name,
    });
    expect(lines(first)).toContain(give);
    k = first.state;
    expect(k.seen).toContain(MET);
    // They give beta on it too: it's theirs, sent or not.
    expect(questDone(k)).toBe(false);
    // Sent: said at the send.
    const n = needFor(10);
    const at = {
      ...k,
      day: k.day + 1,
      at: ROUTES.project!.place,
      x: null,
      min: 10 * 60,
      energy: 100,
      skin: 100,
      climber: { ...k.climber, skills: { power: n, fingers: n, endurance: n, technique: n, head: n } },
    };
    const went = act(at, { t: 'go', route: 'project' });
    expect(went.events.flatMap((e) => (e.k === 'refused' ? [e.why] : []))).toEqual([]);
    const SENT: GoResult = { sent: true, hi: ROUTES.project!.moves, fellAt: null, tried: [], skin: 0 };
    const done = act(went.state, { t: 'done', route: 'project', result: SENT });
    expect(lines(done)).toContain(fill(QUEST_SENT, { quest: ROUTES.project!.name, forebear: 'Robin' }));
    expect(questDone(done.state)).toBe(true);
    expect(done.state.record.kinquest).toBe(done.state.day);
    expect(recordById('kinquest')?.title).toBe('Unfinished Business');
    // The next time you sit with them, they've heard; once.
    const sitWith = (from: GameState): ReturnType<typeof act> => {
      let d = from.day + 1;
      while (!forebearAtFire(night({ ...from, day: d }))) d++;
      return act(night({ ...from, day: d }), { t: 'forebear', do: 'talk' });
    };
    const sit = sitWith(done.state);
    expect(lines(sit)).toContain(fill(QUEST_TOLD, { forebear: 'Robin' }));
    const again = sitWith(sit.state);
    expect(lines(again)).toHaveLength(1);
    expect(lines(again)).not.toContain(fill(QUEST_TOLD, { forebear: 'Robin' }));
    // And at the end.
    const end = {
      ...done.state,
      life: { ...done.state.life, retired: { day: done.state.day, forced: false } },
    };
    expect(epilogue(end).map((l) => l.text)).toContain(
      fill(QUEST_END.project, { quest: ROUTES.project!.name, forebear: 'Robin' }),
    );
  });

  it('isn’t a quest till they’ve given it', () => {
    const k = kidOf(robin(50));
    const s = { ...k, routes: { project: sent } };
    expect(questDone(s)).toBe(false);
    expect(questDone({ ...s, seen: [MET] })).toBe(true);
  });
});
