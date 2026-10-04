// Every number a designer might turn, with what it means and why it sits where it does.
// These are the feel slice's values: placeholders that played well, not balance. Phase 6
// retunes them against the bots in R2.

import type { Style } from './climber';
import type { Disc } from './content/routes';

// Phase 18.7 [proposed], Evan's call: the grade curve, compressed past `knee`. Up to it, a
// skill average of 8g + 2.4g² climbs grade g (V5 at 100, V10 at 320), as it always has; past
// it, each grade costs `top` more. On the old curve a career ended near V13 and The Line's
// V18 wanted three careers' growth; the knee keeps every early target where it was.
export const CURVE = { knee: 10, top: 26 };

// How a crux's window scales with your margin: your level in the beta's style, less the
// line's grade. Under your level windows open 24% a grade, but never past 1.4, so a crux
// never stops being one. Over it they close by e^(0.9 x margin), to about 40% a grade.
// Against the harness's human-ish hands, a one-crux boulder then goes about 60% a go one
// grade over, 15% at two, 5% at three and never at four; a sport line with two cruxes and
// the pump, 10-30% a go one grade over. v0.956 made the point with a cliff (odds capped
// at 13% 1.5 grades short, 3% at 2.5); this is its slope without the hidden step. R1's
// floor of 0.4 let a V4 send the Gorge's V9 with enough goes.
export const WINDOW = {
  easier: 0.24,
  widest: 1.4,
  harder: 0.9,
  // A floor only so a window inside the limit is never zero; nothing holds one this narrow.
  narrowest: 0.002,
};

// Climbing above your grade (Phase 16, Evan's call), all [proposed]. A V12 who'd trained
// one style to V15 sent the Crucible's V15 boulder 95% of goes, its V16 half the time and
// its V18 myth one go in eleven: the meter steps at 60 a second, so a window narrower than
// a frame still passes whenever a frame lands in it. So:
//   specialist  one style carries you at most this far past your grade (the average of
//               all five), so the V18 myth asks for a V18 climber, near enough;
//   from        past one grade over, windows close faster too: steeper more a grade on top
//               of WINDOW.harder, so two grades over is a ninth of at-grade, not a sixth;
//   limit       three grades over, a crux is shut: there's no window to hit at all;
//   cruxFrom    and from a grade and a half over, a move that's a move for someone at the
//               grade is a crux for you, one more each grade on, up to `most` on a line.
//               From one grade over, half the career bots hadn't finished Act III by day
//               415 (a grade over is where everyone projects); from a grade and a half,
//               all of them had, a median of day 261.
export const OVER = {
  specialist: 1.5,
  from: 1,
  steeper: 0.6,
  limit: 3,
  cruxFrom: 1.5,
  most: 2,
};

export const DAY = {
  // The first morning starts at 7:40. Hazel is already at the fire with the coffee.
  firstMin: 7 * 60 + 40,
  // Wake at 7:10: early enough for the morning shade at the crag, late enough that a lie-in
  // isn't a choice you have to make.
  wakeMin: 7 * 60 + 10,
  // From 5 PM the Lot is a night scene: the fire's lit, Hazel is back, and you can turn in.
  // Bed was 6 PM, to make a bad day harder to skip. All it made harder was the evening:
  // Phase 11's count found 12 of a day-3 loop's 32 taps spent waiting for bed.
  nightFrom: 17 * 60,
  nightUntil: 5 * 60,
};

export const MONEY = {
  // $41 is two nights at the Lot and one tank to the crag. A climbing day without a shift
  // ends in debt at bedtime: the trade the whole game is built on.
  start: 41,
  // A night at the Lot. It goes on the card if you can't cover it.
  vanSpot: 18,
  // Send City's day pass. v0.956 charged $5 a go; a pass lets you keep trying.
  dayPass: 14,
  // The Training Center's: dearer, for the walls and the setting [proposed].
  centerPass: 20,
  // How far the card goes. Past it, gas and the van spot are declined: you drive nowhere
  // and sleep rough. Bills still land. No game over: v0.956's hard wipe is gone.
  cardLimit: 150,
  // Every seventh night, v0.956's weekly bills.
  registration: 45,
  insurance: 25,
};

// Phase 22.1: the week's shifts. You sign up for a posted shift up to a week ahead (from
// tomorrow: today's you walk in to). A shift you signed up for and didn't work is a
// warning; the third costs the job: back to its first rank, and off its schedule for a week.
export const WORK = {
  ahead: 7,
  strikes: 3,
  benchDays: 7,
};

// Phase 18.1: a shift played, not just worked [proposed]. Played well, it pays up to `top`
// more than the shift (a score of 1); a score under `from` pays the shift and no more, so
// playing is never worse than working it. Busking's lesson: skill earns, nothing punishes.
export const PLAY = { from: 0.4, top: 0.4 };

// Phase 18.2 [proposed]. The café's rush: a queue that grows with your rank, each order a
// drink and how many turns of the machine the customer will wait; serve them in the order
// that keeps the most tips. The diner's floor: a section of tables that grows with rank,
// each a party and a mood, and the kitchen's pace; every table you take on makes the others
// wait, the fussy most, so take the ones that tip best together. Each is scored against the
// best that day's queue or floor allowed, so `from` is set above what playing at random gets.
export const RUSH = { queue: [5, 5, 6, 6, 7], patience: { lo: 2, hi: 9 }, regular: 2, from: 0.8 };
export const FLOOR = { waves: 3, wave: [3, 3, 4, 4], from: 0.65 };

// Phase 18.3 [proposed]. The coach's roster: clients who stay, each with a project a grade
// or three over them, and how a session's hour moves them toward it. Burns are the fastest
// way up and wear a client out; a scared client gets nowhere on them till the fear's
// worked on; a tired one needs sending home. Tiredness wears off a point a day, and some
// days a client turns up scared. A send pays `send` a grade of the gap, and a new client
// takes the slot. The roster grows with rank.
export const COACH = {
  roster: [2, 3, 4],
  burns: { gain: 26, tired: 8, scared: 4, wear: 2 },
  drill: { gain: 12, wear: 1 },
  head: { gain: 5 },
  rest: { ease: 2 },
  scare: 0.25,
  send: 6,
};

// The warehouse's picks: after the shift's quota, picks on top, three on offer at a time,
// each paying something and weighing something. Every pick's a chance to drop it, rising
// with how worn out you are, and a drop costs some of what you'd picked so far and ends the
// run: so there's a time to stop, and the day (the heat, the supervisor) moves it. The
// forklift driver (rank 2 and up) carries `easier`.
// Phase 18.4 [proposed]. A comp: a top counts if it's in the first `goes` goes; sign-up
// closes at `close`; the field's chance of a top rises with grade over the problem's,
// `steep` per grade; ladder points fade by half every `half` days.
export const COMP = { goes: 5, close: 13 * 60, steep: 1.4, half: 56 };

// Phase 18.5 [proposed]. Followers from a post: `k` × the worth of today's best send (its
// grade plus two, to the power `pow`; more outside, on a first go, or a first ascent) × how
// engaged your followers are, for the post's style, × what's left of the audience under
// `ceiling` (Phase 18.7: summed over every send and uncapped, the media bot had 1.6 million
// by day 415). The ceiling sits well over the rival's top, so she can be caught. Engagement rises a post and slips after
// `quiet` days without one; under `slump` you lose a share of followers a night. A sponsor
// cycle is `cycle` days, two missed and you're dropped. A thread comes up at `heat` a night
// (more with followers, brand terms and bait), and gives you `prove` days to send at the
// grade. The film wants a line at your grade plus `doc.over`, outside, in `doc.days` (one over,
// the media bots shelved it as often as not, Phase 18.7); shelved,
// the filmmaker asks again `doc.again` days on (Phase 18.7). `known`
// is the media ladder's first rung: a crag's worth of people who'd know your name.
export const MEDIA = {
  known: 1000,
  ceiling: 150000,
  k: 12,
  pow: 1.4,
  outside: 1.6,
  first: 1.3,
  fa: 2,
  podium: 400,
  style: { straight: 1, story: 0.6, bait: 1.6, ad: 0.3 },
  engage: { start: 40, post: 6, quiet: 3, fade: 3, slump: 25, loss: 0.005 },
  brand: 1.5,
  cycle: 14,
  strikes: 2,
  heat: { chance: 0.012, cap: 0.05, from: 2000, bait: 1.8, prove: 7, win: 0.25, lose: 0.05 },
  rival: { top: 60000, mid: 140, width: 35 },
  lostFor: 28,
  doc: { followers: 40000, over: 0, days: 28, boost: 0.5, again: 56 },
  storyPsyche: 4,
  shoot: { energy: 20, min: 180 },
};

