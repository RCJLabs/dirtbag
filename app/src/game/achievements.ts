// Phase 14.4 (Evan's call): the Record Book as Steam achievements, one an entry, each named for
// its id, which content/record.ts keeps stable for this. The desktop build does the unlocking;
// this says what there is to unlock.
import { RECORD, type GameState } from '../sim';

// Steam's name for an entry: its id in capitals ("FIRSTSEND").
export const steamName = (id: string): string => id.toUpperCase();

// Every entry this save's family has ever written down. An heir's book starts empty, but what
// their forebears earned on this save stays earned on Steam.
export function earnedEver(s: GameState): string[] {
  const ids = new Set(Object.keys(s.record));
  for (const b of s.family?.books ?? []) for (const id of Object.keys(b.record)) ids.add(id);
  return RECORD.filter((r) => ids.has(r.id)).map((r) => r.id);
}

// What to set up on the Steamworks site, from the book itself (desktop/steam/achievements.json).
export const steamAchievements = () =>
  RECORD.filter((r) => !r.waits).map((r) => ({ name: steamName(r.id), title: r.title, desc: r.desc }));
