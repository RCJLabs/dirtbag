// Conditions content can ask about, as data. Every field present must hold. A small fixed
// vocabulary keeps content JSON-shaped and keeps rules out of content files.

import { gradeOf } from './climber';
import { PLACES } from './content/places';
import { gradeOfPerson } from './curves';
import { ARC, DAY, DOG, MONEY, type VanPart } from './dials';
import { repairCost } from './van';
import { clockShort, fill } from './format';
import { benchedUntil, isPosted } from './jobs';
import type { GameState } from './types';
import { conditionsAt, skyOn, type Sky } from './weather';

export interface Cond {
  night?: boolean; // true: only at night; false: only by day
  before?: number; // clock earlier than this (minutes since midnight)
  from?: number; // clock at or after this
  pay?: number; // this much can go on the card (cash plus what the card will still take)
  energy?: number; // at least
  skin?: number; // at least
  fed?: number; // at least
  today?: string; // a daily flag is set
  notToday?: string; // a daily flag is not set
  knows?: string; // "route/beta" is known
  notKnows?: string;
  sentToday?: string; // route id sent today
  wentToday?: string; // route id tried today
  met?: string; // you've met this person
  notMet?: string;
  sky?: Sky; // today's weather
  arc?: string; // "who/n": beat n of their arc is due (bond reached, days since the last)
  bond?: string; // "who/n": your bond with them is at least n
  grade?: number; // your grade is at least this
  open?: string; // that place's rock is climbable today
  outside?: boolean; // true: at a crag; false: anywhere else
  metToday?: string; // you met this person today
  racing?: boolean; // a first-ascent race is on
  lead?: string; // "who/n": you climb at least n grades harder than them
  trail?: string; // "who/n": they climb at least n grades harder than you
  dog?: boolean; // you have a dog
  dogOffer?: boolean; // Scout's ready to pick you
  dogFedBelow?: number; // your dog's food is under this
  has?: string; // you own this gear (content/gear.ts), with some left
  hasNot?: string; // you don't
  gearBelow?: string; // "id/n": that gear's condition or uses are under n
  weekend?: boolean; // true: only on a weekend (the swap meet); false: only on a weekday
  unlocked?: string; // you've paid for that place's haul
  posted?: string; // that job has a shift posted today (content/jobs.ts)
  hired?: string; // that job hasn't let you go, or has taken you back
  worn?: VanPart; // that part of the van could use the garage (under 95)
  payVan?: VanPart; // the card covers the garage's bill for that part
  stock?: string; // a serving of that ingredient in the pantry (Phase 22.3)
}

// The last two days of every seven are the weekend: the week's bills land on its last night.
export const isWeekend = (day: number): boolean => day % 7 === 6 || day % 7 === 0;

// How many grades you climb above someone today (negative when they're ahead).
export function leadOver(s: GameState, who: string): number {
  return gradeOf(s.climber.skills) - (gradeOfPerson(s.seed, who, s.day) ?? 0);
}

const ref = (r: string): [string, number] => {
  const [who, n] = r.split('/');
  return [who ?? '', Number(n)];
};

// A condition an act needs, with the line shown when it fails. `why` may use {t}, the
// clock time in the condition, so the words can't drift from the number.
export interface Need extends Cond {
  why?: string;
}

// The card: how much more it will take before it's declined.
export const headroom = (s: GameState): number => s.cash + MONEY.cardLimit;

export const isNight = (min: number): boolean => min >= DAY.nightFrom || min % (24 * 60) < DAY.nightUntil;

function knows(s: GameState, ref: string): boolean {
  const [route, beta] = ref.split('/');
  return !!route && !!beta && !!s.routes[route]?.known.includes(beta);
}

