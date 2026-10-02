// Phase 23.5: the scene. Two crowds, five calls put to you at the crag, the echoes that
// come back for some answers, and what standing gets you.
import { describe, expect, it } from 'vitest';
import { ECHOES, FACTION_PERKS, STANCES } from './content/scene';
import { PLACES } from './content/places';
import { FACTION } from './dials';
import { act, newGame } from './game';
import { gainMult } from './identity';
import { edgeWindows } from './paths';
import { ROUTES } from './content/routes';
import {
  echoDue,
  perksOf,
  permitFor,
  sceneNote,
  stanceAnswer,
  stanceDue,
  stanceOpts,
  standingWord,
  whereYouStand,
} from './scene';
import type { GameState } from './types';

const made = (over: Partial<GameState> = {}) => ({
  ...act(newGame('scene'), { t: 'create', name: 'Jo', start: 'allrounder' }).state,
  ...over,
});
const scene = (s: GameState, over: Partial<GameState['scene']>) => ({ ...s, scene: { ...s.scene, ...over } });
const crag = Object.keys(PLACES).find((id) => PLACES[id]!.crag)!;

describe('the scene', () => {
  it('starts even with both crowds, in the middle of the road', () => {
    const s = made();
    expect(s.scene.old).toBe(FACTION.start);
    expect(standingWord(s.scene.old)).toBe('Neutral');
    expect(whereYouStand(s)).toMatch(/Middle of the road/);
    expect(whereYouStand(scene(s, { old: 80, gym: 30 }))).toBe(
      'In with the old guard, but on the outs with the gym crowd.',
    );
  });

  it('puts a call to you at a crag now and then, never in the first fortnight, never twice', () => {
    const early = made({ day: 5 });
    expect(Array.from({ length: 50 }, (_, d) => stanceDue({ ...early, day: 1 + (d % 13) }, crag))).toEqual(
      Array(50).fill(null),
    );
    const days = Array.from({ length: 200 }, (_, d) => stanceDue(made({ day: 14 + d }), crag)).filter(
      (x) => x,
    );
    expect(days.length).toBeGreaterThan(20);
    expect(days.length).toBeLessThan(80);
    // The first-ascent call waits on one of your own.
    expect(days).not.toContain('fa');
    expect(stanceDue(made({ day: 30 }), 'gym')).toBeNull();
    const done = scene(made({ day: 40 }), { stances: [{ id: 'chip', opt: 0, day: 30 }], last: 30 });
    expect(stanceDue(done, crag)).toBeNull();
  });

  it('gives the elder’s answer only once the old guard listens', () => {
    const s = made();
    expect(stanceOpts(s, 'chip')).toHaveLength(3);
    expect(stanceOpts(scene(s, { old: FACTION.elder }), 'chip')).toHaveLength(4);
    expect(stanceAnswer('chip', 3)).toBe(STANCES.chip!.elder);
  });

  it('answers move standing, psyche and energy, and are kept', () => {
    const s = { ...made({ day: 20 }), encounter: { kind: 'stance' as const, id: 'trashed' } };
    const r = act(s, { t: 'answer', opt: 0 });
    const fx = STANCES.trashed!.opts[0]!.fx;
    expect(r.state.scene.old).toBe(FACTION.start + fx.old!);
    expect(r.state.scene.gym).toBe(FACTION.start + fx.gym!);
    expect(r.state.energy).toBe(Math.max(0, s.energy + fx.energy!));
    expect(r.state.scene.stances).toEqual([{ id: 'trashed', opt: 0, day: 20 }]);
    expect(r.state.encounter).toBeNull();
    expect(sceneNote(fx)).toMatch(
      /^The old guard warms to you, the gym crowd warms to you, psyche −2, energy −30\.$/,
    );
  });

  it('brings an answer back weeks later, once, and records whether you held or turned', () => {
    const s = scene(made({ day: 60 }), { stances: [{ id: 'chip', opt: 1, day: 20 }], last: 20 });
    expect(echoDue({ ...s, day: 40 })).toBeNull();
    expect(echoDue(s)).toBe('chip_climbed');
    const r = act({ ...s, encounter: { kind: 'echo', id: 'chip_climbed' } }, { t: 'answer', opt: 1 });
    expect(r.state.scene.echoes).toEqual([{ id: 'chip_climbed', turned: true, day: 60 }]);
    expect(r.state.scene.old).toBe(FACTION.start + ECHOES.chip_climbed!.turn.fx.old!);
    expect(echoDue(r.state)).toBeNull();
    // An answer with no echo brings nothing back.
    expect(echoDue(scene(made({ day: 90 }), { stances: [{ id: 'trashed', opt: 0, day: 20 }] }))).toBeNull();
  });

  it('every echo answers to a real call', () => {
    for (const [id, e] of Object.entries(ECHOES)) expect(stanceAnswer(e.stance, e.opt), id).toBeTruthy();
  });

  it('gets you the clubs’ perks at standing: local knowledge outside, coaching, and free permits', () => {
    const s = made();
    expect(perksOf(s)).toEqual([]);
    const out = Object.values(ROUTES).find((r) => !r.exped && PLACES[r.place]?.crag)!;
    const old = scene(s, { old: FACTION_PERKS.old[0]!.at });
    expect(edgeWindows(old, out, false)).toBeCloseTo(1.02, 10);
    const paid = Object.keys(PLACES).find((id) => (PLACES[id]!.permit ?? 0) > 0)!;
    expect(permitFor(old, paid)).toBe(PLACES[paid]!.permit);
    expect(permitFor(scene(s, { old: FACTION_PERKS.old[1]!.at }), paid)).toBe(0);
    expect(gainMult(scene(s, { gym: FACTION_PERKS.gym[1]!.at }), 'power', 'train')).toBeCloseTo(
      1.15 * 1.13,
      10,
    );
    expect(gainMult(scene(s, { gym: 100 }), 'power', 'out')).toBe(1);
  });

  it('hears about the calling you take up', () => {
    const r = act(made(), { t: 'calling', id: 'purist' });
    expect(r.state.scene.old).toBeGreaterThan(FACTION.start);
  });
});
