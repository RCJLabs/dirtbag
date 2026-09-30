// Places, the things you can do there, and the roads between them. Text may use {spot},
// {wake}, {pass} and {cash}, filled from the dials, and a place card {lines}, its count of
// lines, so no number is typed twice.
//
// Prices and shifts are v0.956's where it had them: the diner meal ($10, +50 fed), a café
// shift (3 h, $28), setting at Send City (4 h, $28, raised to $30 in Phase 22.1 so the café
// pays least a shift, by Evan's call; it trains technique).
//
// An act's id starts with the place it happens at: 'cafe.shift' is worked at the café.
// Work needs energy but never food, so a broke, hungry climber can always earn their way
// back: there's no game over, only a bad week.

import type { Need } from '../cond';
import { DAY, DOG, KIT, MONEY, UPGRADE, VAN, WINTER, type VanPart } from '../dials';
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
  // A season it's closed, and why (v0.956's closedSeason); or several, for a place that's
  // only open the rest of the year (v0.956's openSeason).
  closed?: { season: Season | Season[]; why: string };
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
  // The bond a partner needs with you to come out here when you ask: further, harder to
  // talk them into (BOND.tiers names them).
  invite?: number;
  // How many climbers it draws on a plain weekday afternoon, 0 to 1 (v0.956's crag
  // popularity). Crowds (Phase 21.6) build from it; a place without one never has one.
  crowd?: number;
  // The side-view scene you walk around in, or null for a card-only place.
  scene: string | null;
  // The map card's line when you're elsewhere, and when you're here.
  away: string;
  here: string;
  // Acts on the place card, in order.
  acts: string[];
  // What it sounds like while you're there (audio/ambience.ts makes it, in code).
  ambience: Ambience;
}

