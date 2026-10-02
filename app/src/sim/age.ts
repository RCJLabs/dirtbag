// A life's clock (Phase 16.1): how old you are, when hanging it up is yours, when your body
// calls it, and the tally of a climbing life at the end.

import { CALLINGS } from './content/callings';
import { EXPEDITIONS } from './content/expeditions';
import { indoor, routeById } from './content/gym';
import { OPEN_PATHS, PATHS } from './content/paths';
import { PEOPLE } from './content/people';
import { PLACES } from './content/places';
import { AGE, HOME } from './dials';
import { originOf } from './identity';
import { actOf } from './story';
import { STORY } from './content/story';
import { tierOf } from './presence';
import type { GameState } from './types';

export const startAge = (s: GameState): number => AGE.start + (originOf(s)?.fx.age ?? 0);

// Your age today: a year of it every AGE.days days, less any clock an old save held back.
export const ageOf = (s: GameState, day = s.day): number =>
  startAge(s) + Math.floor(Math.max(0, day - 1 - s.life.held) / AGE.days);

// The first day you're `age`.
export const dayAtAge = (s: GameState, age: number): number =>
  Math.max(1, (age - startAge(s)) * AGE.days + 1 + s.life.held);

// Why you can't hang it up now, or null when you can.
export function retireBlocked(s: GameState): string | null {
  if (!s.climber.name) return 'Make a climber first.';
  if (s.life.retired) return 'You already have.';
  // After The Line (Phase 16.3), hanging it up is yours whatever your age.
  if (ageOf(s) < AGE.from && actOf(s) <= STORY.length)
    return `Not before ${AGE.from}. There’s too much left in you.`;
  if (s.expedition || s.wall) return 'Get down first.';
  return null;
}

// On The Line (Phase 16.2, Evan's call): from Act V your body waits on you. No countdown and
// no forced end; hanging it up stays yours.
export const bodyWaits = (s: GameState): boolean => actOf(s) >= 5;

// Days left before your body calls it, once the countdown's on; null before then.
export function daysLeft(s: GameState): number | null {
  if (s.life.retired || bodyWaits(s) || ageOf(s) < AGE.warn) return null;
  return Math.max(0, dayAtAge(s, AGE.forced) - s.day);
}

// A morning's line, on the birthdays that change something; null on the rest.
export function birthdayLine(s: GameState): string | null {
  const a = ageOf(s);
  if (a === AGE.from)
    return `${AGE.from}. Hanging it up is on the You page now, whenever you want it. Nobody’s making you.`;
  if ((a === AGE.warn || a === AGE.forced - 1) && !bodyWaits(s)) {
    const d = daysLeft(s) ?? 0;
    return `${a}. Your body’s started keeping count: ${d} days before it calls it at ${AGE.forced}, whatever you’ve got left on your list.`;
  }
  return null;
}

export interface Tally {
  name: string;
  age: number;
  years: number;
  forced: boolean;
  hardest: { name: string; grade: number; outside: boolean } | null;
  sends: number;
  outside: number;
  crags: number;
  firsts: number;
  myth: string | null;
  summits: string[];
  record: number;
  scars: number;
  calling: { name: string; rungs: number } | null;
  paths: { name: string; tiers: number }[];
  never: string[];
  people: string[];
  dogs: string[];
}

