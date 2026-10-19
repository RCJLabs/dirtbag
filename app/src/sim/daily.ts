// Phase 45: the problem of the day. A date, as the player's device reads it (YYYY-MM-DD),
// fixes a day: a boulder at a crag your edition has, a climber made for it, the season and
// the sky. The same date is the same day on any device running the same build. It's played in
// its own save slot (game/persist.ts), never the career's, and ends when the line goes or
// nothing more can be tried today.

import { needFor } from './climber';
import { PLACES } from './content/places';
import { ROUTES, type RouteDef } from './content/routes';
import { DAILY, DAY, YEAR } from './dials';
import { inEdition } from './edition';
import { act, goBlocked, newGame } from './game';
import { Rng } from './rng';
import type { GameState, SendStyle } from './types';

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// A date that's on the calendar, written YYYY-MM-DD.
export function isDate(date: string): boolean {
  const m = DATE.exec(date);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
  return !!days && d >= 1 && d <= days;
}

// A date as the day says it: 19 October 2026, or 19 Oct where room's short.
export function dateLabel(date: string, short = false): string {
  const [y, m, d] = date.split('-').map(Number);
  const month = MONTHS[(m ?? 1) - 1] ?? '';
  return short ? `${d} ${month.slice(0, 3)}` : `${d} ${month} ${y}`;
}

// A day's seed, and the date a day's state was made for (null for a career's).
export const daySeed = (date: string): string => `day:${date}`;
export const dateOf = (s: Pick<GameState, 'seed'>): string | null =>
  s.seed.startsWith('day:') ? s.seed.slice(4) : null;

// The boulders a day can be on: at a crag your edition has and the map shows, never an open
// project, in the order of their ids. Whether one can be climbed as it stands (cleaned,
// readable, in season, dry) is the day's pick's to find out.
export function dayLines(): RouteDef[] {
  return Object.values(ROUTES)
    .filter(
      (r) =>
        r.disc === 'boulder' &&
        !r.open &&
        !r.hiddenUntil &&
        !r.exped &&
        !!PLACES[r.place]?.crag &&
        !PLACES[r.place]?.hidden &&
        inEdition(r.place),
    )
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

// The name the day's climber goes by: it's you, whoever you are.
export const DAY_CLIMBER = 'You';

// The climber for the day: everyone gets the same one, every skill DAILY.under grades below
// the line (a project, not a flash), fresh, at the crag at first light.
function stateFor(date: string, line: RouteDef, day: number): GameState {
  const s = act(newGame(daySeed(date)), { t: 'create', name: DAY_CLIMBER, start: 'allrounder' }).state;
  const level = Math.round(needFor(Math.max(0, line.grade - DAILY.under)) * 100) / 100;
  return {
    ...s,
    day,
    min: DAY.firstMin,
    at: line.place,
    x: null,
    energy: 100,
    skin: 100,
    fed: 100,
    today: ['crag'],
    climber: {
      ...s.climber,
      skills: { power: level, fingers: level, endurance: level, technique: level, head: level },
    },
  };
}

// The day a date makes: a line drawn from the date, and a day of the year it can be climbed
// on at first light (in season, not soaked, the crag open), drawn from the date too. A line
// that can't be climbed on any day of the year hands over to the next.
export function dayOf(date: string): { route: string; day: number } {
  const r = Rng.fromStream(daySeed(date), 'worldgen').derive('problem-of-the-day');
  const lines = dayLines();
  const first = r.int(0, lines.length - 1);
  const from = r.int(0, YEAR.days - 2);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[(first + i) % lines.length]!;
    for (let k = 0; k < YEAR.days - 1; k++) {
      // Days 2 to 56: the first morning is always prime, and the year's recap waits past 56.
      const day = 2 + ((from + k) % (YEAR.days - 1));
      if (!goBlocked(stateFor(date, line, day), line)) return { route: line.id, day };
    }
  }
  throw new Error(`No boulder in this edition can be climbed on ${date}`);
}

// The day's state, fresh.
export function dailyState(date: string): GameState {
  const { route, day } = dayOf(date);
  return stateFor(date, ROUTES[route]!, day);
}

// How the day's going on its line: the goes it took (a lap after the send doesn't count),
// how it went if it went, and the highest move reached.
export interface DayResult {
  route: string;
  goes: number;
  sent: SendStyle | null;
  hi: number;
  moves: number;
}
export function dayResult(s: GameState, route: string): DayResult {
  const L = s.routes[route];
  return {
    route,
    goes: L?.sent?.go ?? L?.goes ?? 0,
    sent: L?.sent?.style ?? null,
    hi: L?.sent ? (ROUTES[route]?.moves ?? 0) : (L?.hi ?? 0),
    moves: ROUTES[route]?.moves ?? 0,
  };
}

// Goes, said: "1 go", "3 goes", "no goes".
export const goesSaid = (n: number): string => (n ? `${n} go${n === 1 ? '' : 'es'}` : 'no goes');

// The day's over once the line's gone, or once nothing more can be tried on it today: dark,
// spent, skinned, hurt or fried.
export const dayOver = (s: GameState, route: string): boolean =>
  !!s.routes[route]?.sent || goBlocked(s, ROUTES[route]!) !== null;
