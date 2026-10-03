// Who you're becoming (Phase 23.4): whether a path's tier can be claimed, what you've
// mastered, the quirk your habits name, and every edge they give, as the multipliers the
// rest of the rules read.

import { gradeOf, needFor, type Style } from './climber';
import { indoor, routeById } from './content/gym';
import { HYBRIDS, MASTERY, OPEN_PATHS, PATHS, QUIRKS, type Deed, type Edge } from './content/paths';
import { MASTERY_AT, PATH, QUIRK } from './dials';
import { perksOf } from './scene';
import { COACH_EDGE } from './content/heir';
import type { RouteDef } from './content/routes';
import type { GameState } from './types';

// The lines you've sent, with their style and whether first go.
function sent(s: GameState) {
  return Object.entries(s.routes).flatMap(([id, l]) => {
    if (!l.sent) return [];
    const r = routeById(s.seed, id);
    return r ? [{ type: r.type, first: l.sent.style !== 'redpoint' }] : [];
  });
}

export function deedMet(s: GameState, d: Deed): boolean {
  if ('sends' in d) return sent(s).filter((x) => d.sends.includes(x.type)).length >= d.n;
  if ('first' in d) return sent(s).filter((x) => x.first).length >= d.first;
  if ('comps' in d) return s.comps.results.length >= d.comps;
  if ('podiums' in d) return s.comps.results.filter((r) => r.place <= 3).length >= d.podiums;
  return s.trips >= d.trips;
}

export function deedText(d: Deed): string {
  if ('sends' in d) return `${d.n} ${d.sends.join(' or ')} lines sent`;
  if ('first' in d) return `${d.first} lines flashed or onsighted`;
  if ('comps' in d) return `${d.comps} comps entered`;
  if ('podiums' in d) return `${d.podiums} podiums`;
  return `${d.trips} trips out to a crag`;
}

export const tiersOn = (s: GameState, id: string): number => s.paths.tiers[id] ?? 0;
export const pathsTaken = (s: GameState): string[] =>
  Object.keys(s.paths.tiers).filter((id) => tiersOn(s, id) > 0);

// Why you can't claim a path's next tier, or null when you can.
export function pathBlocked(s: GameState, id: string): string | null {
  const p = PATHS[id];
  if (!p || !OPEN_PATHS.includes(id)) return 'Not a path you can take.';
  const i = tiersOn(s, id);
  if (i >= p.tiers.length) return 'Nothing left on it.';
  if (i === 0 && pathsTaken(s).length >= PATH.max) return `You’re on ${PATH.max} paths already.`;
  const g = PATH.gates[i]!;
  if (gradeOf(s.climber.skills) < g) return `Climbing V${g} first.`;
  if (!deedMet(s, p.tiers[i]!.deed)) return `${deedText(p.tiers[i]!.deed)} first.`;
  return null;
}

// The next tiers you could claim now and haven't been told about, as "id:tier".
export const newlyClaimable = (s: GameState): string[] =>
  OPEN_PATHS.filter((id) => !pathBlocked(s, id))
    .map((id) => `${id}:${tiersOn(s, id) + 1}`)
    .filter((k) => !s.paths.told.includes(k));

// What you've newly mastered: styles sent deep enough, and hybrids, two skills both there.
export function newMastery(s: GameState): string[] {
  const by: Record<string, number> = {};
  for (const x of sent(s)) by[x.type] = (by[x.type] ?? 0) + 1;
  const styles = (Object.keys(MASTERY) as Style[]).filter((k) => (by[k] ?? 0) >= MASTERY_AT.sends);
  const need = needFor(MASTERY_AT.hybrid);
  const k = s.climber.skills;
  const hy = Object.keys(HYBRIDS).filter((id) => k[HYBRIDS[id]!.a] >= need && k[HYBRIDS[id]!.b] >= need);
  return [...styles, ...hy].filter((id) => !s.mastery.includes(id));
}

// A mastery's name, line and edge, style or hybrid.
export function masteryOf(id: string): { name: string; edge: Edge; line: string } | null {
  if (id in MASTERY) return MASTERY[id as Style];
  const h = HYBRIDS[id];
  return h ? { name: h.name, edge: h.edge, line: `${cap(h.a)} and ${h.b}, both real.` } : null;
}

// The quirk your habits name, once you've had enough goes: the first that fits.
export function quirkFor(s: GameState): string | null {
  if (s.quirk || s.habits.goes < QUIRK.after) return null;
  for (const [id, q] of Object.entries(QUIRKS)) if (!q.wait && q.test(s.habits, s)) return id;
  return null;
}

// A go, counted into your habits.
export function countGo(s: GameState, r: RouteDef): GameState['habits'] {
  const h = { ...s.habits };
  h.goes += 1;
  if (!indoor(r.place)) h.outdoor += 1;
  if (s.energy >= QUIRK.fresh) h.fresh += 1;
  if (s.energy < QUIRK.tired) h.tired += 1;
  if (s.min >= QUIRK.evening) h.evening += 1;
  if (s.min < QUIRK.dawn) h.dawn += 1;
  if (r.grade <= gradeOf(s.climber.skills) - QUIRK.easy) h.easy += 1;
  if (r.type === 'power' || r.type === 'dyno') h.power += 1;
  return h;
}