// Phase 18.6 [proposed]. Your own gym: Send City, bought off its owner once you're its head
// setter. A day's money: dues from each member and a share of walk-ins, less rent and the
// desk; members drift toward what the wall's worth (how fresh the set is) and the upgrades.
// The set goes stale by `fade` a day unless you set it, or a hired setter keeps it at
// `hired`. Profit goes in the till, and the till's yours to draw. A till under zero is
// told every morning; under `floor`, the bank sells it, at `forced` of the price.
export const OWN_GYM = {
  // A head setter's season of saving; back in about seven weeks with a hired setter. At
  // $6,000 the business bots bought it near day 300, too late to fill it (Phase 18.7).
  price: 4500,
  // Marg's sixty just about cover the costs. A wall at its freshest draws base + wall; `top`
  // is the busiest gym in the valley, the business ladder's last rung.
  members: { start: 60, base: 30, wall: 140, drift: 0.1, top: 200 },
  // A member's dues a day (about $48 a month), and the walk-ins each brings, at a day pass.
  dues: 1.6,
  walkins: 0.12,
  pass: MONEY.dayPass,
  // A day's rent and the desk kid, and a setter's day if you hire one.
  rent: 120,
  desk: 70,
  setter: 55,
  // A plain set's worth nothing in under two weeks. A hired setter keeps the wall a good
  // set; a plain set of yours lands just under, so the brief's the way past him.
  fade: 0.04,
  hired: 0.55,
  plain: 0.45,
  // Sold, 70% of the price; sold by the bank, half. The floor's a week or so of a stale
  // gym's losses: time to read the warnings and act.
  resale: 0.7,
  forced: 0.5,
  floor: -600,
  // The board and the wall pay for themselves in about a month, as the members come; the
  // café's quicker the busier you are.
  upgrades: {
    board: { price: 1500, members: 25 },
    cafe: { price: 1200, dues: 0.5 },
    wall: { price: 2500, members: 45 },
  },
};

// Setting your own wall takes a shift's hours and legs.
export const GYM_SET = { min: 240, energy: 22 };

// Phase 25.1 [proposed]. Giving, after v0.956's food bank and access fund: once a week each,
// a little psyche for the food bank and the old crowd's nod for the access fund. v0.956 gave a
// food-bank day +10 psyche and a 5-day odds buff; here it's less, and nothing on the rock.
export const GIVING = {
  food: { cash: 50, psyche: 5 },
  access: { cash: 40, old: 2 },
  every: 7,
};

// Phase 25.1 [proposed]. A crag's guide, written at the van once you've sent every line there
// and put up one of your own: `pages` evenings of `min` minutes, then royalties every week.
// v0.956 paid up to $18 a day for its guide; a dirtbag's guide pays for gas.
export const GUIDE = { pages: 5, min: 180, energy: 10, royalty: 15 };

// Phase 18.6 [proposed]. Miller's Bluff: the land's price, and what a line costs to make
// climbable: a sport line bolted (hardware and a day on a rope), a boulder cleaned. The
// price is late money: half again the gym's, for nine lines nobody else will ever climb first.
export const LAND = {
  price: 9000,
  bolt: { cash: 140, min: 300, energy: 35 },
  clean: { cash: 0, min: 120, energy: 15 },
};

export const HAUL = {
  picks: 6,
  offer: 3,
  risk: 2.2,
  easier: 0.75,
  // The day: how hot the floor is (what a pick takes out of you) and who's supervising (how
  // much of the picks a drop costs).
  heat: [0.8, 1, 1.3],
  dock: [0.4, 0.7, 1],
};

// The setter's puzzle [proposed]: five moves hung from a hand that grows with your rank (the
// head setter has the pick of the holds), for a grade the gym wants that rises with it.
// The weights say what a good set is: the grade, then flow, then the wall, then the crowd.
export const SETTING = {
  pick: 5,
  hand: [7, 8, 9, 10],
  want: { step: 2, spread: 2 },
  weight: { grade: 0.35, flow: 0.3, fit: 0.2, crowd: 0.15 },
};

// Phase 22.1: how you live, chosen in the week and paid at the van every night, on top of
// the spot. v0.956 raised your costs with your grade behind your back; here you pick. More
// a night buys more back by morning: a better pad, a shower, salve for your tips [proposed].
export type Lifestyle = 'dirtbag' | 'comfortable' | 'plush';
export const LIFESTYLE: Record<Lifestyle, { cost: number; energy: number; skin: number }> = {
  dirtbag: { cost: 0, energy: 0, skin: 0 },
  comfortable: { cost: 12, energy: 8, skin: 4 },
  plush: { cost: 28, energy: 15, skin: 8 },
};

// Phase 22.2a: the van's three parts, each 0 to 100 (v0.956 had six; Decision 5 kept three).
// Tires and the engine wear with every minute driven; the battery a little every night. A
// part wears the van toward a breakdown on any drive out of town, and the garage in Midtown
// puts it back [proposed, all of it].
export type VanPart = 'tires' | 'engine' | 'battery';
export const VAN = {
  // A new climber's van is used, not new; one already out here when the van came in, more so.
  start: { tires: 85, engine: 85, battery: 85 },
  // Wear per minute of driving: Roadside and back (two hours) is about 1.8 off the tires and
  // 1.2 off the engine, so a climber out there every day needs tires about every 55 days and
  // an engine service about every 80: about $5 a day with the battery. The first try (0.06
  // and 0.04) cost a daily commuter $25 a day and sank every season bot by week two.
  wear: { tires: 0.015, engine: 0.01 },
  // Off the battery every night.
  night: 1,
  // Drives this long or more can break down; a hop across town never does.
  from: 20,
  // Breakdown odds an hour of driving: `worn` times the square of the worst road part's
  // wear (0 new, 1 dead). A van kept up never breaks down; v0.956's did 17% of crag days
  // even fresh. Roadside and back (two hours) with a part at 85 is about 0.6%; at 50, 7%;
  // at 20, 18%.
  base: 0,
  worn: 0.14,
  // What a breakdown leaves of the part that went.
  broken: 5,
  // Under this, the van won't take a drive out of town, except home or to the garage.
  unsafe: 15,
  // The ways out. A tow to the garage; a bodge, which holds three times in five; limping on
  // at half speed; or a friend with a spare and an afternoon.
  tow: { cash: 70, min: 90 },
  bodge: { min: 60, odds: 0.6, to: 35 },
  limp: { slow: 2, energy: 15 },
  friend: { min: 120, to: 30, tier: 2 },
  // The garage: a part from dead to new costs this, and a repair its share of it by wear,
  // never under `least`; the time is the whole job's.
  price: { tires: 140, engine: 180, battery: 90 } as Record<VanPart, number>,
  least: 15,
  work: { tires: 60, engine: 120, battery: 20 } as Record<VanPart, number>,
};

// Phase 22.2b: where you park for the night, a choice that stays until you change it. Each
// spot's price on top of the gas there and back, the drive (off the evening and the
// morning), and what the night does to your energy, more in winter where it's cold. You
// wake at the Lot either way [proposed, all of it].
export type SpotId = 'lot' | 'trailhead' | 'truckstop' | 'driveway' | 'ridge';
export const SPOTS: Record<
  SpotId,
  { cost: number; gas: number; drive: number; energy: number; winter: number }
