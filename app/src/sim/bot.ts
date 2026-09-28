// A player that isn't one: plays whole days through act() and the go model, for the week
// test now and the balance harness in R2. Its choices are rules of thumb, and every one goes
// through the same door a tap does, so a bot's week is a real week. Its hands are better
// than anyone's (it reads the meter exactly), so what it reaches is an upper bound.

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
import { ACTS } from './content/places';
import type { RouteDef } from './content/routes';
import { CLIMB, DAY, MONEY } from './dials';
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
}

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
  // Hands for each go; perfect ones by default.
  hands?: () => (a: Attempt, i: number) => boolean;
}

export function playWeek(seed: string, opts: WeekOpts = {}): BotRun {
  const hands = opts.hands ?? carefulHands;
  let s = newGame(seed);
  const run: BotRun = { state: s, actions: [], refused: [], sends: [] };

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
    const want = 60 + (billsSoon() ? MONEY.registration + MONEY.insurance : 0);
    if (s.cash >= want) return;
    travel('cafe');
    if (!tryAct('cafe.double')) tryAct('cafe.shift');
  }

  function maybeSage() {
    if (whereIs(s.seed, 'sage', s.day, s.min) !== s.at || s.today.includes('sage')) return;
    const node = talkStart(s, 'sage');
    if (node === 'meet' || node === 'again') go({ t: 'say', talk: 'sage', node, opt: 0 });
  }

  // The next line to try: the easiest one not yet sent with a window the hands can hold;
  // with everything sent, the day's done.
  function choose(): RouteDef | null {
    const lines = routesAt(s.seed, s.at, s.day)
      .filter((r) => !goBlocked(s, r) && !s.routes[r.id]?.sent && (s.routes[r.id]?.goesToday ?? 0) < 3)
      .sort((a, b) => a.grade - b.grade);
    return lines.find((r) => bestBeta(s, r).worst >= 0.045) ?? null;
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
      const res = playGo(s, r, hands());
      go({ t: 'done', route: r.id, result: res });
      if (!res.sent && !goBlocked(s, r)) go({ t: 'rest', route: r.id });
    }
  }

  function day() {
    travel('lot');
    if (s.fed < 70) tryAct('lot.cook');
    work();
    const place = conditions(s.seed, s.day).open ? 'road' : 'gym';
    if (s.min < 16 * 60) {
      travel(place);
      if (place === 'gym') tryAct('gym.pass');
      session();
    }
    travel('lot');
    if (s.fed < 60) tryAct('lot.cook');
    if (s.fed < 40) tryAct('lot.cook');
    while (s.min < DAY.bedFrom) if (!tryAct(isNight(s.min) ? 'lot.sit' : 'lot.rest')) break;
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
