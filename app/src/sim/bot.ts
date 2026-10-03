// A player that isn't one: plays whole days through act() and the go model, for the week
// test and the balance harness. Its choices are rules of thumb, and every one goes through
// the same door a tap does, so a bot's week is a real week. With careful hands it reads the
// meter exactly, so what it reaches is an upper bound; human hands scatter.

import { folksDue } from './folks';
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
import { pathBlocked } from './paths';
import { PROTOCOLS } from './content/training';
import { sessionGains, trainBlocked } from './sessions';
import { headroom, holds, isNight, unmet } from './cond';
import { INDOOR, routesAt } from './content/gym';
import { ACTS, PLACES, road } from './content/places';
import { JOBS } from './content/jobs';
import { INGREDIENTS } from './content/food';
import { TALK } from './content/people';
import { roped, type RouteDef } from './content/routes';
import {
  BODY,
  BOND,
  CLIMB,
  KIT,
  LOAD,
  MONEY,
  SICK,
  HUSTLE,
  PSYCHE,
  SUPPLIES,
  UPGRADE,
  VAN,
  WINTER,
  type SpotId,
  type VanPart,
} from './dials';
import { cold, freshLoad, ratio } from './body';
import { gradeOf, average } from './climber';
import {
  act,
  actCost,
  faSuggestions,
  goBlocked,
  knowsBeta,
  landingChance,
  newGame,
  routeOfId,
  talkStart,
} from './game';
import { whereNow } from './presence';
import { signupBlocked } from './jobs';
import { friendFor, PARTS, repairCost, unsafePart } from './van';
import { hitchFriend } from './events';
import { carePrice, weeklyBills } from './clinic';
import { spotBlocked, ticketOdds } from './spots';
import { tonight } from './tonight';
import type { Action, GameState, GoResult, Skills, TripPlan } from './types';
import type { Rng } from './rng';
import { conditions, conditionsAt, seasonOf } from './weather';
import { currentGoal } from './story';
import { EXPEDITIONS, expedPitches } from './content/expeditions';
import { defaultPlan, planBlocked, planCost, stormOn, summitOdds, yourPitch } from './expeditions';
import { WALLS } from './content/routes';

export interface BotRun {
  state: GameState;
  actions: Action[];
  // Anything the rules turned down: a bot that asks for what it can't have is a bot bug, or
  // a rule that leaves no way forward.
  refused: string[];
  sends: string[];
  injuries: string[];
  // Every line the game said, with its day: the state's own log keeps only the last 200.
  lines: string[];
  // One line per day, taken at bedtime.
  days: DaySummary[];
}

export interface DaySummary {
  day: number;
  // What the day would take a player in taps, roughly (Phase 16.6).
  taps: number;
  cash: number;
  grade: number;
  // The five skills' average: the grade's finer grain.
  avg: number;
  energy: number;
  skin: number;
  fed: number;
  // Psyche that morning (Phase 22.4d).
  psyche: number;
  goes: number;
  // Minutes on the clock at work.
  workMin: number;
  // The hardest grade index you tied in on today, or -1.
  hardest: number;
  // Where the day's climbing was: a place; "tired" (too spent to go); "resting" (the body
  // said no, with unsent lines still out there); or "nothing" (no line left within reach
  // anywhere).
  where: string;
  // Minutes on the rock (goes and the rests between them), and the skill they taught, summed
  // over all five: what climbing's worth an hour, against a setting shift's.
  climbMin: number;
  climbGain: number;
  // The skills the day started with: what a training session would have been worth instead.
  skills: Skills;
  // A night the rules count as failure: going to bed hungry, or with the card nearly maxed.
  stuck: boolean;
}

// Where the bots climb: the crags they drive to without paying for a haul, and the gym.
const BOT_PLACES = ['road', 'gorge', 'cove', 'mesa', 'cave', 'gym'];
// The Cave's problems start at V5: a bot climbs there once it's climbing that.
const CAVE_FROM = 5;

// A careful climber reads a highball's landing odds the way they read the load warning: they
// won't work one while a fall from its crux lands badly more than 1 time in 20, so they wait
// for someone to spot them. A reckless one doesn't look.
const HIGHBALL_ODDS = 0.05;
const cruxLanding = (s: GameState, r: RouteDef): number => {
  const c = r.cruxes[0];
  return landingChance(s, r, c ? (c.from + c.to) / 2 : r.moves);
};

// How a bot spends its days. The climber works only when the money's nearly gone; the
// balanced one keeps a cushion; the worker takes every shift going and climbs after.
// The career bot (Phase 21's criterion 3) plays the long game: the best-paying job it can
// get, saving for the trips, asking Hazel along, and the crag with the hardest line it can
// get on.
export type Strategy = 'climber' | 'balanced' | 'worker' | 'career';

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
// from what the eye saw about 200 ms ago, sharper on some goes than others. A fixed lag
// made tension all-or-nothing: every band wider than the lag's wobble held, and every
// narrower one fell. The numbers are guesses, not measurements: R2 fits them to playtests.
export interface HandsSpread {
  // Standard deviations, in meter units: the load meter fills 0.85 a second and the timing
  // marker sweeps 1.6, so 0.045 and 0.08 are both about 50 ms.
  load: number;
  timing: number;
  // Steps of lag on the tension band, and how much it varies from go to go.
  lag: number;
  lagSd: number;
}
export const HUMAN: HandsSpread = { load: 0.045, timing: 0.08, lag: 12, lagSd: 4 };