> = {
  // The Lot: the van spot, and the meter maid.
  lot: { cost: MONEY.vanSpot, gas: 0, drive: 0, energy: 0, winter: 0 },
  // The Upper Trailhead: free, up the road, and cold.
  trailhead: { cost: 0, gas: 6, drive: 25, energy: -10, winter: -10 },
  // The truck stop on the highway: cheap, lit all night, and loud.
  truckstop: { cost: 6, gas: 2, drive: 10, energy: -12, winter: 0 },
  // A friend's driveway: a good night, if you don't wear out your welcome.
  driveway: { cost: 0, gas: 2, drive: 10, energy: 5, winter: 0 },
  // The Ridge: the locals' spot above the valley, once they know you. Stars, and wind.
  ridge: { cost: 0, gas: 8, drive: 40, energy: 5, winter: -15 },
};
export const SPOT = {
  // Tickets at the Lot: none for the first `from` nights in a row, then `per` more a night
  // up to `cap`. v0.956 went to 40% and booted you at three.
  tickets: { from: 3, per: 0.05, cap: 0.25, fine: 25 },
  // The driveway wants a partner (BOND.tiers) and a few nights between visits.
  driveway: { tier: 3, every: 4 },
  // The Ridge opens once you've made this many trips out.
  ridgeTrips: 25,
};

// Phase 22.2c: what Dale fits to the van, and winter. Every upgrade is a thing you own
// (content/gear.ts), fitted once, for good. None of them earns: v0.956's solar and power
// station paid the whole nut, and the audit cut that (core-loop.md §5.1) [proposed, all of it].
export const UPGRADE = {
  // A real mattress: more back from every night in the van.
  bed: { price: 70, min: 60, energy: 5 },
  // Blackout curtains: the parking people can't see you're living there.
  curtains: { price: 60, min: 30, tickets: 0.3 },
  // A tool kit: a bodge that holds nine times in ten.
  toolkit: { price: 85, min: 5, bodge: 0.9 },
  // A tune-up: a fifth off the gas on every drive.
  tuneup: { price: 90, min: 90, gas: 0.8 },
  // A diesel heater: no cold on a winter night while there's propane for it, a tank a night.
  // Evan's call: one a player can buy before the first winter (day 15). The season harness's
  // balanced bots hold a median $83 on days 10 to 14, so $45 and a first tank ($18) is in
  // reach; $150 wasn't.
  heater: { price: 45, min: 90 },
  // Insulation: half the cold, heater or not.
  insulation: { price: 60, min: 120, cold: 0.5 },
  // Phase 22.3: a camp kitchen, and the recipes with it (content/food.ts).
  kitchen: { price: 80, min: 60 },
};
export const WINTER = {
  // What a winter night in the van takes out of you on top of the spot's own chill, before
  // the heater and insulation.
  cold: -10,
  // Propane at the gear shop: a tank lasts this many heated nights.
  propane: { price: 18, nights: 10 },
  // The warning, this many days before winter comes.
  warnDays: 5,
};

// Phase 22.3: food [proposed, all of it]. A meal that fuels you (content/food.ts) widens
// every window by this much for the rest of the day: a day's edge, never a skill (v0.956's
// recipes gave flat skill, a farm to V18: climbing.md §5.3).
export const FOOD = {
  fueled: 1.05,
  // The same meal this many times running, and Tonight says so (22.4's sickness reads it).
  same: 4,
  // Coffee: past this many a day, a cup is jitters, not energy.
  coffees: 2,
  crash: -6,
  // Going to bed hungry with food in the pantry: you eat a serving cold, for this much, up to
  // this many servings.
  cold: 15,
  coldMax: 2,
};

// Phase 22.3b: the lake [proposed]. Fishing is food, not cash: each fish is `fish` food,
// cooked on the shore. The catch is up to `most` fish, its odds by season and by the hour
// (dawn and dusk bite). Two hours for at most a diner meal's worth, once a day: never a
// shift's pay (the harness's rule for a hustle).
export const LAKE = {
  fish: 15,
  most: 3,
  // The chance of each fish, by season.
  bite: { spring: 0.4, summer: 0.5, fall: 0.5, winter: 0.15 },
  // Before this minute or from that one, the fish bite half again as often.
  dawn: 9 * 60,
  dusk: 17 * 60,
  golden: 1.5,
  // A swim: more back than it takes, once a day, not in winter.
  swim: { min: 45, energy: 8 },
};

export const BODY = {
  startEnergy: 78,
  startSkin: 64,
  // v0.956's hunger meter, as "fed": 80 to start, 15 gone overnight.
  startFed: 80,
  nightFed: 15,
  // Go to bed under this and you sleep badly: less energy back.
  hungryBelow: 20,
  hungryNight: 15,
  // A night in the pullout when the card won't cover the van spot.
  roughEnergy: 35,
  // Under this, every window shrinks, down to 70% at zero. Zero stops climbing and work.
  weakBelow: 35,
  // A night's sleep gives most of your energy back but only a fifth of your skin, so two
  // hard days in a row are a real decision.
  sleepEnergy: 55,
  sleepSkin: 22,
  // A long drive is tiring in a small way. Hops across town aren't.
  driveEnergy: 3,
};

// Training load: v0.956's acute:chronic model (docs/audit/climbing.md §2.12). Each go adds
// load; at sleep, acute and chronic load move toward the day's total as exponentially
// weighted averages. Their ratio is how far you've spiked over what your body is used to.
export const LOAD = {
  // Phase 6's fix for v0.956's cold start (both averages at zero, so any first week was a
  // spike): both begin at a light day's load. A first week of full days still ramps you into
  // the warning zone, so the load teaches rest days; it just can't ambush you.
  start: 20,
  // v0.956's smoothing: acute tracks the last four days, chronic the last fortnight.
  acuteRate: 1 / 4,
  chronicRate: 1 / 14,
  // Below this chronic load the ratio isn't meaningful (v0.956: 6).
  minChronic: 6,
  // v0.956's lines: over 1.3 every go risks an injury, over 1.5 you learn at 60%, over 1.7
  // you're fried and can't climb.
  risk: 1.3,
  slow: 1.5,
  fried: 1.7,
  slowGains: 0.6,
  // v0.956's risk per go over the line: 0.3 per 0.1 of ratio, capped at 40%. Its goes were
  // two hours; these are minutes, so the risk scales by the go's load against a v0.956-sized
  // go (about 10 of these units).
  riskSlope: 0.3,
  riskCap: 0.4,
  perGo: 10,
  // A hard go before you've warmed up: v0.956's ×1.6 risk, and every window 10% narrower.
  coldRisk: 1.6,
  coldWindows: 0.9,
  // Risk by the style of the line (v0.956's: crimps and cracks are hardest on fingers).
  typeRisk: { crimp: 1.5, power: 1.2, dyno: 1.2, crack: 1.3, endurance: 1, technical: 1 } as Record<
    Style,
    number
  >,
};

// Partners (v0.956's): bond tiers, a bond a day climbing together (Phase 6's cap on
// v0.956's one a go, which made Ride-or-Die two crag days away), and partners who turn
// up more as the tier rises.
export const BOND = {
  // Stranger, Acquaintance, Regular, Partner, Ride-or-Die.
  tiers: [0, 1, 3, 5, 7],
  // Each tier adds to a partner's odds of turning up on a day. v0.956 added 0.11 a tier to
  // Sage's 0.42; from the rebuild's 0.55, 0.07 a tier lands Ride-or-Die at the same
  // five days in six.
  perTier: 0.07,
  // A partner will come out climbing with you if you ask before one; how close you need to
  // be depends on the crag (PlaceDef.invite).
  inviteBefore: 13 * 60,
};

