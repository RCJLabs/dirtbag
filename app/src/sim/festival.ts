// Phase 20.3 (Evan's calls, 19 Oct 2026): the crag day at Moonstone. Once a year in winter the
// old guard puts the trail back in the morning, a scramble runs on the boulders after (the most
// of them sent in the time wins), and that night there's a fire back at the Lot. Come in before
// the scramble and there are three ways in: pitch in, sign up, or just climb the crag, packed all
// day. The state keeps the year's day once you've been: the way you took, and in the scramble
// your scorecard, then where you placed. The numbers are FESTIVAL (dials.ts), the words
// content/festival.ts.

import { gradeOf } from './climber';
import { COMPETITORS } from './content/comps';
import { FESTIVAL_SAYS } from './content/festival';
import { PEOPLE } from './content/people';
import { PLACES } from './content/places';
import { ROUTES, type RouteDef } from './content/routes';
import { placing, rollTops, type Score } from './comps';
import { dexHurt, gradeOfPerson } from './curves';
import { FESTIVAL, KIT, YEAR } from './dials';
import { inEdition } from './edition';
import { crew } from './folks';
import { bodyNote, clockShort, fill, money, ordinal } from './format';
import { frankParks, RAY_GONE } from './lives';
import { Rng } from './rng';
import { sceneNote } from './scene';
import type { FestivalWay, GameState } from './types';
import { skyAt } from './weather';
import { yearsDone } from './year';

// The three ways in, in the card's order: the first never needs anything.
export const FESTIVAL_WAYS: FestivalWay[] = ['trail', 'scramble', 'climb'];

// When the scramble's over.
export const SCRAMBLE_END = FESTIVAL.scramble.from + FESTIVAL.scramble.min;

// The day it's set for in a year (from 0).
const setFor = (year: number): number => year * YEAR.days + FESTIVAL.on;

// The year's crag day: the day it's set for, or the first after it that's dry at Moonstone,
// `rain` days on at most; null when it rains through all of them, or in an edition without
// Moonstone. The place's own sky decides, so it's the same day whoever asks.
export function festivalDay(seed: string, year: number): number | null {
  if (!inEdition(FESTIVAL.at)) return null;
  for (let d = setFor(year); d <= setFor(year) + FESTIVAL.rain; d++)
    if (skyAt(seed, d, FESTIVAL.at) !== 'rain') return d;
  return null;
}

// Whether it's on, that day.
export const festivalOn = (seed: string, day: number): boolean => festivalDay(seed, yearsDone(day)) === day;

// Whether the week ahead shows it on a day: the day it's set for (only the day itself says
// whether it's dry).
export const festivalSet = (day: number): boolean => inEdition(FESTIVAL.at) && day === setFor(yearsDone(day));

// Whether you could be there: graded up for Moonstone, and the trip paid for.
export function canGo(s: GameState): boolean {
  const p = PLACES[FESTIVAL.at];
  return (
    !!p && gradeOf(s.climber.skills) >= (p.minGrade ?? 0) && (!p.unlock || s.unlocked.includes(FESTIVAL.at))
  );
}

// The morning's word on it, wherever you wake: on today, or put off for rain (said only to
// someone who could go), or nothing.
export function festivalMorning(s: GameState): string | null {
  if (!inEdition(FESTIVAL.at) || !s.climber.name) return null;
  const year = yearsDone(s.day);
  const set = setFor(year);
  if (s.day < set || s.day > set + FESTIVAL.rain) return null;
  const on = festivalDay(s.seed, year);
  if (on === s.day)
    return fill(canGo(s) ? FESTIVAL_SAYS.morning : FESTIVAL_SAYS.notYet, {
      time: clockShort(FESTIVAL.scramble.from),
    });
  if ((on !== null && s.day > on) || !canGo(s)) return null;
  return s.day === set + FESTIVAL.rain ? FESTIVAL_SAYS.washed : FESTIVAL_SAYS.rained;
}

// Whether coming in to Moonstone now brings the day's card: it's on, you haven't been yet today,
// and the scramble hasn't started.
export const festivalCard = (s: GameState): boolean =>
  s.at === FESTIVAL.at &&
  festivalOn(s.seed, s.day) &&
  s.festival?.day !== s.day &&
  s.min < FESTIVAL.scramble.from;

