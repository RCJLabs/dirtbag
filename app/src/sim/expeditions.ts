// Expeditions (Phase 24): a long wall far from the valley, led in blocks with a partner. You
// climb your blocks, a go at a time, as on any line; your partner's go by the seed against
// their grade. Every night on the portaledge gives back less than the one before, and every
// day up there narrows every window a little more. The summit's odds are worked out before
// you pay and every day after, from the go's own model: each of your pitches played out on
// the seed with a climber's hands, then every day, storm and pitch ahead.

import { playGo, humanHands } from './bot';
import { dayFactor } from './climb';
import { EXPEDITIONS, expedPitches, expedWindows, type ExpeditionDef } from './content/expeditions';
export { expedWindows };
import { PEOPLE } from './content/people';
import type { RouteDef, WallDef } from './content/routes';
import { gradeOf } from './climber';
import { BOND, CLIMB, DAY, EXPED, WALL } from './dials';
import { Rng } from './rng';
import type { GameState, TripPlan } from './types';
import { expedCost } from './dreams';

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

// Whether a day out there is a storm: seeded by the expedition and the day, so it's the same
// storm however you get to it.
export const stormOn = (seed: string, id: string, e: ExpeditionDef, day: number): boolean =>
  Rng.fromStream(seed, 'events').derive(`storm-${id}-${day}`).next() < e.stormOdds;

// Who leads a pitch: blocks of `block`, yours first. Free Solo has no partner: all yours.
export const yourPitch = (pitch: number, solo: boolean): boolean =>
  solo || Math.floor(pitch / EXPED.block) % 2 === 0;

// A night on the portaledge: what it gives back, less each night.
export const nightBack = (nights: number): number =>
  Math.round(EXPED.night.energy * EXPED.night.decay ** nights);

// Phase 24.2. The haul bag's weight: food and water by the day (twice the weight where the
// water's snow and there's no stove to melt it), the portaledge, the stove.
export function bagKg(e: ExpeditionDef, food: number, ledge: boolean, stove: boolean): number {
  const H = EXPED.haul;
  return food * H.perDay * (e.melt && !stove ? 2 : 1) + (ledge ? H.ledge : 0) + (stove ? H.stove : 0);
}
// What a night gives back once the bag's been hauled: the portaledge or not, and every kg over
// the free load costing energy for tomorrow's hauling.
export const nightGives = (nights: number, ledge: boolean, kg: number): number =>
  Math.max(
    0,
    Math.round(
      nightBack(nights) * (ledge ? 1 : EXPED.noLedge) - Math.max(0, kg - EXPED.haul.free) * EXPED.haul.perKg,
    ),
  );

// The forecast for a day out there, as it stands today: storm or clear, right more often the
// nearer the day. Today itself, you can see it.
const accuracy = (lead: number): number =>
  lead <= 0 ? 1 : Math.max(0.5, 1 - lead / (2 * EXPED.forecast.horizon));
export function forecastCall(s: GameState, id: string, day: number): 'storm' | 'clear' {
  const e = EXPEDITIONS[id]!;
  const lead = day - s.day;
  const truth = stormOn(s.seed, id, e, day);
  const flip = Rng.fromStream(s.seed, 'events').derive(`fc-${id}-${day}-${lead}`).next() >= accuracy(lead);
  return truth !== flip ? 'storm' : 'clear';
}
// The chance of a storm that day, from what the forecast says and how often it's right that
// far out.
export function stormChance(s: GameState, id: string, day: number): number {
  const e = EXPEDITIONS[id]!;
  const lead = day - s.day;
  if (lead <= 0) return stormOn(s.seed, id, e, day) ? 1 : 0;
  const a = accuracy(lead);
  const q = e.stormOdds;
  return forecastCall(s, id, day) === 'storm'
    ? (q * a) / (q * a + (1 - q) * (1 - a))
    : (q * (1 - a)) / (q * (1 - a) + (1 - q) * a);
}

// A partner's grade: they've been climbing too. Yours, give or take what they're like
// (content/people.ts: Hazel a grade under you, Sage one over) [proposed].
export const partnerGrade = (s: GameState, who: string): number =>
  gradeOf(s.climber.skills) + (PEOPLE[who]?.grade ?? 0);

// Who'd come: everyone you climb with who's close enough, best first.
export function partners(s: GameState): string[] {
  return Object.entries(s.people)
    .filter(([w, p]) => PEOPLE[w]?.grade !== undefined && p.bond >= BOND.tiers[EXPED.partnerTier]!)
    .sort((a, b) => b[1].bond - a[1].bond)
    .map(([w]) => w);
}

// A try of your partner's at one of their pitches: their grade against the pitch's, up there.
export function partnerTry(s: GameState, e: ExpeditionDef, who: string, r: RouteDef, onWall: number): number {
  const P = EXPED.partner;
  const p = P.base + P.perGrade * (partnerGrade(s, who) - r.grade);
  return clamp(p * expedWindows(e, onWall), P.floor, P.ceiling);
}