// The cast past Hazel, Sage and Dex (Phase 17.1), on v0.956's figures where it had them
// [proposed]. Each partner turns up on a day at `base`, plus BOND.perTier a tier, as Sage
// does, inside their hours, and only where they climb.
//   ray    Roadside on weekends, as v0.956's local was, through the morning;
//   frank  the Lot on v0.956's 40% of nights (20% in winter), at his rig till late, from
//          the third: the first two nights at the fire are Hazel's;
//   mara   the Gorge on dry days: v0.956's 0.34, the least around and the hardest climber;
//   rico   the Cave, or Moonstone when it's dry: v0.956's 0.55;
//   tam    the Mesa on dry mornings, before the sandstone heats up: v0.956's 0.30.
export const CAST = {
  ray: { from: 8 * 60, till: 14 * 60 },
  frank: { nights: 0.4, winter: 0.2, from: 17 * 60, till: 22 * 60, fromDay: 3 },
  mara: { base: 0.34, from: 9 * 60, till: 17 * 60 },
  rico: { base: 0.55, from: 11 * 60, till: 20 * 60, moon: 0.4 },
  tam: { base: 0.3, from: 7 * 60, till: 14 * 60 },
};

// Partner arcs: v0.956's four beats, at bonds 1, 3, 5 and 7, with Phase 6's spacing (v0.956
// had none, so a whole arc could land in a week).
export const ARC = {
  bonds: [1, 3, 5, 7],
  spacing: 5,
  // Sage's guiding stint. v0.956 sent her off for 16 days, most of Act I here; a week keeps
  // her arc inside the act.
  sageAway: 7,
  // Phase 17.2's forks, where an answer changes who's around [proposed]: Hazel home to her
  // sister's; Dex off training; Mara keeping her distance after a no, and her finger; Rico at work, and at the
  // city gym; Tam resting his knees; Frank's truck at the garage. Rico's loan, in dollars.
  hazelHome: 5,
  dexTrains: 5,
  maraCool: 3,
  maraHurt: 12,
  ricoWork: 4,
  ricoCity: 14,
  tamRest: 4,
  frankGone: 7,
  ricoLoan: 40,
};

// People's grades, on curves of their own from the seed. v0.956 pinned partners to your
// grade and kept the rival one ahead of you whatever you did; Phase 6 gives each their own.
export const CURVES = {
  // Sage moves a grade every 20 days (v0.956's rate for her), from V4.
  sage: { start: 4.3, perDay: 1 / 20, peak: 13 },
  // Dex is V5 when you meet him around week three, and a grade better every three weeks
  // or so after: a climber putting the work in can catch him.
  dex: { start: 5, perDay: 0.045 },
};

// Dex Calloway, v0.956's rival: power, a bitter nemesis.
export const RIVAL = {
  // His ceiling, drawn from the seed.
  peak: [9, 11],
  // A stretch off hurt (v0.956's blown pulley): when it starts, and how long.
  hurtFrom: [35, 75],
  hurtDays: [14, 24],
  // Streaks: how far a good or bad few weeks moves him, in grades.
  streak: 0.4,
  // Out on two days in five: mostly the crag when it's dry, else the gym.
  out: 0.4,
  crag: 0.7,
  // The first-ascent race for the open project: he moves once you're climbing this grade
  // (when the Gorge opens, around Act I's end), and gives you this many days (v0.956's
  // five). Bots that take the dare win about two races in three; at V3 they won one in
  // nine, and firing on a first V5 or V6 send caught them three grades short.
  raceGrade: 4,
  raceDays: 5,
};

// Scout (v0.956's dog, the Lot's stray here). His bond runs 0-100 as v0.956's did; the
// perks it once bought come later.
export const DOG = {
  // He picks you after your tenth trip out to a crag (v0.956's offer).
  offerTrips: 10,
  // A night takes this much of his food; kibble fills him and adds a little bond.
  nightFed: 22,
  kibble: 6,
  kibbleBond: 3,
  // Throwing the stick: an hour, once a day.
  playBond: 10,
  playMin: 60,
  // Every drive he rides along.
  rideBond: 2,
  // Under this he's hungry, and his lines say so.
  hungryBelow: 30,
  // His bond's words: new pup, good buddy, best friend (v0.956's).
  tiers: [0, 30, 70],
  // Phase 22.7, v0.956's lifecycle. A dog-year is `year` days from the day he picked you; he
  // goes gray at `gray`, slows down at `senior`, has a scare at the vet at each of `vet`'s
  // ages (the bill with it), and at `end` it's the last day. No new stray comes for `gone`
  // days after.
  year: 18,
  gray: 8,
  senior: 12,
  vet: [
    { age: 10, cost: 70 },
    { age: 13, cost: 130 },
  ],
  end: 16,
  gone: 30,
  // His perks, by bond (v0.956's): he settles at the fire (`settle` more psyche there), goes
  // looking for food on his rounds (`find` a night, a serving for the pantry), and watches
  // the van (the Lot's tickets `watch` as likely: halved, where v0.956's blocked every one).
  perks: { settle: 20, find: 45, watch: 75 },
  settle: 2,
  find: 0.25,
  watch: 0.5,
};

// A climber carried over from v0.956, which retired at R3 (Evan's call: retire it, export
// saves). Their five skills come across as they were, but no higher than this grade, scaled
// so their shape (strong fingers, weak head) survives. [proposed] V3 is the middle of Act I:
// a veteran skips the gym basics but still has the act's top grade and Dex's race to earn,
// and the rebuild has nothing to climb above V9 anyway.
export const LEGACY = {
  capGrade: 3,
};

// Injuries: v0.956's three tiers and how long each keeps you off. The clinic is a copay
// (your weekly insurance pays the rest), and your first injury costs only time (Phase 6).
// Phase 22.4a: insurance plans, chosen in the week, paid with the week's bills; they replace
// the flat premium (MONEY.insurance is catastrophic's, the plan everyone had). Each sets what
// a clinic bill comes to: a multiple of INJURY.clinic, or a flat copay [proposed].
export type Plan = 'none' | 'catastrophic' | 'full';
export const PLANS: Record<Plan, { premium: number; bill: number; copay?: number; care: number }> = {
  none: { premium: 0, bill: 2, care: 1 },
  catastrophic: { premium: MONEY.insurance, bill: 1, care: 1 },
  full: { premium: 45, bill: 0, copay: 20, care: 0.25 },
};

// The clinic in Old Town (Phase 22.4a) [proposed]. Physio takes a day off an injury, once a
// day; cortisone halves what's left, and the next injury inside `jabDays` lands a tier worse.
// `care` in PLANS is the share of these prices you pay.
export const CLINIC = {
  physio: { price: 40, min: 120, days: 1 },
  cortisone: { price: 60, min: 30, jabDays: 21 },
};

// Phase 22.4b: old injuries and fear [proposed]. A tier-2 or tier-3 injury, healed, can leave
// a mark on where it was (content/injuries.ts AREA): more risk there for good, and now and
// then a flare, felt only on lines that load it, until physio settles it or it passes. A
// deck, a bad landing or a tier-3 injury leaves you afraid of that line's style until you
// send one. v0.956's scars and marks, merged (core-loop.md §8 CUT 3).
export const SCARS = {
  // The chance a healed injury leaves a mark, by tier.
  chance: [0, 0.35, 0.7],
  // Injury risk where it's marked.
  risk: 1.3,
  // A flare's chance a go on a line that loads the mark, how long it lasts, and what it does
  // to that line's windows.
  flare: 0.06,
  flareDays: 3,
  flareWindows: 0.9,
};
export const FEAR = { windows: 0.9 };

// Phase 22.4c: supplies and sickness [proposed]. One gauge for water and washing, 0 to 100
// (propane stays the heater's own, by tank). It runs down every night at the van and comes
// back at the lake, the market, the gym's shower and the truck stop's.
export const SUPPLIES = {
  start: 80,
  night: 8,
  low: 25,
  lake: 40,
  market: { price: 4, add: 30 },
  shower: 30,
  truckstop: 20,
};
// Sickness: a seeded chance every night from what the night and the week were like. A cold
// or a bug lasts a few days: less back each night and every window tighter. A toothache
// (low supplies) lasts until the clinic sees it. A doctor halves what's left.
export const SICK = {
  base: 0.01,
  winter: 0.03,
  supplies: 0.04,
  hungry: 0.04,
  same: 0.03,
  days: [2, 4] as [number, number],
  energy: -20,
  windows: 0.85,
  doctor: { price: 30, min: 60 },
};

