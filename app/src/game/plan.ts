// The day's plan (Phase 11.4): a sequence of steps, run in one go. A step is a place and
// what to do there: an act, or climbing, which the plan waits on while you climb. It's the
// UI's, not the sim's. Each step runs through act() as a tap would, so the rules never know
// a plan ran them, and it lives beside the save, like the settings.

import { ACTS, PLACES, ROUTES, type GameState } from '../sim';

export interface PlanStep {
  place: string;
  act?: string;
  climb?: true;
}

export const SLEEP = 'lot.sleep';

// Somewhere with something to climb: a crag's lines, or the gym's wall.
const climbable = (place: string): boolean =>
  place === 'gym' || Object.values(ROUTES).some((r) => r.place === place);

// What you can plan at a place: its acts, and climbing where there's something to climb. An
// act only a moment offers (Scout picking you) isn't one, and nor is looking after a dog
// you don't have.
export function stepsAt(s: GameState, place: string): PlanStep[] {
  const acts = Object.entries(ACTS)
    .filter(([id]) => id.split('.')[0] === place)
    .filter(([, a]) => !a.needs?.some((n) => n.dogOffer || (n.dog && !s.dog)))
    .map(([id]): PlanStep => ({ place, act: id }));
  return [...(climbable(place) ? [{ place, climb: true } as PlanStep] : []), ...acts];
}

export const stepLabel = (step: PlanStep): string =>
  step.climb ? 'Climb' : (ACTS[step.act ?? '']?.label ?? step.act ?? '');

const same = (a: PlanStep, b: PlanStep) => a.place === b.place && a.act === b.act && !!a.climb === !!b.climb;

// A plan read back from storage: steps at places that exist, doing things that exist there,
// and nothing after bed.
export function validSteps(raw: unknown): PlanStep[] {
  if (!Array.isArray(raw)) return [];
  const out: PlanStep[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue;
    const { place, act, climb } = x as Record<string, unknown>;
    if (typeof place !== 'string' || !PLACES[place]) continue;
    if (climb === true && climbable(place)) out.push({ place, climb: true });
    else if (typeof act === 'string' && act.split('.')[0] === place && ACTS[act]) out.push({ place, act });
    else continue;
    if (act === SLEEP) break;
  }
  return out;
}

// Bed is always last: a step added to a plan that ends in bed goes in before it.
export function withStep(plan: PlanStep[], step: PlanStep): PlanStep[] {
  const last = plan.at(-1);
  if (last?.act === SLEEP) return step.act === SLEEP ? plan : [...plan.slice(0, -1), step, last];
  return [...plan, step];
}

// Today as played, noted as you go: each act, and a climb once per visit to a place.
export function noted(today: PlanStep[], step: PlanStep): PlanStep[] {
  const last = today.at(-1);
  if (step.climb && last && same(last, step)) return today;
  return [...today, step];
}

// "Coffee Shop, Roadside Crag, then the Lot": where a plan goes, in order.
export function planLine(plan: PlanStep[]): string {
  const places: string[] = [];
  for (const st of plan) if (places.at(-1) !== st.place) places.push(st.place);
  const names = places.map((p) => PLACES[p]?.name ?? p);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')}, then ${names.at(-1)}` : (names[0] ?? '');
}

// ---- beside the save ----

const KEY = 'dirtbag.plan';

export interface Plans {
  // The plan you've made.
  plan: PlanStep[];
  // The day before, as you played it: tomorrow's plan, unless you make another.
  yesterday: PlanStep[];
}

const store = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export function loadPlans(): Plans {
  try {
    const raw = store()?.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as Partial<Record<keyof Plans, unknown>>) : {};
    return { plan: validSteps(v.plan), yesterday: validSteps(v.yesterday) };
  } catch {
    return { plan: [], yesterday: [] };
  }
}

// Returns false if the write failed, so the caller can say so.
export function savePlans(p: Plans): boolean {
  try {
    const ls = store();
    if (!ls) return false;
    ls.setItem(KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

// Starting over starts the plans over too: they were that climber's.
export function wipePlans(): void {
  try {
    store()?.removeItem(KEY);
  } catch {
    // Nothing to wipe if storage is off.
  }
}
