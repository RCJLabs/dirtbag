// Every number a designer might turn, with what it means and why it sits where it does.
// These are the feel slice's values: placeholders that played well, not balance. Phase 6
// retunes them against the bots in R2.

import type { Style } from './climber';

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
  // A floor only so a window is never zero; nothing holds one this narrow.
  narrowest: 0.002,
};

export const DAY = {
  // The first morning starts at 7:40. Hazel is already at the fire with the coffee.
  firstMin: 7 * 60 + 40,
  // Wake at 7:10: early enough for the morning shade at the crag, late enough that a lie-in
  // isn't a choice you have to make.
  wakeMin: 7 * 60 + 10,
  // From 5 PM the Lot is a night scene: the fire's lit and Hazel is back.
  nightFrom: 17 * 60,
  nightUntil: 5 * 60,
  // Bed from 6 PM. Any earlier and skipping the rest of a bad day is too easy.
  bedFrom: 18 * 60,
};

export const MONEY = {
  // $41 is two nights at the Lot and one tank to the crag. A climbing day without a shift
  // ends in debt at bedtime: the trade the whole game is built on.
  start: 41,
  // A night at the Lot. It goes on the card if you can't cover it.
  vanSpot: 18,
  // Send City's day pass. v0.956 charged $5 a go; a pass lets you keep trying.
  dayPass: 14,
  // How far the card goes. Past it, gas and the van spot are declined: you drive nowhere
  // and sleep rough. Bills still land. No game over: v0.956's hard wipe is gone.
  cardLimit: 150,
  // Every seventh night, v0.956's weekly bills.
  registration: 45,
  insurance: 25,
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
  // A Regular will come out to the Gorge with you if you ask before one.
  invite: 3,
  inviteBefore: 13 * 60,
};

// Partner arcs: v0.956's four beats, at bonds 1, 3, 5 and 7, with Phase 6's spacing (v0.956
// had none, so a whole arc could land in a week).
export const ARC = {
  bonds: [1, 3, 5, 7],
  spacing: 5,
  // Sage's guiding stint. v0.956 sent her off for 16 days, most of Act I here; a week keeps
  // her arc inside the act.
  sageAway: 7,
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
export const INJURY = {
  days: [
    [2, 4],
    [6, 9],
    [13, 18],
  ] as [number, number][],
  clinic: [0, 45, 210],
};

export const CLIMB = {
  // What one go costs, by kind. A sport go is tying in, climbing and lowering off; a
  // boulder go is a few minutes on the pads. v0.956 charged 18 energy and 2 hours for a
  // crag go; goes here are played in real time, so each costs less and a day holds more.
  go: {
    sport: { min: 25, energy: 10, fed: 6 },
    boulder: { min: 10, energy: 6, fed: 4 },
    gym: { min: 8, energy: 5, fed: 3 },
  } as Record<'sport' | 'boulder' | 'gym', { min: number; energy: number; fed: number }>,
  // Skin per go by the route's style: v0.956's table at 0.6x for the shorter goes, and
  // 1.35x on real rock.
  skin: { crimp: 7, crack: 9, endurance: 6, power: 5, dyno: 4, technical: 3 } as Record<Style, number>,
  rockSkin: 1.35,
  // Between goes. Long enough that "one more" costs daylight.
  restMin: { sport: 20, boulder: 10 } as Record<'sport' | 'boulder', number>,
  // What a go teaches, against v0.956's formula. Its goes cost two hours and its first week
  // was already too fast (V3 inside it, docs/audit/climbing.md §5.3); goes here are shorter
  // and more of them fit in a day, so each teaches 60% as much.
  learn: 0.6,
  // A go on a line you've already sent teaches this share again: laps are mileage, not
  // progress. It stands in for v0.956's staleness.
  repeatLearn: 0.3,
  // Send City's specialty, as in v0.956: technique and endurance come a little faster.
  gymSpecialty: 1.2,
  // Below these you can't tie in at all.
  minEnergy: 10,
  minSkin: 12,
  // Too dark to climb from 7 PM.
  darkFrom: 19 * 60,
  // Once the sun is on the wall (when depends on the day's weather) every window shrinks
  // by a fifth. It makes the morning worth driving out for.
  greaseFactor: 0.8,
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