// A place's sound, each part 0 to 1. Outdoors, birds give way to crickets at night; rain
// comes in by itself, on the roof of anywhere with a room tone.
export interface Ambience {
  wind?: number;
  birds?: number;
  fire?: number;
  creek?: number;
  // Indoors: the room itself, people talking, cups and plates.
  room?: number;
  murmur?: number;
  clinks?: number;
  // A climbing gym's own noises, now and then: a fall onto the pads, a chalk clap, a hand
  // slapping a hold.
  gym?: number;
  // Now and then, a hawk over the desert.
  hawk?: number;
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
  // Takes all the time till this minute of the day, in one go; `cost` is then what an hour
  // of it costs. Lying around till dark.
  until?: number;
  // What it does for your dog: takes him on, fills his bowl, or adds to the bond.
  dog?: { adopt?: true; fill?: true; bond?: number };
  // A line picked by the day, instead of the same one every time.
  saysOneOf?: string[];
  // What it does to your kit: sets an item to this (condition, or 1 for owned), or adds uses.
  gear?: { id: string; set?: number; add?: number };
  // A repair at the garage (Phase 22.2a): that part back to new, at a price by its wear.
  van?: VanPart;
  // A shift at a job (content/jobs.ts), counting this many toward promotion. Its pay is
  // `cost.cash` at the first rank, plus the rank's raise for each shift.
  job?: { id: string; shifts: number };
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
    ambience: { wind: 0.25, birds: 0.5, fire: 0.5 },
    away: 'Home. {spot} a night.',
    here: 'Home. {spot} a night.',
    acts: [],
  },
  road: {
    crowd: 0.6,
    name: 'Roadside Crag',
    crag: true,
    scene: 'crag',
    ambience: { wind: 0.35, birds: 0.4 },
    away: 'Granite. {lines} lines, from a V2 warm-up to The Pump.',
    here: "You're parked here.",
    acts: [],
    invite: 1,
    // The sun comes round the far end first: the projects out in the boulder field lose
    // their shade early, and the warm-ups by the road keep theirs longest.
    sun: [
      'rsopen',
      'project',
      'highball',
      'fingercrack',
      'tradarete',
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
    crowd: 0.5,
    name: 'Granite Gorge',
    crag: true,
    scene: 'gorge',
    ambience: { wind: 0.2, birds: 0.3, creek: 0.6 },
    away: 'Classic granite, two hours out and in the shade. Harder lines.',
    here: 'The canyon’s cool even at noon.',
    acts: [],
    minGrade: 4,
    invite: 3,
    locked: 'V5 and up. It’s no place to learn: come back when you’re climbing V4.',
    closed: { season: 'spring', why: 'Closed for nesting raptors till summer' },
    shaded: true,
  },
  // v0.956's third crag, "a fabled desert highball mecca, a real road trip out": V6 to
  // get in, a haul to pay for once, and a permit every trip.
  moon: {
    crowd: 0.45,
    name: 'Moonstone Boulders',
    crag: true,
    scene: 'moon',
    ambience: { wind: 0.6, hawk: 0.3 },
    away: 'Quartzite highballs out in the desert. A real road trip.',
    here: 'Sand, sky, and boulders the size of houses.',
    acts: [],
    minGrade: 6,
    invite: 5,
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
  // v0.956's fourth crag: "a famous desert destination, world-class and brutal". V7 to get
  // in, three hours out, and shut for the summer heat. No haul to pay for: just the drive.
  mesa: {
    crowd: 0.45,
    name: 'Sandstone Mesa',
    crag: true,
    scene: 'mesa',
    ambience: { wind: 0.5, hawk: 0.25 },
    away: 'Red desert sandstone, three hours out. World-class, and brutal about it.',
    here: 'Red rock, black varnish, and nobody for miles.',
    acts: [],
    minGrade: 7,
    invite: 5,
    locked: 'V7 and up, and they mean it. Come back when you’re climbing V7.',
    closed: { season: 'summer', why: 'Too hot to hold anything till fall' },
    desert: true,
    ownSky: true,
    // The sun comes round the far end first, as at Moonstone: the project out past the
    // Prow loses its shade first, the traverse by the van keeps it longest.
    sun: [
      'sopen',
      'smega',
      'spowerhouse',
      'sprow',
      'sdtrad',
      'sbiglink',
      'senduro',
      'sdlap',
      'ssplit',
      'scrimps',
      'svarnish',
    ],
  },
  // v0.956's "valley of granite big walls, the multi-day proving ground": V8 to get in, a
  // trip paid for once, four hours out, and shaded. Its walls come with Phase 21.5.
  stone: {
    crowd: 0.6,
    name: 'The Big Stone',
    crag: true,
    scene: 'stone',
    ambience: { wind: 0.3, birds: 0.3, creek: 0.4 },
    away: 'A valley of granite big walls, four hours out. The proving ground.',
    here: 'Granite to the sky on both sides. Your neck hurts already.',
    acts: [],
    minGrade: 8,
    invite: 7,
    locked: 'The walls are V8 and up, and they don’t care who you are. Come back when you’re climbing V8.',
    unlock: 600,
    shaded: true,
    ownSky: true,
  },
  // v0.956's "high alpine granite cathedral, a long, costly haul for the committed": V9, a
  // trip paid for once and a permit every time, four hours out past the Gorge, shaded, and
  // snowed in all winter.
  wind: {
    crowd: 0.3,
    name: 'Wind River Walls',
    crag: true,
    scene: 'wind',
    ambience: { wind: 0.7, creek: 0.3, hawk: 0.15 },
    away: 'High alpine granite past the Gorge. A long, costly haul for the committed.',
    here: 'Thin air, cold rock, and weather you watch.',
    acts: [],
    minGrade: 9,
    invite: 7,
    locked: 'V9 and up, and a long way up at that. Come back when you’re climbing V9.',
    unlock: 800,
    permit: 35,
    closed: { season: 'winter', why: 'Snowed in till spring' },
    shaded: true,
    ownSky: true,
  },
  // v0.956's "remote, frigid wall, where the grades run out": V11, four hours out, shaded, no
  // haul to pay for. East out of the valley, over the pass above Midtown.
  crucible: {
    crowd: 0.2,
    name: 'The Crucible',
    crag: true,
    scene: 'crucible',
    ambience: { wind: 0.8, hawk: 0.1 },
    away: 'A remote, frigid wall four hours east, over the pass. Where the grades run out.',
    here: 'Black gneiss, cold wind, and nothing easy.',
    acts: [],
    minGrade: 11,
    invite: 7,
    locked: 'Nothing here is under V13. Come back when you’re climbing V11, and even then.',
    shaded: true,
    ownSky: true,
  },
  // v0.956's "deep-water solo over the sea, summer only, and a fall is just a splash": V4,
  // two hours out on the coast past Old Town, no fee, and shut the rest of the year.
  cove: {
    crowd: 0.6,
    name: 'Psicobloc Cove',
    crag: true,
    scene: 'cove',
    ambience: { wind: 0.4, creek: 0.7, birds: 0.2 },
    away: 'Deep-water solo on a limestone sea cliff, two hours out. A fall is just a splash.',
    here: 'Salt on your hands, the swell under you, and no pads anywhere.',
    acts: [],
    minGrade: 4,
    invite: 3,
    locked: 'The cliff starts at V2 but the swim doesn’t. Come back when you’re climbing V4.',
    closed: { season: ['fall', 'winter', 'spring'], why: 'Cold, rough seas till summer' },
    ownSky: true,
    // The sun comes up the coast from the south end: the tall lines out at the point first.
    sun: ['pdeep', 'parete', 'poverhang', 'pleap', 'pbarnacle', 'pslab', 'pplunge', 'ptide'],
  },
  // v0.956's second gym: "a steep bouldering cave, no ropes, just hard plastic", V5 to V12
  // here (v0.956's V3 to V10, raised), at the trailhead below Roadside. A day pass, and coaching for work once you can climb.
  cave: {
    name: 'The Cave',
    scene: 'cave',
    ambience: { room: 0.3, murmur: 0.3, gym: 1 },
    away: 'The bouldering cave at the trailhead. Steep plastic, V5 and up. Day pass {pass}.',
    here: 'Low ceiling, loud music, everyone upside down.',
    acts: ['cave.pass', 'cave.coach'],
  },
  // v0.956's third gym, where the comp team trains: comp-style setting, V7 to V14, in Midtown
  // west of the highway. You need V7 to get past the desk.
  center: {
    name: 'The Training Center',
    scene: 'center',
    ambience: { room: 0.2, murmur: 0.5, gym: 1 },
    away: 'The comp gym in Midtown. Run-and-jumps and volumes, V7 to V14. Day pass {centerPass}.',
    here: 'White walls, big volumes, a comp clock nobody turns off.',
    acts: ['center.pass'],
    minGrade: 7,
    locked: 'The desk checks your ticklist: V7 and up. Come back when you’re climbing V7.',
  },
  gym: {
    name: 'Send City',
    scene: 'gym',
    ambience: { room: 0.25, murmur: 0.45, gym: 0.8 },
    away: 'The gym downtown. New problems every week. Day pass {pass}.',
    here: 'Plastic, chalk dust, a playlist nobody chose.',
    acts: ['gym.pass', 'gym.set'],
  },
  diner: {
    name: 'The Diner',
    scene: null,
    ambience: { room: 0.4, murmur: 0.6, clinks: 0.5 },
    away: 'Old Town. The special, and bottomless coffee.',
    here: 'Old Town. Otis is reading the paper. There’s a HELP WANTED sign by the register.',
    acts: ['diner.meal', 'diner.coffee', 'diner.shift'],
  },
  // Phase 21.1: where your kit comes from. A resole bench in the back, and on weekends the
  // swap meet out front.
  shop: {
    name: 'The Gear Shop',
    scene: null,
    ambience: { room: 0.3, murmur: 0.25, clinks: 0.1 },
    away: 'Midtown. Shoes, chalk, pads, and a resole bench in the back.',
    here: "A bell on the door. Two guys by the cams, arguing about a route neither's done.",
    acts: [
      'shop.resole',
      'shop.chalk',
      'shop.tape',
      'shop.propane',
      'shop.shoes',
      'shop.pad',
      'shop.rack',
      'shop.hangboard',
      'shop.rope',
      'shop.usedShoes',
      'shop.usedPad',
      'shop.usedRack',
    ],
  },
  cafe: {
    name: 'Coffee Shop',
    scene: null,
    ambience: { room: 0.3, murmur: 0.5, clinks: 0.6 },
    away: 'Midtown. They always need someone on the morning shift.',
    here: 'Midtown. Wren is on the bar.',
    acts: ['cafe.shift', 'cafe.double', 'cafe.coffee'],
  },
  // Phase 22.1 [proposed]: a distribution warehouse on the flats by the river, south of
  // Midtown. Long shifts from dawn, a few days a week.
  warehouse: {
    name: 'The Warehouse',
    scene: null,
    ambience: { room: 0.5, murmur: 0.15, clinks: 0.35 },
    away: 'On the flats by the river. A few long shifts a week, from dawn.',
    here: 'Pallets to the roof, and a forklift backing up somewhere, beeping.',
    acts: ['warehouse.shift'],
  },
  // Phase 22.2a [proposed]: Dale's garage, on the edge of Midtown past the gear shop. Where a
  // tow brings you, and where the van gets put back together.
  garage: {
    name: 'The Garage',
    scene: null,
    ambience: { room: 0.35, murmur: 0.1, clinks: 0.5 },
    away: 'Edge of Midtown. Tires, engines, batteries. Dale takes cards and opinions.',
    here: 'A radio on a shelf, a calendar from 2019, and Dale under somebody’s truck.',
    acts: [
      'garage.tires',
      'garage.engine',
      'garage.battery',
      'garage.bed',
      'garage.curtains',
      'garage.toolkit',
      'garage.tuneup',
      'garage.heater',
      'garage.insulation',
    ],
  },
};

const oneShift: Need = { notToday: 'worked', why: "You've done your shift today." };
// A van upgrade at the garage: fitted once, for its price and time (UPGRADE in dials.ts).
const upgrade = (id: keyof typeof UPGRADE, label: string, says: string): Record<string, ActDef> => {
  const u = UPGRADE[id];
  return {
    [`garage.${id}`]: {
      label,
      cost: { min: u.min, cash: -u.price },
      needs: [{ hasNot: id, why: 'Already fitted.' }, { pay: u.price }],
      gear: { id, set: 1 },
      says,
    },
  };
};
// A job's shift needs one posted today, and a job that hasn't let you go (Phase 22.1).
const onSchedule = (job: string): Need[] => [
  { posted: job, why: 'No shift posted today. The week’s schedule is under the clock.' },
  { hired: job, why: 'They let you go. They’ll take you back in a week.' },
];

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
    needs: [{ from: DAY.nightFrom, why: "Not yet. The day's still going." }],
    note: 'Wake at {wake}.',
    sleep: true,
  },
  // Passing the day: somewhere to be when you're spent before dark, in one go.
  'lot.rest': {
    label: 'Lie around till dark',
    cost: { energy: 4 },
    until: DAY.nightFrom,
    needs: [{ night: false, why: "It's evening. The fire's lit." }],
    says: "You read the same page until it's too dark to read.",
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
  // Phase 22.1, by Evan's call: waiting tables. Four hours and a base a little over the
  // café's an hour, and the tips on top (content/jobs.ts), better at the weekend.
  'diner.shift': {
    label: 'Wait tables',
    cost: { min: 240, cash: 30, energy: -16, fed: -6 },
    needs: [
      oneShift,
      ...onSchedule('diner'),
      { before: 14 * 60, why: 'Shifts start by {t}.' },
      { energy: 16, why: 'Too tired to carry four plates.' },
    ],
    note: 'Plus tips. Otis leaves a quarter, every time.',
    sets: ['worked'],
    job: { id: 'diner', shifts: 1 },
    says: 'Four hours of refills and "whenever you get a chance."',
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
      ...onSchedule('cafe'),
      { before: 15 * 60, why: 'Shifts start by {t}.' },
      { energy: 12, why: 'Too tired to pull shots.' },
    ],
    sets: ['worked'],
    job: { id: 'cafe', shifts: 1 },
    says: 'Three hours of oat milk.',
  },
  'cafe.double': {
    label: 'Pick up a double',
    cost: { min: 360, cash: 56, energy: -24, fed: -16 },
    needs: [
      oneShift,
      ...onSchedule('cafe'),
      { before: 11 * 60, why: 'Doubles start by {t}.' },
      { energy: 24, why: 'Too tired for a double.' },
    ],
    note: 'The day is gone after this.',
    sets: ['worked'],
    job: { id: 'cafe', shifts: 2 },
    says: 'Six hours on your feet.',
  },
  // Eight hours from dawn: the most a shift pays and the least an hour, and there's no
  // climbing left in the day after it.
  'warehouse.shift': {
    label: 'Work a shift',
    cost: { min: 480, cash: 52, energy: -40, fed: -20 },
    trains: { endurance: 2 },
    needs: [
      oneShift,
      ...onSchedule('warehouse'),
      { before: 9 * 60, why: 'The shift starts by {t}. Late is a no.' },
      { energy: 40, why: 'Too tired to lift anything.' },
    ],
    note: 'Trains your endurance. The day is gone after this.',
    sets: ['worked'],
    job: { id: 'warehouse', shifts: 1 },
    says: 'Eight hours of pallets, and a scanner that beeps at you.',
  },
  // The garage: each part back to new, priced by how far gone it is (van.ts repairCost).
  'garage.tires': {
    label: 'New tires',
    cost: { min: VAN.work.tires },
    needs: [{ worn: 'tires', why: 'Plenty of tread left.' }, { payVan: 'tires' }],
    van: 'tires',
    says: 'Four new tires, balanced. The van drives straight for the first time in months.',
  },
  'garage.engine': {
    label: 'Service the engine',
    cost: { min: VAN.work.engine },
    needs: [{ worn: 'engine', why: 'Dale listens to it and shrugs. It’s fine.' }, { payVan: 'engine' }],
    van: 'engine',
    says: 'Belts, hoses, oil, and a look from Dale about the oil.',
  },
  'garage.battery': {
    label: 'New battery',
    cost: { min: VAN.work.battery },
    needs: [{ worn: 'battery', why: 'It’s holding a charge fine.' }, { payVan: 'battery' }],
    van: 'battery',
    says: 'A new battery. The van starts first time, like it’s showing off.',
  },
  // Phase 22.2c: what Dale fits to the van, once and for good (UPGRADE in dials.ts).
  ...upgrade(
    'bed',
    'Fit a real bed',
    'A mattress that isn’t a camping pad. Your back sends a thank-you note.',
  ),
  ...upgrade('curtains', 'Blackout curtains', 'From outside, the van could be anyone’s. Nobody lives in it.'),
  ...upgrade(
    'toolkit',
    'Buy a tool kit',
    'Sockets, a jack that works, and a roll of duct tape the size of your head.',
  ),
  ...upgrade('tuneup', 'A tune-up', 'Plugs, filters, and the idle set right. It sips gas now.'),
  ...upgrade(
    'heater',
    'Fit a diesel heater',
    'A heater under the passenger seat. It runs on propane from the gear shop.',
  ),
  ...upgrade('insulation', 'Insulate the van', 'Foam in the walls and the ceiling. It holds the warm in.'),
  'cafe.coffee': {
    label: 'Buy a coffee',
    cost: { min: 10, cash: -4, energy: 16, fed: -2 },
    needs: [{ pay: 4 }],
    says: 'Wren makes it strong.',
  },
  // The gear shop (Phase 21.1). Prices, wear and what a block lasts are KIT's.
  'shop.resole': {
    label: 'Resole your shoes',
    cost: { min: 10, cash: -KIT.shoes.resole },
    needs: [
      { has: 'shoes', why: 'Nothing to resole.' },
      { gearBelow: `shoes/${KIT.shoes.resoleTo}`, why: 'Your rubber has life in it yet.' },
      { pay: KIT.shoes.resole },
    ],
    gear: { id: 'shoes', set: KIT.shoes.resoleTo },
    says: "Fresh rubber. For a day they'll feel like someone else's.",
  },
  'shop.chalk': {
    label: 'A block of chalk',
    cost: { min: 5, cash: -KIT.chalk.price },
    needs: [{ pay: KIT.chalk.price }],
    gear: { id: 'chalk', add: KIT.chalk.uses },
    says: 'You crush half of it into the bag before you reach the door.',
  },
  // Phase 22.2c: the heater's propane.
  'shop.propane': {
    label: 'A tank of propane',
    cost: { min: 10, cash: -WINTER.propane.price },
    needs: [{ pay: WINTER.propane.price }],
    gear: { id: 'propane', add: WINTER.propane.nights },
    note: `${WINTER.propane.nights} winter nights for the heater.`,
    says: 'The tank rides home on the passenger seat, belted in.',
  },
  'shop.tape': {
    label: 'A roll of tape',
    cost: { min: 5, cash: -KIT.tape.price },
    needs: [{ pay: KIT.tape.price }],
    gear: { id: 'tape', add: KIT.tape.uses },
    says: 'Athletic tape. For cracks, and for pretending your tips are fine.',
  },
  'shop.shoes': {
    label: 'New shoes',
    cost: { min: 20, cash: -KIT.shoes.price },
    needs: [{ gearBelow: 'shoes/100', why: 'Yours are new.' }, { pay: KIT.shoes.price }],
    gear: { id: 'shoes', set: 100 },
    says: "They pinch. They'll give.",
  },
  'shop.pad': {
    label: 'A second pad',
    cost: { min: 10, cash: -KIT.pad.price },
    needs: [{ hasNot: 'pad', why: 'Two pads is plenty to carry.' }, { pay: KIT.pad.price }],
    gear: { id: 'pad', set: 1 },
    says: 'A second pad on the roof rack. Highballs look shorter already.',
  },
  'shop.usedShoes': {
    label: 'Used shoes, from the swap meet',
    cost: { min: 20, cash: -Math.round(KIT.used.share * KIT.shoes.price) },
    needs: [
      { weekend: true, why: 'The swap meet is weekends.' },
      { gearBelow: `shoes/${KIT.used.condition}`, why: 'Yours are better than anything on the table.' },
      { pay: Math.round(KIT.used.share * KIT.shoes.price) },
    ],
    gear: { id: 'shoes', set: KIT.used.condition },
    says: 'Somebody else broke them in. Somebody with your feet, almost.',
  },
  'shop.usedPad': {
    label: 'A used pad, from the swap meet',
    cost: { min: 10, cash: -Math.round(KIT.used.share * KIT.pad.price) },
    needs: [
      { weekend: true, why: 'The swap meet is weekends.' },
      { hasNot: 'pad', why: 'Two pads is plenty to carry.' },
      { pay: Math.round(KIT.used.share * KIT.pad.price) },
    ],
    gear: { id: 'pad', set: 1 },
    says: 'The foam is tired and the cover is duct tape. It still lands.',
  },
  'shop.rack': {
    label: 'A rack',
    cost: { min: 20, cash: -KIT.rack.price },
    needs: [{ hasNot: 'rack', why: 'One rack is plenty. Two is a hobby.' }, { pay: KIT.rack.price }],
    gear: { id: 'rack', set: 1 },
    says: 'A rack of cams, a set of nuts, slings. It jangles like money leaving.',
  },
  'shop.hangboard': {
    label: 'A hangboard',
    cost: { min: 15, cash: -KIT.hangboard.price },
    needs: [{ hasNot: 'hangboard', why: 'One board on the van is plenty.' }, { pay: KIT.hangboard.price }],
    gear: { id: 'hangboard', set: 1 },
    says: 'A slab of wood with edges in it. It goes over the back doors, and the van will never be the same.',
  },
  'shop.rope': {
    label: 'A rope and a harness',
    cost: { min: 15, cash: -KIT.rope.price },
    needs: [{ hasNot: 'rope', why: 'One rope is enough to get you in trouble.' }, { pay: KIT.rope.price }],
    gear: { id: 'rope', set: 1 },
    says: 'Seventy metres of dynamic rope, and a harness that fits if you breathe in.',
  },
  'shop.usedRack': {
    label: 'A used rack, from the swap meet',
    cost: { min: 20, cash: -Math.round(KIT.used.share * KIT.rack.price) },
    needs: [
      { weekend: true, why: 'The swap meet is weekends.' },
      { hasNot: 'rack', why: 'One rack is plenty. Two is a hobby.' },
      { pay: Math.round(KIT.used.share * KIT.rack.price) },
    ],
    gear: { id: 'rack', set: 1 },
    says: 'Somebody’s old rack: faded slings, cams that still cam. You check every trigger twice.',
  },

  'center.pass': {
    label: 'Buy a day pass',
    cost: { min: 5, cash: -MONEY.centerPass },
    needs: [{ notToday: 'centerpass', why: "You've got a pass for today." }, { pay: MONEY.centerPass }],
    sets: ['centerpass'],
    says: 'A wristband, and a look that says the comp wall is not for warming up on.',
  },
  'cave.pass': {
    label: 'Buy a day pass',
    cost: { min: 5, cash: -MONEY.dayPass },
    needs: [{ notToday: 'cavepass', why: "You've got a pass for today." }, { pay: MONEY.dayPass }],
    sets: ['cavepass'],
    says: 'A stamp on your hand, and a nod at the steep end.',
  },
  // v0.956's Cave job: coaching, four hours at $34, training head and technique. Nobody
  // pays for coaching from someone who can't climb [proposed: V5 to start].
  'cave.coach': {
    label: 'Coach a session',
    cost: { min: 240, cash: 34, energy: -18, fed: -10 },
    needs: [
      oneShift,
      { grade: 5, why: 'They want a coach who climbs V5.' },
      ...onSchedule('coach'),
      { before: 14 * 60, why: 'Sessions start by {t}.' },
      { energy: 18, why: 'Too tired to spot anyone.' },
    ],
    note: 'Trains your head and technique. Your pass is on the house.',
    sets: ['worked', 'cavepass'],
    trains: { head: 2, technique: 1 },
    job: { id: 'coach', shifts: 1 },
    says: 'Four hours of telling people to trust their feet.',
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
    cost: { min: 240, cash: 30, energy: -22, fed: -10 },
    needs: [
      oneShift,
      ...onSchedule('set'),
      { before: 14 * 60, why: 'Setting starts by {t}.' },
      { energy: 22, why: 'Too tired to haul holds.' },
    ],
    note: 'Trains technique. Your pass is on the house.',
    sets: ['worked', 'pass'],
    trains: { technique: 3 },
    job: { id: 'set', shifts: 1 },
    says: 'Four hours on a ladder with a drill, and a free pass.',
  },
};

