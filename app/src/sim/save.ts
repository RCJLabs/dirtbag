// Save files: a versioned envelope around the state, a migration registry, and a strict
// validator. The loader never repairs a save it doesn't understand and never returns a
// fresh game in its place: it says why it failed, and the caller keeps the bytes.
//
// Changing the shape of GameState means: bump SAVE_VERSION, register MIGRATIONS[old] that
// turns an old state into the new shape, and add a test that loads a real old save.

import { CARRIED, SKILLS, STARTS } from './climber';
import { GEAR } from './content/gear';
import { PLACES } from './content/places';
import { AGE, FACTION, LIFESTYLE, PLANS, SPOTS, TRAIN, YEAR } from './dials';
import { JOBS } from './content/jobs';
import { ROUTES, WALLS } from './content/routes';
import { EXPEDITIONS } from './content/expeditions';
import { PEOPLE } from './content/people';
import { WALL_EVENTS } from './content/wallevents';
import { INGREDIENTS, MEAL_NAME } from './content/food';
import { KNOCKS } from './content/knocks';
import { HITCHERS, STOPS } from './content/road';
import { EPICS } from './content/epics';
import { recordById } from './content/record';
import { CAME_ACROSS, ORIGINS } from './content/origins';
import { TALENTS } from './content/talents';
import { CALLINGS } from './content/callings';
import { HYBRIDS, MASTERY, PATHS, QUIRKS } from './content/paths';
import { ECHOES, STANCES } from './content/scene';
import { BOARD_JOBS } from './content/board';
import { newMastery } from './paths';
import { newlyEarned } from './record';
import { aimMet, currentGoal } from './story';
import { ACT_I } from './content/story';
import type { GameState, LogLine, PersonLog, RouteLog, SendRecord } from './types';

export const SAVE_VERSION = 47;
const FORMAT = 'dirtbag';

export interface SaveFile {
  format: typeof FORMAT;
  v: number;
  // The build that wrote it, for bug reports. Loading never depends on it.
  app: string;
  state: GameState;
}

