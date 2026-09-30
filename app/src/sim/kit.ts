// What your kit does to a go, and what a go does to your kit (Phase 21.1). Pure functions
// of the state, like the rest of the sim.
import type { Style } from './climber';
import type { RouteDef } from './content/routes';
import { KIT } from './dials';
import type { GameState } from './types';

export const has = (s: GameState, id: string): boolean => (s.gear[id] ?? 0) > 0;

// How your kit scales every window on a line of this style: shoes by their rubber, twice as
// much on technical footwork, and chalk if the bag's empty.
export function kitFactor(s: GameState, style: Style): number {
  const S = KIT.shoes;
  const shoes = s.gear.shoes ?? 0;
  const worn = shoes < S.blown ? S.blownWindows : shoes < S.worn ? S.wornWindows : 1;
  const feet = style === 'technical' ? 1 - (1 - worn) * 2 : worn;
  return feet * (has(s, 'chalk') ? 1 : KIT.chalk.without);
}

// The skin a go takes, after tape on a crack.
export const tapedSkin = (s: GameState, r: RouteDef, skin: number): number =>
  r.type === 'crack' && has(s, 'tape') ? skin * KIT.tape.skin : skin;

// What a go costs your kit: rubber by the line's grade, a go's worth of chalk, and a wrap of
// tape on a crack. Returns what's worth telling you.
export function wearKit(s: GameState, r: RouteDef): string[] {
  const S = KIT.shoes;
  const said: string[] = [];
  const was = s.gear.shoes ?? 0;
  if (was > 0) {
    const now = Math.max(0, Math.round((was - S.wear * (1 + S.perGrade * r.grade)) * 100) / 100);
    s.gear.shoes = now;
    if (was >= S.blown && now < S.blown) said.push("Your shoes are done: the rubber's through at the toe.");
    else if (was >= S.worn && now < S.worn)
      said.push(`Your shoes are going. A resole's $${S.resole} at the gear shop.`);
  }
  if (has(s, 'chalk')) {
    s.gear.chalk = s.gear.chalk! - 1;
    if (!s.gear.chalk) said.push('Your chalk bag is empty.');
  }
  if (r.type === 'crack' && has(s, 'tape')) {
    s.gear.tape = s.gear.tape! - 1;
    if (!s.gear.tape) said.push("That's the last of the tape.");
  }
  return said;
}