// Phase 22.5a: the hustle [proposed], v0.956's safety net for being broke: cans round the
// Lot, the bins behind the market after it shuts, and foraging by the lake. Each is once a
// day and takes its time; none pays a shift's worth an hour (the harness checks). v0.956's
// numbers, but for the forage, which here is the lake's only and slim in winter.
export const HUSTLE = {
  cans: { min: 120, energy: -8, cash: [3, 9] as [number, number] },
  bins: { min: 60, energy: -4, odds: 0.78, fed: [24, 39] as [number, number] },
  forage: { min: 120, energy: -6, fed: [18, 29] as [number, number], winter: 0.4 },
  // Hungry under this and broke under this, the game says where the net is, once.
  teach: { fed: 35, cash: 10 },
};

// Phase 22.5b: busking outside the café [proposed]. Evan's call: it pays less than any job
// at first, and after hundreds of sets more an hour than any job, because you've become a
// good guitar player; and the crowds grow as you do. Your playing is `learn`-scaled: after
// `learn` sets you're 63% of the way there, after three times that 95%. A set counts
// `practice.floor` plus the rest by how clean it was. Pay an hour runs from `rate.start`
// (under the warehouse's $6.50) to `rate.top` (over head coach's $17), times the crowd
// (the hour, the weekend, the sky, the day's luck: about 1 on an ordinary day), times how
// you played. One set a day, so a day's busking never pays what a day's shift does.
export const BUSK = {
  min: 60,
  energy: 5,
  from: 8 * 60,
  until: 20 * 60,
  notes: 8,
  learn: 150,
  practice: { floor: 0.5 },
  rate: { start: 4, top: 24 },
  // Tips at a sloppy set, as a share of a clean one's.
  sloppy: 0.3,
  hours: [
    { from: 8 * 60, f: 0.6 },
    { from: 11 * 60 + 30, f: 1.2 },
    { from: 14 * 60, f: 0.8 },
    { from: 17 * 60, f: 1.3 },
  ],
  weekend: 1.3,
  sky: { prime: 1.1, fair: 1, hot: 0.8, rain: 0 },
  luck: 0.2,
  // People who stop, on an ordinary crowd, from your first set to a legend's.
  heads: [2, 30] as [number, number],
  // Where your playing earns a name: busker, regular, local legend.
  ranks: [0.25, 0.55, 0.85],
};

// Phase 22.6: the event deck [v0.956's numbers]. At most one encounter a day, of any kind.
// A knock comes on a van night, at `knock.odds` times the spot's own (the Lot's lit and
// public, a driveway's private), and never within `knock.every` nights of the last. A
// knock's psyche is v0.956's scale, which moved further than the rebuild's: `psyche` scales
// it to ours.
export const EVENTS = {
  // Nothing before this day: the first two are for learning the valley [proposed].
  from: 3,
  knock: {
    odds: 0.11,
    every: 4,
    spot: { lot: 1.4, truckstop: 1.2, trailhead: 0.9, ridge: 0.6, driveway: 0.5 },
  },
  // Phase 22.6b, on a drive to or from a crag that doesn't break down. A hitchhiker [v0.956's:
  // 14%, five days apart], one you've met `again` times likelier than a stranger; else a
  // roadside stop [proposed: v0.956 offered one on three drives in four], a detour of `min`,
  // worth `again` of itself after the first time. At a breakdown, a hitchhiker you were good
  // to pulls up behind you `friend` of the time, if nobody you'd call can.
  hitch: { odds: 0.14, every: 5, again: 2.6 },
  stop: { odds: 0.2, every: 3, min: 40, again: 0.4 },
  friend: 0.5,
  // Phase 22.6c: a walk-out from a crag, ten days apart and never hurt [v0.956's]. Risk adds
  // up from the day: late (`late`, and more from `later`), late with no headlamp, rain, winter,
  // spent, starving, out of water, alone. The odds are `per` a point over `from`, up to `most`.
  // The calls on the way add more; at most `clean` you get out clean, at most `rough` rough,
  // and past that badly, hurt. Getting out is worth `psyche` whatever it cost.
  epic: {
    every: 10,
    late: 19 * 60,
    later: 21 * 60,
    from: 4,
    per: 0.055,
    most: 0.45,
    clean: 2,
    rough: 6,
    psyche: 5,
  },
  psyche: 0.5,
  // Knocks heard lately that the deck passes over while there are others for the spot.
  fresh: 3,
};

// Phase 22.9a: the games at the fire. The once-a-day bond and Sage's 40% are Evan's calls
// (1 Oct 2026); the others' throws and bids [proposed]. Each takes `min` and `energy`, once a
// night.
// They pay bond with whoever's playing, as a day climbing together does, and no faster: a
// person's bond moves once a day, climbing or at the fire (no game out-bonds its time).
// Sage stays over at the Lot `sage` of nights once you're regulars. Horseshoes is `throws`
// throws, a ringer `ringer` points and a leaner `leaner`; the others throw a ringer `odds`
// of the time and a leaner `lean`. Liar's dice is `n` dice each, no wilds, and one bid: their
// opener is what they hold (safe), one more, or two more (a bluff), `bids` of the time, so
// what's in your cup is the tell; they call a raise that needs more than `call` of your dice.
export const GAMES = {
  min: 60,
  energy: 3,
  sage: 0.4,
  shoes: { throws: 4, ringer: 3, leaner: 1, odds: 0.25, lean: 0.35 },
  dice: { n: 5, bids: [0.35, 0.4], call: 1 },
  // Phase 22.9b, by Evan's calls (1 Oct 2026): cards, for money. You sit down with what's in hand up to `cap`, the
  // most a night can cost. Blackjack is `bet` a hand, up to `hands` a night: a fresh deck each,
  // the dealer standing on every 17, 3:2 for a blackjack (to the dollar up), double on two
  // cards, no split.
  // Played right that's about even: variance, not a living. Hold'em is heads-up, `ante` each,
  // then `bets` before the flop, on the flop, and on the turn and river together; `hands` a
  // night. Their play weighs a `samples`-deal guess at how often their hand wins. Reads come at
  // `reads` hands played; once you've been caught betting a loser `caughtShare` of your hands,
  // they call `adapt` lighter.
  bj: { cap: 40, bet: 5, hands: 10 },
  holdem: {
    cap: 40,
    ante: 1,
    bets: [2, 4, 4],
    hands: 6,
    samples: 60,
    reads: [5, 12],
    caughtShare: 0.25,
    adapt: 0.15,
  },
};

// Phase 22.8: dreams, v0.956's. What the Rig takes off every spot, and the War Chest off
// every expedition. Their prices are content/dreams.ts's.
export const DREAM = { rig: 0.5, warchest: 0.5 };

// Phase 22.4d: psyche [proposed]. A slow mood, 0 to 100, settled each night. Variety and
// company lift it and grind wears it down; every night it drifts a tenth of the way back to
// even, so nothing holds it up for long, and a day moves it at most `cap` either way. At the
// ends it moves every window by `windows`: a little, never the day's story.
export const PSYCHE = {
  start: 60,
  even: 50,
  drift: 0.1,
  cap: 8,
  // A line you'd never sent; a day at a crag, or one you'd never been to; a day climbing
  // with someone; the fire at night.
  send: 4,
  crag: 2,
  newCrag: 6,
  company: 3,
  fire: 2,
  // A shift; and each day in a row with none of the above past the first, up to `staleMax`.
  shift: -3,
  staleMax: 4,
  windows: 0.05,
  // Where the words change: under 25 low, then flat, steady, keen, and psyched from 80.
  bands: [25, 45, 60, 80],
};

