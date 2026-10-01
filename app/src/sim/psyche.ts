// Psyche (Phase 22.4d): a slow mood, settled at the end of each day from what the day was.
// Variety and company lift it, grind wears it down, and a nightly drift back to even means no
// single ritual holds it up. The numbers are PSYCHE (dials.ts).

import { DOG, PSYCHE } from './dials';
import { hasPerk } from './scout';
import type { GameState } from './types';

export type PsycheWord = 'low' | 'flat' | 'steady' | 'keen' | 'psyched';
const WORDS: PsycheWord[] = ['low', 'flat', 'steady', 'keen', 'psyched'];

export const psycheWord = (level: number): PsycheWord =>
  WORDS[PSYCHE.bands.filter((b) => level >= b).length]!;

// What today does to it, before the night's drift: each thing that lifted or wore it, and
// the days in a row with nothing to lift it, today included. `away` is a night on a wall or
// an expedition, which is a day out whatever else it was.
export function psycheDay(
  s: GameState,
  away = false,
): { delta: number; up: string[]; down: string[]; stale: number } {
  const up: string[] = [];
  const down: string[] = [];
  let d = 0;
  const lift = (by: number, why: string) => {
    d += by;
    up.push(why);
  };
  if (Object.values(s.routes).some((r) => r.sentToday && r.sent?.day === s.day))
    lift(PSYCHE.send, 'a new send');
  if (s.today.includes('new-crag')) lift(PSYCHE.newCrag, 'somewhere new');
  else if (away || s.today.includes('crag')) lift(PSYCHE.crag, 'a day out');
  // Cards at the fire count as company (Evan, 1 Oct 2026), though they move no bond.
  if (
    Object.values(s.people).some((p) => p.last === s.day) ||
    s.today.includes('bj') ||
    s.today.includes('holdem')
  )
    lift(PSYCHE.company, 'company');
  // Your dog settles at the fire with the perk (Phase 22.7), and it's worth a little more.
  if (s.today.includes('fire'))
    hasPerk(s, 'settle')
      ? lift(PSYCHE.fire + DOG.settle, `the fire, and ${s.dog!.name}`)
      : lift(PSYCHE.fire, 'the fire');
  const stale = up.length ? 0 : s.psyche.stale + 1;
  if (s.today.includes('worked')) {
    d += PSYCHE.shift;
    down.push('a shift');
  }
  if (stale >= 2) {
    d -= Math.min(stale - 1, PSYCHE.staleMax);
    down.push('more of the same');
  }
  return { delta: Math.max(-PSYCHE.cap, Math.min(PSYCHE.cap, d)), up, down, stale };
}

// Where it'll be by morning: today's change, then the drift back toward even.
export function psycheBy(s: GameState, away = false): { level: number; stale: number } {
  const day = psycheDay(s, away);
  const level = s.psyche.level + day.delta;
  return {
    level: Math.max(0, Math.min(100, Math.round(level + (PSYCHE.even - level) * PSYCHE.drift))),
    stale: day.stale,
  };
}

// Said the morning it tips into either end.
export const PSYCHE_LINE: Record<'low' | 'psyched', string> = {
  low: 'Another day like the last one. You try to remember what the plan was out here.',
  psyched: 'You wake up already thinking about the next line.',
};

// Every window: a little wider when you're psyched, a little tighter when you're low.
export const psycheWindows = (s: GameState): number =>
  1 + (PSYCHE.windows * (s.psyche.level - PSYCHE.even)) / PSYCHE.even;
