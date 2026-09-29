// What an injury is called, by where the line's style loads you and how bad it is. The
// names are v0.956's (its tier tables); the lines are new, in its voice.

import type { Style } from '../climber';

export type Area = 'fingers' | 'shoulder' | 'forearm' | 'leg';

// Where each style is hardest on you.
export const AREA: Record<Style, Area> = {
  crimp: 'fingers',
  crack: 'fingers',
  power: 'shoulder',
  dyno: 'shoulder',
  endurance: 'forearm',
  technical: 'leg',
};

// Tier 1, 2, 3.
export const INJURY_NAME: Record<Area, [string, string, string]> = {
  fingers: ['tweaked finger', 'pulley strain', 'ruptured pulley'],
  shoulder: ['sore shoulder', 'tweaked rotator cuff', 'torn shoulder'],
  forearm: ['strained forearm', 'elbow tendonitis', 'tendon tear'],
  leg: ['tight hamstring', 'tweaked knee', 'meniscus tear'],
};

// A bad landing off a highball, tier 1, 2, 3: v0.956's ankle names.
export const LANDING_NAME: [string, string, string] = ['jammed ankle', 'rolled ankle', 'broken ankle'];
export const LANDING_LINE: [string, string, string] = [
  'You come off high on {route} and land half on the pad. A {kind}: {days} days off.',
  'Off the top of {route}, and the pad isn’t where you land. {Kind}. {days} days off, and a clinic visit.',
  'A long way down off {route}, and nothing soft at the bottom. {Kind}. {days} days, and the clinic isn’t cheap.',
];

// Decking off a trad line: nothing held, and the ground is where you land.
export const DECK_LINE: [string, string, string] = [
  'Nothing held. You hit the ground at the foot of {route}. A {kind}: {days} days off.',
  'You deck off {route}. {Kind}. {days} days off, and a clinic visit.',
  'You deck from high on {route}, and the ground doesn’t give. {Kind}. {days} days, and the clinic isn’t cheap.',
];
export const DECK_WALKED = 'You hit the ground off {route}. Nothing broken. Next time, place something.';

// Said when it happens: {route}, {kind} (capitalised at the start of a sentence as {Kind}),
// {days}. And when it's healed.
export const HURT_LINE: [string, string, string] = [
  'Something tweaks on {route}. A {kind}: {days} days off, if you’re smart.',
  'You feel it go on {route}. {Kind}. {days} days off, and a clinic visit.',
  'A pop you hear before you feel. {Kind}, on {route}. {days} days, and the clinic isn’t cheap.',
];
export const HEALED_LINE = 'Your {kind} feels normal again. Ease back in.';
export const FIRST_FREE_LINE = 'The clinic waves off the bill. First one’s on the house, apparently.';
export const CLINIC_LINE = 'The clinic takes {cost}. Insurance covers the rest, eventually.';
