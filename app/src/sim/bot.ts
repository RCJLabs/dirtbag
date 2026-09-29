// A player that isn't one: plays whole days through act() and the go model, for the week
// test and the balance harness. Its choices are rules of thumb, and every one goes through
// the same door a tap does, so a bot's week is a real week. With careful hands it reads the
// meter exactly, so what it reaches is an upper bound; human hands scatter.

import {
  attemptInput,
  betaScale,
  goResult,
  resting,
  startAttempt,
  STEP,
  stepAttempt,
  type Attempt,
} from './climb';
import { isNight, unmet } from './cond';
import { routesAt } from './content/gym';
import { ACTS, road } from './content/places';
import type { RouteDef } from './content/routes';
import { CLIMB, DAY, MONEY } from './dials';
import { gradeOf, average } from './climber';
import { act, goBlocked, knowsBeta, newGame, talkStart } from './game';
import { whereIs } from './presence';
import type { Action, GameState, GoResult } from './types';
import type { Rng } from './rng';
import { conditions } from './weather';

export interface BotRun {
  state: GameState;
  actions: Action[];
  // Anything the rules turned down: a bot that asks for what it can't have is a bot bug, or
  // a rule that leaves no way forward.
  refused: string[];
  sends: string[];
  // One line per day, taken at bedtime.
  days: DaySummary[];
}

export interface DaySummary {
  day: number;
  cash: number;
  grade: number;
  // The five skills' average: the grade's finer grain.
  avg: number;
  energy: number;
  skin: number;
  fed: number;
  goes: number;
  // Minutes on the clock at work.
  workMin: number;
  // The hardest grade index you tied in on today, or -1.
  hardest: number;
  // Where the day's climbing was: a place, "tired" (too spent to go), or "nothing" (no line
  // left within reach anywhere).
  where: string;
}

// How a bot spends its days. The climber works only when the money's nearly gone; the
// balanced one keeps a cushion; the worker takes every shift going and climbs after.
export type Strategy = 'climber' | 'balanced' | 'worker';

// Reads the meter the way the e2e bot reads the screen: hold to track the tension band,
// release a throw just inside its band, tap on the beat; shake out at the rest, and hang
// on a jug between cruxes when the pump gets high.
export function carefulHands(): (a: Attempt, i: number) => boolean {
  let rested = false;
  let shaking = false;
  let lastTap = -99;
  return (a, i) => {
    const v = a.crux;
    if (a.phase === 'crux' && v) {
      if (v.verb === 'tension') return v.m < v.c;
      if (v.verb === 'load') return v.m < CLIMB.load.target - v.w * 0.3;
      if (Math.abs(v.m - CLIMB.timing.center) < v.w * 0.5 && i - lastTap > 15) {
        lastTap = i;
        return true;
      }
      return false;
    }
    if (resting(a) && !rested) {
      if (a.pump > 6) return false;
      rested = true;
    }
    if (a.pump > 70) shaking = true;
    if (shaking && a.pump < 30) shaking = false;
    return !shaking;
  };
}

// Human-ish hands, for a first read on difficulty: a throw let go of and a foot tapped with
// the scatter of a practised thumb (about 50 ms either way), and a tension band tracked
// from what the eye saw 200 ms ago. The numbers are guesses, not measurements: R2 fits
// them to playtests.
export interface HandsSpread {
  // Standard deviations, in meter units: the load meter fills 0.85 a second and the timing
  // marker sweeps 1.6, so 0.045 and 0.08 are both about 50 ms.
  load: number;
  timing: number;
  // Steps of lag on the tension band.
  lag: number;
}
export const HUMAN: HandsSpread = { load: 0.045, timing: 0.08, lag: 12 };

