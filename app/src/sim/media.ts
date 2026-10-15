// Phase 18.5: the media ladder. A post a day turns what you did into followers; sponsors
// come with followers and pay for a cycle's asks; a rival takes the headline deal if her
// numbers are better; a thread about you is answered by sending; and a film, at the top.
// Followers alone pay nothing.

import { gradeOf } from './climber';
import { SPONSORS } from './content/media';
import { indoor, routeById } from './content/gym';
import { PLACES } from './content/places';
import { ageOf } from './ageing';
import { FILM, MEDIA, PHOTO, PIECE, RUNWAY, SHOW } from './dials';
import { money } from './format';
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

// What a sponsor's cycle pays when its asks are done: the stipend, more on brand terms, half on
// an ambassador's (Phase 30.3: a cycle that asks for a clinic).
export function cyclePay(sp: { tier: number; terms: 'real' | 'brand'; tasks: MediaTask[] }): number {
  const S = SPONSORS[sp.tier]!;
  const amb = sp.tasks.some((t) => t.kind === 'clinic') ? RUNWAY.ambassador : 1;
  return Math.round(S.stipend * (sp.terms === 'brand' ? MEDIA.brand : 1) * amb);
}

// The sponsor tier your followers have earned, or -1.
export const tierEarned = (s: GameState): number =>
  SPONSORS.reduce((t, x, i) => (s.media.followers >= x.followers ? i : t), -1);

// A cycle's asks for a tier, on its terms: where the shoot is, by the day; from Apex up, a day
// on the stand, `SHOW.before` days ahead of the cycle's end (Phase 34.4).
export function cycleTasks(
  s: GameState,
  tier: number,
  terms: 'real' | 'brand',
  due = s.day + MEDIA.cycle,
): MediaTask[] {
  const sp = SPONSORS[tier]!;
  // Phase 30.3: from 35, ambassador terms: a clinic where it asked for a send.
  const tasks: MediaTask[] = [
    ageOf(s) >= RUNWAY.from
      ? { kind: 'clinic', done: false }
      : { kind: 'send', grade: Math.max(0, gradeOf(s.climber.skills) - 1), done: false },
  ];
  if (sp.shoot) {
    const crags = Object.entries(PLACES)
      .filter(([id, p]) => p.crag && (!p.unlock || s.unlocked.includes(id)))
      .map(([id]) => id);
    const r = Rng.fromStream(s.seed, 'events').derive(`shoot-${s.day}`);
    tasks.push({ kind: 'shoot', place: crags[r.int(0, crags.length - 1)] ?? 'road', done: false });
  }
  if (sp.comp) tasks.push({ kind: 'comp', done: false });
  if (tier >= SHOW.tier) tasks.push({ kind: 'show', day: due - SHOW.before, done: false });
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

// ---- Phase 34.3: photos that sell, and the year's piece ----

type Photo = GameState['media']['photos'][number];

// Whether a first send makes a photo a magazine would look at: outside, at V`from` or harder,
// and not a wall's pitch or an expedition's, whose summits sell already.
export function photoWorthy(s: GameState, id: string): boolean {
  const r = routeById(s.seed, id);
  return !!r && !indoor(r.place) && !r.wall && !r.exped && r.grade >= PHOTO.from;
}

// A photo's price now: a grade's worth from `from` up, more with followers, less on a
// partner's phone, and never over the cap.
export function photoPrice(s: GameState, p: Pick<Photo, 'route' | 'by'>): number {
  const g = routeById(s.seed, p.route)?.grade ?? -1;
  if (g < PHOTO.from) return 0;
  const v =
    PHOTO.base *
    (g - PHOTO.from + 1) *
    (1 + s.media.followers / PHOTO.fans) *
    (p.by === 'camera' ? 1 : PHOTO.phone);
  return Math.min(PHOTO.cap, Math.round(v));
}

// The day a magazine last bought one of yours, or null.
export const lastSold = (s: GameState): number | null =>
  s.media.photos.reduce<number | null>(
    (d, p) => (p.sold !== undefined && (d === null || p.sold > d) ? p.sold : d),
    null,
  );

// The photos nobody's bought yet, the best-paying first.
export const unsoldPhotos = (s: GameState): Photo[] =>
  s.media.photos.filter((p) => p.sold === undefined).sort((a, b) => photoPrice(s, b) - photoPrice(s, a));

// Why this photo won't sell today, or null.
export function photoBlocked(s: GameState, route: string): string | null {
  const p = s.media.photos.find((x) => x.route === route);
  if (!p) return 'No photo of that';
  if (p.sold !== undefined) return 'A magazine has that one';
  const last = lastSold(s);
  if (last !== null && s.day - last < PHOTO.every)
    return `Magazines take one every ${PHOTO.every} days: the next on day ${last + PHOTO.every}`;
  return null;
}

// Sold to a magazine so far.
export const photosSold = (s: GameState): number => s.media.photos.filter((p) => p.sold !== undefined).length;

// Whether an editor asks for this year's piece tonight: enough of your photos run, and a
// year since the last ask.
export const pieceAsks = (s: GameState, day: number): boolean =>
  photosSold(s) >= PIECE.after && (!s.media.piece || day - s.media.piece.asked >= PIECE.every);

// The piece you've been asked for and haven't written, while there's time.
export const pieceOpen = (s: GameState): boolean =>
  !!s.media.piece && s.media.piece.wrote === undefined && s.day <= s.media.piece.due;

// Why you can't write the piece now, or null.
export function pieceBlocked(s: GameState): string | null {
  if (!pieceOpen(s)) return 'No piece to write';
  if (s.at !== 'lot') return 'You write it at the van';
  if (s.energy < PIECE.energy) return 'Too tired to write';
  return null;
}

// ---- Phase 34.4: a day on the stand, and a film you pay for ----

// Today's stand, still to do, if the sponsor has one.
export const showToday = (s: GameState, day = s.day): boolean =>
  !!s.media.sponsor?.tasks.some((t) => t.kind === 'show' && !t.done && t.day === day);

// Why you can't work the stand now, or null.
export function showBlocked(s: GameState): string | null {
  if (!showToday(s)) return 'No stand to work today';
  if (s.min > SHOW.by) return 'The doors opened without you';
  if (s.energy < SHOW.energy) return 'Too tired for a day of handshakes';
  return null;
}

// The line a film would be of: your hardest first sent outside, not a wall's pitch or an
// expedition's, at V`from` or harder; null if there's none yet.
export function filmLine(s: GameState): string | null {
  let best: { id: string; grade: number } | null = null;
  for (const [id, l] of Object.entries(s.routes)) {
    if (!l.sent) continue;
    const r = routeById(s.seed, id);
    if (!r || indoor(r.place) || r.wall || r.exped || r.grade < FILM.from) continue;
    if (!best || r.grade > best.grade) best = { id, grade: r.grade };
  }
  return best?.id ?? null;
}

// Why you can't pay for a film now, or null.
export function filmBlocked(s: GameState): string | null {
  if (s.media.film) return 'There’s a film of you already';
  if (!filmLine(s)) return `Send a V${FILM.from} outside first`;
  if (s.cash < FILM.price) return `A film costs ${money(FILM.price)}`;
  return null;
}