// Every edge you have: your paths' claimed tiers, your masteries, your quirk.
export function edges(s: GameState): Edge[] {
  const out: Edge[] = [];
  for (const [id, n] of Object.entries(s.paths.tiers))
    for (const t of PATHS[id]?.tiers.slice(0, n) ?? []) out.push(t.edge);
  for (const k of s.mastery) {
    const m = masteryOf(k);
    if (m) out.push(m.edge);
  }
  const q = s.quirk ? QUIRKS[s.quirk] : undefined;
  if (q) out.push(q.edge);
  // Standing with a crowd (Phase 23.5).
  for (const p of perksOf(s)) out.push(p.edge);
  // Dex's coaching, for your forebear's sake (Phase 16.5).
  if (s.family?.coach) out.push(COACH_EDGE);
  return out;
}

const product = (xs: number[]) => xs.reduce((m, x) => m * x, 1);

// Crux windows on this line, now, from your edges. `first`: it's the line's first go.
export function edgeWindows(s: GameState, r: RouteDef, first: boolean): number {
  return product(
    edges(s).map((e) => {
      let m = 1;
      if (e.windows && (!e.style || e.style.includes(r.type))) m *= e.windows;
      if (first && e.firstGo) m *= e.firstGo;
      if (e.gym && indoor(r.place)) m *= e.gym;
      if (e.comp && r.id.startsWith('cp-')) m *= e.comp;
      if (e.outside && !indoor(r.place)) m *= e.outside;
      if (e.fresh && s.energy >= QUIRK.fresh) m *= e.fresh;
      if (e.tired && s.energy < QUIRK.tired) m *= e.tired;
      if (e.evening && s.min >= QUIRK.evening) m *= e.evening;
      if (e.dawn && s.min < QUIRK.dawn) m *= e.dawn;
      return m;
    }),
  );
}

export const edgeGain = (s: GameState, k: keyof GameState['climber']['skills']): number =>
  product(edges(s).map((e) => (e.gainAll ?? 1) * (e.gain && e.gain[0] === k ? e.gain[1] : 1)));
export const edgeInjury = (s: GameState): number => product(edges(s).map((e) => e.injury ?? 1));
export const edgeTrain = (s: GameState): number => product(edges(s).map((e) => e.train ?? 1));
export const edgeGas = (s: GameState): number => product(edges(s).map((e) => e.gas ?? 1));
export const edgeLiving = (s: GameState): number => product(edges(s).map((e) => e.living ?? 1));

// An edge in words, from its numbers.
const pct = (m: number): string => `${Math.round(Math.abs(1 - m) * 100)}%`;
const more = (m: number, up: string, down: string) => `${pct(m)} ${m > 1 ? up : down}`;
export function edgeText(e: Edge): string {
  const out: string[] = [];
  if (e.windows)
    out.push(
      `Cruxes ${more(e.windows, 'kinder', 'meaner')}${e.style ? ` on ${e.style.join(' and ')} lines` : ''}.`,
    );
  if (e.firstGo) out.push(`Cruxes ${more(e.firstGo, 'kinder', 'meaner')} on a first go.`);
  if (e.gym) out.push(`Cruxes ${more(e.gym, 'kinder', 'meaner')} indoors.`);
  if (e.comp) out.push(`Cruxes ${more(e.comp, 'kinder', 'meaner')} in a comp.`);
  if (e.outside) out.push(`Cruxes ${more(e.outside, 'kinder', 'meaner')} outside.`);
  if (e.train) out.push(`Sessions teach ${more(e.train, 'more', 'less')}.`);
  if (e.fresh) out.push(`Cruxes ${more(e.fresh, 'kinder', 'meaner')} with energy at ${QUIRK.fresh} or more.`);
  if (e.tired) out.push(`Cruxes ${more(e.tired, 'kinder', 'meaner')} with energy under ${QUIRK.tired}.`);
  if (e.evening) out.push(`Cruxes ${more(e.evening, 'kinder', 'meaner')} in the evening.`);
  if (e.dawn) out.push(`Cruxes ${more(e.dawn, 'kinder', 'meaner')} early in the morning.`);
  if (e.gain) out.push(`${cap(e.gain[0])} comes ${more(e.gain[1], 'faster', 'slower')}.`);
  if (e.gainAll) out.push(`Every skill comes ${more(e.gainAll, 'faster', 'slower')}.`);
  if (e.injury) out.push(`${more(e.injury, 'more', 'less')} likely to get hurt.`);
  if (e.gas) out.push(`Gas ${more(e.gas, 'dearer', 'cheaper')}.`);
  if (e.living) out.push(`Nights ${more(e.living, 'dearer', 'cheaper')}.`);
  return out.join(' ');
}
const cap = (w: string) => w[0]!.toUpperCase() + w.slice(1);
