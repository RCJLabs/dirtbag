// What the send card says, from the save: the line as it goes by, how and when you sent it,
// and who got there first. Every word and number comes from where the game's own do.

import { byName, lineGrade, lineName, PLACES, routeOfId, seasonOf, SEND_NAME, type GameState } from '../sim';
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
