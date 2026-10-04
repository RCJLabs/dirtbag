// What the things in a scene are called, for the keyboard and screen readers: the words on
// the invisible button over each one.
import {
  gradeLabel,
  lineGrade,
  lineName,
  PEOPLE,
  routeOfId,
  wallAt,
  TALK,
  THINGS,
  type GameState,
  WALLS,
} from '../sim';
import type { Hot } from '../view/layout';

const SHEET_NAME = {
  van: 'Your van',
  cragVan: 'Your van',
  desk: 'The desk',
  board: 'The board',
  speed: 'The speed wall',
} as const;

export function hotLabel(s: GameState, h: Hot): string {
  const u = h.use;
  if ('sheet' in u) return SHEET_NAME[u.sheet];
  if ('talk' in u) return PEOPLE[TALK[u.talk]?.who ?? '']?.name ?? 'Someone';
  if ('thing' in u) return u.thing === 'scout' && s.dog ? s.dog.name : (THINGS[u.thing]?.name ?? 'Something');
  if ('wall' in u) return WALLS[u.wall]?.name ?? 'A wall';
  if ('crowd' in u) return 'Someone in the crowd';
  if ('route' in u) {
    const r = routeOfId(s, u.route);
    return r ? `${lineName(s, r)}, ${lineGrade(s, r)}${s.routes[r.id]?.sent ? ', sent' : ''}` : 'A line';
  }
  const r = wallAt(s, s.at)[u.problem];
  return r ? `${lineName(s, r)}, ${gradeLabel(r)}${s.routes[r.id]?.sent ? ', sent' : ''}` : 'A problem';
}
