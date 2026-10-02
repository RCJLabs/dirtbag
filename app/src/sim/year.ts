// The year (Phase 23.7): which one it is, a year's recap from what the game already keeps,
// and the Homecoming.

import { indoor, routeById } from './content/gym';
import { PEOPLE } from './content/people';
import { PLACES } from './content/places';
import { HOME, YEAR } from './dials';
import { tierOf } from './presence';
import type { GameState } from './types';

// Years done by a day: 0 through day 56, 1 from day 57.
export const yearsDone = (day: number): number => Math.floor((day - 1) / YEAR.days);

export interface YearRecap {
  n: number;
  sends: number;
  hardest: { name: string; grade: number; outside: boolean } | null;
  crags: number;
  firsts: number;
  record: number;
  trips: number;
  calls: number;
  cash: number;
}

// Year `n` (1 for days 1–56), from the days things happened on.
export function recapOf(s: GameState, n: number): YearRecap {
  const from = (n - 1) * YEAR.days + 1;
  const to = n * YEAR.days;
  const inYear = (d: number) => d >= from && d <= to;
  let sends = 0;
  let hardest: YearRecap['hardest'] = null;
  const crags = new Set<string>();
  for (const [id, l] of Object.entries(s.routes)) {
    if (!l.sent || !inYear(l.sent.day)) continue;
    const r = routeById(s.seed, id);
    if (!r || r.exped) continue;
    sends++;
    const outside = !indoor(r.place);
    if (outside && PLACES[r.place]?.crag) crags.add(r.place);
    if (!hardest || r.grade > hardest.grade)
      hardest = { name: s.firsts[r.id]?.name ?? r.name, grade: r.grade, outside };
  }
  return {
    n,
    sends,
    hardest,
    crags: crags.size,
    firsts: Object.values(s.firsts).filter((f) => !f.by && inYear(f.day)).length,
    record: Object.values(s.record).filter(inYear).length,
    trips: s.book.filter((t) => inYear(t.day)).length,
    calls: s.scene.stances.filter((x) => inYear(x.day)).length,
    cash: Math.round(s.cash),
  };
}

// A recap in lines, from its numbers; only what happened.
export function recapLines(r: YearRecap): string[] {
  const out: string[] = [];
  out.push(
    r.sends ? `${r.sends} line${r.sends > 1 ? 's' : ''} sent.` : 'Nothing sent. Some years are like that.',
  );
  if (r.hardest)
    out.push(`The hardest: ${r.hardest.name}, V${r.hardest.grade}${r.hardest.outside ? ', outside' : ''}.`);
  if (r.crags) out.push(`Sent at ${r.crags} crag${r.crags > 1 ? 's' : ''}.`);
  if (r.firsts) out.push(`${r.firsts} first ascent${r.firsts > 1 ? 's' : ''} with your name on.`);
  if (r.trips) out.push(`Home from ${r.trips} expedition${r.trips > 1 ? 's' : ''}.`);
  if (r.record) out.push(`${r.record} in the Record Book.`);
  if (r.calls) out.push(`${r.calls} call${r.calls > 1 ? 's' : ''} made at the crag.`);
  out.push(`$${r.cash} in hand.`);
  return out;
}

// The people close enough to come out for it.
export const homeCrowd = (s: GameState): string[] =>
  Object.entries(s.people)
    .filter(([id, p]) => PEOPLE[id] && tierOf(p.bond) >= HOME.tier)
    .map(([id]) => PEOPLE[id]!.name);

// Whether the Homecoming's yours to arm: not had, and enough people to come.
export const homeReady = (s: GameState): boolean =>
  typeof s.year.home !== 'number' && homeCrowd(s).length >= HOME.people;
