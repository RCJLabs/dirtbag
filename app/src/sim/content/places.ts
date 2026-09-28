// Places, the things you can do there, and the roads between them. Text may use {spot},
// {wake}, {grease} and {cash}; they're filled from the dials so no number is typed twice.

import type { Need } from '../cond';
import { CLIMB, DAY, MONEY } from '../dials';
import { clockShort } from '../format';
import type { Delta } from '../types';

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
  // Sleep ends the day; its rules live in the sim, not here.
  sleep?: true;
}

export interface RoadDef {
  a: string;
  b: string;
  min: number;
  cash: number;
  says: string;
}

export const PLACES: Record<string, PlaceDef> = {
  lot: {
    name: 'The Lot',
    scene: 'lot',
    away: 'Home. {spot} a night.',
    here: 'Home. {spot} a night.',
    acts: [],
  },
  diner: {
    name: 'The Diner',
    scene: null,
    away: 'Old Town. Shifts, meatloaf, bottomless coffee.',
    here: 'Old Town. Otis is reading the paper.',
    acts: ['diner.shift', 'diner.special', 'diner.coffee'],
  },
  road: {
    name: 'Roadside Crag',
    scene: 'crag',
    away: "Granite. Shade until {grease}. Hazel's already there.",
    here: "You're parked here.",
    acts: [],
  },
};

export const ACTS: Record<string, ActDef> = {
  'lot.cook': {
    label: 'Cook ramen',
    cost: { min: 20, cash: -2, energy: 15 },
    needs: [{ cash: 2 }],
    says: 'Ramen again. It works.',
  },
  'lot.sleep': {
    label: 'Sleep',
    cost: { cash: -MONEY.vanSpot },
    needs: [{ from: DAY.bedFrom, why: "Not yet. The day's still going." }],
    note: 'Wake at {wake} with most of your energy back.',
    sleep: true,
  },
  'lot.sit': {
    label: 'Sit a while',
    cost: { min: 40, energy: 3 },
    needs: [{ night: true, why: 'The fire is out till tonight.' }],
    says: 'You sit until the fire is down to coals.',
  },
  'diner.shift': {
    label: 'Work a shift',
    cost: { min: 300, cash: 52, energy: -25 },
    needs: [
      { before: 14 * 60, why: 'Shifts start by {t}.' },
      { energy: 25, why: "You're too tired to carry plates." },
    ],
    note: 'The day is gone after this.',
    says: 'Five hours of plates. +$52.',
  },
  'diner.special': {
    label: 'Order the special',
    cost: { min: 30, cash: -9, energy: 30 },
    needs: [{ cash: 9 }],
    says: "The special is meatloaf. It's always meatloaf.",
  },
  'diner.coffee': {
    label: 'Bottomless coffee',
    cost: { min: 10, cash: -2, energy: 6 },
    needs: [{ cash: 2 }],
  },
};

export const ROADS: RoadDef[] = [
  { a: 'lot', b: 'road', min: 60, cash: 12, says: 'Gas, {cash}. The van starts on the second try.' },
  { a: 'lot', b: 'diner', min: 10, cash: 1, says: 'Gas, {cash}.' },
  { a: 'diner', b: 'road', min: 70, cash: 12, says: 'Gas, {cash}. The van starts on the second try.' },
];

export const road = (a: string, b: string): RoadDef | undefined =>
  ROADS.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a));

// Values content text may name, derived from the dials.
export const TEXT_VALUES = {
  spot: `$${MONEY.vanSpot}`,
  grease: clockShort(CLIMB.greaseFrom),
  wake: clockShort(DAY.wakeMin),
};