// MIGRATIONS[n] turns a version-n state into version n+1. Each one is history: it writes
// the values the new shape started with, as literals, so retuning a dial later never
// changes what an old save loads as.
export type Migration = (state: unknown) => unknown;
export const MIGRATIONS: Record<number, Migration> = {
  // v1 (R0) -> v2 (R1): hunger, a climber with v0.956's skills, and the people you've met.
  // The name stays empty, so the game asks who you are before it goes on.
  1: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return {
      ...x,
      fed: 80,
      climber: {
        name: '',
        start: 'allrounder',
        skills: { power: 8, fingers: 8, endurance: 8, technique: 8, head: 8 },
      },
      people: {},
    };
  },
  // v2 (R1) -> v3 (R2): training load, seeded at a light day's load as a new game's is; no
  // injury, and none so far; no first ascents, no race on, no trips out, no dog, and Act I
  // from its first goal (checked on the next action, so an old save catches up). (v3 grows with R2 until R2's build ships;
  // from then on it's history like the rest.)
  2: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return {
      ...x,
      load: { acute: 20, chronic: 20, today: 0 },
      injury: null,
      hurt: 0,
      firsts: {},
      race: null,
      trips: 0,
      dog: null,
      goals: 0,
    };
  },
  // v3 (0.960.0) -> v4 (Phase 10.3): no trips paid for yet. Moonstone opens on its own terms.
  3: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, unlocked: [] };
  },
  // v4 (0.961.0) -> v5 (Phase 21.1): the kit a new climber starts with, the shoes they drove
  // out in and half a bag of chalk, for climbers who were already out here.
  4: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, gear: { shoes: 60, chalk: 30 } };
  },
  // v5 (Phase 21.2) -> v6 (Phase 21.3): a training block, in base since the day you load it,
  // never tapered, no prehab.
  5: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, training: { phase: 'base', since: isInt(x.day) ? x.day : 1, taper: null, prehab: 0 } };
  },
  // v6 (Phase 21.3) -> v7: shifts worked, counted from here. v6 never counted them, so
  // everyone starts at the first rank.
  6: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, jobs: {} };
  },
  // v7 -> v8 (Phase 21.5): on no wall, and away on no expedition.
  7: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, wall: null, expedition: null };
  },
  // v8 -> v9 (Phase 21.6): no speed runs yet, and climbing on a rope, as everyone did.
  8: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, speed: { pb: null, runs: 0, day: 0 }, mode: 'rope', soloing: null, dead: null };
  },
  // v9 -> v10 (Phase 22.1): no shifts signed up for, no warnings, on every job's schedule,
  // and living as everyone did: a dirtbag.
  9: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, shifts: [], strikes: {}, benched: {}, lifestyle: 'dirtbag' };
  },
  // v10 -> v11 (Phase 22.2a): the van's parts, worn from the miles already on it, and not
  // broken down.
  10: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, van: { tires: 70, engine: 70, battery: 70 }, breakdown: null };
  },
  // v11 -> v12 (Phase 22.2b): parked at the Lot, as everyone was, with the count of nights in
  // a row starting from here, and no driveway yet.
  11: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, spot: 'lot', lotNights: 0, driveway: 0 };
  },
  // v12 -> v13 (Phase 22.3): an empty pantry, no meals remembered, and not fueled.
  12: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, pantry: {}, meals: [], fueled: 0 };
  },
  // v13 -> v14 (Phase 22.4a): on the catastrophic plan, which is what the flat premium was,
  // and never jabbed.
  13: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, insurance: 'catastrophic', jab: 0 };
  },
  // v14 -> v15 (Phase 22.4b): no marks, no flare, no fear. Old injuries before now left none.
  14: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, scars: [], flare: null, fear: [] };
  },
  // v15 -> v16 (Phase 22.4c): supplies at a new climber's, and well.
  15: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, supplies: 80, sick: null };
  },
  // v16 -> v17 (Phase 22.4d): psyche even. No crags listed: a crag you've logged a line at
  // counts as one you've been to (game.ts arriveAt), so an old climber's aren't new.
  16: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, psyche: { level: 50, stale: 0 }, crags: [] };
  },
  // v17 -> v18 (Phase 22.5a): no one-time lines had yet.
  17: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, seen: [] };
  },
  // v18 -> v19 (Phase 22.5b): no sets played yet.
  18: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, guitar: 0 };
  },
  // v19 -> v20 (Phase 22.6a): an empty deck, and nobody at the door.
  19: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, deck: { last: 0, knock: 0, seen: [] }, encounter: null };
  },
  // v20 -> v21 (Phase 22.6b): nobody picked up yet, no stops found.
  20: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const deck = isObj(x.deck) ? x.deck : {};
    return { ...x, deck: { ...deck, hitch: 0, stop: 0, stops: [], met: {} } };
  },
  // v21 -> v22 (Phase 22.6c): no walk-outs yet.
  21: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const deck = isObj(x.deck) ? x.deck : {};
    return { ...x, deck: { ...deck, epic: 0 } };
  },
  // v22 -> v23 (Phase 22.7): no dog lost yet. A dog you have keeps the day he picked you, and
  // ages from it.
  22: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, dogs: [] };
  },
  // v23 -> v24 (Phase 22.8): no dream picked, an empty jar.
  23: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, dream: { pick: null, pot: 0, owned: [] } };
  },
  // v24 -> v25 (Phase 22.9a): no hand of dice on the go.
  24: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, table: null };
  },
  // v25 -> v26 (Phase 22.9b): not sat at cards, and no reads on anyone.
  25: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, cards: null, reads: {} };
  },
  // v26 -> v27 (Phase 24.1): an expedition you're away on keeps its day and its pitches, and
  // ropes up with Hazel if you know her (alone if not); 21.5's energy on the wall goes, since
  // up there it's your own.
  26: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const e = x.expedition;
    if (!isObj(e)) return x;
    const people = isObj(x.people) ? x.people : {};
    const { energy: _gone, ...rest } = e;
    void _gone;
    return {
      ...x,
      expedition: {
        ...rest,
        partner: 'hazel' in people ? 'hazel' : null,
        nights: Math.max(0, Number(e.day) - 1),
      },
    };
  },
  // v27 -> v28 (Phase 24.2): nothing booked; a trip under way packed food and water for every
  // day it has left, the portaledge, and the stove where the water's snow.
  27: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const e = x.expedition;
    if (!isObj(e)) return { ...x, booked: null };
    const def = EXPEDITIONS[String(e.id)];
    return {
      ...x,
      booked: null,
      expedition: {
        ...e,
        food: Math.max(0, (def?.days ?? 0) - Number(e.day)),
        ledge: true,
        stove: !!def?.melt,
      },
    };
  }, // v28 -> v29 (Phase 24.4): a trip under way has had nothing happen to it yet.
  28: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const e = x.expedition;
    return isObj(e) ? { ...x, expedition: { ...e, seen: [] } } : x;
  }, // v29 -> v30 (Phase 24.5): no trips in the book yet. One under way goes in when it's over.
  29: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, book: [] };
  }, // v30 -> v31 (Phase 23.1): the Record Book, holding what you'd already done, as of the
  // day you load it. No cards for those: they go in quietly.
  30: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const s = { ...x, record: {} } as unknown as GameState;
    const record: Record<string, number> = {};
    for (const r of newlyEarned(s)) record[r.id] = s.day;
    return { ...x, record };
  }, // v31 -> v32 (Phase 23.2): a climber from before origins has none, and nothing's dealt
  // them now; their talents would show against the skills they have today.
  31: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const c = x.climber;
    const skills = isObj(c) && isObj(c.skills) ? { ...c.skills } : {};
    return { ...x, origin: null, talents: { ids: [], known: [], from: skills } };
  },
  // v32 -> v33 (Phase 23.3): no calling yet, and not yet asked; a climber who's sent enough
  // is asked on the first thing they do.
  32: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, calling: { id: null, since: 0, rungs: [], offered: false } };
  },
  // v33 -> v34 (Phase 23.4): no paths yet; the styles already sent deep enough are mastered,
  // quietly; habits count from today, so a quirk's named on goes the game has seen.
  33: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const fresh = {
      ...x,
      paths: { tiers: {}, told: [] },
      mastery: [],
      quirk: null,
      habits: { goes: 0, outdoor: 0, fresh: 0, tired: 0, evening: 0, dawn: 0, easy: 0, power: 0 },
    };
    return { ...fresh, mastery: newMastery(fresh as unknown as GameState) };
  },
  // v34 -> v35 (Phase 23.5): even with both crowds, no calls made yet.
  34: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return {
      ...x,
      scene: { old: FACTION.start, gym: FACTION.start, stances: [], echoes: [], last: 0, echoLast: 0 },
    };
  },
  // v35 -> v36 (Phase 23.6): no board yet; this week's goes up on the first thing you do.
  35: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, board: { week: 0, jobs: [], shifts0: 0, sessions: 0 } };
  },
  // v36 -> v37 (Phase 23.7): the years already done count as recapped, quietly (no card for a
  // year that ended before the game could say so); no Homecoming yet.
  36: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const day = isInt(x.day) ? x.day : 1;
    return { ...x, year: { recapped: Math.floor((day - 1) / YEAR.days), home: 'none' } };
  },
  // v37 -> v38 (Phase 16.1): a clock for the life. A save already past the countdown's start
  // has its clock held back to it, so nobody loads into their last night unwarned; the age
  // you are on loading counts as said.
  37: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const day = isInt(x.day) ? x.day : 1;
    const start = AGE.start + (typeof x.origin === 'string' ? (ORIGINS[x.origin]?.fx.age ?? 0) : 0);
    const warnDay = (AGE.warn - start) * AGE.days + 1;
    const held = Math.max(0, day - warnDay);
    const told = start + Math.floor(Math.max(0, day - 1 - held) / AGE.days);
    return { ...x, life: { held, told, retired: null } };
  },
  // v38 -> v39 (Phase 16.2): the story goes on past Act I. A save that's finished it moves on,
  // quietly, past every later stage it's already done (no cards, no pay for what came
  // before the story could say so), to the first it hasn't.
  38: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const s = { ...x } as unknown as GameState;
    if (!isInt(s.goals) || s.goals < ACT_I.length) return s;
    for (let g = currentGoal(s); g && aimMet(s, g.aim); g = currentGoal(s)) s.goals += 1;
    return s;
  },
  // v39 -> v40 (Phase 16.5): no family yet; every climber so far is the first of theirs.
  39: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, family: null };
  },
  // v40 -> v41 (Phase 17.3): everyone you'd met, you'd spoken to as far as the game knew
  // (their first meeting played or was skipped for good); nobody's life has moved on yet.
  40: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const people = isObj(x.people) ? x.people : {};
    return {
      ...x,
      people: Object.fromEntries(
        Object.entries(people).map(([id, p]) => [id, isObj(p) ? { ...p, talked: true } : p]),
      ),
    };
  },
  // v41 -> v42 (Phase 17.4): nobody's with anyone yet, and no spark's been offered.
  41: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, romance: null };
  },
  // v42 -> v43 (Phase 17.5): two new optional fields, a gift's day and a line's honoree;
  // nobody's been given anything yet, and no line's named for anyone.
  42: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x };
  },
  // v43 -> v44 (Phase 17.6): nobody's called from home yet.
  43: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, folks: { calls: 0 } };
  },
  // v44 -> v45 (Phase 17.7): two new optional fields; nobody's fire or portaledge lines have
  // been heard in order yet, so everyone's start from their first.
  44: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x };
  },
  // v45 -> v46 (Phase 18.1): nobody's taken leave yet.
  45: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, leave: {} };
  },
  // v46 -> v47 (Phase 18.3): nobody coached yet, and no picks on the go.
  46: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, coach: null, haul: null };
  },
};

