// What the send card says, from the save: the line as it goes by, how and when you sent it,
// and who got there first. Every word and number comes from where the game's own do.

import {
  byName,
  EXPEDITIONS,
  expedPitches,
  lineGrade,
  lineName,
  PEOPLE,
  PLACES,
  routeOfId,
  seasonOf,
  SEND_NAME,
  type GameState,
} from '../sim';
import type { Card } from '../view/paint/card';

// The card for a line you've sent, from your first send of it; none for one you haven't.
export function cardOf(s: GameState, route: string): Card | null {
  const r = routeOfId(s, route);
  const sent = s.routes[route]?.sent;
  if (!r || !sent) return null;
  const fa = s.firsts[route];
  return {
    route: r,
    name: lineName(s, r),
    grade: lineGrade(s, r),
    style: sent.style === 'redpoint' ? `${SEND_NAME.redpoint}, go ${sent.go}` : SEND_NAME[sent.style],
    where: PLACES[r.place]?.name ?? r.place,
    when: `Day ${sent.day}, ${seasonOf(sent.day)}`,
    who: s.climber.name,
    fa: fa ? { mine: !fa.by, by: fa.by ? byName(fa.by) : s.climber.name } : null,
  };
}

// Phase 25.7: the card for a trip in the book, drawn on the pitch you got to: the summit's,
// or your high point's. None for a trip that never left the ground.
export function tripCardOf(s: GameState, i: number): Card | null {
  const t = s.book[i];
  const r = t && t.high > 0 ? expedPitches(t.id)[t.high - 1] : undefined;
  if (!t || !r) return null;
  const e = EXPEDITIONS[t.id]!;
  const summit = t.end === 'summit';
  const partner = t.partner ? (PEOPLE[t.partner]?.name ?? t.partner) : null;
  return {
    route: r,
    name: summit ? e.objective : `${e.objective}, pitch ${t.high}`,
    grade: lineGrade(s, r),
    style: summit ? 'Summit' : `High point, ${t.high} of ${e.pitches}`,
    where: `${e.name}, ${e.region}`,
    when: `Day ${t.day}, ${seasonOf(t.day)}`,
    who: partner ? `${s.climber.name} and ${partner}` : s.climber.name,
    fa: null,
  };
}

// The trip in the book a card would be drawn from, for an objective: the summit, or else
// the highest you got.
export function bestTrip(s: GameState, id: string): number | null {
  let best: number | null = null;
  for (let i = 0; i < s.book.length; i++) {
    const t = s.book[i]!;
    if (t.id !== id || t.high === 0) continue;
    const b = best === null ? null : s.book[best]!;
    if (!b || (t.end === 'summit' && b.end !== 'summit') || (b.end !== 'summit' && t.high > b.high)) best = i;
  }
  return best;
}

// What the card says in words, for a screen reader and for the message it's shared with.
export const cardText = (c: Card): string =>
  `${c.name}, ${c.grade}. ${c.style}. ${c.where}, ${c.when.toLowerCase()}.`;

// "dirtbag-highball-arete.png": the name without its accents or punctuation.
export const cardFile = (c: Card): string =>
  `dirtbag-${
    c.name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'send'
  }.png`;