export const INJURY = {
  days: [
    [2, 4],
    [6, 9],
    [13, 18],
  ] as [number, number][],
  clinic: [0, 45, 210],
};

// Highballs [proposed]: a fall from high on a tall boulder (`fromFt` up) can land badly. Up to safeFt a
// fall onto a pad is a normal boulder fall; every foot above it adds perFoot to the chance
// of a bad landing, with one pad and nobody spotting. So a fall from 16 ft is about 1 in 10,
// from 22 ft about 1 in 6. The Moonstone haul's pads halve it, and a partner spotting you
// halves it again. How far over safeFt you fell sets how bad: tier 2 from `tier2` ft over,
// tier 3 from `tier3`.
export const HIGHBALL = {
  // Every outdoor boulder this tall is a highball (Evan's call, 30 Sep 2026): v0.956's
  // Highball Arête is 18 ft, and 16 takes in the tall problems the later crags brought.
  fromFt: 16,
  safeFt: 8,
  perFoot: 0.012,
  pads: 0.5,
  spotter: 0.5,
  tier2: 6,
  tier3: 12,
};

export const CLIMB = {
  // What one go costs, by kind. A sport go is tying in, climbing and lowering off; a
  // boulder go is a few minutes on the pads. v0.956 charged 18 energy and 2 hours for a
  // crag go; goes here are played in real time, so each costs less and a day holds more.
  go: {
    sport: { min: 25, energy: 10, fed: 6 },
    // A trad go is racking up, placing on the way and cleaning on the way down: longer.
    trad: { min: 35, energy: 12, fed: 7 },
    boulder: { min: 10, energy: 6, fed: 4 },
    gym: { min: 8, energy: 5, fed: 3 },
  } as Record<Disc | 'gym', { min: number; energy: number; fed: number }>,
  // Skin per go by the route's style: v0.956's table at 0.6x for the shorter goes, and
  // 1.35x on real rock.
  skin: { crimp: 7, crack: 9, endurance: 6, power: 5, dyno: 4, technical: 3 } as Record<Style, number>,
  rockSkin: 1.35,
  // Between goes. Long enough that "one more" costs daylight.
  restMin: { sport: 20, trad: 25, boulder: 10 } as Record<Disc, number>,
  // What a go teaches, against v0.956's formula. Its goes cost two hours and its first week
  // was already too fast (V3 inside it, docs/audit/climbing.md §5.3); goes here are shorter
  // and more of them fit in a day, so each teaches 60% as much.
  learn: 0.6,
  // A go on a line you've already sent teaches this share again: laps are mileage, not
  // progress. It stands in for v0.956's staleness.
  repeatLearn: 0.3,
  // Each gym's specialty, as in v0.956 (INDOOR in content/gym.ts): Send City brings on
  // technique and endurance a little faster, The Cave power and fingers.
  gymSpecialty: 1.2,
  // Below these you can't tie in at all.
  minEnergy: 10,
  minSkin: 12,
  // Too dark to climb from 7 PM.
  darkFrom: 19 * 60,
  // Once the sun is on a line (when depends on the day's weather, and on where the line
  // is) every window on it shrinks by a fifth. It makes the morning worth driving out for.
  greaseFactor: 0.8,
  // The sun crosses a sunny crag's wall in two hours, end to end, so each line gets the
  // sun at its own time (sunOn). Long enough that where you start matters: Roadside's
  // warm-ups keep their shade two hours past its projects.
  sunSweep: 120,
  // Desert rock is sunbaked and sharp-edged: every window at a desert crag is scaled by
  // this. v0.956 took 0.08 off the odds there; seeping's 0.07 became 0.92 the same way.
  desertFactor: 0.92,
  // Moves per second while you hold. About a move and a half: fast enough that pump, not
  // boredom, is what makes you let go.
  climbRate: 1.53,
  // Pace: above a line's grade you move through it faster, below it slower, 8% a grade, so
  // one route plays out differently for two climbers (Phase 9). Fewer seconds on the wall
  // means less pump for the same moves.
  pace: { perGrade: 0.08, min: 0.8, max: 1.25 },
  // Pump per second: while climbing, while hanging on a normal hold, at a rest, in a crux.
  // Hanging still pays some back, so letting go is never wasted; a real rest pays back 3x.
  pumpClimb: 8.5,
  pumpHang: 4.5,
  pumpRest: 16,
  pumpCrux: 3,
  // A full pump bar shrinks every window by 55%: pumped is survivable, but only just.
  pumpShrink: 0.55,
  // Thin tips on crimpy beta: under 30 skin the window shrinks by a fifth.
  thinSkinBelow: 30,
  thinSkinFactor: 0.8,
  // Hold-to-load: the charge fills the meter in about 1.2 s and the band sits at 72%, so
  // the release comes a little under a second into the hold.
  load: { target: 0.72, rate: 0.85 },
  // Tension: the marker rises while you hold and sinks when you don't; the band drifts on a
  // sine around the middle. Stay in it long enough and you're through; stall and you're off.
  tension: { speed: 0.8, center: 0.5, swing: 0.26, timeout: 4.5 },
  // Timing: the marker sweeps the meter and back every 1.25 s. Two good taps pass; two bad
  // ones and your foot's gone.
  timing: { period: 1.25, center: 0.5, hits: 2, misses: 2 },
  // A fall takes about half a second to watch, with 3 ft of slack in the system.
  fallTime: 0.55,
  slackFt: 3,
  // Where the rope leaves you after a catch: this many moves under the clip you fell on.
  lowerMargin: 0.5,
  // A bolt counts as clipped once you're this far past it.
  clipPast: 0.13,
  // A cleared crux puts you this far past its top.
  clearCrux: 0.13,
};

// Trad (Phase 21.2): at a stance, letting go places a piece instead of shaking out. v0.956
// had no trad minigame at all, only a rack choice before the go; here every piece is a
// choice made on the wall, paid for in pump and time.
export const TRAD = {
  // A stance is this many moves either side of its mark: below it you reach for it, past it
  // you can still stop. Nearly a second of climbing: whether to stop is the decision, not
  // whether you can hit the spot.
  before: 0.5,
  after: 0.8,
  // The climb panel says a stance is coming this many moves before it.
  ahead: 1.2,
  // Seconds of letting go to get a piece in, and the pump it costs a second where hanging
  // would pay 4.5 back. A piece is about seven points of pump against resting.
  placeTime: 1.1,
  placePump: 2,
  // A fall that reaches the ground is a deck: under `safeFt` you walk it off; above, each
  // foot is `perFoot` more likely to hurt, three times a highball's with no pad under you.
  // How far over sets how bad, as a highball's does.
  deck: { safeFt: 6, perFoot: 0.036, tier2: 6, tier3: 12 },
  // v0.956 gave a trad send +3 head. Here it's a share of a go's lesson, added to head.
  sendHead: 0.4,
};