export type LoadResult = { ok: true; state: GameState; from: number } | { ok: false; why: string };

export function toSave(state: GameState, app: string): string {
  const file: SaveFile = { format: FORMAT, v: SAVE_VERSION, app, state };
  return JSON.stringify(file);
}

// `target` is the version this build reads; tests lower the bar to exercise migrations.
export function fromSave(
  raw: string,
  migrations: Record<number, Migration> = MIGRATIONS,
  target: number = SAVE_VERSION,
): LoadResult {
  let file: unknown;
  try {
    file = JSON.parse(raw);
  } catch {
    return { ok: false, why: 'not JSON' };
  }
  if (!isObj(file) || file.format !== FORMAT) return { ok: false, why: 'not a Dirtbag save' };
  const v = file.v;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) return { ok: false, why: 'no version' };
  if (v > target)
    return { ok: false, why: `written by a newer build (save v${v}, this build reads v${target})` };
  let state: unknown = file.state;
  for (let n = v; n < target; n++) {
    const m = migrations[n];
    if (!m) return { ok: false, why: `no migration from v${n}` };
    try {
      state = m(state);
    } catch (e) {
      return { ok: false, why: `migration from v${n} failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
  const errors = validate(state);
  if (errors.length) return { ok: false, why: `invalid: ${errors.slice(0, 3).join('; ')}` };
  return { ok: true, state: state as GameState, from: v };
}

// ---- validation: every field, its type and its range ----

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isInt = (x: unknown): x is number => isNum(x) && Number.isInteger(x);
const isStrs = (x: unknown): x is string[] => Array.isArray(x) && x.every((e) => typeof e === 'string');

export function validate(x: unknown): string[] {
  const err: string[] = [];
  const need = (ok: boolean, what: string) => {
    if (!ok) err.push(what);
  };
  if (!isObj(x)) return ['state is not an object'];
  need(typeof x.seed === 'string', 'seed');
  need(isInt(x.day) && x.day >= 1, 'day');
  need(isInt(x.min) && x.min >= 0, 'min');
  need(isInt(x.cash), 'cash');
  need(isNum(x.energy) && x.energy >= 0 && x.energy <= 100, 'energy');
  need(isNum(x.skin) && x.skin >= 0 && x.skin <= 100, 'skin');
  need(isNum(x.fed) && x.fed >= 0 && x.fed <= 100, 'fed');
  need(typeof x.at === 'string' && x.at in PLACES, 'at');
  need(x.x === null || isNum(x.x), 'x');
  need(isStrs(x.today), 'today');
  err.push(...validateClimber(x.climber).map((e) => `climber.${e}`));
  const l = x.load;
  need(
    isObj(l) &&
      isNum(l.acute) &&
      l.acute >= 0 &&
      isNum(l.chronic) &&
      l.chronic >= 0 &&
      isNum(l.today) &&
      l.today >= 0,
    'load',
  );
  const inj = x.injury;
  need(
    inj === null ||
      (isObj(inj) &&
        typeof inj.kind === 'string' &&
        (inj.tier === 1 || inj.tier === 2 || inj.tier === 3) &&
        isInt(inj.until)),
    'injury',
  );
  need(isInt(x.hurt) && x.hurt >= 0, 'hurt');
  need(
    isObj(x.firsts) &&
      Object.values(x.firsts).every(
        (f) =>
          isObj(f) &&
          typeof f.name === 'string' &&
          (f.call === -1 || f.call === 0 || f.call === 1) &&
          isInt(f.day) &&
          (f.by === undefined || typeof f.by === 'string') &&
          (f.for === undefined || (typeof f.for === 'string' && f.for in PEOPLE)),
      ),
    'firsts',
  );
  const race = x.race;
  need(race === null || (isObj(race) && typeof race.route === 'string' && isInt(race.until)), 'race');
  need(isInt(x.trips) && x.trips >= 0, 'trips');
  need(isInt(x.goals) && x.goals >= 0, 'goals');
  need(isStrs(x.unlocked) && x.unlocked.every((id) => id in PLACES), 'unlocked');
  need(
    isObj(x.gear) &&
      Object.entries(x.gear).every(
        ([id, n]) => id in GEAR && isNum(n) && n >= 0 && (GEAR[id]!.kind !== 'wears' || n <= 100),
      ),
    'gear',
  );
  const tr = x.training;
  need(
    isObj(tr) &&
      typeof tr.phase === 'string' &&
      tr.phase in TRAIN.phases &&
      isInt(tr.since) &&
      tr.since >= 1 &&
      (tr.taper === null || (isInt(tr.taper) && tr.taper >= 1)) &&
      isInt(tr.prehab) &&
      tr.prehab >= 0,
    'training',
  );
  need(isObj(x.jobs) && Object.entries(x.jobs).every(([id, n]) => id in JOBS && isInt(n) && n >= 0), 'jobs');
  need(
    Array.isArray(x.shifts) &&
      x.shifts.every(
        (e) => isObj(e) && typeof e.job === 'string' && e.job in JOBS && isInt(e.day) && e.day >= 1,
      ),
    'shifts',
  );
  const perJob = (o: unknown) =>
    isObj(o) && Object.entries(o).every(([id, n]) => id in JOBS && isInt(n) && n >= 0);
  need(perJob(x.strikes), 'strikes');
  need(perJob(x.benched), 'benched');
  need(
    isObj(x.leave) &&
      Object.entries(x.leave).every(
        ([id, d]) => id in JOBS && Array.isArray(d) && d.every((n) => isInt(n) && n >= 1),
      ),
    'leave',
  );
  const isClient = (c: unknown) =>
    isObj(c) &&
    typeof c.name === 'string' &&
    ['crimp', 'power', 'technical', 'dyno'].includes(c.style as string) &&
    isInt(c.gap) &&
    isInt(c.progress) &&
    isInt(c.tired) &&
    typeof c.scared === 'boolean';
  need(
    x.coach === null ||
      (isObj(x.coach) &&
        Array.isArray(x.coach.clients) &&
        x.coach.clients.every(isClient) &&
        isInt(x.coach.next) &&
        isInt(x.coach.last)),
    'coach',
  );
  need(
    x.haul === null ||
      (isObj(x.haul) &&
        isInt(x.haul.day) &&
        isInt(x.haul.picks) &&
        isInt(x.haul.fatigue) &&
        isInt(x.haul.pay)),
    'haul',
  );
  need(typeof x.lifestyle === 'string' && x.lifestyle in LIFESTYLE, 'lifestyle');
  need(typeof x.spot === 'string' && x.spot in SPOTS, 'spot');
  need(
    isObj(x.pantry) && Object.entries(x.pantry).every(([id, n]) => id in INGREDIENTS && isInt(n) && n >= 0),
    'pantry',
  );
  need(isStrs(x.meals) && x.meals.every((m) => m in MEAL_NAME), 'meals');
  need(isInt(x.fueled) && x.fueled >= 0, 'fueled');
  need(typeof x.insurance === 'string' && x.insurance in PLANS, 'insurance');
  need(isInt(x.jab) && x.jab >= 0, 'jab');
  const MARKS = ['fingers', 'shoulder', 'forearm', 'leg', 'ankle'];
  const STYLES = ['crimp', 'power', 'endurance', 'technical', 'dyno', 'crack'];
  need(isStrs(x.scars) && x.scars.every((m) => MARKS.includes(m)), 'scars');
  const fl = x.flare;
  need(
    fl === null || (isObj(fl) && typeof fl.area === 'string' && MARKS.includes(fl.area) && isInt(fl.until)),
    'flare',
  );
  need(isStrs(x.fear) && x.fear.every((f) => STYLES.includes(f)), 'fear');
  need(isNum(x.supplies) && x.supplies >= 0 && x.supplies <= 100, 'supplies');
  const sk = x.sick;
  need(
    sk === null || (isObj(sk) && ['cold', 'bug', 'toothache'].includes(sk.kind as string) && isInt(sk.until)),
    'sick',
  );
  const ps = x.psyche;
  need(
    isObj(ps) && isInt(ps.level) && ps.level >= 0 && ps.level <= 100 && isInt(ps.stale) && ps.stale >= 0,
    'psyche',
  );
  need(isStrs(x.crags) && x.crags.every((c) => PLACES[c]?.crag), 'crags');
  need(isStrs(x.seen), 'seen');
  need(isNum(x.guitar) && x.guitar >= 0, 'guitar');
  const dk = x.deck;
  need(
    isObj(dk) &&
      isInt(dk.last) &&
      isInt(dk.knock) &&
      isStrs(dk.seen) &&
      isInt(dk.hitch) &&
      isInt(dk.stop) &&
      isStrs(dk.stops) &&
      isObj(dk.met) &&
      isInt(dk.epic) &&
      Object.entries(dk.met).every(([id, i]) => HITCHERS.some((h) => h.id === id) && isInt(i)),
    'deck',
  );
  const en = x.encounter;
  const ids = {
    knock: KNOCKS,
    hitch: HITCHERS,
    stop: STOPS,
    epic: EPICS.map((e) => ({ id: e.kind })),
    wall: WALL_EVENTS,
    stance: Object.keys(STANCES).map((id) => ({ id })),
    echo: Object.keys(ECHOES).map((id) => ({ id })),
  } as Record<string, { id: string }[]>;
  const tb = x.table;
  const dice = (d: unknown) => Array.isArray(d) && d.every((v) => isInt(v) && v >= 1 && v <= 6);
  need(
    tb === null ||
      (isObj(tb) &&
        typeof tb.who === 'string' &&
        dice(tb.mine) &&
        dice(tb.theirs) &&
        isObj(tb.bid) &&
        isInt(tb.bid.n) &&
        isInt(tb.bid.face)),
    'table',
  );
  const cd = x.cards;
  const cards = (d: unknown) => Array.isArray(d) && d.every((v) => isInt(v) && v >= 0 && v <= 51);
  const bjOk = (h: unknown) =>
    h === null || (isObj(h) && cards(h.you) && cards(h.dealer) && isInt(h.next) && isNum(h.bet));
  const heOk = (h: unknown) =>
    h === null ||
    (isObj(h) &&
      cards(h.you) &&
      cards(h.them) &&
      cards(h.board) &&
      isInt(h.street) &&
      isNum(h.pot) &&
      isNum(h.facing) &&
      typeof h.bet === 'boolean');
  need(
    cd === null ||
      (isObj(cd) &&
        (cd.game === 'bj' || cd.game === 'holdem') &&
        typeof cd.who === 'string' &&
        isNum(cd.chips) &&
        isInt(cd.hands) &&
        bjOk(cd.bj) &&
        heOk(cd.he)),
    'cards',
  );
  need(
    isObj(x.reads) && Object.values(x.reads).every((r) => isObj(r) && isInt(r.hands) && isInt(r.caught)),
    'reads',
  );
  const dr = x.dream;
  const DREAMS = ['rig', 'warchest', 'homebase'];
  need(
    isObj(dr) &&
      (dr.pick === null || DREAMS.includes(dr.pick as string)) &&
      isNum(dr.pot) &&
      dr.pot >= 0 &&
      isStrs(dr.owned) &&
      dr.owned.every((o) => DREAMS.includes(o)),
    'dream',
  );
  need(
    Array.isArray(x.dogs) &&
      x.dogs.every((d) => isObj(d) && typeof d.name === 'string' && isInt(d.years) && isInt(d.day)),
    'dogs',
  );
  const tl = isObj(en) ? en.tally : undefined;
  need(
    en === null ||
      (isObj(en) &&
        typeof en.kind === 'string' &&
        (en.kind === 'farewell'
          ? typeof en.id === 'string' && isObj(x.dog)
          : !!ids[en.kind]?.some((k) => k.id === en.id)) &&
        (en.kind !== 'epic' ||
          (isInt(en.stage) &&
            isObj(tl) &&
            ['risk', 'energy', 'fed', 'skin', 'psyche', 'hours'].every((k) => isNum(tl[k]))))),
    'encounter',
  );
  need(isInt(x.lotNights) && x.lotNights >= 0, 'lotNights');
  need(isInt(x.driveway) && x.driveway >= 0, 'driveway');
  const pct = (v: unknown) => isNum(v) && v >= 0 && v <= 100;
  const van = x.van;
  need(isObj(van) && ['tires', 'engine', 'battery'].every((k) => pct(van[k])), 'van');
  const bd = x.breakdown;
  need(
    bd === null ||
      (isObj(bd) &&
        (bd.part === 'tires' || bd.part === 'engine') &&
        typeof bd.to === 'string' &&
        bd.to in PLACES &&
        isInt(bd.rest) &&
        bd.rest >= 0 &&
        typeof bd.bodged === 'boolean'),
    'breakdown',
  );
  const w = x.wall;
  need(
    w === null || (isObj(w) && typeof w.id === 'string' && w.id in WALLS && isInt(w.next) && w.next >= 0),
    'wall',
  );
  const e = x.expedition;
  need(
    e === null ||
      (isObj(e) &&
        typeof e.id === 'string' &&
        e.id in EXPEDITIONS &&
        isInt(e.day) &&
        e.day >= 1 &&
        isInt(e.pitch) &&
        e.pitch >= 0 &&
        (e.partner === null || (typeof e.partner === 'string' && e.partner in PEOPLE)) &&
        isInt(e.nights) &&
        e.nights >= 0 &&
        isInt(e.food) &&
        e.food >= 0 &&
        typeof e.ledge === 'boolean' &&
        typeof e.stove === 'boolean' &&
        Array.isArray(e.seen) &&
        e.seen.every((v) => typeof v === 'string')),
    'expedition',
  );
  const book = x.book;
  need(
    Array.isArray(book) &&
      book.every(
        (t) =>
          isObj(t) &&
          typeof t.id === 'string' &&
          t.id in EXPEDITIONS &&
          isInt(t.day) &&
          ['summit', 'bail', 'water', 'time'].includes(t.end as string) &&
          isInt(t.high) &&
          t.high >= 0 &&
          (t.partner === null || (typeof t.partner === 'string' && t.partner in PEOPLE)) &&
          isInt(t.nights) &&
          t.nights >= 0 &&
          isStrs(t.seen) &&
          typeof t.told === 'boolean',
      ),
    'book',
  );
  need(
    x.origin === null || (typeof x.origin === 'string' && (x.origin in ORIGINS || x.origin === CAME_ACROSS)),
    'origin',
  );
  const tals = x.talents;
  need(
    isObj(tals) &&
      isStrs(tals.ids) &&
      tals.ids.every((id) => id in TALENTS) &&
      isStrs(tals.known) &&
      tals.known.every((id) => (tals.ids as string[]).includes(id)) &&
      isObj(tals.from) &&
      SKILLS.every((k) => typeof (tals.from as Record<string, unknown>)[k] === 'number'),
    'talents',
  );
  const cl = x.calling;
  need(
    isObj(cl) &&
      (cl.id === null || (typeof cl.id === 'string' && cl.id in CALLINGS)) &&
      isInt(cl.since) &&
      cl.since >= 0 &&
      Array.isArray(cl.rungs) &&
      cl.rungs.every((d) => isInt(d) && d >= 0) &&
      cl.rungs.length <= (cl.id ? CALLINGS[cl.id as string]!.rungs.length : 0) &&
      typeof cl.offered === 'boolean',
    'calling',
  );
  const pt = x.paths;
  need(
    isObj(pt) &&
      isObj(pt.tiers) &&
      Object.entries(pt.tiers).every(
        ([id, n]) => id in PATHS && isInt(n) && n >= 0 && n <= PATHS[id]!.tiers.length,
      ) &&
      isStrs(pt.told),
    'paths',
  );
  need(isStrs(x.mastery) && x.mastery.every((k) => k in MASTERY || k in HYBRIDS), 'mastery');
  need(x.quirk === null || (typeof x.quirk === 'string' && x.quirk in QUIRKS), 'quirk');
  const sc = x.scene;
  need(
    isObj(sc) &&
      isNum(sc.old) &&
      sc.old >= 0 &&
      sc.old <= 100 &&
      isNum(sc.gym) &&
      sc.gym >= 0 &&
      sc.gym <= 100 &&
      Array.isArray(sc.stances) &&
      sc.stances.every(
        (y) =>
          isObj(y) &&
          typeof y.id === 'string' &&
          y.id in STANCES &&
          isInt(y.opt) &&
          y.opt >= 0 &&
          y.opt <= 3 &&
          isInt(y.day),
      ) &&
      Array.isArray(sc.echoes) &&
      sc.echoes.every(
        (y) =>
          isObj(y) &&
          typeof y.id === 'string' &&
          y.id in ECHOES &&
          typeof y.turned === 'boolean' &&
          isInt(y.day),
      ) &&
      isInt(sc.last) &&
      isInt(sc.echoLast),
    'scene',
  );
  const brd = x.board;
  need(
    isObj(brd) &&
      isInt(brd.week) &&
      brd.week >= 0 &&
      Array.isArray(brd.jobs) &&
      brd.jobs.every(
        (j) =>
          isObj(j) &&
          typeof j.id === 'string' &&
          j.id in BOARD_JOBS &&
          isInt(j.grade) &&
          typeof j.paid === 'boolean',
      ) &&
      isInt(brd.shifts0) &&
      isInt(brd.sessions),
    'board',
  );
  const yr = x.year;
  need(
    isObj(yr) &&
      isInt(yr.recapped) &&
      yr.recapped >= 0 &&
      (yr.home === 'none' || yr.home === 'armed' || (isInt(yr.home) && yr.home >= 0)),
    'year',
  );
  const lf = x.life;
  need(
    isObj(lf) &&
      isInt(lf.held) &&
      lf.held >= 0 &&
      isInt(lf.told) &&
      lf.told >= 0 &&
      (lf.retired === null ||
        (isObj(lf.retired) &&
          isInt(lf.retired.day) &&
          typeof lf.retired.forced === 'boolean' &&
          (lf.retired.home === undefined || typeof lf.retired.home === 'boolean'))),
    'life',
  );
  need(isObj(x.folks) && isInt(x.folks.calls) && x.folks.calls >= 0, 'folks');
  const fm = x.family;
  need(
    fm === null ||
      (isObj(fm) &&
        isInt(fm.gen) &&
        fm.gen >= 2 &&
        typeof fm.forebear === 'string' &&
        Array.isArray(fm.lines) &&
        fm.lines.every((l) => typeof l === 'string') &&
        typeof fm.coach === 'boolean'),
    'family',
  );
  const ro = x.romance;
  need(
    ro === null ||
      (isObj(ro) &&
        typeof ro.who === 'string' &&
        ro.who in PEOPLE &&
        isInt(ro.stage) &&
        ro.stage >= 1 &&
        isInt(ro.since) &&
        isInt(ro.beatDay) &&
        optInt(ro.over)),
    'romance',
  );
  const hb = x.habits;
  need(
    isObj(hb) &&
      ['goes', 'outdoor', 'fresh', 'tired', 'evening', 'dawn', 'easy', 'power'].every(
        (k) => isInt(hb[k]) && (hb[k] as number) >= 0,
      ),
    'habits',
  );
  const rec = x.record;
  need(isObj(rec) && Object.entries(rec).every(([k, v]) => !!recordById(k) && isInt(v) && v >= 0), 'record');
  const bk = x.booked;
  need(
    bk === null ||
      (isObj(bk) &&
        typeof bk.id === 'string' &&
        bk.id in EXPEDITIONS &&
        isInt(bk.day) &&
        (bk.partner === null || (typeof bk.partner === 'string' && bk.partner in PEOPLE)) &&
        isInt(bk.food) &&
        bk.food >= 0 &&
        typeof bk.ledge === 'boolean' &&
        typeof bk.stove === 'boolean'),
    'booked',
  );
  const sp = x.speed;
  need(
    isObj(sp) &&
      (sp.pb === null || (isNum(sp.pb) && sp.pb > 0)) &&
      isInt(sp.runs) &&
      sp.runs >= 0 &&
      isInt(sp.day),
    'speed',
  );
  need(x.mode === 'rope' || x.mode === 'solo', 'mode');
  need(x.soloing === null || (typeof x.soloing === 'string' && x.soloing in ROUTES), 'soloing');
  const dd = x.dead;
  need(dd === null || (isObj(dd) && typeof dd.route === 'string' && isInt(dd.day) && isNum(dd.hi)), 'dead');
  const dog = x.dog;
  need(
    dog === null ||
      (isObj(dog) && typeof dog.name === 'string' && isInt(dog.since) && pct(dog.fed) && pct(dog.bond)),
    'dog',
  );
  if (!isObj(x.people)) err.push('people');
  else for (const [id, p] of Object.entries(x.people)) need(isPerson(p), `people.${id}`);
  if (!isObj(x.routes)) err.push('routes');
  else
    for (const [id, r] of Object.entries(x.routes))
      err.push(...validateRoute(r).map((e) => `routes.${id}.${e}`));
  if (!Array.isArray(x.log)) err.push('log');
  else x.log.forEach((l, i) => need(isLogLine(l), `log[${i}]`));
  return err;
}

function validateClimber(x: unknown): string[] {
  if (!isObj(x)) return ['not an object'];
  const err: string[] = [];
  if (typeof x.name !== 'string') err.push('name');
  if (typeof x.start !== 'string' || !(x.start in STARTS || x.start === CARRIED)) err.push('start');
  const k = x.skills;
  if (!isObj(k)) err.push('skills');
  else
    for (const id of ['power', 'fingers', 'endurance', 'technique', 'head'])
      if (!isNum(k[id]) || (k[id] as number) < 0) err.push(`skills.${id}`);
  return err;
}

const optInt = (x: unknown) => x === undefined || isInt(x);
const isPerson = (x: unknown): x is PersonLog =>
  isObj(x) &&
  isInt(x.bond) &&
  x.bond >= 0 &&
  isInt(x.last) &&
  x.last >= 0 &&
  optInt(x.since) &&
  optInt(x.arc) &&
  optInt(x.beatDay) &&
  optInt(x.away) &&
  (x.ahead === undefined || typeof x.ahead === 'boolean') &&
  (x.talked === undefined || typeof x.talked === 'boolean') &&
  optInt(x.life) &&
  (x.sparked === undefined || typeof x.sparked === 'boolean') &&
  optInt(x.gave) &&
  optInt(x.heard) &&
  optInt(x.ledge) &&
  (x.invite === undefined ||
    (isObj(x.invite) &&
      isInt(x.invite.day) &&
      typeof x.invite.place === 'string' &&
      x.invite.place in PLACES &&
      isInt(x.invite.from)));

function validateRoute(x: unknown): string[] {
  if (!isObj(x)) return ['not an object'];
  const err: string[] = [];
  const need = (ok: boolean, what: string) => {
    if (!ok) err.push(what);
  };
  const r = x as Partial<Record<keyof RouteLog, unknown>>;
  need(isStrs(r.known), 'known');
  need(isStrs(r.told), 'told');
  need(isObj(r.pick) && Object.values(r.pick).every((v) => typeof v === 'string'), 'pick');
  need(isObj(r.falls) && Object.values(r.falls).every((v) => isInt(v) && v >= 0), 'falls');
  need(isInt(r.goes) && r.goes >= 0, 'goes');
  need(isInt(r.goesToday) && r.goesToday >= 0, 'goesToday');
  need(isNum(r.hi) && r.hi >= 0, 'hi');
  need(r.sent === null || isSend(r.sent), 'sent');
  need(typeof r.sentToday === 'boolean', 'sentToday');
  return err;
}

function isSend(x: unknown): x is SendRecord {
  return (
    isObj(x) &&
    isInt(x.day) &&
    isInt(x.go) &&
    (x.style === 'onsight' || x.style === 'flash' || x.style === 'redpoint')
  );
}

function isLogLine(x: unknown): x is LogLine {
  return isObj(x) && isInt(x.day) && isInt(x.min) && typeof x.text === 'string';
}
