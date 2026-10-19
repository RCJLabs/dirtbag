// Phase 45: the problem of the day, from the page's side. The sim never reads a clock, so the
// date comes from here: this device's own calendar, so a day turns over at the player's
// midnight, wherever they are.

import { isDate } from '../sim';

// Today on this device, as the sim takes it (YYYY-MM-DD).
export function localDate(now: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

// The day a page was opened for: `?day` is today's; `?day=2026-10-19` that day's, for a day
// missed or a test that needs the same one every run. Null when it isn't a day.
export function dayParam(search: string, now: Date): string | null {
  const q = new URLSearchParams(search);
  if (!q.has('day')) return null;
  const asked = q.get('day') ?? '';
  return isDate(asked) ? asked : localDate(now);
}

// To the day and back: the same page, with or without `?day`. A reload, so each starts as
// it would from cold, in its own save slot.
export const toDay = (): void => location.assign(`${location.pathname}?day`);
export const fromDay = (): void => location.assign(location.pathname);
