// What you're climbing for (Phase 23.3): when a calling's offered, whether a rung of its
// ambition's met, and its perk and rungs in words, from their numbers.

import { indoor, routeById } from './content/gym';
import { CALLINGS, type Calling, type RungAim } from './content/callings';
import { CALLING } from './dials';
import type { GameState } from './types';

// The lines you've sent since `from`, with their grade and whether outside and first go.
function sendsSince(s: GameState, from: number) {
  return Object.entries(s.routes).flatMap(([id, l]) => {
    if (!l.sent || l.sent.day < from) return [];
    const r = routeById(s.seed, id);
    if (!r) return [];
    const first = l.sent.style === 'flash' || l.sent.style === 'onsight';
    return [{ grade: r.grade, outside: !indoor(r.place), first }];
  });
}

export function rungMet(s: GameState, aim: RungAim): boolean {
  const sent = sendsSince(s, s.calling.since);
  if ('outside' in aim) return sent.some((x) => x.outside && x.grade >= aim.outside);
  if ('flashOutside' in aim) return sent.some((x) => x.outside && x.first && x.grade >= aim.flashOutside);
  if ('followers' in aim) return s.media.followers >= aim.followers;
  const at: Record<number, number> = {};
  for (const x of sent) at[x.grade] = (at[x.grade] ?? 0) + 1;
  return Object.values(at).filter((n) => n >= CALLING.consolidate).length >= aim.consolidate;
}

// The rungs just met, in order: each only once the one below it is.
export function newRungs(s: GameState): number[] {
  const c = s.calling.id ? CALLINGS[s.calling.id] : undefined;
  if (!c) return [];
  const got: number[] = [];
  for (let i = s.calling.rungs.length; i < c.rungs.length; i++) {
    if (!rungMet(s, c.rungs[i]!)) break;
    got.push(i);
  }
  return got;
}

// Whether it's time to be asked: enough lines sent, and never asked before.
export const callingDue = (s: GameState): boolean =>
  !s.calling.offered &&
  !s.calling.id &&
  Object.values(s.routes).filter((l) => l.sent).length >= CALLING.offerAt;

export function rungText(aim: RungAim): string {
  if ('outside' in aim) return `Send a V${aim.outside} outside`;
  if ('flashOutside' in aim) return `Flash a V${aim.flashOutside} outside`;
  if ('followers' in aim) return `Reach ${aim.followers.toLocaleString('en-US')} followers`;
  return `Consolidate ${aim.consolidate} grades (${CALLING.consolidate} lines sent at each)`;
}

// A whole ambition in one line: "Send a V8, V11, then V14 outside."
export function ambitionText(c: Calling): string {
  const n = c.rungs.map((a) =>
    'outside' in a
      ? a.outside
      : 'flashOutside' in a
        ? a.flashOutside
        : 'followers' in a
          ? a.followers.toLocaleString('en-US')
          : a.consolidate,
  );
  const list = (pre: string) =>
    `${n
      .slice(0, -1)
      .map((x) => pre + x)
      .join(', ')}, then ${pre}${n.at(-1)}`;
  const a = c.rungs[0];
  if (!a) return '';
  if ('outside' in a) return `Send a ${list('V')} outside`;
  if ('flashOutside' in a) return `Flash a ${list('V')} outside`;
  if ('followers' in a) return `Reach ${list('')} followers`;
  return `Consolidate ${list('')} grades (${CALLING.consolidate} lines sent at each)`;
}

const pct = (m: number): string => `${Math.round(Math.abs(1 - m) * 100)}%`;
export function callingTerms(c: Calling): { perks: string[]; costs: string[] } {
  const f = c.fx;
  const perks: string[] = [];
  const costs: string[] = [];
  if (f.gainOut && f.gainOut !== 1)
    (f.gainOut > 1 ? perks : costs).push(
      `You learn ${pct(f.gainOut)} ${f.gainOut > 1 ? 'more' : 'less'} climbing outside.`,
    );
  if (f.firstGo && f.firstGo !== 1)
    (f.firstGo > 1 ? perks : costs).push(
      `Every crux is ${pct(f.firstGo)} ${f.firstGo > 1 ? 'kinder' : 'meaner'} on a line’s first go.`,
    );
  if (f.living && f.living !== 1)
    (f.living < 1 ? perks : costs).push(`Nights cost ${pct(f.living)} ${f.living < 1 ? 'less' : 'more'}.`);
  if (f.injury && f.injury !== 1)
    (f.injury < 1 ? perks : costs).push(
      `You’re ${pct(f.injury)} ${f.injury < 1 ? 'less' : 'more'} likely to get hurt.`,
    );
  if (f.reach && f.reach !== 1)
    (f.reach > 1 ? perks : costs).push(
      `Posts bring ${pct(f.reach)} ${f.reach > 1 ? 'more' : 'fewer'} followers.`,
    );
  return { perks, costs };
}