// The valley's roads: each place to its neighbours, and nothing more. A drive anywhere
// else is the quickest way through them (`road`). Town is a few streets, ten minutes
// wide. The highway runs from town up to Roadside, an hour out, and the Gorge's dirt road
// and the desert road to Moonstone both leave it there. A new place needs roads to its
// neighbours only: content.test.ts holds the network to reaching everywhere.
export const ROADS: RoadDef[] = [
  { a: 'lot', b: 'cafe', min: 8, cash: 1 },
  { a: 'lot', b: 'gym', min: 12, cash: 1 },
  { a: 'lot', b: 'diner', min: 10, cash: 1 },
  { a: 'cafe', b: 'gym', min: 5, cash: 0 },
  { a: 'cafe', b: 'diner', min: 8, cash: 1 },
  { a: 'gym', b: 'diner', min: 10, cash: 1 },
  // The gear shop: a block from the café, on the way in from the Lot.
  { a: 'shop', b: 'cafe', min: 4, cash: 0 },
  { a: 'shop', b: 'lot', min: 9, cash: 1 },
  // The warehouse: on the flats below Midtown, between the Lot and the shop.
  { a: 'warehouse', b: 'lot', min: 10, cash: 1 },
  { a: 'warehouse', b: 'shop', min: 6, cash: 1 },
  // The garage: past the gear shop, on the way out to the Lot.
  { a: 'garage', b: 'shop', min: 5, cash: 0 },
  { a: 'garage', b: 'lot', min: 8, cash: 1 },
  { a: 'garage', b: 'cafe', min: 7, cash: 1 },
  { a: 'road', b: 'lot', min: 60, cash: 12 },
  { a: 'road', b: 'cafe', min: 65, cash: 12 },
  { a: 'road', b: 'diner', min: 70, cash: 12 },
  // The Gorge: v0.956's two hours and 22% of a tank from the Lot, the last hour of it on
  // the dirt road that leaves the highway past Roadside.
  { a: 'gorge', b: 'road', min: 60, cash: 10 },
  // Moonstone: v0.956's three hours and 30% of a tank from the Lot, north up the highway
  // past Roadside and out of the valley.
  { a: 'moon', b: 'road', min: 120, cash: 18 },
  // The Mesa: v0.956's three hours and 35% of a tank from the Lot, west off the highway
  // past Roadside on the desert road.
  { a: 'mesa', b: 'road', min: 120, cash: 20 },
  // The Big Stone: v0.956's four hours and 38% of a tank from the Lot, north past where the
  // highway leaves the valley.
  { a: 'stone', b: 'road', min: 180, cash: 22 },
  // Wind River: v0.956's four hours and 40% of a tank from the Lot, on past the Gorge where
  // its dirt road climbs out of the valley.
  { a: 'wind', b: 'gorge', min: 120, cash: 14 },
  // The Crucible: v0.956's four hours and 45% of a tank from the Lot, east over the pass.
  { a: 'crucible', b: 'lot', min: 240, cash: 26 },
  // Psicobloc Cove: v0.956's two hours and 26% of a tank from the Lot, west past Old Town
  // to the coast.
  { a: 'cove', b: 'diner', min: 110, cash: 14 },
  // The Cave: at the trailhead on the highway, twenty minutes short of Roadside.
  { a: 'cave', b: 'road', min: 20, cash: 3 },
  { a: 'cave', b: 'gym', min: 45, cash: 8 },
  { a: 'center', b: 'gym', min: 10, cash: 1 },
];