// A partner's day leading: their own block, or yours when you hand them a pitch you're stuck
// on. Up to `tries` goes, pitch after pitch, rolled on the seed. How many pitches they fixed.
export function partnerDay(s: GameState, e: ExpeditionDef, id: string, who: string, from: number): number {
  const ps = expedPitches(id);
  const onWall = s.expedition?.day ?? 1;
  let pitch = from;
  for (let t = 0; t < EXPED.partner.tries && pitch < ps.length; t++) {
    const roll = Rng.fromStream(s.seed, 'events').derive(`lead-${id}-${s.day}-${t}`).next();
    if (roll < partnerTry(s, e, who, ps[pitch]!, onWall)) pitch++;
  }
  return pitch - from;
}

// A go of yours at a pitch, the chance it goes: the go itself, played on the seed by a
// climber's hands, `samples` times, today as you are. Kept by what changes it.
const sendMemo = new Map<string, number>();
export function sendChance(s: GameState, r: RouteDef): number {
  const k = s.climber.skills;
  const key = `${s.seed}|${r.id}|${s.day}|${Object.values(k).join(',')}|${dayFactor(s, r).windows.toFixed(3)}|${JSON.stringify(s.routes[r.id]?.pick ?? {})}`;
  const hit = sendMemo.get(key);
  if (hit !== undefined) return hit;
  let sent = 0;
  for (let n = 0; n < EXPED.samples; n++) {
    const rng = Rng.fromStream(s.seed, 'session').derive(`odds-${r.id}-${n}`);
    if (playGo(s, r, humanHands(rng)).sent) sent++;
  }
  const p = sent / EXPED.samples;
  if (sendMemo.size > 500) sendMemo.clear();
  sendMemo.set(key, p);
  return p;
}

// Goes in a day: what the light allows, and what you've the energy for.
const daylightGoes = Math.ceil((CLIMB.darkFrom - DAY.wakeMin) / EXPED.pitch.min);
const goesFor = (energy: number): number =>
  Math.max(0, Math.min(daylightGoes, Math.floor((energy - CLIMB.minEnergy) / EXPED.pitch.energy) + 1));

