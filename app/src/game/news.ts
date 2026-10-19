// Phase 20.1: what's new since you last played. The save says which version of the game last
// wrote it; what's come since is what's new to you. A new player has nothing to compare.
import { NEWS } from './news.full';

export interface News {
  version: string;
  text: string;
}

// Whether version a comes after version b, part by part: 0.999.108 after 0.999.86.
export function newer(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d > 0;
  }
  return false;
}

// What's new since `since` (the version that last wrote your save), up to `current`, newest
// first and at most `most`. A save that doesn't say gets the newest only.
export function newsSince(since: string, current: string, most = 3, notes: News[] = NEWS): News[] {
  const upTo = notes.filter((n) => !newer(n.version, current));
  if (!since) return upTo.slice(0, 1);
  return upTo.filter((n) => newer(n.version, since)).slice(0, most);
}
