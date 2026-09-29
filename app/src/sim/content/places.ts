// Places, the things you can do there, and the roads between them. Text may use {spot},
// {wake}, {pass} and {cash}, filled from the dials, and a place card {lines}, its count of
// lines, so no number is typed twice.
//
// Prices and shifts are v0.956's where it had them: the diner meal ($10, +50 fed), a café
// shift (3 h, $28), setting at Send City (4 h, $28, and it trains technique).
//
// An act's id starts with the place it happens at: 'cafe.shift' is worked at the café.
// Work needs energy but never food, so a broke, hungry climber can always earn their way
// back: there's no game over, only a bad week.

import type { Need } from '../cond';
import { DAY, DOG, MONEY } from '../dials';
import { DOG_LINES, DOG_OFFER } from './dog';
import { clockShort } from '../format';
import type { Delta, Skills } from '../types';
import type { Season } from '../weather';

export interface PlaceDef {
  name: string;
  // A crag you can't drive to until you climb this grade (v0.956's minGrade), and what the
  // card says until then.
  minGrade?: number;
  locked?: string;
  // A season it's closed, and why (v0.956's closedSeason).
  closed?: { season: Season; why: string };
  // Shaded rock stays cool: no afternoon grease, and heat doesn't hurt it.
  shaded?: true;
  // Desert rock: sunbaked, every window a little tighter (CLIMB.desertFactor).
  desert?: true;
  // Out of the valley: its own weather, rolled from its climate (v0.956's per-crag skies).
  ownSky?: true;
  // A trip you pay for once, in cash, before you can drive it (v0.956's unlockCost), and
  // a permit paid on every trip in (v0.956's permit).
  unlock?: number;
  permit?: number;
  // The haul you paid for includes crash pads: every highball lands softer (HIGHBALL.pads).
  pads?: true;
  // A sunny crag's lines in the order the afternoon sun reaches them, from one end of the
  // crag to the other, talus boulders and wall lines alike. The scene's layout must agree
  // (view/sun.test.ts), so the shade line you see crosses each line as it starts to grease.
  sun?: string[];
  // Real rock: a trip out, and a crag's beats and people.
  crag?: true;
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
  // What it does for your dog: takes him on, fills his bowl, or adds to the bond.
  dog?: { adopt?: true; fill?: true; bond?: number };
  // A line picked by the day, instead of the same one every time.
  saysOneOf?: string[];
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
    crag: true,
    scene: 'crag',
    away: 'Granite. {lines} lines, from a V2 warm-up to The Pump.',
    here: "You're parked here.",
    acts: [],
    // The sun comes round the far end first: the projects out in the boulder field lose
    // their shade early, and the warm-ups by the road keep theirs longest.
    sun: [
      'rsopen',
      'project',
      'highball',
      'fingercrack',
      'testpiece',
      'pump',
      'crimpfest',
      'roadside',
      'dyno',
      'warmup',
      'warm',
    ],
  },
  gorge: {
    name: 'Granite Gorge',
    crag: true,
    scene: 'gorge',
    away: 'Classic granite, two hours out and in the shade. Harder lines.',
    here: 'The canyon’s cool even at noon.',
    acts: [],
    minGrade: 4,
    locked: 'V5 and up. It’s no place to learn: come back when you’re climbing V4.',
    closed: { season: 'spring', why: 'Closed for nesting raptors till summer' },
    shaded: true,
  },
  // v0.956's third crag, "a fabled desert highball mecca, a real road trip out": V6 to
  // get in, a haul to pay for once, and a permit every trip.
  moon: {
    name: 'Moonstone Boulders',
    crag: true,
    scene: 'moon',
    away: 'Quartzite highballs out in the desert. A real road trip.',
    here: 'Sand, sky, and boulders the size of houses.',
    acts: [],
    minGrade: 6,
    locked: 'Tall, hard and a long way out. Come back when you’re climbing V6.',
    unlock: 400,
    permit: 20,
    pads: true,
    desert: true,
    ownSky: true,
    // The sun comes round the far end first, like Roadside's: the project out past the
    // roof loses its shade first, the arête by the van keeps it longest.
    sun: ['mopen', 'mroof', 'msplitter', 'mhueco', 'mmoon', 'mspire', 'megg', 'mmantel', 'marete'],
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
  'lot.adopt': {
    label: DOG_OFFER.yes,
    cost: {},
    needs: [{ dogOffer: true }],
    dog: { adopt: true },
    says: DOG_OFFER.took,
  },
  'lot.kibble': {
    label: 'Feed Scout',
    cost: { min: 5, cash: -DOG.kibble },
    needs: [{ dog: true }, { dogFedBelow: 80, why: "He's good. He'd eat it anyway." }, { pay: DOG.kibble }],
    dog: { fill: true, bond: DOG.kibbleBond },
    says: 'Scout eats like it was a race, and wins.',
  },
  'lot.play': {
    label: 'Throw the stick',
    cost: { min: DOG.playMin },
    needs: [{ dog: true }, { notToday: 'play', why: "He's had his game today. He disagrees." }],
    sets: ['play'],
    dog: { bond: DOG.playBond },
    saysOneOf: DOG_LINES.play,
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
  // The Gorge: v0.956's two hours and 22% of a tank each way.
  { a: 'gorge', b: 'lot', min: 120, cash: 22 },
  { a: 'gorge', b: 'road', min: 70, cash: 12 },
  { a: 'gorge', b: 'gym', min: 125, cash: 22 },
  { a: 'gorge', b: 'diner', min: 125, cash: 22 },
  { a: 'gorge', b: 'cafe', min: 125, cash: 22 },
  // Moonstone: v0.956's three hours and 30% of a tank from the Lot, north up the highway
  // past Roadside and out of the valley.
  { a: 'moon', b: 'lot', min: 180, cash: 30 },
  { a: 'moon', b: 'road', min: 120, cash: 20 },
  { a: 'moon', b: 'gorge', min: 190, cash: 32 },
  { a: 'moon', b: 'gym', min: 175, cash: 29 },
  { a: 'moon', b: 'diner', min: 180, cash: 30 },
  { a: 'moon', b: 'cafe', min: 175, cash: 29 },
];

export const road = (a: string, b: string): RoadDef | undefined =>
  ROADS.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a));

// Values content text may name, derived from the dials.
export const TEXT_VALUES = {
  spot: `$${MONEY.vanSpot}`,
  pass: `$${MONEY.dayPass}`,
  wake: clockShort(DAY.wakeMin),
};