export function humanHands(rng: Rng, spread: HandsSpread = HUMAN): (a: Attempt, i: number) => boolean {
  const seen: Attempt[] = [];
  const gauss = () => {
    let u = 0;
    for (let k = 0; k < 6; k++) u += rng.next();
    return (u - 3) / Math.SQRT1_2;
  };
  const base = carefulHands();
  let aim: { crux: string; at: number } | null = null;
  let lastTap = -99;
  return (a, i) => {
    seen.push(a);
    if (seen.length > spread.lag + 1) seen.shift();
    const v = a.crux;
    if (a.phase !== 'crux' || !v) {
      aim = null;
      return base(a, i);
    }
    if (v.verb === 'tension') {
      const old = seen[0]!.crux ?? v;
      return old.m < old.c;
    }
    // Each throw and each tap aims at the target plus this attempt's own error.
    if (!aim || aim.crux !== `${v.id}:${v.hits + v.miss}`)
      aim = {
        crux: `${v.id}:${v.hits + v.miss}`,
        at:
          (v.verb === 'load' ? CLIMB.load.target : CLIMB.timing.center) +
          gauss() * (v.verb === 'load' ? spread.load : spread.timing),
      };
    if (v.verb === 'load') return v.m < aim.at;
    const near = Math.abs(v.m - aim.at) < 0.02;
    if (near && i - lastTap > 15) {
      lastTap = i;
      return true;
    }
    return false;
  };
}

// Plays one go to its end with the given hands.
export function playGo(s: GameState, r: RouteDef, hands = carefulHands()): GoResult {
  let a = startAttempt(s, r);
  for (let i = 0; i < 60 * 180; i++) {
    const want = hands(a, i);
    if (want !== a.hold) a = attemptInput(a, want).att;
    a = stepAttempt(a, STEP).att;
    if (a.phase === 'lowered' || a.phase === 'sent') break;
  }
  return goResult(a);
}

// The widest window you'd have at each crux with the beta you know, and the beta for it.
function bestBeta(s: GameState, r: RouteDef): { picks: [string, string][]; worst: number } {
  const picks: [string, string][] = [];
  let worst = Infinity;
  for (const c of r.cruxes) {
    let best = { id: c.beta[0]!, w: -1 };
    for (const id of c.beta) {
      if (!knowsBeta(s, r.id, c.id, id)) continue;
      const w = r.beta[id]!.w * betaScale(s, r, id);
      if (w > best.w) best = { id, w };
    }
    picks.push([c.id, best.id]);
    worst = Math.min(worst, best.w);
  }
  return { picks, worst };
}

export interface WeekOpts {
  days?: number;
  start?: string;
  strategy?: Strategy;
  // Hands for each go; perfect ones by default.
  hands?: () => (a: Attempt, i: number) => boolean;
}

// The cash each strategy tries to keep before it'll spend a day climbing.
const CUSHION: Record<Strategy, number> = { climber: 15, balanced: 60, worker: Infinity };

export const playWeek = (seed: string, opts: WeekOpts = {}): BotRun => playDays(seed, { days: 7, ...opts });