// A climbing life, from what the game kept.
export function tallyOf(s: GameState): Tally {
  let hardest: Tally['hardest'] = null;
  let sends = 0;
  let outside = 0;
  const crags = new Set<string>();
  for (const [id, l] of Object.entries(s.routes)) {
    if (!l.sent) continue;
    const r = routeById(s.seed, id);
    if (!r || r.exped) continue;
    sends++;
    const out = !indoor(r.place);
    if (out) outside++;
    if (out && PLACES[r.place]?.crag) crags.add(r.place);
    if (!hardest || r.grade > hardest.grade)
      hardest = { name: s.firsts[r.id]?.name ?? r.name, grade: r.grade, outside: out };
  }
  const mine = Object.entries(s.firsts).filter(([, f]) => !f.by);
  // The hardest first ascent of a myth, by its name.
  const myth =
    mine
      .map(([id, f]) => ({ f, r: routeById(s.seed, id) }))
      .filter(({ r }) => (r?.grade ?? 0) >= 18)
      .map(({ f }) => f.name)[0] ?? null;
  const calling = s.calling.id ? CALLINGS[s.calling.id] : undefined;
  const taken = Object.keys(s.paths.tiers).filter((id) => (s.paths.tiers[id] ?? 0) > 0);
  return {
    name: s.climber.name,
    age: ageOf(s),
    years: ageOf(s) - startAge(s),
    forced: !!s.life.retired?.forced,
    hardest,
    sends,
    outside,
    crags: crags.size,
    firsts: mine.length,
    myth,
    summits: [
      ...new Set(s.book.filter((t) => t.end === 'summit').map((t) => EXPEDITIONS[t.id]?.name ?? t.id)),
    ],
    record: Object.keys(s.record).length,
    scars: s.scars.length,
    calling: calling ? { name: calling.name, rungs: s.calling.rungs.length } : null,
    paths: taken.map((id) => ({ name: PATHS[id]!.name, tiers: s.paths.tiers[id]! })),
    never: OPEN_PATHS.filter((id) => !taken.includes(id)).map((id) => PATHS[id]!.name),
    people: Object.entries(s.people)
      .filter(([id, p]) => PEOPLE[id] && tierOf(p.bond) >= HOME.tier)
      .map(([id]) => PEOPLE[id]!.name),
    dogs: [...s.dogs.map((d) => d.name), ...(s.dog ? [s.dog.name] : [])],
  };
}

// One line for the whole of it: v0.956's epitaph, minus the rep and the sponsors it hasn't got.
export function epitaph(t: Tally): string {
  if (t.myth) return 'You put up a first ascent that’ll outlive you.';
  if (t.summits.length) return 'You stood on top of something most people only see on a poster.';
  if (t.firsts) return 'You left first ascents with your name on them.';
  if ((t.hardest?.grade ?? 0) >= 11) return 'You climbed harder than most ever will.';
  return 'A life lived on rock. No regrets.';
}

const n = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;
const list = (xs: string[]) =>
  xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

// The tally in lines, only what happened, from its numbers.
export function tallyLines(t: Tally): string[] {
  const out: string[] = [];
  out.push(
    t.sends
      ? `${n(t.sends, 'line')} sent, ${t.outside} of them outside${t.crags ? `, at ${n(t.crags, 'crag')}` : ''}.`
      : 'Nothing sent. You were there for the life, not the ticks.',
  );
  if (t.hardest)
    out.push(`The hardest: ${t.hardest.name}, V${t.hardest.grade}${t.hardest.outside ? ', outside' : ''}.`);
  if (t.firsts)
    out.push(`${n(t.firsts, 'first ascent')} with your name on${t.myth ? `, ${t.myth} among them` : ''}.`);
  if (t.summits.length) out.push(`Summits: ${list(t.summits)}.`);
  if (t.calling) out.push(`${t.calling.name}: ${t.calling.rungs} of 3.`);
  if (t.paths.length)
    out.push(
      `The roads you took: ${list(t.paths.map((p) => `${p.name}${p.tiers > 1 ? `, ${p.tiers} tiers` : ''}`))}.`,
    );
  if (t.never.length) out.push(`You never walked ${list(t.never)}. Somebody else did.`);
  if (t.scars) out.push(`${n(t.scars, 'old injury', 'old injuries')} you still feel when it rains.`);
  // The people and the dog are the epilogue's (Phase 16.4).
  out.push(`${n(t.record, 'entry', 'entries')} in the Record Book.`);
  return out;
}
