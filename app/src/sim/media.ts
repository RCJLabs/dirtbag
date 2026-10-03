// Phase 18.5: the media ladder. A post a day turns what you did into followers; sponsors
// come with followers and pay for a cycle's asks; a rival takes the headline deal if her
// numbers are better; a thread about you is answered by sending; and a film, at the top.
// Followers alone pay nothing.

import { gradeOf } from './climber';
import { SPONSORS } from './content/media';
import { indoor, routeById } from './content/gym';
import { PLACES } from './content/places';
import { MEDIA } from './dials';
import { Rng } from './rng';
import type { GameState, MediaTask } from './types';

type Style = 'straight' | 'story' | 'bait' | 'ad';

// What today gave you to post: the best line first sent today, by its grade, outside, first
// go or a first ascent; and a podium. One post tells one send (Phase 18.7).
export function todaysWorth(s: GameState): number {
  let v = 0;
  for (const [id, l] of Object.entries(s.routes)) {
    if (!l.sent || l.sent.day !== s.day) continue;
    const r = routeById(s.seed, id);
    if (!r) continue;
    let w = (Math.max(0, r.grade) + 2) ** MEDIA.pow;
    if (!indoor(r.place)) w *= MEDIA.outside;
    if (l.sent.style !== 'redpoint') w *= MEDIA.first;
    if (s.firsts[id] && !s.firsts[id]!.by) w *= MEDIA.fa;
    v = Math.max(v, w);
  }
  const podium = s.comps.results.some((x) => x.day === s.day && x.place <= 3);
  return v + (podium ? MEDIA.podium / MEDIA.k : 0);
}

// The hardest line first sent today, or -1.
export function todaysBest(s: GameState): number {
  let g = -1;
  for (const [id, l] of Object.entries(s.routes))
    if (l.sent?.day === s.day) g = Math.max(g, routeById(s.seed, id)?.grade ?? -1);
  return g;
}

// New followers, as many as are left of the audience under the ceiling allow (Phase 18.7):
// a post's, an answered thread's and the film's alike.
export const fromAudience = (s: GameState, n: number): number =>
  Math.round(n * Math.max(0, 1 - s.media.followers / MEDIA.ceiling));

// Followers a post in this style would bring now. The Influencer brings more (`reach`).
export function postGain(s: GameState, style: Style, reach = 1): number {
  const base = style === 'story' ? 5 : 0;
  return fromAudience(
    s,
    (base + MEDIA.k * todaysWorth(s) * (0.5 + s.media.engagement / 100) * MEDIA.style[style]) * reach,
  );
}

export function postBlocked(s: GameState, style: Style): string | null {
  if (s.today.includes('posted')) return 'You’ve posted today';
  if (style === 'ad' && !s.media.sponsor) return 'No sponsor to post for';
  return null;
}

// The rival's followers on a day: a curve, from a comp climber to a name everyone knows.
export const rivalFollowers = (day: number): number =>
  Math.round(MEDIA.rival.top / (1 + Math.exp(-(day - MEDIA.rival.mid) / MEDIA.rival.width)));

// The sponsor tier your followers have earned, or -1.
export const tierEarned = (s: GameState): number =>
  SPONSORS.reduce((t, x, i) => (s.media.followers >= x.followers ? i : t), -1);

// A cycle's asks for a tier, on its terms: where the shoot is, by the day.
export function cycleTasks(s: GameState, tier: number, terms: 'real' | 'brand'): MediaTask[] {
  const sp = SPONSORS[tier]!;
  const tasks: MediaTask[] = [
    { kind: 'send', grade: Math.max(0, gradeOf(s.climber.skills) - 1), done: false },
  ];
  if (sp.shoot) {
    const crags = Object.entries(PLACES)
      .filter(([id, p]) => p.crag && (!p.unlock || s.unlocked.includes(id)))
      .map(([id]) => id);
    const r = Rng.fromStream(s.seed, 'events').derive(`shoot-${s.day}`);
    tasks.push({ kind: 'shoot', place: crags[r.int(0, crags.length - 1)] ?? 'road', done: false });
  }
  if (sp.comp) tasks.push({ kind: 'comp', done: false });
  if (terms === 'brand') tasks.push({ kind: 'ad', done: false });
  return tasks;
}

// A thread about you tonight, by the night: more likely with followers, brand terms and bait.
export function heatTonight(s: GameState): boolean {
  const m = s.media;
  if (m.followers < MEDIA.heat.from || m.heat) return false;
  const H = MEDIA.heat;
  const p = Math.min(
    H.cap,
    H.chance *
      (1 + m.followers / 25000) *
      (m.sponsor?.terms === 'brand' ? MEDIA.brand : 1) *
      (s.day - m.bait <= 7 ? H.bait : 1),
  );
  return Rng.fromStream(s.seed, 'events').derive(`heat-${s.day}`).next() < p;
}

// How many rungs of the media ladder you've climbed (Phase 18.7 shows them): known
// locally, each sponsor, the film. Dropped by a sponsor, you're back to your followers.
export const mediaRung = (s: GameState): number => {
  const m = s.media;
  if (m.doc && 'aired' in m.doc) return 5;
  if (m.sponsor) return 2 + m.sponsor.tier;
  return m.followers >= MEDIA.known ? 1 : 0;
};