export function humanHands(rng: Rng, spread: HandsSpread = HUMAN): (a: Attempt, i: number) => boolean {
  const seen: Attempt[] = [];
  const gauss = () => {
    let u = 0;
    for (let k = 0; k < 6; k++) u += rng.next();
    return (u - 3) / Math.SQRT1_2;
  };
  const base = carefulHands();
  const lag = Math.min(24, Math.max(4, Math.round(spread.lag + gauss() * spread.lagSd)));
  let aim: { crux: string; at: number } | null = null;
  let lastTap = -99;
  return (a, i) => {
    seen.push(a);
    if (seen.length > lag + 1) seen.shift();
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

// How forgiving a window is for hands like these: a throw's band against its scatter, and
// a foot's against the timing's, which needs two good taps. Comparing raw widths across
// verbs had the bot taking the wider timing beta on dynos that the throw sent three times
// as often.
const VERB_SPREAD: Record<string, number> = { load: HUMAN.load, timing: HUMAN.timing * 1.6, tension: 0.06 };

// The best window you'd have at each crux with the beta you know, and the beta for it.
// `worst` is the tightest crux's window, in load-verb terms.
function bestBeta(s: GameState, r: RouteDef): { picks: [string, string][]; worst: number } {
  const picks: [string, string][] = [];
  let worst = Infinity;
  for (const c of r.cruxes) {
    let best = { id: c.beta[0]!, w: -1 };
    for (const id of c.beta) {
      if (!knowsBeta(s, r.id, c.id, id)) continue;
      const b = r.beta[id]!;
      const w = ((b.w * betaScale(s, r, id)) / (VERB_SPREAD[b.verb] ?? HUMAN.load)) * HUMAN.load;
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
  // Where the bot came from (Phase 23.2); none, as a test's climber, by default.
  origin?: string;
  // And what it's climbing for (Phase 23.3), taken up on day one; none by default.
  calling?: string;
  // The paths it claims a tier of whenever it can (Phase 23.4); none by default.
  paths?: string[];
  // How it answers a call at the crag, or a call coming back, by id (Phase 23.5); the first
  // answer for any it isn't told.
  answers?: Record<string, number>;
  strategy?: Strategy;
  // A moderate climber warms up, stops for the day when their body starts talking (the
  // load ratio over 1.3), and waits for a spotter on a highball; a reckless one does none
  // of that.
  reckless?: boolean;
  // Hands for each go; perfect ones by default.
  hands?: () => (a: Attempt, i: number) => boolean;
  // Phase 17.7: a player who reads everything: sits at the fire every night, and with Ray
  // and Frank when they're about. Every bot plays the people's moments when they're due.
  social?: boolean;
}

// The cash each strategy tries to keep before it'll spend a day climbing.
const CUSHION: Record<Strategy, number> = { climber: 15, balanced: 60, worker: Infinity, career: 60 };

// Where a career goes: every crag and both gyms.
const CAREER_PLACES = [
  'road',
  'gorge',
  'cove',
  'mesa',
  'moon',
  'stone',
  'wind',
  'crucible',
  'cave',
  'center',
  'gym',
];
// The jobs a career bot weighs, by what they pay an hour.
const JOB_ACTS = ['cafe.shift', 'diner.shift', 'cave.coach', 'gym.set', 'warehouse.shift'];
// Each job's one-shift act (Phase 22.1): what a bot signed up for goes to work as.
const SHIFT_OF: Record<string, string> = Object.fromEntries(JOB_ACTS.map((id) => [ACTS[id]!.job!.id, id]));
// A part under this goes to the garage once there's money for it.
const GARAGE_AT = 45;
// Van upgrades a bot buys, in order, and what it keeps in hand past its cushion before it
// does (Phase 22.2c).
const BOT_UPGRADES = ['heater', 'kitchen', 'insulation', 'bed', 'tuneup', 'curtains', 'toolkit'] as const;
// Meals a bot cooks, best first (Phase 22.3).
const MEAL_ORDER = ['burritos', 'pasta', 'ricebeans', 'oatmeal'];
const SPARE = 60;
// A trust-fund bot (Phase 23.8) works only once it's down to this.
const IDLE_CASH = 20;
// Supplies under this, a bot buys water (Phase 22.4c).
const BOT_SUPPLIES = 40;
// Psyche under this, a bot sits at the fire before bed: short of keen (Phase 22.4d).
const BOT_FIRE = PSYCHE.bands[2]!;
// What a bot keeps over the heater and its propane, or the propane alone, in winter: a
// night at the Lot and a little, and the bills when they're close.
const WARM_OVER = 25;
// Phase 16.6: how much a crag the story names counts for, in grades, when the career bot picks.
const STORY_PULL = 3;
// A crag day starts by here, or it's not worth the drive.
const LAST_START = 14 * 60;

export const playWeek = (seed: string, opts: WeekOpts = {}): BotRun => playDays(seed, { days: 7, ...opts });

// Phase 24's expedition, played as the odds assume, for the harness and the career bot alike:
// wait out a storm; on your block, lead it a go at a time while you can, or hand it to your
// partner when their day is the better bet; on theirs, second it. `step` takes an action and
// says whether it was done; `hands` gives the hands for a go, by its number that day.
export function expedLoop(
  get: () => GameState,
  step: (a: Action) => boolean,
  hands: (g: number) => (a: Attempt, i: number) => boolean,
): void {
  for (let guard = 0; get().expedition && guard < 400; guard++) {
    const s = get();
    // Something happened up there (Phase 24.4): the bots take the first call.
    if (s.encounter?.kind === 'wall') {
      step({ t: 'answer', opt: 0 });
      continue;
    }
    const x = s.expedition!;
    const id = x.id;
    if (!stormOn(s.seed, id, EXPEDITIONS[id]!, s.day) && !s.today.includes('exped')) {
      const mine = yourPitch(x.pitch, !x.partner);
      const from = { ...x, on: s.day, energy: s.energy };
      const handOver =
        mine && !!x.partner && summitOdds(s, id, from, 'hand') > summitOdds(s, id, from, 'lead');
      if (!mine || handOver) {
        step({ t: 'exped', id, do: 'follow' });
        continue;
      }
      for (let g = 0; g < 20; g++) {
        const on = get().expedition;
        if (!on || !yourPitch(on.pitch, !on.partner)) break;
        const p = expedPitches(id)[on.pitch]!;
        if (!step({ t: 'go', route: p.id })) break;
        step({ t: 'done', route: p.id, result: playGo(get(), p, hands(g)) });
      }
      if (!get().expedition) break;
    }
    step({ t: 'exped', id, do: 'camp' });
  }
}

export function playDays(seed: string, opts: WeekOpts = {}): BotRun {
  const hands = opts.hands ?? carefulHands;
  const strategy = opts.strategy ?? 'balanced';
  let s = newGame(seed);
  const run: BotRun = { state: s, actions: [], refused: [], sends: [], injuries: [], lines: [], days: [] };
  let workMin = 0;
  let hardest = -1;
  let climbMin = 0;
  let climbGain = 0;
  // Phase 16.6: what the day would take a player in taps (the e2e's count: a trip by the map
  // is three, a go is three with its line and the walk off, anything else one).
  let taps = 0;

  // Who it is, in how it plays (Phase 23.8): where it came from decides where it goes first,
  // whether it trains, and how hard it works.
  const who = {
    indoor: opts.origin === 'gymrat' || opts.origin === 'gymnast',
    trains: opts.origin === 'gymnast',
    idle: opts.origin === 'trustfund',
  };
  // What its start plays to (Phase 23.8): a boulderer boulders, a rope gun ties in, a
  // technician goes for the technical lines; an all-rounder takes what suits it.
  const likes = (r: RouteDef): number => {
    const st = s.climber.start;
    if (st === 'boulderer') return r.disc === 'boulder' ? 1 : 0;
    if (st === 'ropegun') return r.disc !== 'boulder' ? 1 : 0;
    if (st === 'technician') return r.type === 'technical' ? 1 : 0;
    return 0;
  };
  // The session that teaches it most, of those it can do here and now.
  function trainOnce() {
    const best = Object.keys(PROTOCOLS)
      .filter((id) => id !== 'prehab' && !trainBlocked(s, id))
      .map((id) => ({ id, g: Object.values(sessionGains(s, PROTOCOLS[id]!)).reduce((n, v) => n + v, 0) }))
      .sort((a, b) => b.g - a.g)[0];
    if (best) go({ t: 'train', protocol: best.id });
  }
  // The answer it gives an encounter: the one it's told for a call, else the first.
  const answer = (): number => (s.encounter ? (opts.answers?.[s.encounter.id] ?? 0) : 0);
  const go = (a: Action): boolean => {
    const r = act(s, a);
    const no = r.events.find((e) => e.k === 'refused');
    if (no && no.k === 'refused') {
      run.refused.push(`day ${s.day} ${s.min}: ${JSON.stringify(a)}: ${no.why}`);
      return false;
    }
    s = r.state;
    run.actions.push(a);
    taps += a.t === 'travel' || a.t === 'go' ? 3 : a.t === 'done' ? 0 : 1;
    for (const e of r.events) {
      if (e.k === 'line') run.lines.push(`day ${s.day}: ${e.text}`);
      if (e.k === 'sent') run.sends.push(`day ${s.day}: ${e.route} (${e.style})`);
      if (e.k === 'injured') run.injuries.push(`day ${s.day}: ${e.kind} (tier ${e.tier})`);
      if (e.k === 'skills' && a.t === 'done') climbGain += Object.values(e.gains).reduce((n, g) => n + g, 0);
      // A first ascent gets the first name on offer, called true.
      if (e.k === 'fa') {
        const line = routesAt(s.seed, s.at, s.day).find((x) => x.id === e.route);
        if (line) go({ t: 'name', route: e.route, name: faSuggestions(s, line)[0]!, call: 0 });
      }
    }
    // A call at the crag after a go (Phase 23.5), answered there and then.
    if (a.t === 'done' && (s.encounter?.kind === 'stance' || s.encounter?.kind === 'echo'))
      go({ t: 'answer', opt: answer() });
    // Its paths' next tiers, the moment it can claim them.
    for (const id of opts.paths ?? []) if (a.t !== 'path' && !pathBlocked(s, id)) go({ t: 'path', id });
    return true;
  };
  // Only asks for an act when its needs hold, like a player reading a greyed-out button.
  const tryAct = (id: string): boolean =>
    id.split('.')[0] === s.at && !unmet(s, ACTS[id]!.needs) ? go({ t: 'act', act: id }) : false;
  // A drive, and whatever it takes if the van breaks down on the way: a friend if there's
  // one to call, then a bodge (free, and the part's left usable), then limping on if there's
  // energy for it (the part's left shot), and the tow when all else fails.
  const travel = (to: string): boolean => {
    if (s.at === to) return true;
    if (!go({ t: 'travel', to })) return false;
    // Someone on the road (Phase 22.6b), or a walk-out's calls (22.6c): the first answer, as
    // a bot takes things. Out of a walk-out, the drive is still to do.
    while (s.encounter) if (!go({ t: 'answer', opt: answer() })) break;
    if (s.at !== to && !s.breakdown && !s.encounter && !go({ t: 'travel', to })) return false;
    while (s.encounter) if (!go({ t: 'answer', opt: answer() })) break;
    if (s.breakdown) {
      const ok =
        ((friendFor(s) || hitchFriend(s)) && go({ t: 'fix', how: 'friend' })) ||
        (go({ t: 'fix', how: 'bodge' }) && !s.breakdown) ||
        (s.energy >= 40 && go({ t: 'fix', how: 'limp' })) ||
        go({ t: 'fix', how: 'tow' });
      if (!ok) return false;
    }
    return s.at === to;
  };

  const billsSoon = () => Math.ceil(s.day / 7) * 7 - s.day <= 1;

  // What a shift pays, with a job's tips at the middle of their range.
  const shiftPay = (id: string): number => {
    const tips = JOBS[ACTS[id]!.job!.id]?.tips;
    return (actCost(s, ACTS[id]!).cash ?? 0) + (tips ? (tips[0] + tips[1]) / 2 : 0);
  };
  // The morning's money: the cushion, and the week's bills when they're close.
  const wantFor = (day: number) =>
    CUSHION[strategy] + (Math.ceil(day / 7) * 7 - day <= 1 ? weeklyBills(s) : 0) + repairs();
  // A worn part is saved for, the way the bills are.
  const repairs = () => PARTS.filter((p) => s.van[p] < GARAGE_AT).reduce((n, p) => n + repairCost(s, p), 0);
  // Today's shift, if the bot signed up for one: it goes whatever the money says, or it's a
  // warning.
  const booked = (): string | null => {
    const b = s.shifts.find((x) => x.day === s.day);
    return b ? SHIFT_OF[b.job]! : null;
  };

  function work() {
    // Phase 23.8: a trust-fund kid works when the money's nearly gone, not to keep a cushion.
    const want = who.idle ? Math.min(wantFor(s.day), IDLE_CASH) : wantFor(s.day);
    const b = booked();
    if (s.cash >= want && !b) return;
    travel('cafe');
    const t = s.min;
    if (!tryAct('cafe.double')) tryAct('cafe.shift');
    workMin += s.min - t;
  }

  // Phase 22.2b: where to park tonight. A friend's driveway when it'll have you, the
  // trailhead when the Lot's ticket odds start, and the Lot otherwise.
  function park() {
    const want: SpotId = !spotBlocked(s, 'driveway')
      ? 'driveway'
      : ticketOdds(s.lotNights) > 0
        ? 'trailhead'
        : 'lot';
    if (s.spot !== want) go({ t: 'spot', spot: want });
  }

  // Phase 22.1: at night, a bot that'll be short in the morning signs up for tomorrow's
  // shift, so the shift counts toward a raise, like a player planning the week. The one it
  // takes is the best-paying of `jobs` posted tomorrow, an hour for an hour from the Lot.
  function signUp(jobs: string[], extra = 0) {
    const day = s.day + 1;
    if (s.shifts.some((x) => x.day === day)) return;
    if (tonight(s).cash >= wantFor(day) + extra) return;
    const rate = (id: string) => {
      const c = actCost(s, ACTS[id]!);
      return shiftPay(id) / ((c.min ?? 60) + 2 * (road('lot', id.split('.')[0]!)?.min ?? 0));
    };
    const best = jobs
      .filter((id) => !signupBlocked(s, ACTS[id]!.job!.id, day))
      .sort((a, b) => rate(b) - rate(a))[0];
    if (best) go({ t: 'signup', job: ACTS[best]!.job!.id, day, on: true });
  }

  // Keeps the kit up, as a careful player would once the shop's line tells them: a resole
  // when the rubber's going and there's money for it past the cushion, chalk when it's low.
  function kit() {
    const resole = (s.gear.shoes ?? 0) < KIT.shoes.worn + 5 && s.cash >= KIT.shoes.resole + CUSHION[strategy];
    const chalk = (s.gear.chalk ?? 0) < 5 && s.cash >= KIT.chalk.price;
    if (!resole && !chalk) return;
    travel('shop');
    if (resole) tryAct('shop.resole');
    if (chalk) tryAct('shop.chalk');
  }

  // Phase 22.4a: physio when hurt, with money past the cushion for it and days to save.
  function physio() {
    // A toothache won't pass on its own (Phase 22.4c).
    if (s.sick?.kind === 'toothache' && s.cash >= SICK.doctor.price + CUSHION.climber) {
      travel('clinic');
      tryAct('clinic.doctor');
    }
    if (!s.injury || s.injury.until - s.day < 2) return;
    if (s.cash < carePrice(s, 'physio') + CUSHION[strategy]) return;
    travel('clinic');
    tryAct('clinic.physio');
  }

  // Phase 22.3: the best meal the pantry makes, the ones that fuel you first; ramen when
  // there's no kitchen or nothing in the pantry for it.
  function eat(): boolean {
    for (const id of MEAL_ORDER) if (tryAct(`lot.${id}`)) return true;
    return tryAct('lot.cook');
  }

  // Bed, and an answer for whoever knocks (Phase 22.6a): the first, as a bot takes things.
  function bed() {
    tryAct('lot.sleep');
    if (s.encounter) go({ t: 'answer', opt: 0 });
  }

  // Phase 22.5a: the bins behind the market, and back to the van.
  function binRun() {
    travel('market');
    tryAct('market.bins');
    travel('lot');
  }

  // With a kitchen, a run to the market when the pantry's low: a pack of each for rice and
  // beans and for burritos, while the money past the cushion lasts.
  function groceries() {
    // Phase 22.4c: water and a wash kit when supplies run low.
    if (s.supplies < BOT_SUPPLIES && s.cash >= SUPPLIES.market.price + CUSHION.climber) {
      travel('market');
      tryAct('market.water');
    }
    if (!s.gear.kitchen) return;
    const low = ['rice', 'beans', 'tortillas', 'eggs', 'cheese'].filter((id) => (s.pantry[id] ?? 0) < 1);
    const cost = low.reduce((n, id) => n + INGREDIENTS[id]!.price, 0);
    if (low.length < 2 || s.cash < cost + CUSHION[strategy]) return;
    travel('market');
    for (const id of low) tryAct(`market.${id}`);
  }

  // Keeps the van up (Phase 22.2a): a part to the garage when it's worn and there's money
  // past the cushion for it, and at once, on the card, when it's shot or the battery's going.
  // Whether the van will take you there today (Phase 22.2a): across town always; out of it
  // only on sound road parts and a charged battery.
  function vanReaches(place: string): boolean {
    const r = road('lot', place);
    if (!r || r.min < VAN.from) return true;
    return !unsafePart(s) && s.van.battery > 0;
  }

  function garage() {
    // Asked again before each job, so one repair's bill counts against the next.
    const needs = (p: VanPart) => {
      const c = s.van[p];
      // Urgent, but not at the price of a maxed card: a van that can't leave town still gets
      // you to a shift and the gym while the money comes in.
      if (c < VAN.unsafe || (p === 'battery' && c < 8))
        return headroom(s) >= repairCost(s, p) + MONEY.vanSpot + CUSHION.climber;
      return c < GARAGE_AT && s.cash >= repairCost(s, p) + CUSHION[strategy];
    };
    const due = PARTS.filter(needs);
    // Phase 22.2c: before and through winter, the heater and a tank of propane come first,
    // as soon as the cash covers them with a little over (Evan's call: a heater a player can
    // afford before winter). Otherwise one upgrade a day, with money past the cushion.
    const cold = seasonOf(s.day) === 'winter' || seasonOf(s.day + WINTER.warnDays) === 'winter';
    const warm =
      cold &&
      repairs() === 0 &&
      !s.gear.heater &&
      s.cash >= UPGRADE.heater.price + WINTER.propane.price + WARM_OVER + (billsSoon() ? weeklyBills(s) : 0);
    const fit = warm
      ? 'heater'
      : BOT_UPGRADES.find((id) => !s.gear[id] && s.cash >= UPGRADE[id].price + CUSHION[strategy] + SPARE);
    if (due.length || fit) {
      travel('garage');
      for (const p of PARTS) if (needs(p)) tryAct(`garage.${p}`);
      if (
        fit &&
        (fit === 'heater'
          ? s.cash >= UPGRADE.heater.price
          : s.cash >= UPGRADE[fit].price + CUSHION[strategy] + SPARE)
      )
        tryAct(`garage.${fit}`);
    }
    if (cold && s.gear.heater && (s.gear.propane ?? 0) < 2 && s.cash >= WINTER.propane.price + WARM_OVER) {
      travel('shop');
      tryAct('shop.propane');
    }
  }

  // Talks to Sage when she's here: her lesson once a day, and whatever beat of her arc is
  // due (the first answer, like a player who doesn't read).
  function maybeSage() {
    for (let n = 0; n < 3; n++) {
      // A beat can send her off mid-conversation.
      if (whereNow(s, 'sage') !== s.at) return;
      const node = talkStart(s, 'sage');
      if (!node || !(node === 'meet' || node === 'again' || node.startsWith('beat-'))) return;
      if (node === 'again' && s.today.includes('sage')) return;
      const opt = TALK.sage!.nodes[node]!.opts.findIndex((o) => !o.when || holds(s, o.when));
      if (opt < 0 || !go({ t: 'say', talk: 'sage', node, opt })) return;
      if (node === 'meet' || node === 'again') return;
    }
  }

  // The next line to try at a place: the easiest one not yet sent with a window the hands
  // can hold; failing that, a project (the unsent line with the widest window, three goes a
  // day at most, as a player would work a line above them); with everything sent, there's
  // nothing to go there for.
  function choose(place = s.at, partner?: string): RouteDef | null {
    // Plan for when you'd get there, with the pass you'd buy at the desk, and the partner
    // you'd ask along.
    const drive = place === s.at ? 0 : (road(s.at, place)?.min ?? 0);
    const there = {
      ...s,
      at: place,
      min: s.min + drive,
      today: INDOOR[place] ? [...s.today, INDOOR[place]!.pass] : s.today,
      people: partner
        ? { ...s.people, [partner]: { ...s.people[partner]!, invite: { day: s.day, place, from: s.min } } }
        : s.people,
    };
    const lines = routesAt(s.seed, place, s.day)
      .filter((r) => !goBlocked(there, r) && !s.routes[r.id]?.sent && (s.routes[r.id]?.goesToday ?? 0) < 3)
      .filter((r) => opts.reckless || cruxLanding(there, r) <= HIGHBALL_ODDS)
      .map((r) => ({ r, w: bestBeta(there, r).worst }))
      .sort((a, b) => a.r.grade - b.r.grade);
    // Dex's dare comes first: a player racing him works the line he's after.
    const race = s.race && lines.find((l) => l.r.id === s.race!.route);
    if (race) return race.r;
    // Of the easiest it can send (the lowest grade with one, and the grade above), the line
    // that suits it best, as a player picks what plays to their strengths (Phase 23.8).
    const sendable = lines.filter((l) => l.w >= 0.045);
    if (sendable.length) {
      const low = sendable[0]!.r.grade;
      const band = sendable.filter((l) => l.r.grade <= low + 1);
      return band.sort((a, b) => likes(b.r) - likes(a.r) || b.w - a.w)[0]!.r;
    }
    // A project: of the easiest it hasn't sent (the lowest grade, and the one above), what
    // it likes, then the widest window.
    const low = lines[0]?.r.grade;
    if (low === undefined) return null;
    return lines.filter((l) => l.r.grade <= low + 1).sort((a, b) => likes(b.r) - likes(a.r) || b.w - a.w)[0]!
      .r;
  }

  // Whether a place has an unsent line the day allows (weather, closures, the light, a
  // belayer, the pass) for a fresh, unhurt body: what "nothing new to try" is about. Grade
  // gates count, so the Gorge isn't fresh before V4.
  function fresh(place: string): boolean {
    const p = PLACES[place];
    if (p?.minGrade !== undefined && gradeOf(s.climber.skills) < p.minGrade) return false;
    if (p?.unlock && !s.unlocked.includes(place)) return false;
    const body: GameState = {
      ...s,
      at: place,
      today: INDOOR[place] ? [...s.today, INDOOR[place]!.pass] : s.today,
      energy: 100,
      skin: 100,
      fed: 100,
      injury: null,
      load: freshLoad(),
    };
    // A career's day is judged from the morning, when Hazel would come if the bond's there.
    if (strategy === 'career') {
      body.min = 10 * 60;
      const need = p?.invite;
      if (need !== undefined && (s.people.hazel?.bond ?? 0) >= need)
        body.people = {
          ...s.people,
          hazel: { ...s.people.hazel!, invite: { day: s.day, place, from: 9 * 60 } },
        };
    }
    return routesAt(s.seed, place, s.day).some((r) => !s.routes[r.id]?.sent && !goBlocked(body, r));
  }

  // The easiest thing here to warm up on, sent or not.
  function warmUp(): RouteDef | null {
    return (
      routesAt(s.seed, s.at, s.day)
        .filter((r) => !goBlocked(s, r))
        .sort((a, b) => a.grade - b.grade)[0] ?? null
    );
  }

  // Phase 17.7, the social bot only: whoever's here with something due (a meeting, a beat of
  // their arc, a moment of their life, a romance's), answered the first way, and a sit with a
  // local. The others leave the people be, so their targets measure what they always have.
  const MOMENT = /^(meet|beat-|love-|last-season|slowing|parked)/;
  function maybePeople() {
    if (!opts.social) return;
    for (const [talk, t] of Object.entries(TALK)) {
      if (t.who === 'sage' || talk === 'hazel-lot' || whereNow(s, t.who) !== s.at) continue;
      for (let n = 0; n < 4; n++) {
        if (whereNow(s, t.who) !== s.at) break;
        const node = talkStart(s, talk);
        const sit = node === 'again' && (t.who === 'ray' || t.who === 'frank');
        if (!node || !(MOMENT.test(node) || sit)) break;
        const opt = t.nodes[node]!.opts.findIndex((o) => !o.when || holds(s, o.when));
        if (opt < 0 || !go({ t: 'say', talk, node, opt })) break;
        if (sit || node === 'meet') break;
      }
    }
    // A call from home, returned, answered the first way (never home).
    if (folksDue(s) !== null && go({ t: 'call' })) go({ t: 'answer', opt: 0 });
  }

  function session() {
    for (let n = 0; n < 30; n++) {
      if (s.energy < 25 || s.skin < 22 || s.min >= 17 * 60) return;
      if (!opts.reckless && ratio(s.load) > LOAD.risk) return;
      maybeSage();
      maybePeople();
      const next = choose();
      if (!next) return;
      const r = !opts.reckless && !s.today.includes('warm') && cold(s, next) ? (warmUp() ?? next) : next;
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

  // The day's line in the run, at bedtime.
  // `away`: a day spent on a trip or a wall (Phase 16.6), recorded after it's over: that day's
  // number, and not stuck (the food was packed).
  function record(where: string, morning: Skills, away?: number) {
    run.days.push({
      day: away ?? s.day,
      cash: s.cash,
      grade: gradeOf(s.climber.skills),
      avg: average(s.climber.skills),
      energy: s.energy,
      skin: s.skin,
      fed: s.fed,
      psyche: s.psyche.level,
      goes: Object.values(s.routes).reduce((n, r) => n + r.goesToday, 0),
      workMin,
      hardest,
      where,
      climbMin,
      climbGain: Math.round(climbGain * 100) / 100,
      skills: morning,
      stuck: away === undefined && (s.fed < BODY.hungryBelow || headroom(s) < MONEY.vanSpot),
      taps,
    });
    taps = 0;
  }

  function day() {
    const morning = { ...s.climber.skills };
    workMin = 0;
    hardest = -1;
    climbMin = 0;
    climbGain = 0;
    travel('lot');
    if (s.fed < 70) eat();
    work();
    kit();
    groceries();
    physio();
    garage();
    // The crag when it's dry and there's something there to try; the gym otherwise.
    // Roadside first, the Gorge once it's open to you and there's nothing new at Roadside,
    // the gym when the rock's wet or done.
    // The Cove and the Mesa once they're open to you, their own weather and seasons deciding
    // (Phase 21.4).
    const open = conditions(s.seed, s.day).open;
    const grade = gradeOf(s.climber.skills);
    const opens = (id: string) => grade >= (PLACES[id]?.minGrade ?? 0) && vanReaches(id);
    // Phase 23.8: a climber who came up indoors goes to the gym first, crag or no crag.
    const indoorFirst = who.indoor && grade < CAVE_FROM && choose('gym') ? 'gym' : null;
    const place =
      indoorFirst ??
      (open && vanReaches('road') && choose('road')
        ? 'road'
        : open && opens('gorge') && choose('gorge')
          ? 'gorge'
          : opens('cove') && choose('cove')
            ? 'cove'
            : opens('mesa') && choose('mesa')
              ? 'mesa'
              : grade >= CAVE_FROM && choose('cave')
                ? 'cave'
                : choose('gym')
                  ? 'gym'
                  : null);
    // Nothing to climb isn't the same as nothing new to try: a hurt or spent climber still
    // has unsent lines out there, and only a day without any counts as the content running out.
    let where = place ? 'tired' : BOT_PLACES.some(fresh) ? 'resting' : 'nothing';
    if (place && s.min < 16 * 60 && s.energy >= 30 && s.skin >= 25) {
      travel(place);
      if (INDOOR[place]) tryAct(`${place}.pass`);
      // Phase 23.8: an ex-gymnast does a session before they climb.
      if (who.trains && INDOOR[place]) trainOnce();
      const t = s.min;
      session();
      climbMin += s.min - t;
      where = place;
    }
    travel('lot');
    if (s.fed < 60) eat();
    if (s.fed < 40) eat();
    // Scout: taken on when he picks you, fed when his bowl's low. No stick: bots are busy.
    tryAct('lot.adopt');
    if (s.dog && s.dog.fed < 40) tryAct('lot.kibble');
    // Broke (Phase 22.5a): cans by day, and the bins after dark if there's no food money.
    if (s.cash < HUSTLE.teach.cash) tryAct('lot.cans');
    if (!isNight(s.min)) tryAct('lot.rest');
    if (s.fed < HUSTLE.teach.fed && s.cash < -(ACTS['lot.cook']!.cost.cash ?? 0)) binRun();
    // The fire when the days have gone flat (Phase 22.4d), as a player would; every night,
    // for one who reads everything (Phase 17.7). And whoever's at the Lot with something due.
    maybePeople();
    if (s.psyche.level < BOT_FIRE || opts.social) tryAct('lot.sit');
    park();
    signUp(['cafe.shift']);
    record(where, morning);
    bed();
  }

  // ---- the career bot ----

  // Whether a place is somewhere this climber can go today: the grade for it, the trip paid
  // for, the gas and the permit there and back, dry and open, and time to climb once there.
  function reachable(place: string): boolean {
    if (!vanReaches(place)) return false;
    const p = PLACES[place]!;
    const grade = gradeOf(s.climber.skills);
    if (p.minGrade !== undefined && grade < p.minGrade) return false;
    if (p.unlock && !s.unlocked.includes(place)) return false;
    if (INDOOR[place]) return place !== 'cave' || grade >= CAVE_FROM;
    const there = place === s.at ? undefined : road(s.at, place);
    const back = road(place, 'lot');
    const gas = (there?.cash ?? 0) + (back?.cash ?? 0) + (p.permit ?? 0);
    if (headroom(s) < gas + MONEY.vanSpot) return false;
    if (s.min + (there?.min ?? 0) > LAST_START) return false;
    const c = conditionsAt(s.seed, s.day, place);
    return !c.closed && c.open;
  }

  // Who'd come along to a crag, if asked now: Hazel, when she's here and close enough.
  function askable(place: string): string | null {
    const need = PLACES[place]?.invite;
    if (need === undefined || INDOOR[place] || s.min >= BOND.inviteBefore || s.today.includes('invite'))
      return null;
    if (whereNow(s, 'hazel') !== s.at) return null;
    return (s.people.hazel?.bond ?? 0) >= need ? 'hazel' : null;
  }

  // The day's crag: the one whose line for you is hardest, a little less for every hour of
  // driving; with a partner asked along where that opens roped lines.
  function pickPlace(): { place: string; partner: string | null } | null {
    let best: { place: string; partner: string | null; score: number } | null = null;
    for (const place of CAREER_PLACES) {
      if (!reachable(place)) continue;
      const partner = askable(place);
      const r = choose(place, partner ?? undefined);
      if (!r) continue;
      const drive = place === s.at ? 0 : (road(s.at, place)?.min ?? 0);
      // Short of money, the gas counts too: a dollar is worth a few minutes of driving.
      const gas = (place === s.at ? 0 : (road(s.at, place)?.cash ?? 0)) + (PLACES[place]!.permit ?? 0);
      const broke = s.cash < CUSHION.career + saving();
      // Phase 16.6: the crag the story's asking for, if it has a line there to try.
      const story = storyPlace() === place ? STORY_PULL : 0;
      const score = r.grade - drive / 120 - (broke ? gas / 8 : 0) + story;
      if (!best || score > best.score) best = { place, partner, score };
    }
    return best;
  }

  // The crag you'd pick after a double shift and the drive, judged now while Hazel can be
  // asked: pretend it's six hours later.
  function pickAfterWork(): { place: string; partner: string | null } | null {
    const was = s;
    let best: { place: string; partner: string | null; score: number } | null = null;
    for (const place of CAREER_PLACES) {
      if (INDOOR[place]) continue;
      const partner = askable(place);
      if (!partner) continue;
      s = { ...was, min: was.min + 6 * 60 };
      const ok = reachable(place);
      const r = ok ? choose(place, partner) : null;
      s = was;
      if (!r || !roped(r)) continue;
      const score = r.grade;
      if (!best || score > best.score) best = { place, partner, score };
    }
    return best;
  }

  // Asks a partner out to a crag, through the talk a player would use.
  function invite(who: string, place: string): boolean {
    const talk = who === 'hazel' ? (s.at === 'lot' ? 'hazel-lot' : 'hazel-crag') : who;
    const node = talkStart(s, talk);
    const nodes = TALK[talk]?.nodes;
    if (!node || !nodes) return false;
    const ask = nodes[node]!.opts.findIndex(
      (o) => o.label === 'Come climbing?' && (!o.when || holds(s, o.when)),
    );
    if (ask < 0 || !go({ t: 'say', talk, node, opt: ask })) return false;
    const opt = nodes.invite!.opts.findIndex(
      (o) => o.label === PLACES[place]!.name && (!o.when || holds(s, o.when)),
    );
    return opt >= 0 && go({ t: 'say', talk, node: 'invite', opt });
  }

  // The next trip worth saving for: the cheapest haul the grade has opened.
  // Phase 16.6: the crag the story's current stage names, if it names one.
  function storyPlace(): string | null {
    const aim = currentGoal(s)?.aim;
    return aim && 'at' in aim ? aim.at : null;
  }

  // Phase 16.6: what the trip the story's asking for costs, once the grade and a partner
  // would let it go; else nothing to save for.
  function storyTripCost(): number {
    const aim = currentGoal(s)?.aim;
    if (!aim || !('summit' in aim)) return 0;
    const plan = defaultPlan(s, aim.summit);
    return plan && !planBlocked(s, aim.summit, plan) ? tripNeed(aim.summit, plan) : 0;
  }

  // A trip's price, and the week's bills that come while you're away: what to have before it.
  const tripNeed = (id: string, plan: TripPlan): number =>
    planCost(s, id, plan) + weeklyBills(s) * Math.ceil(EXPEDITIONS[id]!.days / 7);

  function saving(): number {
    if (strategy === 'career' && storyTripCost()) return storyTripCost();
    const grade = gradeOf(s.climber.skills);
    const next = CAREER_PLACES.map((id) => PLACES[id]!)
      .filter((p) => p.unlock && (p.minGrade ?? 0) <= grade)
      .filter((p) => !s.unlocked.includes(Object.keys(PLACES).find((k) => PLACES[k] === p)!))
      .map((p) => p.unlock!)
      .sort((a, b) => a - b)[0];
    return next ?? 0;
  }

  // Buys a trip the grade has opened, once the cash is there.
  function buyTrips() {
    const grade = gradeOf(s.climber.skills);
    for (const id of CAREER_PLACES) {
      const p = PLACES[id]!;
      if (!p.unlock || s.unlocked.includes(id) || (p.minGrade ?? 0) > grade) continue;
      if (s.cash >= p.unlock + CUSHION.career) go({ t: 'unlock', place: id });
    }
  }

  // A shift at the best-paying job this climber can work, an hour for an hour.
  function shift(short: number) {
    const rate = (id: string) => {
      const a = ACTS[id]!;
      const c = actCost(s, a);
      const trip = road(s.at, id.split('.')[0]!)?.min ?? 0;
      return shiftPay(id) / ((c.min ?? 60) + 2 * trip);
    };
    const jobs = JOB_ACTS.filter((id) => !unmet({ ...s, at: id.split('.')[0]! }, ACTS[id]!.needs)).sort(
      (a, b) => rate(b) - rate(a),
    );
    // A shift signed up for comes first, whatever pays better today.
    const id = booked() ?? jobs[0];
    if (!id) return;
    travel(id.split('.')[0]!);
    const t = s.min;
    // Short by more than a shift pays, and the café will take a double.
    if (!(id === 'cafe.shift' && short > (actCost(s, ACTS[id]!).cash ?? 0) && tryAct('cafe.double')))
      tryAct(id);
    workMin += s.min - t;
  }

  // Phase 16.6: what the story asks next, when it's an expedition or a wall: the career bot
  // takes it on once it can (the grade, the money past its cushion, a partner, a rope).
  // Every day it takes goes in the run, as a player's would.
  // A week between tries, so a wall that's beaten it or a trip it bailed on isn't every day.
  let nextTrip = 0;
  function storyTrip(morning: Skills): boolean {
    const aim = currentGoal(s)?.aim;
    if (!aim || s.injury || s.booked || s.expedition || s.day < nextTrip) return false;
    const from = s.day;
    const did = 'summit' in aim ? expedition(aim.summit) : 'wall' in aim ? wall(aim.wall) : false;
    if (!did) return false;
    nextTrip = s.day + 7;
    // Whatever was waiting at the bottom or at home (a call, an echo, a knock): answered.
    while (s.encounter) if (!go({ t: 'answer', opt: answer() })) break;
    for (let d = from; d < s.day; d++) record('away', morning, d);
    return true;
  }

  function expedition(id: string): boolean {
    const plan = defaultPlan(s, id);
    if (!plan || planBlocked(s, id, plan) || s.cash < tripNeed(id, plan) + CUSHION.career) return false;
    if (!go({ t: 'exped', id, do: 'book', plan })) return false;
    if (!go({ t: 'exped', id, do: 'go' })) return false;
    // The loop finds the day's leading is over by a go turned down; the bot asks quietly.
    const quiet = (a: Action) => (a.t === 'go' && act(s, a).events[0]?.k === 'refused' ? false : go(a));
    expedLoop(
      () => s,
      quiet,
      () => hands(),
    );
    return true;
  }

  // A wall at its hardest pitch's grade: rack up, climb the pitches in their turn,
  // a bivy when the light goes, and off it if a day goes by with nothing gained.
  function wall(id: string): boolean {
    const w = WALLS[id]!;
    if (gradeOf(s.climber.skills) < w.grade || !reachable(w.place)) return false;
    // A wall day earns nothing: not with the cushion gone.
    if (s.cash < CUSHION.career) return false;
    if (!s.gear.rope && s.mode !== 'solo') {
      const price = actCost(s, ACTS['shop.rope']!).cash ?? 0;
      if (s.cash < -price + CUSHION.career) return false;
      travel('shop');
      if (!tryAct('shop.rope')) return false;
    }
    // Somebody to belay: Hazel, asked along at the Lot in the morning.
    const mate = s.mode === 'solo' ? null : askable(w.place);
    if (s.mode !== 'solo' && (!mate || !invite(mate, w.place))) return false;
    if (!travel(w.place) || !go({ t: 'wall', wall: id, do: 'start' })) return false;
    // The pitch it was on at the last bivy: a day that ends where the last one did is a
    // wall that's beaten it, this time.
    let last = -1;
    for (let guard = 0; s.wall && guard < 400; guard++) {
      const at = s.wall.next;
      const r = routeOfId(s, w.pitches[at]!)!;
      const why = goBlocked(s, r);
      const spent = s.energy < 30 || s.skin < 20 || isNight(s.min) || /empty|skin|dark/i.test(why ?? '');
      if (!why && !spent) {
        go({ t: 'go', route: r.id });
        go({ t: 'done', route: r.id, result: playGo(s, r, hands()) });
        if (s.wall?.next === at) go({ t: 'rest', route: r.id });
        continue;
      }
      // Wet rock or a body that says no: off it, and back another day. At the bottom, or a
      // day gone with nothing gained: the same.
      if (!spent || at === 0 || at === last) {
        go({ t: 'wall', wall: id, do: 'retreat' });
        break;
      }
      last = at;
      while (!isNight(s.min) && go({ t: 'rest', route: r.id }));
      if (!go({ t: 'wall', wall: id, do: 'bivy' })) {
        go({ t: 'wall', wall: id, do: 'retreat' });
        break;
      }
    }
    if (s.wall) go({ t: 'wall', wall: id, do: 'retreat' });
    // Down by the van, the day's night as anyone's.
    travel('lot');
    bed();
    return true;
  }

  function careerDay() {
    const morning = { ...s.climber.skills };
    workMin = 0;
    hardest = -1;
    climbMin = 0;
    climbGain = 0;
    travel('lot');
    // Anything that turned up overnight or on the way home, answered before the day starts.
    while (s.encounter) if (!go({ t: 'answer', opt: answer() })) break;
    if (storyTrip(morning)) return;
    if (s.fed < 70) eat();
    buyTrips();
    kit();
    groceries();
    physio();
    garage();
    // Money first: the cushion, the week's bills, and the next trip if there's one to save
    // for. A working morning, then a crag near enough to reach after it.
    // A trip's saved for with a night's costs over, so it's still there in the morning.
    const trip = saving();
    const want = CUSHION.career + (billsSoon() ? weeklyBills(s) : 0) + (trip ? trip + 50 : 0) + repairs();
    const pick = pickPlace();
    // A working day: ask Hazel along first, to the crag you'll reach after the shift, so
    // she's there with the rope when you are.
    if (s.cash < want || !pick || booked()) {
      const after = pickAfterWork();
      if (after?.partner) invite(after.partner, after.place);
      shift(want - s.cash);
    }
    const then = pickPlace();
    let where = then ? 'tired' : CAREER_PLACES.some(fresh) ? 'resting' : 'nothing';
    if (then && s.energy >= 30 && s.skin >= 25) {
      if (then.partner) invite(then.partner, then.place);
      travel(then.place);
      if (INDOOR[then.place]) tryAct(`${then.place}.pass`);
      // No pass to be had (the money's gone on a trip being saved for): no session.
      const inside = INDOOR[then.place];
      if (!inside || s.today.includes(inside.pass)) {
        const t = s.min;
        session();
        climbMin += s.min - t;
        where = then.place;
      }
    }
    travel('lot');
    if (s.fed < 60) eat();
    if (s.fed < 40) eat();
    tryAct('lot.adopt');
    if (s.dog && s.dog.fed < 40) tryAct('lot.kibble');
    // Broke (Phase 22.5a): cans by day, and the bins after dark if there's no food money.
    if (s.cash < HUSTLE.teach.cash) tryAct('lot.cans');
    if (!isNight(s.min)) tryAct('lot.rest');
    if (s.fed < HUSTLE.teach.fed && s.cash < -(ACTS['lot.cook']!.cost.cash ?? 0)) binRun();
    // The fire when the days have gone flat (Phase 22.4d), as a player would; every night,
    // for one who reads everything (Phase 17.7). And whoever's at the Lot with something due.
    maybePeople();
    if (s.psyche.level < BOT_FIRE || opts.social) tryAct('lot.sit');
    const next = saving();
    park();
    signUp(JOB_ACTS, next ? next + 50 : 0);
    record(where, morning);
    bed();
  }

  go({ t: 'create', name: 'Bot', start: opts.start ?? 'allrounder', origin: opts.origin });
  if (opts.calling) go({ t: 'calling', id: opts.calling });
  const end = s.day + (opts.days ?? 7);
  // A climber who's hung it up (Phase 16.1) has no more days to play.
  for (let guard = 0; s.day < end && !s.life.retired; guard++) {
    if (guard > (opts.days ?? 7) * 2)
      throw new Error(`the bot is stuck on day ${s.day}: ${run.refused.slice(-3).join(' | ')}`);
    if (strategy === 'career') careerDay();
    else day();
  }
  run.state = s;
  return run;
}
