// A training session: what it costs, what it teaches you, what it puts through your body,
// and why you can't do one right now. The protocols are data (content/training.ts); the
// block they sit in is training.ts.

import { daysOff, goLoad, ratio } from './body';
import { gradeOf, hi, SKILLS } from './climber';
import { has } from './kit';
import { PREHAB, PROTOCOLS, type ProtocolDef } from './content/training';
import { CLIMB, LOAD, TRAIN } from './dials';
import { taperDay } from './training';
import { INDOOR, INDOOR_CLOSE } from './content/gym';
import type { Delta, GameState, Skills } from './types';

const round2 = (v: number) => Math.round(v * 100) / 100;

export const protocolOf = (id: string): ProtocolDef | undefined => PROTOCOLS[id];

export const sessionCost = (p: ProtocolDef): Required<Pick<Delta, 'min' | 'energy' | 'fed' | 'skin'>> => ({
  min: p.min,
  energy: -p.energy,
  fed: -p.fed,
  skin: -p.skin,
});

export const prehabCost = (): Required<Pick<Delta, 'min' | 'energy' | 'fed'>> => ({
  min: PREHAB.min,
  energy: -PREHAB.energy,
  fed: -PREHAB.fed,
});

// What a session teaches you: a lesson that grows with your grade, like a go's, split by the
// protocol's weights and slowed by hi() as a go's is; then the phase, and a spiked load.
export function sessionGains(s: GameState, p: ProtocolDef): Partial<Skills> {
  const k = s.climber.skills;
  const total =
    (TRAIN.base + TRAIN.perGrade * gradeOf(k)) *
    TRAIN.phases[s.training.phase].train *
    (ratio(s.load) > LOAD.slow ? LOAD.slowGains : 1);
  const out: Partial<Skills> = {};
  for (const id of SKILLS) {
    const w = p.trains[id];
    if (w) out[id] = round2(total * w * hi(k[id]));
  }
  return out;
}

// What it puts through you: a go of the same energy on a line at your grade, topped out,
// times how hard the protocol is.
export const sessionLoad = (s: GameState, p: ProtocolDef): number =>
  round2(goLoad(p.energy, gradeOf(s.climber.skills), 1) * p.intensity);

// Why you can't train this now, or null. A session a day, never while you taper, hurt or
// fried: v0.956 let you train through all three.
export function trainBlocked(s: GameState, id: string): string | null {
  const p = protocolOf(id);
  if (!p) return 'No such session';
  if (p.where === 'van') {
    if (s.at !== 'lot') return 'The hangboard’s on the van, at the Lot';
    if (!has(s, 'hangboard')) return 'You need a hangboard. The gear shop sells them';
  } else {
    const inside = INDOOR[s.at];
    if (!inside) return 'That’s at a gym';
    if (s.min >= INDOOR_CLOSE) return `${inside.name} is closed`;
    if (!s.today.includes(inside.pass)) return 'Buy a day pass at the desk first';
    if (id === 'campus' && gradeOf(s.climber.skills) < TRAIN.campusGrade)
      return `Not till you’re climbing V${TRAIN.campusGrade}. Pulleys first`;
  }
  if (taperDay(s)) return 'You’re tapering. Rest is the training';
  if (s.today.includes('trained')) return 'You’ve trained today';
  const off = daysOff(s);
  if (off > 0) return `Your ${s.injury!.kind} needs ${off} more day${off > 1 ? 's' : ''}`;
  if (ratio(s.load) > LOAD.fried) return "You're fried. Your body wants a rest day";
  if (s.fed <= 0) return "You're running on empty";
  if (s.energy < p.energy) return 'Too tired for that';
  if (p.skin && s.skin < CLIMB.minSkin) return 'Your skin is done for today';
  return null;
}

export function prehabBlocked(s: GameState): string | null {
  if (s.at !== 'lot') return 'Prehab’s at the van, at the Lot';
  if (s.today.includes('prehab')) return 'You’ve done it today';
  if (s.energy < PREHAB.energy) return 'Too tired even for that';
  return null;
}
