// Places, the things you can do there, and the roads between them. Text may use {spot},
// {wake}, {pass} and {cash}; they're filled from the dials so no number is typed twice.
//
// Prices and shifts are v0.956's where it had them: the diner meal ($10, +50 fed), a café
// shift (3 h, $28), setting at Send City (4 h, $28, and it trains technique).
//
// An act's id starts with the place it happens at: 'cafe.shift' is worked at the café.
// Work needs energy but never food, so a broke, hungry climber can always earn their way
// back: there's no game over, only a bad week.

import type { Need } from '../cond';
import { DAY, MONEY } from '../dials';
import { clockShort } from '../format';
import type { Delta, Skills } from '../types';

export interface PlaceDef {
  name: string;
  // The side-view scene you walk around in, or null for a card-only place.
  scene: string | null;
  // The map card's line when you're elsewhere, and when you're here.
  away: string;
  here: string;
  // Acts on the place card, in order.
  acts: string[];
}

export interface ActDef {
  label: string;
  cost: Delta;
  needs?: Need[];
  // Flavour, shown after the act's effects on your body.
  note?: string;
  // The line you get afterwards.
  says?: string;
  // Daily flags it sets ("worked", "pass").
  sets?: string[];
  // What it trains, flat (v0.956 jobs build skills a little).
  trains?: Partial<Skills>;
  // Sleep ends the day; its rules live in the sim, not here.
  sleep?: true;
}

export interface RoadDef {
  a: string;
  b: string;
  min: number;
  cash: number;
}

export const PLACES: Record<string, PlaceDef> = {
  lot: {
    name: 'The Lot',
    scene: 'lot',
    away: 'Home. {spot} a night.',
    here: 'Home. {spot} a night.',
    acts: [],
  },
  road: {
    name: 'Roadside Crag',
    scene: 'crag',
    away: 'Granite. Seven lines, from a V2 warm-up to The Pump.',
    here: "You're parked here.",
    acts: [],
  },
  gym: {
    name: 'Send City',
    scene: 'gym',
    away: 'The gym downtown. New problems every week. Day pass {pass}.',
    here: 'Plastic, chalk dust, a playlist nobody chose.',
    acts: ['gym.pass', 'gym.set'],
  },
  diner: {
    name: 'The Diner',
    scene: null,
    away: 'Old Town. The special, and bottomless coffee.',
    here: 'Old Town. Otis is reading the paper.',
    acts: ['diner.meal', 'diner.coffee'],
  },
  cafe: {
    name: 'Coffee Shop',
    scene: null,
    away: 'Midtown. They always need someone on the morning shift.',
    here: 'Midtown. Wren is on the bar.',
    acts: ['cafe.shift', 'cafe.double', 'cafe.coffee'],
  },
};

const oneShift: Need = { notToday: 'worked', why: "You've done your shift today." };

export const ACTS: Record<string, ActDef> = {
  'lot.cook': {
    label: 'Cook ramen',
    cost: { min: 20, cash: -2, fed: 25, energy: 6 },
    needs: [{ pay: 2 }],
    says: 'Ramen again. It works.',
  },
  'lot.sleep': {
    label: 'Sleep',
    cost: { cash: -MONEY.vanSpot },
    needs: [{ from: DAY.bedFrom, why: "Not yet. The day's still going." }],
    note: 'Wake at {wake}.',
    sleep: true,
  },
  // Passing the day: somewhere to be when you're spent before dark.
  'lot.rest': {
    label: 'Lie around in the van',
    cost: { min: 60, energy: 4 },
    needs: [{ night: false, why: "It's evening. The fire's lit." }],
    says: 'You read the same page four times.',
  },
  'lot.sit': {
    label: 'Sit a while',
    cost: { min: 40, energy: 3 },
    needs: [{ night: true, why: 'The fire is out till tonight.' }],
    says: 'You sit until the fire is down to coals.',
  },
  'diner.meal': {
    label: 'Order the special',
    cost: { min: 45, cash: -10, fed: 50, energy: 4 },
    needs: [{ pay: 10 }],
    says: "The special is meatloaf. It's always meatloaf.",
  },
  'diner.coffee': {
    label: 'Bottomless coffee',
    cost: { min: 10, cash: -2, energy: 6 },
    needs: [{ pay: 2 }],
  },
  'cafe.shift': {
    label: 'Work a shift',
    cost: { min: 180, cash: 28, energy: -12, fed: -8 },
    needs: [
      oneShift,
      { before: 15 * 60, why: 'Shifts start by {t}.' },
      { energy: 12, why: 'Too tired to pull shots.' },
    ],
    sets: ['worked'],
    says: 'Three hours of oat milk. +$28.',
  },
  'cafe.double': {
    label: 'Pick up a double',
    cost: { min: 360, cash: 56, energy: -24, fed: -16 },
    needs: [
      oneShift,
      { before: 11 * 60, why: 'Doubles start by {t}.' },
      { energy: 24, why: 'Too tired for a double.' },
    ],
    note: 'The day is gone after this.',
    sets: ['worked'],
    says: 'Six hours on your feet. +$56.',
  },
  'cafe.coffee': {
    label: 'Buy a coffee',
    cost: { min: 10, cash: -4, energy: 16, fed: -2 },
    needs: [{ pay: 4 }],
    says: 'Wren makes it strong.',
  },
  'gym.pass': {
    label: 'Buy a day pass',
    cost: { min: 5, cash: -MONEY.dayPass },
    needs: [{ notToday: 'pass', why: "You've got a pass for today." }, { pay: MONEY.dayPass }],
    sets: ['pass'],
    says: 'The kid at the desk stamps your hand.',
  },
  'gym.set': {
    label: 'Set problems for a shift',
    cost: { min: 240, cash: 28, energy: -22, fed: -10 },
    needs: [
      oneShift,
      { before: 14 * 60, why: 'Setting starts by {t}.' },
      { energy: 22, why: 'Too tired to haul holds.' },
    ],
    note: 'Trains technique. Your pass is on the house.',
    sets: ['worked', 'pass'],
    trains: { technique: 3 },
    says: 'Four hours on a ladder with a drill. +$28, and a free pass.',
  },
};

// Every pair of places: minutes and gas. Town is ten minutes wide; the crag is an hour out.
export const ROADS: RoadDef[] = [
  { a: 'lot', b: 'road', min: 60, cash: 12 },
  { a: 'lot', b: 'gym', min: 12, cash: 1 },
  { a: 'lot', b: 'diner', min: 10, cash: 1 },
  { a: 'lot', b: 'cafe', min: 8, cash: 1 },
  { a: 'gym', b: 'cafe', min: 5, cash: 0 },
  { a: 'gym', b: 'diner', min: 10, cash: 1 },
  { a: 'diner', b: 'cafe', min: 8, cash: 1 },
  { a: 'road', b: 'gym', min: 70, cash: 12 },
  { a: 'road', b: 'diner', min: 70, cash: 12 },
  { a: 'road', b: 'cafe', min: 65, cash: 12 },
];

export const road = (a: string, b: string): RoadDef | undefined =>
  ROADS.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a));

// Values content text may name, derived from the dials.
export const TEXT_VALUES = {
  spot: `$${MONEY.vanSpot}`,
  pass: `$${MONEY.dayPass}`,
  wake: clockShort(DAY.wakeMin),
};
