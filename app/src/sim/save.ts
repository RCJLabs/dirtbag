// Save files: a versioned envelope around the state, a migration registry, and a strict
// validator. The loader never repairs a save it doesn't understand and never returns a
// fresh game in its place: it says why it failed, and the caller keeps the bytes.
//
// Changing the shape of GameState means: bump SAVE_VERSION, register MIGRATIONS[old] that
// turns an old state into the new shape, and add a test that loads a real old save.

import { PLACES } from './content/places';
import type { GameState, LogLine, RouteLog, SendRecord } from './types';

export const SAVE_VERSION = 1;
const FORMAT = 'dirtbag';

export interface SaveFile {
  format: typeof FORMAT;
  v: number;
  // The build that wrote it, for bug reports. Loading never depends on it.
  app: string;
  state: GameState;
}

// MIGRATIONS[n] turns a version-n state into version n+1. Empty until the shape first
// changes; the loader and its tests already run the chain.
export type Migration = (state: unknown) => unknown;
export const MIGRATIONS: Record<number, Migration> = {};

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
  need(typeof x.at === 'string' && x.at in PLACES, 'at');
  need(x.x === null || isNum(x.x), 'x');
  need(isStrs(x.today), 'today');
  if (!isObj(x.routes)) err.push('routes');
  else
    for (const [id, r] of Object.entries(x.routes))
      err.push(...validateRoute(r).map((e) => `routes.${id}.${e}`));
  if (!Array.isArray(x.log)) err.push('log');
  else x.log.forEach((l, i) => need(isLogLine(l), `log[${i}]`));
  return err;
}

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
