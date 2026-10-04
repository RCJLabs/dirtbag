// Phase 25.6: texting the crew. Each partner you know answers: where they'll be today and
// when, or why not, in their own words. Late in the evening they answer for tomorrow.

import { walk } from './ambient';
import { isNight } from './cond';
import { AWAY_TEXT, BUSY, LATE_TEXT, OUT_TEXT, SULK_TEXT } from './content/texts';
import { PLACES } from './content/places';
import { PEOPLE } from './content/people';
import { DAY } from './dials';
import { clockShort, fill } from './format';
import { stintOn } from './lives';
import { DAY_END, knows, PARTNERS, whereIs } from './presence';
import type { GameState } from './types';

// Their first stretch out, from a minute on a day: where, from when, till when.
function firstStay(s: GameState, who: string, day: number, from: number) {
  let at: string | null = null;
  let start = 0;
  for (let m = from; m < DAY_END; m++) {
    const here = whereIs(s.seed, who, day, m, s.people[who], s.people);
    if (!at && here) [at, start] = [here, m];
    else if (at && here !== at) return { at, from: start, till: m };
  }
  return at ? { at, from: start, till: DAY_END } : null;
}

// One partner's text back: where they'll be, or why not.
export function textBack(s: GameState, who: string): string {
  // Nothing left of today for them, in the evening: they answer for tomorrow.
  const today = firstStay(s, who, s.day, s.min);
  const late = !today && isNight(s.min);
  const day = late ? s.day + 1 : s.day;
  const stay = today ?? (late ? firstStay(s, who, day, DAY.wakeMin) : null);
  if (stay) {
    const place = PLACES[stay.at]?.name ?? stay.at;
    return late
      ? fill(LATE_TEXT, { place, from: clockShort(stay.from) })
      : fill(OUT_TEXT, { place, from: clockShort(stay.from), till: clockShort(stay.till) });
  }
  const p = s.people[who];
  const pool =
    p?.avoid && p.away !== undefined && day < p.away
      ? SULK_TEXT
      : ((stintOn(s.seed, who, day) ? AWAY_TEXT[stintOn(s.seed, who, day)!.kind] : null) ??
        (p?.away !== undefined && day < p.away ? AWAY_TEXT.away : (BUSY[who] ?? AWAY_TEXT.away)));
  return walk(s.seed, `text-${who}`, pool, day);
}

// Everyone you could text: partners you know, closest first.
export const crewToText = (s: GameState): string[] =>
  PARTNERS.filter((w) => knows(s, w) && BUSY[w]).sort(
    (a, b) =>
      (s.people[b]?.bond ?? 0) - (s.people[a]?.bond ?? 0) || PARTNERS.indexOf(a) - PARTNERS.indexOf(b),
  );

// The lines for the sheet: a name and what they sent.
export const crewTexts = (s: GameState): string[] =>
  crewToText(s).map((w) => `${PEOPLE[w]?.name ?? w}: “${textBack(s, w)}”`);
