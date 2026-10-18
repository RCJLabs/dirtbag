// Phase 40: "What now?" from Hazel. Three moves for whoever's asking, each with its reason, all
// from the state: what's pressing first (hurt, spent, skin gone, the bills), then the story's
// next goal, then what's good today (a friend about, a crag in prime shape, a line you nearly
// had). A move opens where it happens: a place's card, a line's sheet, or the journal's goal.

import { weeklyBills } from './clinic';
import { gradeOf } from './climber';
import { actOf, currentGoal, goalDesc } from './story';
import { indoor, wallAt } from './content/gym';
import { PEOPLE } from './content/people';
import { ACTS, PLACES } from './content/places';
import { ROUTES } from './content/routes';
import { WHAT_NOW as W } from './content/whatnow';
import { unmet } from './cond';
import { CLIMB, WHATNOW } from './dials';
import { dayName, duration, fill, money } from './format';
import { actCost } from './game';
import { known } from './hollow';
import { signedUp } from './jobs';
import { PARTNERS, whereNow } from './presence';
import { conditionsAt } from './weather';
import type { GameState } from './types';

export type MoveTo = { k: 'place'; id: string } | { k: 'line'; route: string } | { k: 'goal' };
export interface Move {
  to: MoveTo;
  label: string;
  why: string;
  kind: 'need' | 'story' | 'chance';
}

const place = (id: string): MoveTo => ({ k: 'place', id });
const same = (a: MoveTo, b: MoveTo): boolean => JSON.stringify(a) === JSON.stringify(b);
const name = (id: string): string => PLACES[id]?.name ?? id;

// The shift you could work now: one you're signed up for today first, then the job you've
// worked most, its single-shift act's needs met (posted, on your schedule, in time, the
// energy for it). The act, and where.
export function shiftNow(s: GameState): { act: string; place: string } | null {
  const acts = Object.entries(ACTS).filter(([, d]) => d.job?.shifts === 1);
  const first = (job: string) => (signedUp(s, job, s.day) ? 1e6 : 0) + (s.jobs[job] ?? 0);
  acts.sort(([, a], [, b]) => first(b.job!.id) - first(a.job!.id));
  const ok = acts.find(([id, d]) => known(s, id.split('.')[0]!) && !unmet(s, d.needs));
  return ok ? { act: ok[0], place: ok[0].split('.')[0]! } : null;
}

// The day the week's bills come out, and how that's said.
function billsWhen(day: number): { left: number; when: string } {
  const due = Math.ceil(day / 7) * 7;
  return { left: due - day, when: due === day ? W.tonight : fill(W.on, { day: dayName(due) }) };
}

function needs(s: GameState): Move[] {
  const out: Move[] = [];
  if (s.injury && s.injury.until > s.day)
    out.push({
      to: place('clinic'),
      label: W.hurt.label,
      why: fill(W.hurt.why, { kind: s.injury.kind }),
      kind: 'need',
    });
  if (s.energy < CLIMB.minEnergy)
    out.push({ to: place('lot'), label: W.spent.label, why: W.spent.why, kind: 'need' });
  const job = shiftNow(s)?.place;
  if (job && s.skin < CLIMB.minSkin)
    out.push({
      to: place(job),
      label: fill(W.skin.label, { place: name(job) }),
      why: W.skin.why,
      kind: 'need',
    });
  const bills = weeklyBills(s);
  const { left, when } = billsWhen(s.day);
  if (job && left <= WHATNOW.billsWithin && s.cash < bills)
    out.push({
      to: place(job),
      label: fill(W.bills.label, { place: name(job) }),
      why: fill(W.bills.why, { when, bills: money(bills), cash: money(s.cash) }),
      kind: 'need',
    });
  return out;
}

// The easiest line here you haven't sent and could get on, if this is a place to climb.
function lineHere(s: GameState): string | null {
  const p = PLACES[s.at];
  if (!p?.crag && !indoor(s.at)) return null;
  const grade = gradeOf(s.climber.skills);
  const open = wallAt(s, s.at).filter(
    (r) => !r.open && !r.wall && !s.routes[r.id]?.sent && r.grade <= grade + 1,
  );
  open.sort((a, b) => a.grade - b.grade);
  return open[0]?.id ?? null;
}