export function playDays(seed: string, opts: WeekOpts = {}): BotRun {
  const hands = opts.hands ?? carefulHands;
  const strategy = opts.strategy ?? 'balanced';
  let s = newGame(seed);
  const run: BotRun = { state: s, actions: [], refused: [], sends: [], days: [] };
  let workMin = 0;
  let hardest = -1;

  const go = (a: Action): boolean => {
    const r = act(s, a);
    const no = r.events.find((e) => e.k === 'refused');
    if (no && no.k === 'refused') {
      run.refused.push(`day ${s.day} ${s.min}: ${JSON.stringify(a)}: ${no.why}`);
      return false;
    }
    s = r.state;
    run.actions.push(a);
    for (const e of r.events) if (e.k === 'sent') run.sends.push(`day ${s.day}: ${e.route} (${e.style})`);
    return true;
  };
  // Only asks for an act when its needs hold, like a player reading a greyed-out button.
  const tryAct = (id: string): boolean =>
    id.split('.')[0] === s.at && !unmet(s, ACTS[id]!.needs) ? go({ t: 'act', act: id }) : false;
  const travel = (to: string) => s.at === to || go({ t: 'travel', to });

  const billsSoon = () => Math.ceil(s.day / 7) * 7 - s.day <= 1;

  function work() {
    const want = CUSHION[strategy] + (billsSoon() ? MONEY.registration + MONEY.insurance : 0);
    if (s.cash >= want) return;
    travel('cafe');
    const t = s.min;
    if (!tryAct('cafe.double')) tryAct('cafe.shift');
    workMin += s.min - t;
  }

  function maybeSage() {
    if (whereIs(s.seed, 'sage', s.day, s.min) !== s.at || s.today.includes('sage')) return;
    const node = talkStart(s, 'sage');
    if (node === 'meet' || node === 'again') go({ t: 'say', talk: 'sage', node, opt: 0 });
  }

  // The next line to try at a place: the easiest one not yet sent with a window the hands
  // can hold; failing that, a project (the unsent line with the widest window, three goes a
  // day at most, as a player would work a line above them); with everything sent, there's
  // nothing to go there for.
  function choose(place = s.at): RouteDef | null {
    // Plan for when you'd get there, with the pass you'd buy at the desk.
    const drive = place === s.at ? 0 : (road(s.at, place)?.min ?? 0);
    const there = {
      ...s,
      at: place,
      min: s.min + drive,
      today: place === 'gym' ? [...s.today, 'pass'] : s.today,
    };
    const lines = routesAt(s.seed, place, s.day)
      .filter((r) => !goBlocked(there, r) && !s.routes[r.id]?.sent && (s.routes[r.id]?.goesToday ?? 0) < 3)
      .map((r) => ({ r, w: bestBeta(there, r).worst }))
      .sort((a, b) => a.r.grade - b.r.grade);
    const easy = lines.find((l) => l.w >= 0.045);
    if (easy) return easy.r;
    return lines.sort((a, b) => b.w - a.w)[0]?.r ?? null;
  }

  function session() {
    for (let n = 0; n < 30; n++) {
      if (s.energy < 25 || s.skin < 22 || s.min >= 17 * 60) return;
      maybeSage();
      const r = choose();
      if (!r) return;
      for (const [crux, beta] of bestBeta(s, r).picks)
        if ((s.routes[r.id]?.pick[crux] ?? r.cruxes.find((c) => c.id === crux)!.beta[0]) !== beta)
          go({ t: 'pick', route: r.id, crux, beta });
      if (!go({ t: 'go', route: r.id })) return;
      hardest = Math.max(hardest, r.grade);
      const res = playGo(s, r, hands());
      go({ t: 'done', route: r.id, result: res });
      if (!res.sent && !goBlocked(s, r)) go({ t: 'rest', route: r.id });
    }
  }

  function day() {
    workMin = 0;
    hardest = -1;
    travel('lot');
    if (s.fed < 70) tryAct('lot.cook');
    work();
    // The crag when it's dry and there's something there to try; the gym otherwise.
    const open = conditions(s.seed, s.day).open;
    const place = open && choose('road') ? 'road' : choose('gym') ? 'gym' : null;
    let where = place ? 'tired' : 'nothing';
    if (place && s.min < 16 * 60 && s.energy >= 30 && s.skin >= 25) {
      travel(place);
      if (place === 'gym') tryAct('gym.pass');
      session();
      where = place;
    }
    travel('lot');
    if (s.fed < 60) tryAct('lot.cook');
    if (s.fed < 40) tryAct('lot.cook');
    while (s.min < DAY.bedFrom) if (!tryAct(isNight(s.min) ? 'lot.sit' : 'lot.rest')) break;
    run.days.push({
      day: s.day,
      cash: s.cash,
      grade: gradeOf(s.climber.skills),
      avg: average(s.climber.skills),
      energy: s.energy,
      skin: s.skin,
      fed: s.fed,
      goes: Object.values(s.routes).reduce((n, r) => n + r.goesToday, 0),
      workMin,
      hardest,
      where,
    });
    tryAct('lot.sleep');
  }

  go({ t: 'create', name: 'Bot', start: opts.start ?? 'allrounder' });
  const end = s.day + (opts.days ?? 7);
  for (let guard = 0; s.day < end; guard++) {
    if (guard > (opts.days ?? 7) * 2)
      throw new Error(`the bot is stuck on day ${s.day}: ${run.refused.slice(-3).join(' | ')}`);
    day();
  }
  run.state = s;
  return run;
}
