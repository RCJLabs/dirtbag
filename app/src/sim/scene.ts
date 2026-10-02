// The scene (Phase 23.5): where you stand with each crowd and what it gets you, when a call
// comes, and what an answer does.

import { indoor } from './content/gym';
import { PLACES } from './content/places';
import {
  ECHOES,
  FACTION_PERKS,
  FACTIONS,
  STANCES,
  type Echo,
  type Faction,
  type SceneFx,
  type StanceOpt,
} from './content/scene';
import { FACTION } from './dials';
import { Rng } from './rng';
import type { GameState } from './types';

const WORDS = ['Distrusted', 'Skeptical', 'Neutral', 'Respected', 'Beloved'];
export const standingWord = (v: number): string => WORDS[FACTION.bands.filter((b) => v >= b).length]!;

// The perks your standing has earned, both crowds.
export const perksOf = (s: GameState) =>
  (Object.keys(FACTION_PERKS) as Faction[]).flatMap((f) =>
    FACTION_PERKS[f].filter((p) => s.scene[f] >= p.at),
  );

// What a place's permit costs you: nothing once the old guard vouches for you.
export const permitFor = (s: GameState, place: string): number =>
  perksOf(s).some((p) => p.permits) ? 0 : (PLACES[place]?.permit ?? 0);

// Where you stand, in a line: "In with the old guard, on the outs with the gym crowd."
export function whereYouStand(s: GameState): string {
  const fs = Object.keys(FACTIONS) as Faction[];
  const hi = fs.reduce((a, b) => (s.scene[b] > s.scene[a] ? b : a));
  const lo = fs.reduce((a, b) => (s.scene[b] < s.scene[a] ? b : a));
  const inWith = s.scene[hi] >= FACTION.bands[2]! ? `in with ${FACTIONS[hi].name}` : null;
  const outs = s.scene[lo] < FACTION.bands[1]! && lo !== hi ? `on the outs with ${FACTIONS[lo].name}` : null;
  const line = inWith && outs ? `${inWith}, but ${outs}` : (inWith ?? outs);
  return line
    ? `${line[0]!.toUpperCase()}${line.slice(1)}.`
    : 'Middle of the road with both crowds. No side picked yet.';
}

// The answers on offer: the elder's too, once the old guard listens to you.
export function stanceOpts(s: GameState, id: string): StanceOpt[] {
  const st = STANCES[id];
  if (!st) return [];
  return s.scene.old >= FACTION.elder ? [...st.opts, st.elder] : st.opts;
}

// The answer you gave, whichever it was (the elder's is the fourth).
export const stanceAnswer = (id: string, opt: number): StanceOpt | undefined => {
  const st = STANCES[id];
  return st ? [...st.opts, st.elder][opt] : undefined;
};

// A call, arriving at a crag: one you haven't faced, now and then.
export function stanceDue(s: GameState, place: string): string | null {
  if (indoor(place) || !PLACES[place]?.crag) return null;
  if (s.scene.stances.length && s.day - s.scene.last < FACTION.gap) return null;
  const mine = Object.values(s.firsts).some((f) => !f.by);
  const left = Object.keys(STANCES).filter(
    (id) =>
      !s.scene.stances.some((x) => x.id === id) && s.day >= STANCES[id]!.after && (!STANCES[id]!.fa || mine),
  );
  if (!left.length) return null;
  const r = Rng.fromStream(s.seed, 'events').derive(`stance-${s.day}-${place}`);
  if (r.next() >= FACTION.chance) return null;
  return left[Math.floor(r.next() * left.length)]!;
}

// An echo of a call, once it's had time to come back.
export function echoDue(s: GameState): string | null {
  if (s.scene.echoes.length && s.day - s.scene.echoLast < FACTION.echoGap) return null;
  for (const x of s.scene.stances) {
    if (s.day - x.day < FACTION.echoAfter) continue;
    const id = Object.keys(ECHOES).find(
      (e) =>
        ECHOES[e]!.stance === x.id && ECHOES[e]!.opt === x.opt && !s.scene.echoes.some((y) => y.id === e),
    );
    if (id) return id;
  }
  return null;
}

export const echoOpts = (e: Echo): StanceOpt[] => [e.hold, e.turn];

const clamp = (v: number) => Math.max(0, Math.min(100, v));

// What standing a call moves, applied.
export function shift(scene: GameState['scene'], fx: SceneFx): GameState['scene'] {
  return { ...scene, old: clamp(scene.old + (fx.old ?? 0)), gym: clamp(scene.gym + (fx.gym ?? 0)) };
}

// A call's cost and give, in words, from its numbers.
export function sceneNote(fx: SceneFx): string {
  const out: string[] = [];
  for (const f of Object.keys(FACTIONS) as Faction[]) {
    const v = fx[f];
    if (v) out.push(`${FACTIONS[f].name} ${v > 0 ? 'warms to you' : 'cools on you'}`);
  }
  if (fx.psyche) out.push(`psyche ${fx.psyche > 0 ? '+' : '−'}${Math.abs(fx.psyche)}`);
  if (fx.energy) out.push(`energy ${fx.energy > 0 ? '+' : '−'}${Math.abs(fx.energy)}`);
  return out.length ? `${out.join(', ')}.`.replace(/^./, (c) => c.toUpperCase()) : '';
}