// Whether coming in now is too late for the card: it's on, and the scramble's started.
export const festivalLate = (s: GameState): boolean =>
  s.at === FESTIVAL.at &&
  festivalOn(s.seed, s.day) &&
  s.festival?.day !== s.day &&
  s.min >= FESTIVAL.scramble.from;

// Why a way in isn't open to you, or null. The trail work and climbing never need anything.
export function festivalBlocked(s: GameState, way: FestivalWay): string | null {
  if (way === 'scramble' && s.cash < FESTIVAL.scramble.fee) return 'Not the money for the entry';
  return null;
}

// Whoever leads the trail work: Ray, while he's still coming out, then Frank, while his truck
// runs; or one of the old guard you don't know by name.
export function trailLead(s: GameState): string {
  if (s.people.ray && s.day < RAY_GONE) return PEOPLE.ray!.name;
  if (s.people.frank && s.day < (frankParks(s.people.frank) ?? Infinity)) return PEOPLE.frank!.name;
  return FESTIVAL_SAYS.oldHand;
}

// What a way in does, in words from its numbers.
export function festivalNote(way: FestivalWay): string {
  if (way === 'scramble')
    return fill(FESTIVAL_SAYS.scramble.note, {
      time: clockShort(FESTIVAL.scramble.from),
      till: clockShort(SCRAMBLE_END),
      second: money(FESTIVAL.scramble.purse[0]),
      third: money(FESTIVAL.scramble.purse[1]),
    });
  if (way === 'climb') return FESTIVAL_SAYS.climb.note;
  return `${bodyNote({ energy: -FESTIVAL.trail.energy, fed: -FESTIVAL.trail.fed })}. ${sceneNote({ old: FESTIVAL.trail.old })}`;
}

// What happened, in words: the way's own line.
export const festivalOut = (s: GameState, way: FestivalWay): string =>
  fill(FESTIVAL_SAYS[way].out, { who: trailLead(s), time: clockShort(FESTIVAL.scramble.from) });

// ---- The scramble ----

// What's on the sheet: the crag's boulders that have been climbed. An open project isn't, but
// sent in the time it's on your card.
export const scrambleProblems = (): RouteDef[] =>
  Object.values(ROUTES).filter((r) => r.place === FESTIVAL.at && r.disc === 'boulder' && !r.open);

// Your scorecard while it's yours to hand in, or null.
export const scrambling = (s: GameState): NonNullable<GameState['festival']> | null =>
  s.festival?.way === 'scramble' && s.festival.place === undefined ? s.festival : null;

// Whether a go on a line counts: you're signed up, it's on, and it's one of the crag's boulders.
export function scrambleCounts(s: GameState, r: RouteDef): boolean {
  const f = scrambling(s);
  return (
    !!f &&
    f.day === s.day &&
    s.at === FESTIVAL.at &&
    r.place === FESTIVAL.at &&
    r.disc === 'boulder' &&
    s.min >= FESTIVAL.scramble.from &&
    s.min < SCRAMBLE_END
  );
}

// Whether your scorecard's due in: the scramble's over, you've left it once it started, or the
// day's gone.
export function scrambleDue(s: GameState): boolean {
  const f = scrambling(s);
  if (!f) return false;
  return (
    s.day !== f.day || s.min >= SCRAMBLE_END || (s.at !== FESTIVAL.at && s.min >= FESTIVAL.scramble.from)
  );
}

// Your scorecard as a comp's: the problems topped, and the goes they took between them.
export function scrambleCard(s: GameState): Score {
  const tops = Object.values(s.festival?.tops ?? {});
  return { name: s.climber.name, tops: tops.length, goes: tops.reduce((a, b) => a + b, 0) };
}

// "4 problems in 9 goes".
export const cardSaid = (c: Score): string =>
  `${c.tops} ${c.tops === 1 ? 'problem' : 'problems'} in ${c.goes} ${c.goes === 1 ? 'go' : 'goes'}`;