function story(s: GameState): Move | null {
  const g = currentGoal(s);
  if (!g) return null;
  const goal = goalDesc(g, s);
  const a = g.aim;
  const fromHere = (): Move | null => {
    const id = lineHere(s);
    const r = id ? (wallAt(s, s.at).find((x) => x.id === id) ?? ROUTES[id]) : undefined;
    return r
      ? {
          to: { k: 'line', route: r.id },
          label: fill(W.goal.line.label, { line: r.name }),
          why: fill(W.goal.line.why, { goal, line: r.name }),
          kind: 'story',
        }
      : null;
  };
  const go = (id: string): Move => ({
    to: place(id),
    label: fill(W.goal.place.label, { place: name(id) }),
    why: fill(W.goal.place.why, { goal }),
    kind: 'story',
  });
  if ('cash' in a) {
    const job = shiftNow(s)?.place;
    if (job)
      return {
        to: place(job),
        label: fill(W.goal.shift.label, { place: name(job) }),
        why: fill(W.goal.shift.why, { goal, cash: money(s.cash) }),
        kind: 'story',
      };
  }
  if ('at' in a) return s.at === a.at ? (fromHere() ?? go(a.at)) : go(a.at);
  if ('regular' in a) {
    const who = PARTNERS.filter((w) => s.people[w]).sort((x, y) => s.people[y]!.bond - s.people[x]!.bond)[0];
    const at = who ? whereNow(s, who) : null;
    if (who && at && known(s, at))
      return {
        to: place(at),
        label: fill(W.goal.person.label, { name: PEOPLE[who]!.name, place: name(at) }),
        why: fill(W.goal.person.why, { goal, name: PEOPLE[who]!.name, place: name(at) }),
        kind: 'story',
      };
  }
  if ('sends' in a || 'grade' in a) return fromHere() ?? go('gym');
  if ('sendsOutside' in a || 'outside' in a) return (PLACES[s.at]?.crag ? fromHere() : null) ?? go('road');
  return { to: { k: 'goal' }, label: W.goal.page.label, why: fill(W.goal.page.why, { goal }), kind: 'story' };
}

function chances(s: GameState): Move[] {
  const out: Move[] = [];
  // A line you nearly had, here.
  for (const r of PLACES[s.at]?.crag || indoor(s.at) ? wallAt(s, s.at) : []) {
    const L = s.routes[r.id];
    if (!L || L.sent || !L.hi || r.moves - L.hi > WHATNOW.near) continue;
    const n = r.moves - L.hi;
    out.push({
      to: { k: 'line', route: r.id },
      label: fill(W.close.label, { line: r.name }),
      why: fill(W.close.why, { line: r.name, n: n === 1 ? 'a move' : `${n} moves` }),
      kind: 'chance',
    });
    break;
  }
  // A friend about, somewhere else.
  for (const who of PARTNERS) {
    if (!s.people[who]) continue;
    const at = whereNow(s, who);
    if (!at || at === s.at || !known(s, at)) continue;
    const p = { name: PEOPLE[who]!.name, place: name(at) };
    out.push({ to: place(at), label: fill(W.friend.label, p), why: fill(W.friend.why, p), kind: 'chance' });
    break;
  }
  // A crag in prime shape that'll have you.
  const grade = gradeOf(s.climber.skills);
  for (const [id, p] of Object.entries(PLACES)) {
    if (!p.crag || id === s.at || !known(s, id) || (p.minGrade ?? 0) > grade) continue;
    const c = conditionsAt(s.seed, s.day, id);
    if (c.sky !== 'prime' || !c.open || c.closed) continue;
    out.push({
      to: place(id),
      label: fill(W.prime.label, { place: p.name }),
      why: fill(W.prime.why, { place: p.name }),
      kind: 'chance',
    });
    break;
  }
  // A shift going: work's always a move.
  const shift = shiftNow(s);
  if (shift) {
    const c = actCost(s, ACTS[shift.act]!);
    const p = { place: name(shift.place), pay: money(c.cash ?? 0), time: duration(c.min ?? 0) };
    out.push({
      to: place(shift.place),
      label: fill(W.shift.label, p),
      why: fill(W.shift.why, p),
      kind: 'chance',
    });
  }
  return out;
}

// Hazel's moves, best first: needs, the story, chances; never two to the same place.
export function whatNow(s: GameState): Move[] {
  const out: Move[] = [];
  for (const m of [...needs(s), story(s), ...chances(s)])
    if (m && out.length < WHATNOW.moves && !out.some((o) => same(o.to, m.to))) out.push(m);
  return out;
}

// Phase 40 (Evan's call): through Act I the button asks to be pressed each morning; after it,
// it waits to be asked.
export const whatNowLit = (s: GameState, seen: number | null): boolean => actOf(s) === 1 && seen !== s.day;