// The chance of the summit from where you stand: every day ahead, a storm or not; your
// blocks a go at a time while the light and your energy last, at each pitch's chance for
// you; your partner's on the seed's odds. Exact over those, with your send chances as the
// go's model has them for you today.
export interface OddsFrom {
  // The day of the trip, and the calendar day it is (or will be, before you leave).
  day: number;
  on: number;
  pitch: number;
  energy: number;
  nights: number;
  partner: string | null;
  food: number;
  ledge: boolean;
  stove: boolean;
}
// `force`: today's choice on your block, made for you (the bots weigh both); otherwise the
// better of the two.
export function summitOdds(s: GameState, id: string, from: OddsFrom, force?: 'lead' | 'hand'): number {
  const e = EXPEDITIONS[id]!;
  const ps = expedPitches(id);
  const solo = from.partner === null;
  // Each pitch's chance for you, at the start, the middle and the end of the trip (the days
  // up there narrow it), and between them by the day.
  const x = s.expedition;
  const anchors = [from.day, Math.ceil((from.day + e.days) / 2), e.days];
  // A typical go of the day is the third: two goes' food gone since the morning's rations.
  const fedAt = (d: number) => Math.max(0, (d === from.day ? s.fed : EXPED.ration) - 2 * EXPED.pitch.fed);
  const at = (d: number): GameState =>
    x ? { ...s, fed: fedAt(d), expedition: { ...x, day: d } } : { ...s, fed: fedAt(d) };
  const table = anchors.map((d) => ps.map((r, i) => (yourPitch(i, solo) ? sendChance(at(d), r) : 0)));
  const pAt = (pt: number, day: number): number => {
    const [a0, a1, a2] = anchors as [number, number, number];
    const [t0, t1, t2] = table as [number[], number[], number[]];
    if (day <= a1) return a1 === a0 ? t0[pt]! : t0[pt]! + ((t1[pt]! - t0[pt]!) * (day - a0)) / (a1 - a0);
    return a2 === a1 ? t1[pt]! : t1[pt]! + ((t2[pt]! - t1[pt]!) * (day - a1)) / (a2 - a1);
  };
  const memo = new Map<string, number>();
  const go = (day: number, pitch: number, energy: number, nights: number): number => {
    if (pitch >= ps.length) return 1;
    if (day > e.days) return 0;
    const key = `${day}/${pitch}/${energy}/${nights}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    // A night, and on to tomorrow: if there's food and water left for it.
    const food = from.food - (nights - from.nights);
    const kg = bagKg(e, Math.max(0, food - 1), from.ledge, from.stove);
    const next = (pt: number, spent: number): number =>
      pt >= ps.length
        ? 1
        : food <= 0
          ? 0
          : go(
              day + 1,
              pt,
              Math.min(100, Math.max(0, energy - spent) + nightGives(nights, from.ledge, kg)),
              nights + 1,
            );
    const wait = next(pitch, 0);
    // A day of your partner's leading, from here: each try fixes the pitch they're on or not.
    const theirs = (): number => {
      let dist = new Map<number, number>([[pitch, 1]]);
      for (let t = 0; t < EXPED.partner.tries; t++) {
        const next = new Map<number, number>();
        const add = (pt: number, pr: number) => next.set(pt, (next.get(pt) ?? 0) + pr);
        for (const [pt, pr] of dist) {
          if (pt >= ps.length) add(pt, pr);
          else {
            const q = partnerTry(s, e, from.partner!, ps[pt]!, day);
            add(pt + 1, pr * q);
            add(pt, pr * (1 - q));
          }
        }
        dist = next;
      }
      let v = 0;
      for (const [pt, pr] of dist) v += pr * next(pt, EXPED.follow);
      return v;
    };
    let fair: number;
    if (!yourPitch(pitch, solo)) fair = theirs();
    else {
      // Your block: a go at a time, each at this pitch's chance, until the light or you give out.
      const inDay = new Map<string, number>();
      const day1 = (pt: number, g: number, spent: number): number => {
        if (pt >= ps.length) return 1;
        if (g === 0 || !yourPitch(pt, solo)) return next(pt, spent);
        const k = `${pt}/${g}`;
        const hit = inDay.get(k);
        if (hit !== undefined) return hit;
        const c = pAt(pt, day);
        const v =
          c * day1(pt + 1, g - 1, spent + EXPED.pitch.energy) +
          (1 - c) * day1(pt, g - 1, spent + EXPED.pitch.energy);
        inDay.set(k, v);
        return v;
      };
      const goes = goesFor(energy);
      const mine = goes > 0 ? day1(pitch, goes, 0) : wait;
      // Stuck, you can hand it over: the odds take whichever's better each day.
      const root = day === from.day && pitch === from.pitch;
      fair = solo
        ? mine
        : root && force === 'lead'
          ? mine
          : root && force === 'hand'
            ? theirs()
            : Math.max(mine, theirs());
    }
    const storm = stormChance(s, id, from.on + day - from.day);
    const v = storm * wait + (1 - storm) * fair;
    memo.set(key, v);
    return v;
  };
  return go(from.day, from.pitch, from.energy, from.nights);
}

// What a wall's first summit pays: a magazine buys the photos.
export const wallPay = (w: WallDef): number =>
  WALL.pay.base + WALL.pay.perGrade * w.grade + WALL.pay.perPitch * w.pitches.length;

export const onExpedition = (s: GameState): boolean => s.expedition !== null;

// Phase 24.2. A plan's odds before you pay: leaving on its day, with its partner and its bag.
export function planOdds(s: GameState, id: string, plan: TripPlan): number {
  const e = EXPEDITIONS[id]!;
  const t: GameState = {
    ...s,
    min: DAY.wakeMin,
    expedition: {
      id,
      day: 1,
      pitch: 0,
      partner: plan.partner,
      nights: 0,
      food: plan.food,
      ledge: plan.ledge,
      stove: plan.stove,
    },
  };
  void e;
  const { partner, food, ledge, stove } = plan;
  return summitOdds(t, id, {
    day: 1,
    on: plan.day,
    pitch: 0,
    energy: s.energy,
    nights: 0,
    partner,
    food,
    ledge,
    stove,
  });
}

// The plan to start from: today, the closest partner, food and water for as many days as the
// bag takes, the portaledge, and the stove where the water's snow. Null roped with nobody close enough.
export function defaultPlan(s: GameState, id: string): TripPlan | null {
  const e = EXPEDITIONS[id]!;
  const partner = s.mode === 'solo' ? null : (partners(s)[0] ?? null);
  if (s.mode !== 'solo' && !partner) return null;
  // As much food and water as the bag takes, up to every day of the trip.
  const H = EXPED.haul;
  const fits = Math.floor((H.max - H.ledge - (e.melt ? H.stove : 0)) / H.perDay);
  return { day: s.day, partner, food: Math.min(e.days - 1, fits), ledge: true, stove: !!e.melt };
}

// What a plan costs up front, and why it can't go.
export const planCost = (s: GameState, id: string, plan: TripPlan): number =>
  expedCost(s, EXPEDITIONS[id]!.cost) + plan.food * EXPED.food;
export function planBlocked(s: GameState, id: string, plan: TripPlan): string | null {
  const e = EXPEDITIONS[id]!;
  if (gradeOf(s.climber.skills) < e.gradeReq) return `${e.name} wants V${e.gradeReq}`;
  if (s.mode !== 'solo' && (!plan.partner || !partners(s).includes(plan.partner)))
    return 'Nobody you climb with is close enough yet to come';
  if (s.mode === 'solo' && plan.partner) return 'Free Solo goes alone';
  if (plan.day < s.day || plan.day > s.day + EXPED.ahead) return `Up to ${EXPED.ahead} days out`;
  if (plan.food < 1 || plan.food > e.days - 1) return `Between 1 and ${e.days - 1} days of food and water`;
  if (bagKg(e, plan.food, plan.ledge, plan.stove) > EXPED.haul.max)
    return `The bag won’t take it: ${EXPED.haul.max} kg at most`;
  return null;
}