export function holds(s: GameState, c: Cond): boolean {
  if (c.night !== undefined && isNight(s.min) !== c.night) return false;
  if (c.before !== undefined && !(s.min < c.before)) return false;
  if (c.from !== undefined && !(s.min >= c.from)) return false;
  if (c.pay !== undefined && headroom(s) < c.pay) return false;
  if (c.energy !== undefined && s.energy < c.energy) return false;
  if (c.skin !== undefined && s.skin < c.skin) return false;
  if (c.fed !== undefined && s.fed < c.fed) return false;
  if (c.today !== undefined && !s.today.includes(c.today)) return false;
  if (c.notToday !== undefined && s.today.includes(c.notToday)) return false;
  if (c.knows !== undefined && !knows(s, c.knows)) return false;
  if (c.notKnows !== undefined && knows(s, c.notKnows)) return false;
  if (c.sentToday !== undefined && !s.routes[c.sentToday]?.sentToday) return false;
  if (c.wentToday !== undefined && !s.routes[c.wentToday]?.goesToday) return false;
  if (c.met !== undefined && !s.people[c.met]) return false;
  if (c.notMet !== undefined && s.people[c.notMet]) return false;
  if (c.sky !== undefined && skyOn(s.seed, s.day) !== c.sky) return false;
  if (c.arc !== undefined && !beatDue(s, c.arc)) return false;
  if (c.bond !== undefined) {
    const [who, n] = c.bond.split('/');
    if ((s.people[who ?? '']?.bond ?? 0) < Number(n)) return false;
  }
  if (c.grade !== undefined && gradeOf(s.climber.skills) < c.grade) return false;
  if (c.unlocked !== undefined && !s.unlocked.includes(c.unlocked)) return false;
  if (c.open !== undefined) {
    const k = conditionsAt(s.seed, s.day, c.open);
    if (!k.open || k.closed) return false;
  }
  if (c.outside !== undefined && !!PLACES[s.at]?.crag !== c.outside) return false;
  if (c.metToday !== undefined && s.people[c.metToday]?.since !== s.day) return false;
  if (c.racing !== undefined && !!s.race !== c.racing) return false;
  if (c.lead !== undefined) {
    const [who, n] = ref(c.lead);
    if (leadOver(s, who) < n) return false;
  }
  if (c.trail !== undefined) {
    const [who, n] = ref(c.trail);
    if (-leadOver(s, who) < n) return false;
  }
  if (c.dog !== undefined && !!s.dog !== c.dog) return false;
  if (c.dogOffer !== undefined && dogOffered(s) !== c.dogOffer) return false;
  if (c.dogFedBelow !== undefined && !(s.dog && s.dog.fed < c.dogFedBelow)) return false;
  if (c.has !== undefined && !((s.gear[c.has] ?? 0) > 0)) return false;
  if (c.hasNot !== undefined && (s.gear[c.hasNot] ?? 0) > 0) return false;
  if (c.gearBelow !== undefined) {
    const [id, n] = ref(c.gearBelow);
    if (!((s.gear[id] ?? 0) < n)) return false;
  }
  if (c.weekend !== undefined && isWeekend(s.day) !== c.weekend) return false;
  if (c.posted !== undefined && !isPosted(s.seed, c.posted, s.day)) return false;
  if (c.hired !== undefined && benchedUntil(s, c.hired) !== null) return false;
  if (c.worn !== undefined && !(s.van[c.worn] < 95)) return false;
  if (c.payVan !== undefined && headroom(s) < repairCost(s, c.payVan)) return false;
  if (c.stock !== undefined && !((s.pantry[c.stock] ?? 0) > 0)) return false;
  return true;
}

// Scout picks you once you've made enough trips out, and until he has.
export const dogOffered = (s: GameState): boolean => !s.dog && s.trips >= DOG.offerTrips;

// Whether beat n of someone's arc is due: the one before it played, the bond there, and
// enough days since the last.
export function beatDue(s: GameState, ref: string): boolean {
  const [who, n] = ref.split('/');
  const beat = Number(n);
  const p = s.people[who ?? ''];
  if (!p || (p.arc ?? 0) !== beat - 1) return false;
  if (p.bond < (ARC.bonds[beat - 1] ?? Infinity)) return false;
  // The first beat waits a day past meeting; each after it waits out the spacing.
  if (p.beatDay === undefined) return s.day > (p.since ?? 0);
  return s.day - p.beatDay >= ARC.spacing;
}

// The first unmet need's line, or null when everything holds.
export function unmet(s: GameState, needs: readonly Need[] = []): string | null {
  for (const n of needs) {
    if (holds(s, n)) continue;
    if (n.why) return fill(n.why, { t: clockShort(n.before ?? n.from ?? 0) });
    if (n.pay !== undefined || n.payVan !== undefined) return "The card's declined.";
    if (n.energy !== undefined) return 'Too tired.';
    if (n.skin !== undefined) return 'Your skin is done for today.';
    if (n.fed !== undefined) return "You're too hungry.";
    if (n.before !== undefined) return `Only before ${clockShort(n.before)}.`;
    if (n.from !== undefined) return `Not until ${clockShort(n.from)}.`;
    return 'Not now.';
  }
  return null;
}
