// Numbers into the words the game shows. Cost labels and notes are built from the same
// numbers the rules use, never typed by hand: the audit found v0.956's hand-written hints
// drifting from its rules ("van $18" when it cost more, "35 energy / 3 h" for the crag).

import type { WallFx } from './content/wallevents';
import type { Delta, Skills } from './types';

// The typographic minus, as in the rest of the UI.
export const MINUS = '−';

// "7:40 AM". Past midnight wraps to the small hours.
export function clock(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.floor(min % 60);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

// "2 PM" on the hour, "2:30 PM" otherwise.
export function clockShort(min: number): string {
  return min % 60 === 0 ? clock(min).replace(':00', '') : clock(min);
}

// "20 min", "5 h", "1 h 10 min".
export function duration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function money(n: number): string {
  return n < 0 ? `${MINUS}$${-n}` : `$${n}`;
}

function signed(n: number, unit: string): string {
  return `${n < 0 ? MINUS : '+'}${Math.abs(n)} ${unit}`;
}

// The price tag on an act: time, then money. "5 h · +$52", "20 min · $2".
export function costLabel(d: Delta, moneyWord = ''): string {
  const parts: string[] = [];
  if (d.min) parts.push(duration(d.min));
  if (d.cash && d.cash < 0) parts.push(`$${-d.cash}${moneyWord ? ` ${moneyWord}` : ''}`);
  if (d.cash && d.cash > 0) parts.push(`+$${d.cash}`);
  return parts.join(' · ');
}

// What an act does to your body. "+15 energy", "−25 energy · −8 skin", "+50 food".
export function bodyNote(d: Delta): string {
  const parts: string[] = [];
  if (d.fed) parts.push(signed(d.fed, 'food'));
  if (d.energy) parts.push(signed(d.energy, 'energy'));
  if (d.skin) parts.push(signed(d.skin, 'skin'));
  return parts.join(' · ');
}

// What a call up on the wall costs (Phase 24.4), from its effects. "The day goes · −10
// energy", "−2 days of food and water", "+1 bond with Hazel".
export function wallNote(fx: WallFx, partner = 'your partner'): string {
  const parts: string[] = [];
  if (fx.day) parts.push('The day goes');
  if (fx.energy) parts.push(signed(fx.energy, 'energy'));
  if (fx.food)
    parts.push(signed(fx.food, Math.abs(fx.food) === 1 ? 'day of food and water' : 'days of food and water'));
  if (fx.pitch) parts.push(signed(fx.pitch, Math.abs(fx.pitch) === 1 ? 'pitch fixed' : 'pitches fixed'));
  if (fx.ledge === false) parts.push('No portaledge');
  if (fx.psyche) parts.push(signed(fx.psyche, 'psyche'));
  if (fx.bond) parts.push(signed(fx.bond, `bond with ${partner}`));
  return parts.join(' · ');
}

// Fills "{name}" from ctx, and "{name|one|many}" with the right form for a count.
export function fill(text: string, ctx: Record<string, string | number> = {}): string {
  return text.replace(
    /\{(\w+)(?:\|([^|}]*)\|([^}]*))?\}/g,
    (whole, key: string, one?: string, many?: string) => {
      const v = ctx[key];
      if (v === undefined) return whole;
      if (one !== undefined && many !== undefined) return v === 1 ? one : many;
      return String(v);
    },
  );
}

// What someone left you with: "+3 technique, +2 endurance".
export function skillsNote(t: Partial<Skills>): string {
  return Object.entries(t)
    .filter(([, v]) => v)
    .map(([k, v]) => signed(v, k))
    .join(', ');
}

// The day of the week a game day falls on. Day 1 is a Monday, so days 6 and 7 are the
// weekend (cond.ts isWeekend) and the week's bills land on a Sunday night.
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const dayName = (day: number): string => WEEKDAY[day % 7]!;

// 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st.
export const ordinal = (n: number): string =>
  `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;
