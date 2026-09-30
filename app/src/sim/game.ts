// The one door into a game's state: act(state, action) -> { state, events }. The clock,
// money and body only move here, and only because of an action. Nothing ticks while you
// stand still. The UI stages the events; it never edits the state itself.

import { cold, daysOff, freshLoad, goLoad, projected, ratio, rollInjury } from './body';
import { CARRIED, carried, gains, gradeOf, STARTS, type GoSummary } from './climber';
import { headroom, holds, isNight, leadOver, unmet } from './cond';
import { dexHurt, dexSeason, gradeOfPerson } from './curves';
import { indoor, INDOOR, INDOOR_CLOSE, routeById, routesAt } from './content/gym';
import {
  CLINIC_LINE,
  FIRST_FREE_LINE,
  HEALED_LINE,
  HURT_LINE,
  TRAIN_HURT_LINE,
  DECK_LINE,
  DECK_WALKED,
  LANDING_LINE,
  LANDING_NAME,
} from './content/injuries';
import { ACTS, PLACES, road, TEXT_VALUES, type ActDef } from './content/places';
import { DOG_LINES, DOG_OFFER } from './content/dog';
import { PEOPLE, RACE_ROUTE, RIVAL_FA_NAMES, TALK } from './content/people';
import { ACT_I_END } from './content/story';
import { START_KIT } from './content/gear';
import { has, tapedSkin, wearKit } from './kit';
import {
  prehabBlocked,
  prehabCost,
  protocolOf,
  sessionCost,
  sessionGains,
  sessionLoad,
  trainBlocked,
} from './sessions';
import { JOBS } from './content/jobs';
import { raiseAt, rankAt, rankName, shiftsAt } from './jobs';
import { freshTraining, PHASE_NAME, phaseLock, taperDay, taperWait } from './training';
import {
  ROUTES,
  SEND_NAME,
  WALLS,
  effGrade,
  gradeLabel,
  gradeName,
  roped,
  type RouteDef,
} from './content/routes';
import {
  BODY,
  CLIMB,
  CROWD,
  FREESOLO,
  SPEED,
  DAY,
  DOG,
  EXPED,
  HIGHBALL,
  INJURY,
  LOAD,
  MONEY,
  RIVAL,
  TRAD,
  TRAIN,
  WALL,
} from './dials';
import { EXPEDITIONS } from './content/expeditions';
import { pitchOdds, pitchRoll, stormOn, wallPay } from './expeditions';
import { canAsk, queueMin, sprayable, sprayedOn } from './crowds';
import { soloed } from './solo';
import { speedBlocked, speedGains, speedLoad, speedTime, runsToday } from './speed';
import { fill, money, skillsNote } from './format';
import { PARTNERS, tierOf, whereNow } from './presence';
import { hashSeed, Rng } from './rng';
import { aimMet, currentGoal } from './story';
import type {
  PhaseId,
  Action,
  Delta,
  GameEvent,
  GameState,
  Injury,
  Result,
  RouteLog,
  GoStyle,
  SendStyle,
  Skills,
} from './types';
import { conditionsAt, seasonOf, sunOn } from './weather';

// The message log keeps this many lines; older ones fall off the front.
export const LOG_MAX = 200;
export const NAME_MAX = 16;

export function newGame(seed: string): GameState {
  return {
    seed,
    day: 1,
    min: DAY.firstMin,
    cash: MONEY.start,
    energy: BODY.startEnergy,
    skin: BODY.startSkin,
    fed: BODY.startFed,
    at: 'lot',
    x: null,
    today: [],
    climber: { name: '', start: 'allrounder', skills: { ...STARTS.allrounder!.skills } },
    load: freshLoad(),
    injury: null,
    hurt: 0,
    routes: {},
    firsts: {},
    people: {},
    race: null,
    trips: 0,
    dog: null,
    goals: 0,
    unlocked: [],
    gear: { ...START_KIT },
    training: freshTraining(1),
    jobs: {},
    wall: null,
    expedition: null,
    speed: { pb: null, runs: 0, day: 0 },
    mode: 'rope',
    soloing: null,
    dead: null,
    log: [],
  };
}

export function emptyLog(): RouteLog {
  return {
    known: [],
    told: [],
    pick: {},
    falls: {},
    goes: 0,
    goesToday: 0,
    hi: 0,
    sent: null,
    sentToday: false,
  };
}

