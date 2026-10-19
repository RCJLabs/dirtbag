// The valley's forecast (Phase 41): what the radio says each of the next few days will be,
// and how sure it is. A day's sky is a pure function of the seed (weather.ts), and so is a
// call: of the seed, the day it's for and how far out it's made. Nothing is stored, and the
// call for a day can change as the day comes closer, each one drawn afresh, as the
// expeditions' are. It comes true as often as it says it will: the season harness checks.

import { PLACES } from './content/places';
import { FORECAST } from './dials';
import { Rng } from './rng';
import { SKY_ORDER, skyAt, skyOdds, skyOn, type Sky } from './weather';

export type Sure = 'likely' | 'maybe';

export interface Call {
  day: number;
  sky: Sky;
  // The chance it's right: from the odds, said as `word`, never as a number.
  sure: number;
  // Today's needs no call: you can see it.
  word: Sure | null;
}

// How often a call this far out comes true: always today, `near` tomorrow, falling in a
// straight line to `far` on the last day the radio calls.
export function accuracy(lead: number): number {
  if (lead <= 0) return 1;
  const { days, near, far } = FORECAST;
  return near - ((near - far) * (Math.min(lead, days) - 1)) / Math.max(1, days - 1);
}

// The chance a call of `sky` is right. A wrong call is drawn from the other skies by their
// odds, so a call of a sky the season seldom has is more often a wrong one: of every way the
// day could go, the share that would have called this sky and been right.
function sureOf(odds: number[], sky: Sky, a: number): number {
  const i = SKY_ORDER.indexOf(sky);
  let wrong = 0;
  odds.forEach((w, t) => {
    if (t !== i && w > 0 && w < 1) wrong += w / (1 - w);
  });
  return a / (a + (1 - a) * wrong);
}

// What the radio says on day `from` of `day`'s sky: the valley's, or a place's own out of
// it.
export function callOn(seed: string, from: number, day: number, place?: string): Call {
  const at = place && PLACES[place]?.ownSky ? place : undefined;
  const truth = at ? skyAt(seed, day, at) : skyOn(seed, day);
  const lead = day - from;
  if (lead <= 0) return { day, sky: truth, sure: 1, word: null };
  const a = accuracy(lead);
  const odds = skyOdds(day, at);
  const rng = Rng.fromStream(seed, 'worldgen').derive(`call-${at ?? 'valley'}-${day}-${lead}`);
  let sky = truth;
  if (rng.next() >= a) {
    const others = odds.map((w, i) => (SKY_ORDER[i] === truth ? 0 : w));
    let r = rng.next() * others.reduce((x, y) => x + y, 0);
    for (let i = 0; i < others.length; i++) {
      if (!others[i]) continue;
      sky = SKY_ORDER[i]!;
      r -= others[i]!;
      if (r < 0) break;
    }
  }
  const sure = sureOf(odds, sky, a);
  return { day, sky, sure, word: sure >= FORECAST.likely ? 'likely' : 'maybe' };
}

// The radio's days: tomorrow on, as far as it calls.
export const forecastFrom = (seed: string, from: number, place?: string): Call[] =>
  Array.from({ length: FORECAST.days }, (_, i) => callOn(seed, from, from + i + 1, place));