// Your kit (Phase 21.1): v0.956's gear, cut to what a go can feel. Its wear was per two-hour
// attempt; a go here is minutes and a day holds ten of them, so wear per go is a fraction.
export const KIT = {
  shoes: {
    // v0.956: new shoes $140, a resole $35. A resole puts rubber back, not a new last.
    price: 140,
    resole: 35,
    resoleTo: 90,
    // Everyone starts in the shoes they drove out in: worn at 40 in about 80 goes, a week
    // and a bit of climbing, so the first resole lands after Act I's first goals.
    startAt: 60,
    // Condition lost per go, and more on harder lines (v0.956's 1 + 0.035 per grade). About
    // 200 goes from a resole to worn: three weeks of climbing.
    wear: 0.25,
    perGrade: 0.035,
    // Under `worn` every window is this much narrower; under `blown`, much narrower. Technical
    // lines, all footwork, feel it twice.
    worn: 40,
    blown: 15,
    wornWindows: 0.95,
    blownWindows: 0.87,
  },
  chalk: {
    // A block for $8 lasts 60 goes; the bag starts half full. Without it, sweaty hands.
    price: 8,
    uses: 60,
    startWith: 30,
    without: 0.95,
  },
  tape: {
    // A roll for $4 wraps six crack goes, and halves the skin a crack takes.
    price: 4,
    uses: 6,
    skin: 0.5,
  },
  // A pad of your own: with the one everyone has, that's two, and a highball's landing
  // halves as the Moonstone haul's pads do (HIGHBALL.pads).
  pad: { price: 180 },
  // A rack: cams, nuts, slings. v0.956's $280. Nobody leads trad without one.
  rack: { price: 280 },
  // A headlamp (Phase 22.6c) [proposed]: a walk-out after dark without one is the riskiest
  // thing in the valley.
  headlamp: { price: 18 },
  // A rope of your own (Phase 21.5), for walls, where the belayer's won't reach: v0.956
  // sold rope and harness; one price here [proposed].
  rope: { price: 150 },
  // A hangboard screwed over the van's back doors (Phase 21.3) [proposed price]. v0.956
  // sold a pull-up bar as a van upgrade at $90; a board alone is cheaper.
  hangboard: { price: 60 },
  // The swap meet at the shop on weekends: v0.956's 55% of new, in fair shape.
  used: { share: 0.55, condition: 60 },
};

// Training (Phase 21.3): v0.956's protocols, cut from 16 to six and prehab, with its
// exploits closed (docs/audit/climbing.md §2.11, fixes in §7 "Now"). Training is what you
// do when you can't climb, or to shore up one skill: an hour of it teaches less than an
// hour on the rock at every grade (the harness holds it to that), and it loads your body
// the way a go does.
export const TRAIN = {
  // A session's lesson before its weights, hi() and the phase: `base` at V0, and `perGrade`
  // more a grade, half a fall's (climber.ts gains: 4 + 0.7 a grade), so it keeps pace
  // with a go's as grades climb. The harness holds the best protocol under an hour on the
  // rock at every grade the bots reach.
  base: 2,
  perGrade: 0.35,
  // Prehab: v0.956's ×0.6 on the chance of an injury, for 8 days.
  prehab: { days: 8, risk: 0.6 },
  // Campus boards wait until you're climbing this grade: v0.956 let anyone at them.
  campusGrade: 4,
  // Phases [proposed]: base is where everyone starts, and changes nothing. A phase you
  // choose holds for `lock` days before you can change it (v0.956 let you switch at bedtime). Peak runs
  // at most `peakDays`, then drops you into deload on its own.
  lock: 6,
  peakDays: 7,
  phases: {
    base: { train: 1, risk: 1, windows: 1 },
    // Training harder: more from each session, and more risk on everything.
    build: { train: 1.25, risk: 1.2, windows: 1 },
    // Sharp for sending: every crux a little wider, sessions teach less, and you're fragile.
    peak: { train: 0.7, risk: 1.3, windows: 1.04 },
    // Backing off: half from a session, less risk, and each night takes a fifth off your
    // acute load (v0.956's ×0.8).
    deload: { train: 0.5, risk: 0.6, windows: 1, acute: 0.8 },
  },
  // Taper: three days with no training, every crux 3% wider and 6% on the last day
  // (v0.956's +0.03 and +0.06), then a fortnight before you can taper again.
  taper: { days: 3, windows: 1.03, last: 1.06, cooldown: 14 },
};

// Multi-pitch walls (Phase 21.5), as v0.956 had them: an hour and some energy a pitch, and
// the summit pays once, $40 + $12 a grade + $10 a pitch. A night on a ledge is a worse
// night than the van's.
export const WALL = {
  pitch: { min: 60, energy: 8, fed: 4 },
  pay: { base: 40, perGrade: 12, perPitch: 10 },
  bivy: { energy: 40, fed: 20 },
};

// Expeditions (Phase 24): a long wall led in blocks of `block` pitches, yours first, with a
// partner at bond tier `partnerTier` or better. Your pitches are goes, each at WALL.pitch's
// cost; your partner's day on their block is `partner.tries` tries, each fixing the pitch at
// v0.956's odds for their grade against it (`base` at its grade, `perGrade` a grade either
// side, from `floor` to `ceiling`), narrowed as your windows are. Seconding their block costs
// you `follow` energy. A portaledge night gives back `night.energy`, `night.decay` less each
// night after, and the rations bring food back to `ration`. Every day after the first narrows
// every window by `fatigue.perDay`, down to `fatigue.floor`. The odds play each of your
// pitches `samples` times. The summit teaches the head `head` [proposed, all but v0.956's].
export const EXPED = {
  // A big-wall pitch, hauling and all: longer and harder on you than a valley wall's.
  pitch: { min: 150, energy: 15, fed: 6 },
  // Three leads a day at most, hauling and all: past that, the bots on Trango were hurting
  // themselves on two trips in three, and nobody leads five big-wall pitches a day.
  perDay: 3,
  block: 2,
  partnerTier: 2,
  partner: { base: 0.4, perGrade: 0.1, floor: 0.05, ceiling: 0.95, tries: 2 },
  follow: 15,
  night: { energy: 45, decay: 0.92 },
  ration: 60,
  fatigue: { perDay: 0.015, floor: 0.82 },
  samples: 24,
  // How many goes a day of yours on the wall usually is, for the odds' guess at your skin
  // as a long trip wears it down.
  typicalGoes: 3,
  // Phase 24.4 [proposed]: something happens some mornings on the wall (`odds`), never the
  // first, and at most `max` a trip.
  events: { odds: 0.15, max: 2 },
  head: 2,
  // Phase 24.5 [proposed]. Coming home: bond with your partner moves with how it went (a
  // summit together, half the wall or more, the water run out on them; anything else, no
  // change). The story at the fire, once a trip: half an hour, and psyche, more for a summit;
  // the people there count it as a day together.
  home: { bond: { summit: 2, half: 1, water: -1 } },
  story: { min: 30, psyche: { summit: 8, short: 4 } },
  // Phase 24.2 [proposed]. You book up to `ahead` days out. The forecast calls each day storm
  // or clear, right `acc` of the time on the day itself, falling to a coin toss `horizon` days
  // out. The haul bag holds `max` kg: food and water at `perDay` a day (twice that without a
  // stove where the water's snow), the portaledge, the stove and its fuel. Each night costs
  // `perKg` energy for every kg over `free` to haul up the next day. Food and water cost
  // `food` a day. Without the portaledge a night gives back `noLedge` of what it would.
  // Cancelling refunds `refund` of what you paid.
  ahead: 7,
  // Phase 24.3: booking this many days ahead or more drops the shifts you'd signed up for in
  // the trip, without a warning (Evan's call); later, they're missed shifts.
  notice: 7,
  forecast: { horizon: 10 },
  haul: { max: 80, free: 35, perKg: 0.4, perDay: 3, ledge: 9, stove: 2 },
  food: 12,
  noLedge: 0.5,
  refund: 0.5,
};

// Crowds (Phase 21.6, v0.956's): a crag's `crowd` scaled by the weekend (v0.956's ×1.7),
// the hour (nobody at dawn, the most from late morning into the afternoon), the sky (a prime
// day brings everyone out; heat keeps them home) and the day's luck, then read off `levels`.
// A crowd queues for the ropes (`queue`, minutes before a go; the boulders only when
// packed), and knows the beta: asking around (`ask` minutes) teaches you some, at the cost of
// the onsight, and when it's packed, someone shouts it at you anyway on a first go (`spray`).
export const CROWD = {
  weekend: 1.7,
  hours: [
    { from: 7 * 60, f: 0.5 },
    { from: 9 * 60, f: 1 },
    { from: 16 * 60, f: 0.7 },
    { from: 19 * 60, f: 0 },
  ],
  sky: { prime: 1.25, fair: 1, hot: 0.6, rain: 0 },
  luck: 0.3,
  levels: { quiet: 0.25, busy: 0.7, packed: 1.2 },
  queue: { rope: { busy: 10, packed: 20 }, boulder: { busy: 0, packed: 10 } },
  ask: 15,
  spray: 0.4,
};