// The field, drawn for the day: names from the comps' pool, each climbing at a grade between
// the dials' and topping what that grade tops in its goes, as a comp's field does; and Dex, if
// you know him and he's fit, at his own grade.
export function scrambleField(s: GameState, day: number): Score[] {
  const r = Rng.fromStream(s.seed, 'events').derive(`scramble-${day}`);
  const set = scrambleProblems();
  const [lo, hi] = FESTIVAL.scramble.grades;
  const names = [...COMPETITORS];
  const field: Score[] = [];
  for (let i = 0; i < FESTIVAL.scramble.field && names.length; i++) {
    const name = names.splice(r.int(0, names.length - 1), 1)[0]!;
    field.push({ ...rollTops(r, r.float(lo, hi), set, FESTIVAL.scramble.goes), name });
  }
  if (s.people.dex && !dexHurt(s.seed, day))
    field.push({
      ...rollTops(r, gradeOfPerson(s.seed, 'dex', day) ?? hi, set, FESTIVAL.scramble.goes),
      name: PEOPLE.dex!.name,
    });
  return field;
}

// What a place on the podium wins: new shoes for first (or, if yours are new, what they cost),
// and cash for second and third. None of it's more than a week of the café's shifts.
export function scramblePrize(s: GameState, place: number): { shoes: boolean; cash: number } {
  if (place === 1)
    return (s.gear.shoes ?? 0) < 100 ? { shoes: true, cash: 0 } : { shoes: false, cash: KIT.shoes.price };
  return { shoes: false, cash: FESTIVAL.scramble.purse[place - 2] ?? 0 };
}

// The scorecard handed in: where you placed of how many, what it won, and the line that says so.
export function scrambleResult(s: GameState): {
  place: number;
  of: number;
  prize: { shoes: boolean; cash: number } | null;
  said: string;
} {
  const f = s.festival!;
  const you = scrambleCard(s);
  const field = scrambleField(s, f.day);
  const place = placing(you, field);
  const of = field.length + 1;
  const prize = place <= 3 ? scramblePrize(s, place) : null;
  const ranked = [...field].sort((a, b) => b.tops - a.tops || a.goes - b.goes);
  const said = [
    fill(FESTIVAL_SAYS.scrambled, { card: cardSaid(you), place: ordinal(place), of }),
    place === 1
      ? FESTIVAL_SAYS.won
      : place <= 3
        ? FESTIVAL_SAYS.podium
        : place <= of / 2
          ? FESTIVAL_SAYS.mid
          : FESTIVAL_SAYS.low,
  ];
  if (prize?.shoes) said.push(FESTIVAL_SAYS.shoes);
  else if (prize?.cash && place === 1) said.push(`${FESTIVAL_SAYS.shoesPaid} ${money(prize.cash)}.`);
  else if (prize?.cash) said.push(`${money(prize.cash)}.`);
  const top = ranked[0];
  if (top && place > 1) said.push(fill(FESTIVAL_SAYS.wonBy, { name: top.name, n: top.tops }));
  // Dex, if he was in it and didn't win it: ahead of you or not (a tie goes your way, as it
  // does on the sheet).
  const dex = field.find((x) => x.name === PEOPLE.dex!.name);
  if (dex && !(place > 1 && dex === top))
    said.push(
      dex.tops > you.tops || (dex.tops === you.tops && dex.goes < you.goes)
        ? FESTIVAL_SAYS.dexAhead
        : FESTIVAL_SAYS.dexBehind,
    );
  return { place, of, prize, said: said.join(' ') };
}

// ---- The night ----

// Who's at the fire: your people who are around, as at a holiday, and the old guard you know,
// who never miss it while they're still about.
export function fireWith(s: GameState): string[] {
  const old = ['ray', 'frank'].filter((w) => s.people[w] && !(w === 'ray' && s.day >= RAY_GONE));
  return [...new Set([...crew(s), ...old])];
}

// The fire's lines: the day you had, and each of them there.
export function fireSaid(way: FestivalWay, who: string[], lead: string): string {
  const here = who.flatMap((w) => (FESTIVAL_SAYS.with[w] ? [FESTIVAL_SAYS.with[w]!] : []));
  return [fill(FESTIVAL_SAYS.fire[way], { who: lead }), ...(here.length ? here : [FESTIVAL_SAYS.alone])].join(
    ' ',
  );
}
