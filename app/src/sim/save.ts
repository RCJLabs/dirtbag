// Save files: a versioned envelope around the state, a migration registry, and a strict
// validator. The loader never repairs a save it doesn't understand and never returns a
// fresh game in its place: it says why it failed, and the caller keeps the bytes.
//
// Changing the shape of GameState means: bump SAVE_VERSION, register MIGRATIONS[old] that
// turns an old state into the new shape, and add a test that loads a real old save.

import { CARRIED, STARTS } from './climber';
import { GEAR } from './content/gear';
import { PLACES } from './content/places';
import { LIFESTYLE, SPOTS, TRAIN } from './dials';
import { JOBS } from './content/jobs';
import { ROUTES, WALLS } from './content/routes';
import { EXPEDITIONS } from './content/expeditions';
import type { GameState, LogLine, PersonLog, RouteLog, SendRecord } from './types';

export const SAVE_VERSION = 12;
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
          (f.by === undefined || typeof f.by === 'string'),
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
  need(typeof x.lifestyle === 'string' && x.lifestyle in LIFESTYLE, 'lifestyle');
  need(typeof x.spot === 'string' && x.spot in SPOTS, 'spot');
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
        isNum(e.energy) &&
        e.energy >= 0),
    'expedition',
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
