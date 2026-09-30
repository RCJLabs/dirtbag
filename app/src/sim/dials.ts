// Every number a designer might turn, with what it means and why it sits where it does.
// These are the feel slice's values: placeholders that played well, not balance. Phase 6
// retunes them against the bots in R2.

import type { Style } from './climber';
import type { Disc } from './content/routes';

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

// Expeditions (Phase 21.5): v0.956's day loop. Leading a pitch costs energy (more if you dig
// deep, for better odds); a day in camp gives 48 back (v0.956's), and any night 10. A
// pitch's odds come from your endurance against the objective's grade: `base` at the grade
// (v0.956's 0.68 at El Cap for a V9), `perGrade` a grade either side, from `floor` to
// `ceiling` (v0.956's 0.45 and 0.97), and `digBonus` more if you dig deep. Tuned so El Cap
// at its grade goes a little over half the time and at its V7 gate hardly ever, as the
// audit found v0.956's did.
export const EXPED = {
  energy: 100,
  lead: 22,
  dig: 36,
  rest: 48,
  night: 10,
  base: 0.68,
  perGrade: 0.1,
  digBonus: 0.25,
  floor: 0.45,
  ceiling: 0.97,
  // The summit's lesson for the head, as v0.956's +8 head was, scaled to a go's lessons.
  head: 2,
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