// A drive: its time and gas, and the places it passes on the way.
export interface Trip {
  min: number;
  cash: number;
  via: string[];
}

const trips = new Map<string, Trip | undefined>();

// The quickest drive between two places: the least time along the roads, then the least
// gas. None to where you already are, or to somewhere no road reaches.
export function road(a: string, b: string): Trip | undefined {
  const key = `${a}>${b}`;
  if (!trips.has(key)) trips.set(key, a === b ? undefined : quickest(a, b));
  return trips.get(key);
}

function quickest(from: string, to: string): Trip | undefined {
  const best = new Map<string, { min: number; cash: number; path: string[] }>([
    [from, { min: 0, cash: 0, path: [] }],
  ]);
  const done = new Set<string>();
  for (;;) {
    let at: string | null = null;
    for (const [id, t] of best) {
      if (done.has(id)) continue;
      const b = at === null ? null : best.get(at)!;
      if (!b || t.min < b.min || (t.min === b.min && t.cash < b.cash)) at = id;
    }
    if (at === null) return undefined;
    const here = best.get(at)!;
    if (at === to) return { min: here.min, cash: here.cash, via: here.path.slice(0, -1) };
    done.add(at);
    for (const r of ROADS) {
      const next = r.a === at ? r.b : r.b === at ? r.a : null;
      if (!next || done.has(next)) continue;
      const t = { min: here.min + r.min, cash: here.cash + r.cash, path: [...here.path, next] };
      const was = best.get(next);
      if (!was || t.min < was.min || (t.min === was.min && t.cash < was.cash)) best.set(next, t);
    }
  }
}

// Values content text may name, derived from the dials.
export const TEXT_VALUES = {
  spot: `$${MONEY.vanSpot}`,
  pass: `$${MONEY.dayPass}`,
  centerPass: `$${MONEY.centerPass}`,
  wake: clockShort(DAY.wakeMin),
};
