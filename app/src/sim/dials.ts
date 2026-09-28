// Every number a designer might turn, with what it means and why it sits where it does.
// These are the feel slice's values: placeholders that played well, not balance. Phase 6
// retunes them against the bots in R2.

import type { Style } from './climber';

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
