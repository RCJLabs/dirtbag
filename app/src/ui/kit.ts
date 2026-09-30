// Your kit in words: what it's doing to a line, and how each piece is holding up. The
// numbers come from the same factors a go uses (sim/kit.ts), so the words can't drift.
import { GEAR, has, KIT, kitFactor, type GameState, type RouteDef } from '../sim';

// The beta sheet's line when your kit is costing you on this line, or null when it isn't.
export function kitNote(s: GameState, r: RouteDef): string | null {
  const f = kitFactor(s, r.type);
  const why: string[] = [];
  const shoes = s.gear.shoes ?? 0;
  if (shoes < KIT.shoes.blown)
    why.push(r.type === 'technical' ? 'blown shoes on a line that’s all feet' : 'blown shoes');
  else if (shoes < KIT.shoes.worn)
    why.push(r.type === 'technical' ? 'worn shoes on a line that’s all feet' : 'worn shoes');
  if (!has(s, 'chalk')) why.push('no chalk');
  const taped = r.type === 'crack' && !has(s, 'tape');
  if (f >= 1 && !taped) return null;
  const tight =
    f < 1 ? `Your kit: every crux here is ${Math.round((1 - f) * 100)}% tighter (${why.join(', ')}).` : '';
  const tape = taped ? ' Tape would save your skin on this one.' : '';
  return (tight + tape).trim();
}

// How a piece of kit is holding up, for the You page.
export function kitState(id: string, n: number): string {
  const d = GEAR[id];
  if (!d) return '';
  if (d.kind === 'uses') return n > 0 ? `${n} left` : 'Out';
  if (d.kind === 'owned') return 'Yours';
  if (n < KIT.shoes.blown) return 'Blown';
  if (n < KIT.shoes.worn) return 'Worn';
  return 'Good';
}