// The speed wall at Send City (v0.956's, which cost no time and no pass: the audit's
// exploit 20). A run is 20 holds, lights to buzzer. Your time is the seconds you took on
// the screen times `factor`, which is `v0` at V0 and `perGrade` less a grade of power and
// technique (power counted 60/40), down to `floor`, so a fast thumb and a strong climber
// both show. A run takes `min` (the queue, the lower-off, the walk back), costs like a
// short go, and teaches power and technique a little (`trains`, on a session's scale) for
// the first `fresh` a day, then nothing: PB chasing, not a skill farm. `minReal`: faster
// than a thumb can go.
export const SPEED = {
  holds: 20,
  min: 10,
  energy: 7,
  skin: 2,
  fed: 2,
  intensity: 0.8,
  factor: { v0: 2.8, perGrade: 0.1, floor: 1.45 },
  minReal: 1.5,
  fresh: 3,
  trains: { power: 0.14, technique: 0.06 },
};

// Free Solo [proposed] (v0.956's mode): every outdoor sport line and wall pitch is climbed
// without a rope, so no belayer or rope is needed and a fall ends the run. Trad keeps its
// rack and boulders their pads, as v0.956's boulders did. With no rope your body climbs
// tighter: `windows` on every crux (v0.956's 0.72 was set against its dice; this is
// against the verbs). A solo send teaches the head `head` more, as v0.956's +8 did.
export const FREESOLO = {
  windows: 0.82,
  head: 2,
};

// Phase 23.2 [proposed]: a talent shows once its skill has come on this far since you started
// (v0.956 showed one after four reps; on this scale, about a fortnight's climbing).
export const TALENT = { reveal: 6 };

// Phase 23.3 [proposed]: a calling's offered once you've sent this many lines (enough to know
// what you like); a grade's consolidated at this many lines sent at it (v0.956's five); and
// what each rung of its ambition lifts psyche by (a new crag's 6, for scale).
export const CALLING = { offerAt: 10, consolidate: 5, psyche: [8, 12, 16] };

// Phase 23.4 [proposed]. Paths: two at most (v0.956's), each tier gated on your grade, near
// V4, V9 and V14 (Evan's call), as well as its deed. Mastery: lines sent in a style
// (v0.956's 40); a hybrid, two skills both at this grade's (v0.956's 60 of 100, which ran out
// by V5; here, mid-career). A quirk's named once you've had this many goes (v0.956's 30 climbs), on
// what they were: energy at or over `fresh`, under `tired`; from `evening`, before `dawn`;
// `easy`, this many grades or more inside yours.
export const PATH = { max: 2, gates: [4, 9, 14] };
export const MASTERY_AT = { sends: 40, hybrid: 8 };
// Phase 23.5 [proposed]. Standing with each crowd starts at `start` and stays in 0..100; the
// words change at `bands` (v0.956's Distrusted, Skeptical, Neutral, Respected, Beloved). A
// call comes at a crag at most once every `gap` days (v0.956's 14), on `chance` of an
// arrival (its 0.22); an echo at least `echoAfter` days after the call (its 30) and `echoGap`
// after the last echo (its 25). The elder's answer is there once the old guard's at `elder`.
export const FACTION = {
  start: 50,
  bands: [25, 45, 56, 76],
  gap: 14,
  chance: 0.22,
  echoAfter: 30,
  echoGap: 25,
  elder: 65,
};
// Phase 23.6 [proposed]. The Board: jobs a week, and the most a week's best board may pay
// against a day of the worst shift (the harness holds it there).
export const BOARD = { jobs: 3, capDays: 2 };
// Phase 23.7. A year is 56 days (Evan's call 10, the audit's clock fix; "A Year on the Road"
// already counts it), and its recap comes the day the next begins. The Homecoming, once a
// life [proposed, v0.956's cash and psyche]: there once `people` people are at `tier` or
// closer (the audit's fix: v0.956 counted diary entries as "lives shaped"). Two, of the
// game's three: Hazel and Sage, or one of them and the rival you've made a friend of.
export const YEAR = { days: 56 };
// Age (Phase 16.1, Evan's call 2): v0.956's clock, a year of age every `days` days (about
// three to the 56-day year; called age, never a year). You start at `start`, an origin can
// add to it; hanging it up is yours from `from`; your body calls it at `forced`, and from
// `warn` the You page counts the days down. 22 to 45 is day 415, about V14 for the career
// bot: inside Phase 16's 15–25 hours, where V18 (day ~900) isn't. No decline with age.
export const AGE = { start: 22, days: 18, from: 30, warn: 43, forced: 45 };
// How long a day takes a player (Phase 16.6), for criterion 1's hours: seconds a tap (the
// e2e's count, reading included) and seconds a go (holding to climb, and the stamp). Not
// measured: stated, so the hours the harness reports can be checked against testers' and
// the numbers moved [proposed].
export const PACE = { tapSec: 4, goSec: 15 };
// Holidays and the family (Phase 17.6) [proposed]. A holiday each season, on its middle day
// of the 56-day year, a night at the fire: staying up is `psyche` and a day together with
// everyone close who's there. Calls from home come every `every` years on the age clock from
// the `from`th; the last asks you home for good.
export const HOLIDAY = { on: [7, 21, 35, 49], psyche: 10 };
export const FOLKS = { from: 1, every: 2 };

// Giving (Phase 17.5) [proposed]: a gift to someone once a week, a bond for it (no more than
// a day climbing together, and it costs money where a day out doesn't); a line named for
// someone is worth `named`, once a line.
export const GIVE = { every: 7, named: 2 };

// The fire's lines (Phase 17.7) [proposed]: `open` of someone's are there from the night you
// meet, and one more opens each `every` days you've known them, heard first. Criterion 3
// wants something new every week to day 300; a pool that's all open at once is heard through
// by the third month and then only repeats. Ten to start keeps the first weeks from
// repeating a line a night.
export const FIRE_TALK = { open: 10, every: 7 };

// Romance (Phase 17.4, Evan's call: Sage and Mara), all [proposed]. The spark is offered once
// each, at `from` bond (a Partner); the beats after it come a week apart (`spacing`). Forks
// keep them away a while: `cool` after a fight you dig in on, `apart` for their chance taken.
// Three weeks without a day climbing together (`neglect`, their days away not counted) ends
// it, in a scene; then they keep their `distance`, and the bond falls to `after`, a Regular's.
export const ROMANCE = {
  who: ['sage', 'mara'],
  from: 5,
  spacing: 7,
  cool: 3,
  apart: 21,
  neglect: 21,
  distance: 10,
  after: 3,
};

// Lives that change (Phase 17.3), on the age clock (AGE.days to a year, Evan's call), all
// [proposed]:
//   ray     his last season from the sixth year (day 91), and he stops coming out in the
//           seventh (day 109), around Act II's end, so most players knew him;
//   tam     v0.956's "five good seasons" as years of knowing him: slower from the third, his
//           odds of coming out at `slowBy`, and none at all from the fifth;
//   frank   his rig dies four years after you meet, and he parks next to yours for good;
//   stint   each year from the second, a partner may be off the rock for a while, hurt or
//           away: `chance` a year each, `min` to `max` days. Hazel's the constant: she isn't
//           on the list.
export const LIFE = {
  ray: { last: 5, retire: 6 },
  tam: { slow: 3, stop: 5, slowBy: 0.5 },
  frank: { rig: 4 },
  stint: { chance: 0.35, min: 4, max: 12, who: ['sage', 'mara', 'rico', 'tam'] },
};
export const HOME = { people: 2, tier: 2, cash: 200, psyche: 20 };
export const QUIRK = { after: 30, fresh: 70, tired: 35, evening: 17 * 60, dawn: 9 * 60, easy: 2 };