// The state is plain JSON by design; a JSON round trip is the cheapest faithful copy and
// fails loudly if anything non-JSON sneaks in.
const clone = (s: GameState): GameState => JSON.parse(JSON.stringify(s)) as GameState;
const clamp100 = (v: number) => Math.max(0, Math.min(100, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

// A session's injury roll is numbered apart from the day's goes, so the two never share one.
const TRAIN_ROLL = 1000;

// Said when you change phase.
const PHASE_LINE: Record<PhaseId, string> = {
  base: 'Back to base. Mileage, and nothing silly.',
  build: 'Building. More from every session, and your body keeps the receipts.',
  peak: `Peaking. ${TRAIN.peakDays} days to cash it in, then you pay for it.`,
  deload: 'Deloading. Half the training, and the tired starts to lift.',
};

function logOf(s: GameState, route: string): RouteLog {
  return (s.routes[route] ??= emptyLog());
}

export const routeOfId = (s: GameState, id: string): RouteDef | undefined => routeById(s.seed, id);

// ---- queries the UI shares with the rules, so a button never offers what act() refuses ----

// What a go costs you. Given your state, tape on a crack takes its share off the skin.
export function goCost(r: RouteDef, s?: GameState): Required<Pick<Delta, 'min' | 'energy' | 'fed' | 'skin'>> {
  const kind = indoor(r.place) ? 'gym' : r.disc;
  const c = r.wall ? WALL.pitch : CLIMB.go[kind];
  const bare = CLIMB.skin[r.type] * (indoor(r.place) ? 1 : CLIMB.rockSkin);
  const skin = Math.round(s ? tapedSkin(s, r, bare) : bare);
  // A busy crag's queue comes first.
  return { min: c.min + (s ? queueMin(s, r) : 0), energy: -c.energy, fed: -c.fed, skin: -skin };
}

export const restCost = (r: RouteDef): number => CLIMB.restMin[r.disc];

// What an act costs you now. One that runs till a time of day costs its hourly rate for
// every hour it takes.
export function actCost(s: GameState, d: ActDef): Delta {
  // A shift pays its rank's raise on top.
  if (d.job) return { ...d.cost, cash: (d.cost.cash ?? 0) + raiseAt(s, d.job.id) * d.job.shifts };
  if (d.until === undefined) return d.cost;
  const min = Math.max(0, d.until - s.min);
  const out: Delta = { min };
  for (const k of ['cash', 'energy', 'skin', 'fed'] as const)
    if (d.cost[k]) out[k] = Math.round((d.cost[k] * min) / 60);
  return out;
}

// Who'd belay you on a rope here, now.
export function belayer(s: GameState): string | null {
  for (const who of PARTNERS) if (whereNow(s, who) === s.at) return who;
  return null;
}

// ---- highballs [proposed] ----

// Whether the pads you own are more than the one every boulderer has: the Moonstone haul's,
// or one you bought.
export const morePads = (s: GameState): boolean => has(s, 'pad') || s.unlocked.some((id) => PLACES[id]?.pads);

// How far you'd fall from `moves` up a boulder, in feet.
export const fallFt = (r: RouteDef, moves: number): number =>
  r.heightFt * Math.min(1, Math.max(0, moves) / (r.moves || 1));

// The chance a fall from `moves` up a highball lands you badly: nothing up to the safe
// height, then more with every foot, less with the haul's pads and a partner spotting.
export function landingChance(s: GameState, r: RouteDef, moves: number): number {
  if (!r.highball) return 0;
  const over = fallFt(r, moves) - HIGHBALL.safeFt;
  if (over <= 0) return 0;
  return HIGHBALL.perFoot * over * (morePads(s) ? HIGHBALL.pads : 1) * (belayer(s) ? HIGHBALL.spotter : 1);
}

// Rolls a fall's landing. `n` numbers the go within the day, as the injury roll does, on its
// own label so the two never share a draw.
export function rollLanding(s: GameState, r: RouteDef, moves: number, n: number): Injury | null {
  const p = landingChance(s, r, moves);
  if (p <= 0) return null;
  const rng = Rng.fromStream(s.seed, 'session').derive(`landing-${s.day}-${n}`);
  if (rng.next() >= p) return null;
  const over = fallFt(r, moves) - HIGHBALL.safeFt;
  const tier: 1 | 2 | 3 = over >= HIGHBALL.tier3 ? 3 : over >= HIGHBALL.tier2 ? 2 : 1;
  const [lo, hi] = INJURY.days[tier - 1]!;
  return { kind: LANDING_NAME[tier - 1]!, tier, until: s.day + 1 + rng.int(lo, hi) };
}

// ---- decking off trad [proposed] ----

// The chance a ground fall of `ft` hurts you: nothing up to the safe height, then more with
// every foot. No pad, no spotter: you're on a rope, it just didn't help.
export function deckChance(ft: number): number {
  const over = ft - TRAD.deck.safeFt;
  return over <= 0 ? 0 : Math.min(1, TRAD.deck.perFoot * over);
}

// Rolls a deck, on the landing's label: a line is trad or a highball, never both.
export function rollDeck(s: GameState, ft: number, n: number): Injury | null {
  const p = deckChance(ft);
  if (p <= 0) return null;
  const rng = Rng.fromStream(s.seed, 'session').derive(`landing-${s.day}-${n}`);
  if (rng.next() >= p) return null;
  const over = ft - TRAD.deck.safeFt;
  const tier: 1 | 2 | 3 = over >= TRAD.deck.tier3 ? 3 : over >= TRAD.deck.tier2 ? 2 : 1;
  const [lo, hi] = INJURY.days[tier - 1]!;
  return { kind: LANDING_NAME[tier - 1]!, tier, until: s.day + 1 + rng.int(lo, hi) };
}

// A pick from a list that holds for the day: the same line if you ask twice.
const ofDay = <T>(s: GameState, key: string, xs: readonly T[]): T =>
  xs[hashSeed(`${s.seed}:${key}:${s.day}`) % xs.length]!;

// Your dog's tier: new pup, good buddy, best friend.
export const dogTier = (bond: number): number => DOG.tiers.filter((t) => bond >= t).length - 1;

// What Scout's up to, where you are.
export function dogLine(s: GameState, where: 'crag' | 'drive'): string | null {
  if (!s.dog) return null;
  const L = DOG_LINES[where];
  const pool = s.dog.fed < DOG.hungryBelow ? L.hungry : L.tiers[dogTier(s.dog.bond)]!;
  return ofDay(s, `dog-${where}`, pool);
}

// v0.956's bond tiers, by name.
export const TIER_NAME = ['Stranger', 'Acquaintance', 'Regular', 'Partner', 'Ride-or-Die'];
const TIER_LINE = [
  '',
  '{who} knows your name now.',
  'You and {who} are regulars.',
  'You and {who} are partners now: you climb, you belay, nobody keeps score.',
  '{who} is ride-or-die.',
];

// Whether you can read a line yet: a myth stays unreadable until you've sent the one under it.
export const revealed = (s: GameState, r: RouteDef): boolean =>
  !r.hiddenUntil || !!s.routes[r.hiddenUntil]?.sent;

export function goBlocked(s: GameState, r: RouteDef): string | null {
  if (!revealed(s, r))
    return `You can't read this line yet. Send ${routeOfId(s, r.hiddenUntil!)?.name ?? 'the hardest line here'} first`;
  const inside = INDOOR[r.place];
  if (inside) {
    if (s.min >= INDOOR_CLOSE) return `${inside.name} is closed`;
    if (!s.today.includes(inside.pass)) return 'Buy a day pass at the desk first';
  } else {
    const c = conditionsAt(s.seed, s.day, r.place);
    if (c.closed) return c.closed;
    if (!c.open) return 'The rock is soaked';
    if (s.min >= CLIMB.darkFrom) return 'Too dark to climb';
    if (r.disc === 'trad' && !has(s, 'rack')) return 'You need a rack to lead this. The gear shop sells them';
    if (r.wall) {
      const w = WALLS[r.wall]!;
      if (s.wall?.id !== r.wall) return `Start up ${w.name} first`;
      const next = w.pitches[s.wall.next];
      if (next !== r.id) return `Pitch ${s.wall.next + 1} is next: ${ROUTES[next!]?.name ?? 'the next one'}`;
    }
    if (roped(r) && !soloed(s, r) && !belayer(s)) return 'Nobody here to belay you';
  }
  const off = daysOff(s);
  if (off > 0) return `Your ${s.injury!.kind} needs ${off} more day${off > 1 ? 's' : ''}`;
  if (ratio(s.load) > LOAD.fried) return "You're fried. Your body wants a rest day";
  if (s.fed <= 0) return "You're running on empty";
  if (s.energy < CLIMB.minEnergy) return 'Too tired to try';
  if (s.skin < CLIMB.minSkin) return 'Your skin is done for today';
  return null;
}

export function knowsBeta(s: GameState, route: string, crux: string, beta: string): boolean {
  const c = routeOfId(s, route)?.cruxes.find((x) => x.id === crux);
  if (!c || !c.beta.includes(beta)) return false;
  return c.beta[0] === beta || !!s.routes[route]?.known.includes(beta);
}

// The numbers a conversation's words can use: goes today, your name and grade, and the
// days left in a race.
export function talkValues(s: GameState): Record<string, string | number> {
  return {
    goes: goesToday(s),
    name: s.climber.name,
    grade: gradeOf(s.climber.skills),
    left: s.race ? Math.max(0, s.race.until - s.day + 1) : 0,
  };
}

export function talkStart(s: GameState, talk: string): string | null {
  return TALK[talk]?.start.find((e) => !e.when || holds(s, e.when))?.node ?? null;
}

export function goesToday(s: GameState): number {
  return Object.values(s.routes).reduce((n, r) => n + r.goesToday, 0);
}

interface Lesson {
  r: RouteDef;
  crux: string;
  beta: string;
}

// What someone could show you here: on the line you've been working (most goes) first,
// then the easiest one you haven't sent.
export function lessonAt(s: GameState): Lesson | null {
  const open: Lesson[] = [];
  for (const r of routesAt(s.seed, s.at, s.day)) {
    const c = r.cruxes.find((x) => x.beta.slice(1).some((b) => !s.routes[r.id]?.known.includes(b)));
    const b = c?.beta.slice(1).find((x) => !s.routes[r.id]?.known.includes(x));
    if (c && b) open.push({ r, crux: c.id, beta: b });
  }
  const goes = (l: Lesson) => s.routes[l.r.id]?.goes ?? 0;
  const sent = (l: Lesson) => (s.routes[l.r.id]?.sent ? 1 : 0);
  open.sort((a, b) => goes(b) - goes(a) || sent(a) - sent(b) || a.r.grade - b.r.grade);
  return open[0] ?? null;
}

export function act(s0: GameState, a: Action): Result {
  const s = clone(s0);
  const events: GameEvent[] = [];
  const refuse = (why: string): Result => ({ state: s0, events: [{ k: 'refused', why }] });
  const note = (text: string) => {
    s.log.push({ day: s.day, min: s.min, text });
    if (s.log.length > LOG_MAX) s.log.splice(0, s.log.length - LOG_MAX);
  };
  const line = (text: string) => {
    events.push({ k: 'line', text });
    note(text);
  };
  const spend = (d: Delta) => {
    const was = s.cash;
    s.min += d.min ?? 0;
    s.cash += d.cash ?? 0;
    s.energy = clamp100(s.energy + (d.energy ?? 0));
    s.skin = clamp100(s.skin + (d.skin ?? 0));
    s.fed = clamp100(s.fed + (d.fed ?? 0));
    if (was >= 0 && s.cash < 0) line(`You're $${-s.cash} in the hole. It goes on the card.`);
  };
  const train = (t: Partial<Skills>) => {
    for (const [k, v] of Object.entries(t) as [keyof Skills, number][])
      s.climber.skills[k] = round2(s.climber.skills[k] + v);
  };
  // An injury lands: the line, the clinic's bill (the first one's waived), the count.
  const injure = (hurt: Injury, text: string) => {
    s.injury = hurt;
    const days = hurt.until - s.day - 1;
    events.push({ k: 'injured', kind: hurt.kind, tier: hurt.tier, days, text });
    note(text);
    const bill = s.hurt === 0 ? 0 : INJURY.clinic[hurt.tier - 1]!;
    if (hurt.tier > 1) line(bill ? fill(CLINIC_LINE, { cost: money(bill) }) : FIRST_FREE_LINE);
    if (bill) spend({ cash: -bill });
    s.hurt += 1;
  };
  // A night: in the van at the Lot, on a ledge halfway up a wall, or away on an expedition
  // (where the food's paid for, the van waits, and friends feed the dog).
  const sleep = (where: 'van' | 'ledge' | 'away' = 'van') => {
    const ended = s.day;

    const hungry = where !== 'away' && s.fed < BODY.hungryBelow;
    const rough = where === 'van' && headroom(s) < MONEY.vanSpot;
    if (where === 'van' && !rough) s.cash -= MONEY.vanSpot;
    s.day += 1;
    s.min = DAY.wakeMin;
    const rest =
      where === 'ledge'
        ? WALL.bivy.energy
        : (rough ? BODY.roughEnergy : BODY.sleepEnergy) - (hungry ? BODY.hungryNight : 0);
    s.energy = clamp100(s.energy + rest);
    s.skin = clamp100(s.skin + BODY.sleepSkin);
    if (where !== 'away') s.fed = clamp100(s.fed - (where === 'ledge' ? WALL.bivy.fed : BODY.nightFed));
    // The day's load folds into the averages; a deload sheds some of the acute.
    const p = projected(s.load);
    const shed = s.training.phase === 'deload' ? TRAIN.phases.deload.acute : 1;
    s.load = { acute: round2(p.acute * shed), chronic: round2(p.chronic), today: 0 };
    // Peak runs its course, then you back off whether you meant to or not.
    if (s.training.phase === 'peak' && s.day - s.training.since >= TRAIN.peakDays) {
      s.training.phase = 'deload';
      s.training.since = s.day;
      line(`${TRAIN.peakDays} days at peak is all you get. Your body calls a deload, and it isn’t asking.`);
    }
    s.today = [];
    for (const r of Object.values(s.routes)) {
      r.goesToday = 0;
      r.sentToday = false;
    }
    if (where !== 'ledge') {
      s.at = 'lot';
      s.x = null;
    }
    if (where === 'ledge')
      line('A night on a ledge, clipped in, the valley lit up a long way down. You sleep some.');
    else if (where === 'away') {
      // Nothing to say: the expedition's day says it.
    } else if (rough) line("The card won't take the van spot. You sleep in the pullout. It's cold.");
    else
      line(
        s.cash < 0
          ? `Van spot, ${TEXT_VALUES.spot}. You're $${-s.cash} in the hole.`
          : `Van spot, ${TEXT_VALUES.spot}. Morning comes anyway.`,
      );
    if (hungry) line('You went to bed hungry, and it shows.');
    if (s.dog && where !== 'away') {
      s.dog.fed = Math.max(0, s.dog.fed - DOG.nightFed);
      if (s.dog.fed < DOG.hungryBelow)
        line("Scout's bowl is empty. He's been decent about it, which is worse.");
    }
    if (s.injury && s.day >= s.injury.until) {
      line(fill(HEALED_LINE, { kind: s.injury.kind }));
      s.injury = null;
    }
    if (ended % 7 === 0) {
      const bills = MONEY.registration + MONEY.insurance;
      s.cash -= bills;
      line(`Registration and insurance: $${bills}. The week's bills don't care about your card.`);
    }
    rivalNight(ended);
  };
  // A pitch of a wall done: on to the next, or the summit. It pays once, the first time.
  const wallPitch = (id: string, lap: boolean) => {
    const w = WALLS[id]!;
    s.wall = { id, next: s.wall!.next + 1 };
    if (s.wall.next < w.pitches.length) {
      line(`Pitch ${s.wall.next} done. ${w.pitches.length - s.wall.next} to go.`);
      return;
    }
    s.wall = null;
    const pay = wallPay(w);
    if (lap) line(`${w.name} again, all of it. The top's no smaller the second time.`);
    else {
      spend({ cash: pay });
      line(
        `The summit of ${w.name}, ${w.pitches.length} pitches. A magazine pays ${money(pay)} for the photos.`,
      );
    }
  };
  // A day of an expedition gone: home at the summit or when time runs out.
  const expedDay = () => {
    const x = s.expedition!;
    const e = EXPEDITIONS[x.id]!;
    if (x.pitch >= e.pitches) {
      s.expedition = null;
      spend({ cash: e.pays });
      train({ head: EXPED.head });
      line(
        `${e.name}: the summit of ${e.objective}, on day ${x.day}. The sponsors pay ${money(e.pays)}, and you'll be telling this one for years. ${skillsNote({ head: EXPED.head })}.`,
      );
      sleep('away');
      return;
    }
    if (x.day >= e.days) {
      s.expedition = null;
      line(
        `${e.name}: out of time, ${x.pitch} of ${e.pitches} pitches fixed. You fly home with a story and nothing else.`,
      );
      sleep('away');
      return;
    }
    x.day += 1;
    x.energy = Math.min(EXPED.energy, x.energy + EXPED.night);
    sleep('away');
  };
  // Overnight news about the people you know: Dex's race, his season, and who's climbing
  // harder than whom.
  const rivalNight = (ended: number) => {
    const dex = s.people.dex;
    const race = s.race;
    if (race && ended >= race.until) {
      s.race = null;
      const r = routeOfId(s, race.route);
      if (r && !s.routes[race.route]?.sent && !s.firsts[race.route]) {
        const name = RIVAL_FA_NAMES[hashSeed(`${s.seed}:${race.route}`) % RIVAL_FA_NAMES.length]!;
        s.firsts[race.route] = { name, call: 0, day: ended, by: 'dex' };
        line(
          `Dex opened the line at ${PLACES[r.place]?.name ?? 'the crag'}. He calls it "${name}" (${gradeLabel(r)}). That first ascent was there for you. It carries his name now, and it always will.`,
        );
      }
    }
    // He moves on the line once you're climbing well enough to take it from him.
    const open = routeOfId(s, RACE_ROUTE);
    const ready = gradeOf(s.climber.skills) >= RIVAL.raceGrade;
    if (!s.race && dex && open && ready && !s.firsts[RACE_ROUTE] && !s.routes[RACE_ROUTE]?.sent) {
      s.race = { route: RACE_ROUTE, until: ended + RIVAL.raceDays };
      line(
        `Word is Dex is eyeing an unclaimed line at ${PLACES[open.place]?.name ?? 'the crag'} (${gradeLabel(open)}): get the first ascent before he does, or it's his forever. ${RIVAL.raceDays} days.`,
      );
    }
    if (dex) {
      if (dexHurt(s.seed, s.day) && !dexHurt(s.seed, ended)) {
        const d = dexSeason(s.seed);
        const weeks = Math.round((d.hurtTo - d.hurtFrom) / 7);
        line(
          `Word from the gym: Dex blew a pulley. Out for ${weeks} weeks, they're saying. The benchmark just stopped moving.`,
        );
      } else if (!dexHurt(s.seed, s.day) && dexHurt(s.seed, ended))
        line('Dex is quietly back on the wall, picking up right where he left off.');
    }
    // Who's ahead, reckoned overnight. You pass Sage once; Dex, as often as it happens.
    for (const who of ['sage', 'dex']) {
      const p = s.people[who];
      if (!p) continue;
      const ahead = leadOver(s, who) > 0;
      if (who === 'sage' && ahead && p.ahead === false)
        line(
          'You climb harder than Sage now. She noticed before you did, and she is completely fine about it, which somehow makes it worse.',
        );
      if (who === 'dex' && p.ahead !== undefined && ahead !== p.ahead)
        line(
          ahead
            ? "You've passed Dex. Don't get comfortable."
            : `Dex pulled back ahead of you, climbing V${gradeOfPerson(s.seed, 'dex', s.day)} now.`,
        );
      p.ahead = ahead;
    }
  };
  const runAct = (id: string): string | null => {
    const d = ACTS[id];
    if (!d) return 'Nothing to do there.';
    if (id.split('.')[0] !== s.at) return "You're not there.";
    const why = unmet(s, d.needs);
    if (why) return why;
    if (d.sleep) {
      sleep();
      return null;
    }
    const cost = actCost(s, d);
    spend(cost);
    for (const f of d.sets ?? []) if (!s.today.includes(f)) s.today.push(f);
    if (d.trains) train(d.trains);
    if (d.dog?.adopt) s.dog = { name: 'Scout', since: s.day, fed: 60, bond: 0 };
    if (s.dog && d.dog?.fill) s.dog.fed = 100;
    if (s.dog && d.dog?.bond) s.dog.bond = Math.min(100, s.dog.bond + d.dog.bond);
    if (d.gear) s.gear[d.gear.id] = d.gear.set ?? (s.gear[d.gear.id] ?? 0) + (d.gear.add ?? 0);
    if (d.says) line(d.job ? `${d.says} +${money(cost.cash ?? 0)}.` : d.says);
    if (d.saysOneOf) line(ofDay(s, id, d.saysOneOf));
    if (d.job) {
      const was = rankAt(s, d.job.id);
      s.jobs[d.job.id] = shiftsAt(s, d.job.id) + d.job.shifts;
      const now = rankAt(s, d.job.id);
      if (now > was)
        line(
          `Promoted: ${rankName(s, d.job.id)}. That's +${money(raiseAt(s, d.job.id) - JOBS[d.job.id]!.raise * was)} a shift.`,
        );
    }
    return null;
  };
  const meet = (who: string) => (s.people[who] ??= { bond: 0, last: 0, since: s.day });
  // Bond, and the line when it takes you up a tier.
  const bond = (who: string, to: number) => {
    const p = meet(who);
    const was = tierOf(p.bond);
    p.bond = Math.max(0, to);
    const tier = tierOf(p.bond);
    if (tier > was) line(fill(TIER_LINE[tier]!, { who: PEOPLE[who]?.name ?? who }));
  };
  // A day climbing together, watching or belaying, counts once toward the bond.
  const climbedWith = (who: string) => {
    const p = meet(who);
    if (p.last === s.day) return;
    p.last = s.day;
    bond(who, p.bond + 1);
  };
  const learn = (route: string, beta: string, how: 'fall' | 'told' | 'watched', text: string) => {
    const L = logOf(s, route);
    if (L.known.includes(beta)) return;
    L.known.push(beta);
    if (how !== 'fall') L.told.push(beta);
    events.push({ k: 'learned', route, beta, how, text });
    if (text) note(text);
  };
  const watch = (who: string) => {
    const name = PEOPLE[who]?.name ?? who;
    const lesson = lessonAt(s);
    if (!lesson) {
      line(`${name} shrugs. "You know everything I'd tell you here."`);
      return;
    }
    const { r, crux, beta } = lesson;
    const c = r.cruxes.find((x) => x.id === crux)!;
    const b = r.beta[beta]!;
    spend({ min: 20 });
    learn(
      r.id,
      beta,
      'watched',
      `${name} climbs ${r.name}. At ${c.name.replace(/^The /, 'the ')}: ${b.short}. New beta: ${b.name.toLowerCase()}.`,
    );
    events.push({ k: 'line', text: `New beta on ${r.name}: ${b.name.toLowerCase()}.` });
    climbedWith(who);
    if (!s.today.includes(who)) s.today.push(who);
  };

  // A Free Solo run that ended: nothing more happens to this climber.
  if (s.dead) return refuse('That climber is gone.');

  // Away on an expedition: the valley waits. Only the expedition's own day goes on.
  if (s.expedition && a.t !== 'exped' && a.t !== 'stand' && a.t !== 'pick')
    return refuse(`You're on ${EXPEDITIONS[s.expedition.id]!.name}.`);

  switch (a.t) {
    case 'wall': {
      const w = WALLS[a.wall];
      if (!w) return refuse('No such wall.');
      if (a.do === 'start') {
        if (s.at !== w.place) return refuse(`${w.name} is at ${PLACES[w.place]!.name}.`);
        if (s.wall) return refuse(`You're on ${WALLS[s.wall.id]!.name}.`);
        if (!has(s, 'rope') && s.mode !== 'solo')
          return refuse('Walls need a rope of your own. The gear shop sells them.');
        const c = conditionsAt(s.seed, s.day, w.place);
        if (c.closed) return refuse(`${c.closed}.`);
        if (!c.open) return refuse('The rock is soaked.');
        s.wall = { id: a.wall, next: 0 };
        line(`You rack up at the foot of ${w.name}. ${w.pitches.length} pitches.`);
      } else if (a.do === 'retreat') {
        if (s.wall?.id !== a.wall) return refuse("You're not on it.");
        s.wall = null;
        line(`You rap off ${w.name}. The wall will be there.`);
      } else {
        if (s.wall?.id !== a.wall) return refuse("You're not on it.");
        if (s.wall.next === 0) return refuse("You're still at the bottom. Go back to the van.");
        if (!isNight(s.min)) return refuse('Not yet. Climb while it’s light.');
        sleep('ledge');
      }
      break;
    }

    case 'exped': {
      const e = EXPEDITIONS[a.id];
      if (!e) return refuse('No such expedition.');
      if (a.do === 'go') {
        if (s.expedition) return refuse("You're already away.");
        if (s.at !== 'lot') return refuse('Expeditions leave from the Lot.');
        if (gradeOf(s.climber.skills) < e.gradeReq) return refuse(`${e.name} wants V${e.gradeReq}.`);
        if (s.cash < e.cost) return refuse(`${e.name} costs ${money(e.cost)}, in hand.`);
        if (s.wall) s.wall = null;
        spend({ cash: -e.cost });
        s.expedition = { id: a.id, day: 1, pitch: 0, energy: EXPED.energy };
        line(
          `${e.name}, ${e.region}: ${e.objective}. ${e.days} days, ${e.pitches} pitches.${s.dog ? ' The dog stays with friends at the Lot.' : ''}`,
        );
        break;
      }
      const x = s.expedition;
      if (!x || x.id !== a.id) return refuse("You're not on it.");
      if (a.do === 'bail') {
        s.expedition = null;
        line(
          `${e.name}: you call it, ${x.pitch} of ${e.pitches} pitches fixed. Nobody argues with going home alive.`,
        );
        break;
      }
      const storm = stormOn(s.seed, a.id, e, s.day);
      if (a.do === 'rest') {
        x.energy = Math.min(EXPED.energy, x.energy + EXPED.rest);
        line(storm ? 'Storm. You sit it out in the tent.' : 'A day in camp. You eat everything.');
        expedDay();
        break;
      }
      if (storm) return refuse('A storm’s on the wall. Nobody leads in this.');
      const dig = a.do === 'dig';
      const cost = dig ? EXPED.dig : EXPED.lead;
      if (x.energy < cost) return refuse('Not enough left in you to lead. Rest in camp.');
      x.energy -= cost;
      if (pitchRoll(s.seed, a.id, s.day, x.pitch) < pitchOdds(s.climber.skills, e, dig)) {
        x.pitch += 1;
        line(`Pitch ${x.pitch} fixed${dig ? ', and it took everything' : ''}. ${e.pitches - x.pitch} to go.`);
      } else
        line(
          `You back off pitch ${x.pitch + 1}. ${dig ? 'You dug deep, and it still said no.' : 'Tomorrow.'}`,
        );
      expedDay();
      break;
    }

    case 'create': {
      if (s.climber.name) return refuse('You already are who you are.');
      const name = a.name.trim().slice(0, NAME_MAX).trim();
      if (!name) return refuse('You need a name.');
      if (a.carry) {
        const skills = carried(a.carry);
        if (!skills) return refuse("That climber didn't make it across.");
        s.climber = { name, start: CARRIED, skills };
        break;
      }
      const start = STARTS[a.start];
      if (!start) return refuse('Pick how you climb.');
      s.climber = { name, start: a.start, skills: { ...start.skills } };
      if (a.solo) s.mode = 'solo';
      break;
    }

    case 'act': {
      const why = runAct(a.act);
      if (why) return refuse(why);
      break;
    }

    case 'say': {
      const talk = TALK[a.talk];
      const node = talk?.nodes[a.node];
      const opt = node?.opts[a.opt];
      if (!talk || !opt || (opt.when && !holds(s, opt.when)))
        return refuse('They have nothing to say to that.');
      const fx = opt.fx ?? {};
      // You can finish a sentence with someone who's just left, but they won't do anything
      // for you: a conversation can straddle the hour they head off.
      if (Object.keys(fx).length && whereNow(s, talk.who) !== s.at) return refuse("They're not here.");
      // Talking to someone is meeting them.
      const p = meet(talk.who);
      if (fx.act) {
        const why = runAct(fx.act);
        if (why) return refuse(why);
      }
      if (fx.cost) spend(fx.cost);
      if (fx.today && !s.today.includes(fx.today)) s.today.push(fx.today);
      if (fx.learn) {
        const [route, beta] = fx.learn.split('/');
        if (route && beta) learn(route, beta, 'told', '');
      }
      if (fx.watch) watch(talk.who);
      if (fx.arc) {
        p.arc = (p.arc ?? 0) + 1;
        p.beatDay = s.day;
      }
      if (fx.train) train(fx.train);
      if (fx.away) {
        p.away = s.day + fx.away;
        delete p.invite;
      }
      if (fx.invite) p.invite = { day: s.day, place: fx.invite, from: s.min };
      if (fx.line) {
        const said = fill(fx.line, { away: fx.away ?? 0 });
        line(fx.train ? `${said} ${skillsNote(fx.train)}.` : said);
      }
      if (fx.bond) bond(talk.who, p.bond + fx.bond);
      if (fx.bondAtLeast) bond(talk.who, Math.max(p.bond, fx.bondAtLeast));
      events.push({ k: 'talk', node: opt.next ?? null });
      break;
    }

    case 'travel': {
      const r = road(s.at, a.to);
      const to = PLACES[a.to];
      if (!r || !to) return refuse("There's no road there.");
      if (to.minGrade !== undefined && gradeOf(s.climber.skills) < to.minGrade)
        return refuse(`${to.name}: ${to.locked ?? 'not yet.'}`);
      if (to.unlock && !s.unlocked.includes(a.to))
        return refuse(`${to.name} is a trip you haven't paid for yet: ${money(to.unlock)}, once.`);
      // A maxed-out card never strands you: you drive on what's in the tank. A permit isn't
      // gas: the ranger doesn't take fumes.
      const permit = to.permit ?? 0;
      if (permit && headroom(s) < permit)
        return refuse(`${to.name} needs a ${money(permit)} permit, and the card won't cover it.`);
      spend({ cash: -permit });
      if (s.wall) {
        line(`You rap off ${WALLS[s.wall.id]!.name}. The wall will be there.`);
        s.wall = null;
      }
      const declined = r.cash > 0 && headroom(s) < r.cash;
      spend({ min: r.min, cash: declined ? 0 : -r.cash, energy: r.min >= 30 ? -BODY.driveEnergy : 0 });
      s.at = a.to;
      s.x = null;
      if (declined) line("The card's declined at the pump. You make it on fumes.");
      else if (r.cash >= 12) line(`Gas, ${money(r.cash)}. The van starts on the second try.`);
      else if (r.cash > 0) line(`Gas, ${money(r.cash)}.`);
      if (permit) line(`Permit, ${money(permit)}. The ranger doesn't look up.`);
      // Every drive with Scout is a ride-along; out at the crag he gets up to something.
      if (s.dog) s.dog.bond = Math.min(100, s.dog.bond + DOG.rideBond);
      if (to.crag) {
        s.trips += 1;
        if (s.trips === DOG.offerTrips && !s.dog) line(DOG_OFFER.first);
        if (s.dog && !s.today.includes('dog-out')) {
          s.today.push('dog-out');
          line(dogLine(s, 'crag')!);
        }
      }
      break;
    }

    // A trip you pay for once (v0.956's road-trip unlock): cash in hand, not the card.
    case 'unlock': {
      const p = PLACES[a.place];
      if (!p?.unlock) return refuse("There's nothing to pay for there.");
      if (s.unlocked.includes(a.place)) return refuse(`${p.name} is already yours.`);
      if (p.minGrade !== undefined && gradeOf(s.climber.skills) < p.minGrade)
        return refuse(`${p.name}: ${p.locked ?? 'not yet.'}`);
      if (s.cash < p.unlock) return refuse(`${p.name} runs ${money(p.unlock)}, in hand. Keep saving.`);
      spend({ cash: -p.unlock });
      s.unlocked.push(a.place);
      line(`Pads, water jugs and a guidebook, ${money(p.unlock)}. ${p.name} is on your map for good.`);
      break;
    }

    case 'stand':
      s.x = Math.round(a.x);
      break;

    case 'pick': {
      if (!knowsBeta(s, a.route, a.crux, a.beta)) return refuse("You don't know that beta yet.");
      logOf(s, a.route).pick[a.crux] = a.beta;
      break;
    }

    case 'go': {
      const r = routeOfId(s, a.route);
      if (!r || r.place !== s.at) return refuse("That line isn't here.");
      const why = goBlocked(s, r);
      if (why) return refuse(`${why}.`);
      // Whether the crowd shouts the beta at you, decided at the base, before the queue.
      const sprayed = sprayedOn(s, r);
      const queued = queueMin(s, r);
      spend(goCost(r, s));
      const L = logOf(s, a.route);
      L.goes += 1;
      L.goesToday += 1;
      if (queued && L.goesToday === 1) line(`A queue for it. You wait ${queued} minutes for your turn.`);
      if (soloed(s, r)) {
        s.soloing = r.id;
        if (L.goesToday === 1) line('No rope. Nothing between you and the ground but the next move.');
      }
      if (sprayed) {
        const b = sprayable(s, r)[0]!;
        learn(r.id, b, 'told', '');
        line(
          `"${r.beta[b]!.name}," someone on the next rope calls, before you've chalked up. So much for the onsight.`,
        );
      }
      // Whoever's on belay, and anyone you know climbing here, makes it a day together.
      const who = roped(r) ? belayer(s) : null;
      if (who) climbedWith(who);
      for (const w of PARTNERS) if (w !== who && s.people[w] && whereNow(s, w) === s.at) climbedWith(w);
      // A sandbag shows itself on your first go; on the board, everyone saw it coming.
      if (L.goes === 1 && r.trueGrade !== undefined && r.trueGrade !== r.grade)
        line(
          r.board
            ? `Board grades: that's no ${gradeLabel(r)}. Nobody on the mats is surprised.`
            : r.trueGrade > r.grade
              ? `That's no ${gradeLabel(r)}. Locals have been sandbagging it.`
              : `That's no ${gradeLabel(r)}. It's soft, and you're not complaining.`,
        );
      if (!indoor(r.place) && s.min >= sunOn(s.seed, s.day, r.place, r.id) && !s.today.includes('grease')) {
        s.today.push('grease');
        line("Sun's on this line now. Everything feels greasy.");
      }
      break;
    }

    case 'speed': {
      const why = speedBlocked(s);
      if (why) return refuse(`${why}.`);
      if (a.real !== null && !(a.real > 0)) return refuse('Not a time.');
      const was = s.speed.pb;
      const got = a.real === null ? {} : speedGains(s);
      spend({ min: SPEED.min, energy: -SPEED.energy, skin: -SPEED.skin, fed: -SPEED.fed });
      s.load.today = round2(s.load.today + speedLoad(s));
      s.speed = { pb: was, runs: runsToday(s) + 1, day: s.day };
      if (a.real === null) {
        line('False start. The lights hadn’t gone green.');
        break;
      }
      const time = speedTime(s.climber.skills, a.real);
      train(got);
      if (was === null || time < was) {
        s.speed.pb = time;
        line(
          was === null
            ? `${time.toFixed(2)} s. Your first time on the board.`
            : `${time.toFixed(2)} s. A PB, by ${(was - time).toFixed(2)}.`,
        );
      } else line(`${time.toFixed(2)} s. Your best is ${was.toFixed(2)}.`);
      if (Object.keys(got).length) line(`${skillsNote(got)}.`);
      else if (runsToday(s) === SPEED.fresh + 1)
        line('Your legs are done learning today. The clock doesn’t care.');
      break;
    }

    case 'ask': {
      const r = routeOfId(s, a.route);
      if (!r || r.place !== s.at) return refuse("That line isn't here.");
      if (s.routes[r.id]?.sent) return refuse('You’ve sent it. Nobody’s telling you anything.');
      if (!sprayable(s, r).length) return refuse('Nobody here knows more about it than you do.');
      if (!canAsk(s, r)) return refuse('Nobody here to ask.');
      const b = sprayable(s, r)[0]!;
      spend({ min: CROWD.ask });
      learn(r.id, b, 'told', '');
      line(`You ask around. Somebody's been on it all season: ${r.beta[b]!.name.toLowerCase()}.`);
      break;
    }

    case 'rest': {
      const r = routeOfId(s, a.route);
      if (!r) return refuse('Not a route.');
      spend({ min: restCost(r) });
      break;
    }

    case 'done': {
      const r = routeOfId(s, a.route);
      if (!r) return refuse('Not a route.');
      const L = logOf(s, a.route);
      const res = a.result;
      const lap = L.sent !== null;
      // A solo: off it is the end of it; up it is a lesson for the head.
      if (soloed(s, r)) {
        s.soloing = null;
        if (!res.sent) {
          s.dead = { route: r.id, day: s.day, hi: Math.max(0, Math.floor(res.hi)) };
          line(`${s.climber.name} came off ${r.name}, with no rope.`);
          break;
        }
        train({ head: FREESOLO.head });
        line(`${r.name}, without a rope. ${skillsNote({ head: FREESOLO.head })}.`);
      }
      // What the go put through you, and whether it cost you: judged on the state it was
      // climbed in, before it counts as your warm-up.
      const wasCold = cold(s, r);
      const load = goLoad(
        CLIMB.go[indoor(r.place) ? 'gym' : r.disc].energy,
        r.grade,
        res.sent ? 1 : res.hi / r.moves,
      );
      s.load.today = round2(s.load.today + load);
      const goN = Object.values(s.routes).reduce((t, x) => t + x.goesToday, 0);
      // Overuse first; failing that, a fall off a highball can land you badly.
      // A deep-water solo loads you, but the sea takes the fall: no strain roll (v0.956's).
      const strain = r.dws ? null : rollInjury(s, r, load, wasCold, goN);
      // A deck is only as far as the result says, and only on trad: nothing else has one.
      const deck = r.disc === 'trad' && !res.sent && res.deck ? Math.min(res.deck, r.heightFt) : 0;
      const landed =
        strain || res.sent ? null : deck ? rollDeck(s, deck, goN) : rollLanding(s, r, res.hi, goN);
      const hurt = strain ?? landed;
      if (deck && !hurt) line(fill(DECK_WALKED, { route: r.name }));
      if (!s.today.includes('warm')) s.today.push('warm');
      s.skin = clamp100(s.skin - Math.max(0, tapedSkin(s, r, res.skin)));
      for (const l of wearKit(s, r)) line(l);
      L.hi = Math.max(L.hi, Math.min(r.moves, Math.max(0, Math.floor(res.hi))));
      if (res.sent) {
        // The log keeps how the first send went; any send after it is a repeat.
        const firstStyle: SendStyle = L.goes === 1 ? (L.told.length ? 'flash' : 'onsight') : 'redpoint';
        const style: GoStyle = lap ? 'repeat' : firstStyle;
        L.sent ??= { day: s.day, go: L.goes, style: firstStyle };
        L.sentToday = true;
        events.push({ k: 'sent', route: a.route, style, go: L.goes });
        if (r.wall && s.wall?.id === r.wall) wallPitch(r.wall, lap);
        if (r.open && !s.firsts[r.id] && L.sent.day === s.day && L.sent.go === L.goes)
          events.push({ k: 'fa', route: r.id });
        if (s.race?.route === a.route) {
          s.race = null;
          line(`You sent it before Dex could. That one's yours.`);
        }
        // Your first V4 gets noticed: Dex is here for the rest of the day, and he'll say so.
        if (r.grade >= 4 && !s.people.dex) {
          s.people.dex = { bond: 0, last: 0, since: s.day, invite: { day: s.day, place: s.at, from: s.min } };
          line('Somebody was watching that.');
        }
        note(`${SEND_NAME[style]}: ${r.name}, ${gradeLabel(r)}, on go ${L.goes}.`);
      } else if (res.fellAt) {
        const crux = r.cruxes.find((c) => c.id === res.fellAt);
        if (!crux) return refuse('No such crux.');
        const falls = (L.falls[crux.id] ?? 0) + 1;
        L.falls[crux.id] = falls;
        for (const id of crux.beta) {
          const u = r.beta[id]?.unlock;
          if (u && falls >= u.falls) learn(a.route, id, 'fall', u.line);
        }
      }
      // What the go taught you: the route's style, and the sequences you tried.
      const before = gradeOf(s.climber.skills);
      const styles = res.tried.map((b) => r.beta[b]?.style).filter((x): x is NonNullable<typeof x> => !!x);
      const go: GoSummary = {
        grade: effGrade(r),
        sent: res.sent,
        progress: res.hi / r.moves,
        type: r.type,
        styles,
      };
      const got = gains(s.climber.skills, go);
      // Spiked over your usual load, your body keeps less of what the go taught.
      const spent = ratio(s.load) > LOAD.slow ? LOAD.slowGains : 1;
      for (const k of Object.keys(got) as (keyof Skills)[]) {
        const gym = INDOOR[r.place]?.specialty.includes(k) ? CLIMB.gymSpecialty : 1;
        got[k] = round2(got[k]! * CLIMB.learn * (lap ? CLIMB.repeatLearn : 1) * gym * spent);
      }
      // Leading on gear you placed yourself is a lesson for the head.
      if (r.disc === 'trad' && res.sent)
        got.head = round2(
          (got.head ?? 0) + TRAD.sendHead * CLIMB.learn * (lap ? CLIMB.repeatLearn : 1) * spent,
        );
      train(got);
      const after = gradeOf(s.climber.skills);
      events.push({ k: 'skills', gains: got, grade: after > before ? after : null });
      if (after > before) line(`Something clicks. You're climbing V${after} now.`);
      if (hurt) {
        const kind = hurt.kind;
        const text = fill((landed ? (deck ? DECK_LINE : LANDING_LINE) : HURT_LINE)[hurt.tier - 1]!, {
          route: r.name,
          kind,
          Kind: kind[0]!.toUpperCase() + kind.slice(1),
          days: hurt.until - s.day - 1,
        });
        injure(hurt, text);
      }
      break;
    }

    case 'train': {
      if (a.protocol === 'prehab') {
        const why = prehabBlocked(s);
        if (why) return refuse(`${why}.`);
        spend(prehabCost());
        s.today.push('prehab');
        s.training.prehab = s.day + TRAIN.prehab.days - 1;
        line(`Bands, wrist curls, the boring half of climbing. Covered for ${TRAIN.prehab.days} days.`);
        break;
      }
      const p = protocolOf(a.protocol);
      const why = trainBlocked(s, a.protocol);
      if (!p || why) return refuse(`${why ?? 'No such session'}.`);
      // Judged on the body you started with, as a go is.
      const got = sessionGains(s, p);
      const load = sessionLoad(s, p);
      s.load.today = round2(s.load.today + load);
      const hurt = rollInjury(s, { type: p.style }, load, false, TRAIN_ROLL);
      spend(sessionCost(p));
      s.today.push('trained');
      const before = gradeOf(s.climber.skills);
      train(got);
      const after = gradeOf(s.climber.skills);
      events.push({ k: 'skills', gains: got, grade: after > before ? after : null });
      line(`${p.name}, done. ${skillsNote(got)}.`);
      if (after > before) line(`Something clicks. You're climbing V${after} now.`);
      if (hurt) {
        const kind = hurt.kind;
        injure(
          hurt,
          fill(TRAIN_HURT_LINE[hurt.tier - 1]!, {
            session: p.name.toLowerCase(),
            kind,
            Kind: kind[0]!.toUpperCase() + kind.slice(1),
            days: hurt.until - s.day - 1,
          }),
        );
      }
      break;
    }

    case 'phase': {
      if (!(a.phase in TRAIN.phases)) return refuse('No such phase.');
      if (a.phase === s.training.phase) return refuse("You're in it.");
      const wait = phaseLock(s);
      if (wait > 0)
        return refuse(
          `Give ${PHASE_NAME[s.training.phase].toLowerCase()} ${wait} more day${wait > 1 ? 's' : ''}.`,
        );
      s.training.phase = a.phase;
      s.training.since = s.day;
      line(PHASE_LINE[a.phase]);
      break;
    }

    case 'taper': {
      if (taperDay(s)) return refuse("You're tapering.");
      const wait = taperWait(s);
      if (wait > 0) return refuse(`Too soon after the last one. ${wait} more day${wait > 1 ? 's' : ''}.`);
      s.training.taper = s.day;
      line(`Tapering: no training for ${TRAIN.taper.days} days, and fresh arms at the end of it.`);
      break;
    }

    case 'name': {
      const r = routeOfId(s, a.route);
      if (!r?.open || !s.routes[a.route]?.sent) return refuse("That line isn't yours to name.");
      if (s.firsts[a.route]) return refuse("You've named it already.");
      const name = a.name.trim().slice(0, FA_NAME_MAX).trim();
      if (name.length < 2) return refuse('Give it a name.');
      s.firsts[a.route] = { name, call: a.call, day: s.day };
      const called = gradeName(r.disc, r.grade + a.call);
      line(
        a.call > 0
          ? `First ascent: ${name}, called stout at ${called}. Let them find out.`
          : a.call < 0
            ? `First ascent: ${name}, called soft at ${called}. Nobody argues with a humble call.`
            : `First ascent: ${name}, ${called}. That's on the map now.`,
      );
      break;
    }
  }
  // Act I's goals, after whatever just happened: each one done says so, and the last ends
  // the act.
  for (let g = currentGoal(s); s.climber.name && g && aimMet(s, g.aim); g = currentGoal(s)) {
    s.goals += 1;
    if (g.train) train(g.train);
    events.push({ k: 'goal', id: g.id });
    line(g.train ? `${g.done} ${skillsNote(g.train)}.` : g.done);
    if (!currentGoal(s)) {
      s.cash += ACT_I_END.cash;
      events.push({ k: 'act', n: 1 });
      note(ACT_I_END.text);
      line(`First season done. There's ${money(ACT_I_END.cash)} in the glovebox you'd forgotten about.`);
    }
  }
  return { state: s, events };
}

export const FA_NAME_MAX = 28;

// What a line's called: its first ascensionist's name for it, or the guidebook's.
export const lineName = (s: GameState, r: RouteDef): string => s.firsts[r.id]?.name ?? r.name;

// The grade a line goes by: its first ascensionist's call once it has one, and a "?" on an
// open line nobody's done, the way guidebooks mark a grade no one has confirmed.
export function lineGrade(s: GameState, r: RouteDef): string {
  const fa = s.firsts[r.id];
  if (fa) return gradeName(r.disc, r.grade + fa.call);
  return r.open && !s.routes[r.id]?.sent ? `${gradeLabel(r)}?` : gradeLabel(r);
}

const WORDS = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
];
const NOUN: Record<RouteDef['type'], string> = {
  crimp: 'Edge',
  power: 'Pull',
  dyno: 'Leap',
  endurance: 'Long Way Up',
  technical: 'Dance',
  crack: 'Crack',
};

// Names to offer for a first ascent, from your record: yours, how long it took, the
// season, and what the week's been like.
export function faSuggestions(s: GameState, r: RouteDef): string[] {
  const first = s.climber.name.split(/\s+/)[0] || 'Nobody';
  const goes = s.routes[r.id]?.goes ?? 1;
  const season = seasonOf(s.day);
  return [
    `${first}’s ${NOUN[r.type]}`,
    goes <= 1 ? 'First Try, Somehow' : goes < WORDS.length ? `Go ${WORDS[goes]}` : `Go ${goes}`,
    `The ${season[0]!.toUpperCase()}${season.slice(1)} Project`,
    s.cash < 0 ? 'Rent’s Due' : s.routes.pump?.told.includes('B2') ? 'Hazel Was Right' : 'Coffee Money',
  ];
}

// A game that closed mid-solo: whatever happened up there, you didn't top out. Reloading
// can't take back a solo, which is what makes Free Solo mean it (the audit's S7).
export const unfinishedSolo = (s: GameState): GameState =>
  s.soloing
    ? act(s, {
        t: 'done',
        route: s.soloing,
        result: { sent: false, hi: 0, fellAt: null, tried: [], skin: 0 },
      }).state
    : s;
