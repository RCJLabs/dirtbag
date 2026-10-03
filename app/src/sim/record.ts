// The Record Book (Phase 23.1): whether an entry's earned, worked out from what the game
// already keeps. Checked after everything you do, as Act I's goals are; an entry's earned
// once, on the day it's first true.

import { gradeOf } from './climber';
import { gradeOfPerson } from './curves';
import { indoor, routeById } from './content/gym';
import { COMP_TIERS } from './content/comps';
import { PLACES } from './content/places';
import { RECORD, type RecordAim, type RecordEntry } from './content/record';
import { rankAt } from './jobs';
import { tierOf } from './presence';
import type { GameState } from './types';

// The lines you've sent, with where and how.
function sends(s: GameState) {
  return Object.entries(s.routes)
    .filter(([, l]) => l.sent)
    .map(([id, l]) => ({ r: routeById(s.seed, id), style: l.sent!.style }));
}

export function aimEarned(s: GameState, aim: RecordAim, sent = sends(s)): boolean {
  if ('sends' in aim) return sent.length >= aim.sends;
  if ('grade' in aim) return sent.some(({ r }) => (r?.grade ?? -1) >= aim.grade);
  if ('style' in aim)
    return sent.some(({ style }) => style === aim.style || (aim.style === 'flash' && style === 'onsight'));
  if ('outside' in aim) return sent.some(({ r }) => !!r && !indoor(r.place));
  if ('fa' in aim) return Object.values(s.firsts).filter((f) => !f.by).length >= aim.fa;
  // A walk-in doesn't count toward a raise, but it's a shift: today's counts when it's worked.
  if ('shift' in aim) return s.today.includes('worked') || Object.values(s.jobs).some((n) => n > 0);
  if ('regular' in aim) return Object.keys(s.jobs).some((j) => rankAt(s, j) >= 1);
  if ('letGo' in aim) return Object.keys(s.benched).length > 0;
  if ('cash' in aim) return s.cash >= aim.cash;
  if ('gear' in aim) return Object.keys(s.gear).length >= aim.gear;
  if ('dream' in aim) return (s.dream.owned as string[]).includes(aim.dream);
  if ('brokeDown' in aim) return !!s.breakdown;
  if ('bond' in aim) return Object.values(s.people).some((p) => tierOf(p.bond) >= aim.bond);
  if ('circuit' in aim) {
    const open = Object.entries(PLACES).filter(([id, p]) => p.crag && (!p.unlock || s.unlocked.includes(id)));
    const at = new Set(sent.map(({ r }) => r?.place));
    return open.length > 0 && open.every(([id]) => at.has(id));
  }
  if ('hurt' in aim) return !!s.injury || s.scars.length > 0;
  if ('day' in aim) return s.day > aim.day;
  if ('summit' in aim) return s.book.some((t) => t.end === 'summit');
  if ('dog' in aim) return !!s.dog || s.dogs.length > 0;
  if ('rival' in aim)
    return !!s.people.dex && gradeOf(s.climber.skills) > (gradeOfPerson(s.seed, 'dex', s.day) ?? 99);
  // An old save filling the book on loading has no life yet.
  if ('retired' in aim) return !!s.life?.retired;
  if ('followers' in aim) return (s.media?.followers ?? 0) >= aim.followers;
  if ('sponsor' in aim) return (s.media?.sponsor?.tier ?? -1) >= aim.sponsor;
  if ('film' in aim) return !!s.media?.doc && 'aired' in s.media.doc;
  if ('gym' in aim) return !!s.gym;
  if ('land' in aim) return s.unlocked.some((id) => PLACES[id]?.land);
  if ('comp' in aim) {
    const r = s.comps?.results ?? [];
    if (aim.comp === 'entered') return r.length > 0;
    if (aim.comp === 'won') return r.some((x) => x.place === 1);
    return r.some((x) => x.tier === COMP_TIERS.length - 1 && x.place <= 3);
  }
  return false;
}

// The entries the book can hold now: not the ones waiting on systems that aren't built.
export const OPEN_RECORD: RecordEntry[] = RECORD.filter((r) => !r.waits && r.aim);

// What's newly earned, in the book's order.
export function newlyEarned(s: GameState): RecordEntry[] {
  const left = OPEN_RECORD.filter((r) => s.record[r.id] === undefined);
  if (!left.length) return [];
  const sent = sends(s);
  return left.filter((r) => aimEarned(s, r.aim!, sent));
}
