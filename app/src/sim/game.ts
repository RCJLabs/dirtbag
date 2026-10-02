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
import {
  DOG_AGE_LINE,
  DOG_FAREWELL,
  DOG_FIND_LINE,
  DOG_GRAY_CRAG,
  DOG_LINES,
  DOG_OFFER,
  DOG_PERK_LINE,
  DOG_VET,
} from './content/dog';
import { dogAge, nextDogName, scoutFinds, type Perk } from './scout';
import { expedCost, owns } from './dreams';
import {
  atFire,
  bidSaid,
  bidWords,
  count,
  dealDice,
  gameBlocked,
  theirShoes,
  theyCall,
  ringersSaid,
  throwPoints,
  yourRaise,
} from './fire';
import {
  bjDeck,
  bjSettle,
  bjTotal,
  cardsBlocked,
  cardsName,
  dealerPlays,
  deckFor,
  handNeeds,
  handValue,
  handWord,
  isBlackjack,
  readsOn,
  theirMove,
} from './cards';
import { dreamById } from './content/dreams';
import { PEOPLE, RACE_ROUTE, RIVAL_FA_NAMES, TALK } from './content/people';
import { ACT_I_END } from './content/story';
import { START_KIT } from './content/gear';
import { INGREDIENTS, RECIPES } from './content/food';
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
import { livingTonight, raiseAt, rankAt, rankName, shiftsAt, signupBlocked, skimps, tipsFor } from './jobs';
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
  CLINIC,
  CROWD,
  FOOD,
  FREESOLO,
  LAKE,
  SPEED,
  DAY,
  DOG,
  EXPED,
  HIGHBALL,
  INJURY,
  LIFESTYLE,
  CALLING,
  MASTERY_AT,
  FACTION,
  LOAD,
  MONEY,
  PLANS,
  RIVAL,
  SCARS,
  BUSK,
  EVENTS,
  GAMES,
  PSYCHE,
  SICK,
  SUPPLIES,
  TRAD,
  UPGRADE,
  TRAIN,
  SPOT,
  SPOTS,
  VAN,
  WALL,
  WINTER,
  WORK,
} from './dials';
import { EXPED_ROUTES, EXPEDITIONS, expedPitches, tripDays } from './content/expeditions';
import { WALL_EVENTS, wallEventById } from './content/wallevents';
import { TRIP_STORY } from './content/tripstories';
import {
  bagKg,
  lastTrip,
  nightGives,
  partnerDay,
  partners,
  planBlocked,
  planCost,
  stormOn,
  storyBlocked,
  tripBond,
  tripPay,
  tripWords,
  wallPay,
  yourPitch,
} from './expeditions';
import { canAsk, queueMin, sprayable, sprayedOn } from './crowds';
import { soloed } from './solo';
import { fishCatch } from './lake';
import { HUSTLE_TEACH, hustleTake, needsTeaching } from './hustle';
import {
  driveEncounter,
  epicByKind,
  epicEnd,
  epicNow,
  hitchFriend,
  hitcherById,
  hitchOpts,
  knockById,
  knockPsyche,
  knockTonight,
  roadPsyche,
  stopById,
} from './events';
import type { RoadFx } from './content/road';
import { buskBlocked, buskHeads, buskTips, guitarRank, practiceOf, RANK_LINE } from './busk';
import { carePrice, clinicBill, jabbed, weeklyBills, worsened } from './clinic';
import { flareRoll, scarRoll, scarred } from './scars';
import { isSick, SICK_NAME, sickRoll } from './sick';
import { PSYCHE_LINE, psycheBy, psycheWord } from './psyche';
import { AREA, MARK_NAME, STYLE_NAME, type Mark } from './content/injuries';
import { drivewayHost, nightAt, spotBlocked, ticketRoll } from './spots';
import { SPOT_LINE, SPOT_NAME } from './content/spots';
import { bodgeHolds, breakdownRoll, friendFor, gasFor, PART_NAME, repairCost, unsafePart } from './van';
import { BODGE_FAILED, BODGE_HELD, BREAKDOWN_LINE } from './content/van';
import { speedBlocked, speedGains, speedLoad, speedTime, runsToday } from './speed';
import { fill, money, skillsNote } from './format';
import { PARTNERS, tierOf, whereNow } from './presence';
import { hashSeed, Rng } from './rng';
import { aimMet, currentGoal } from './story';
import { newlyEarned } from './record';
import { callingOf, dealTalents, gainMult, payMult, shopMult, talentsShowing } from './identity';
import { callingDue, newRungs, rungText } from './calling';
import {
  countGo,
  edgeText,
  masteryOf,
  newlyClaimable,
  newMastery,
  pathBlocked,
  quirkFor,
  tiersOn,
} from './paths';
import { MASTERY, PATHS, QUIRKS } from './content/paths';
import { CALLING_SCENE, ECHOES } from './content/scene';
import { echoDue, echoOpts, permitFor, shift, stanceDue, stanceOpts } from './scene';
import { CALLINGS, OPEN_CALLINGS } from './content/callings';
import { CAME_ACROSS, ORIGINS } from './content/origins';
import { TALENTS } from './content/talents';
import type {
  PhaseId,
  Action,
  TripEnd,
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
    shifts: [],
    strikes: {},
    benched: {},
    lifestyle: 'dirtbag',
    spot: 'lot',
    lotNights: 0,
    driveway: 0,
    van: { ...VAN.start },
    breakdown: null,
    pantry: {},
    meals: [],
    fueled: 0,
    insurance: 'catastrophic',
    jab: 0,
    scars: [],
    flare: null,
    fear: [],
    supplies: SUPPLIES.start,
    sick: null,
    psyche: { level: PSYCHE.start, stale: 0 },
    crags: [],
    seen: [],
    guitar: 0,
    deck: { last: 0, knock: 0, seen: [], hitch: 0, stop: 0, stops: [], met: {}, epic: 0 },
    encounter: null,
    dogs: [],
    dream: { pick: null, pot: 0, owned: [] },
    table: null,
    cards: null,
    reads: {},
    wall: null,
    expedition: null,
    booked: null,
    book: [],
    origin: null,
    talents: { ids: [], known: [], from: { power: 0, fingers: 0, endurance: 0, technique: 0, head: 0 } },
    calling: { id: null, since: 0, rungs: [], offered: false },
    paths: { tiers: {}, told: [] },
    mastery: [],
    quirk: null,
    habits: { goes: 0, outdoor: 0, fresh: 0, tired: 0, evening: 0, dawn: 0, easy: 0, power: 0 },
    scene: { old: FACTION.start, gym: FACTION.start, stances: [], echoes: [], last: 0, echoLast: 0 },
    record: {},
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
// Cups of coffee today (Phase 22.3).
export const coffeesToday = (s: GameState): number => s.today.filter((f) => f === 'coffee').length;
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
  const c = r.exped ? EXPED.pitch : r.wall ? WALL.pitch : CLIMB.go[kind];
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
  // Where you came from moves it (Phase 23.2).
  if (d.job)
    return {
      ...d.cost,
      cash: Math.round(((d.cost.cash ?? 0) + raiseAt(s, d.job.id) * d.job.shifts) * payMult(s)),
    };
  // What you buy, kit or food, at what your origin pays for it (Phase 23.2).
  if ((d.gear || d.buys) && (d.cost.cash ?? 0) < 0)
    return { ...d.cost, cash: Math.round((d.cost.cash ?? 0) * shopMult(s)) };
  // A repair costs its share of the part's price, by wear.
  if (d.van) return { ...d.cost, cash: -repairCost(s, d.van) };
  // The clinic's care, on your plan (Phase 22.4a), and a doctor's (22.4c).
  if (d.clinic) return { ...d.cost, cash: -carePrice(s, d.clinic) };
  if (d.doctor) return { ...d.cost, cash: -Math.round(SICK.doctor.price * PLANS[s.insurance].care) };
  // Bed costs wherever you're parked tonight (Phase 22.2b).
  if (d.sleep) return { ...d.cost, cash: -nightAt(s).cost };
  // Past a couple of cups a day, coffee is jitters, not energy (Phase 22.3).
  if (d.coffee && coffeesToday(s) >= FOOD.coffees) return { ...d.cost, energy: FOOD.crash };
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
  // An old ankle injury lands worse (Phase 22.4b).
  const scar = s.scars.includes('ankle') ? SCARS.risk : 1;
  return (
    HIGHBALL.perFoot * over * (morePads(s) ? HIGHBALL.pads : 1) * (belayer(s) ? HIGHBALL.spotter : 1) * scar
  );
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

// What your dog's up to, where you are; slower at the crag once he's gray (Phase 22.7). The
// lines are Scout's, and a later stray's name goes in his place.
export function dogLine(s: GameState, where: 'crag' | 'drive'): string | null {
  if (!s.dog) return null;
  const L = DOG_LINES[where];
  const gray = where === 'crag' && dogAge(s.dog, s.day) >= DOG.gray;
  const pool = s.dog.fed < DOG.hungryBelow ? L.hungry : gray ? DOG_GRAY_CRAG : L.tiers[dogTier(s.dog.bond)]!;
  return ofDay(s, `dog-${where}`, pool).replaceAll('{name}', s.dog.name).replaceAll('Scout', s.dog.name);
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

// Phase 24: a pitch up there goes only in its turn, in your block, on a clear day, in the light.
function expedBlocked(s: GameState, r: RouteDef): string | null {
  const x = s.expedition;
  if (!x || x.id !== r.exped) return 'You’re nowhere near it';
  const ps = expedPitches(x.id);
  if (ps[x.pitch]?.id !== r.id) return `Pitch ${x.pitch + 1} is next: ${ps[x.pitch]?.name ?? 'the top'}`;
  if (!yourPitch(x.pitch, !x.partner))
    return `${PEOPLE[x.partner!]?.name ?? 'Your partner'}’s block. Second it`;
  if (stormOn(s.seed, x.id, EXPEDITIONS[x.id]!, s.day)) return 'A storm’s on the wall. Nobody leads in this';
  if (s.min >= CLIMB.darkFrom) return 'Too dark to climb. Make camp';
  const led = expedPitches(x.id).reduce((n, p) => n + (s.routes[p.id]?.goesToday ?? 0), 0);
  if (led >= EXPED.perDay) return 'That’s the day’s leading. Make camp';
  const off = daysOff(s);
  if (off > 0) return `Your ${s.injury!.kind} needs ${off} more day${off > 1 ? 's' : ''}`;
  if (s.fed <= 0) return "You're running on empty";
  if (s.energy < CLIMB.minEnergy) return 'Too tired to lead. Make camp';
  return null;
}

export function goBlocked(s: GameState, r: RouteDef): string | null {
  if (r.exped) return expedBlocked(s, r);
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
    // Cortisone hid how bad things were (Phase 22.4a): this one lands a tier worse.
    if (jabbed(s) && hurt.tier < 3) {
      hurt = worsened(hurt);
      s.jab = 0;
      text = `${text} The cortisone was hiding how bad it had got.`;
    }
    s.injury = hurt;
    const days = hurt.until - s.day - 1;
    events.push({ k: 'injured', kind: hurt.kind, tier: hurt.tier, days, text });
    note(text);
    const bill = clinicBill(s, hurt.tier);
    if (hurt.tier > 1) line(s.hurt === 0 ? FIRST_FREE_LINE : fill(CLINIC_LINE, { cost: money(bill) }));
    if (bill) spend({ cash: -bill });
    s.hurt += 1;
  };
  // An injury heals: said, and it may leave a mark (Phase 22.4b).
  const heal = () => {
    const was = s.injury!;
    line(fill(HEALED_LINE, { kind: was.kind }));
    s.injury = null;
    const mark = scarRoll(s, was);
    if (mark) {
      s.scars.push(mark);
      line(`It’s healed, but your ${MARK_NAME[mark]} will remember. Lines that load it are riskier now.`);
    }
  };
  // A night: in the van at the Lot, on a ledge halfway up a wall, or away on an expedition
  // (where the food's paid for, the van waits, and friends feed the dog).
  // `back`: a portaledge night's energy (Phase 24), which gives back less every night.
  const sleep = (where: 'van' | 'ledge' | 'away' | 'exped' = 'van', back = 0) => {
    const ended = s.day;
    const away = where === 'away' || where === 'exped';

    // Going to bed hungry with food in the pantry: you eat some of it cold first (Phase 22.3).
    if (!away && s.fed < BODY.hungryBelow) {
      const cold: string[] = [];
      for (let n = 0; n < FOOD.coldMax && s.fed < BODY.hungryBelow; n++) {
        const id = Object.keys(INGREDIENTS).find((k) => (s.pantry[k] ?? 0) > 0);
        if (!id) break;
        s.pantry[id]! -= 1;
        s.fed = clamp100(s.fed + FOOD.cold);
        cold.push(INGREDIENTS[id]!.name.toLowerCase());
      }
      if (cold.length) line(`Too hungry to cook: ${cold.join(' and ')}, cold, from the pantry.`);
    }
    const hungry = !away && s.fed < BODY.hungryBelow;
    // Where the van's parked tonight (Phase 22.2b), and what it costs; the pullout if the
    // card won't cover it.
    const night = where === 'van' ? nightAt(s) : null;
    const rough = !!night?.rough;
    // How you live is paid at the van, after the spot, while the card still takes it.
    const life = night && !rough ? livingTonight(s, night.cost) : LIFESTYLE.dirtbag;
    const skimped = !!night && !rough && s.lifestyle !== 'dirtbag' && skimps(s, night.cost);
    const ticket = !!night && night.spot === 'lot' && !rough && ticketRoll(s);
    if (night) {
      s.cash -= night.cost;
      s.lotNights = night.spot === 'lot' && !rough ? s.lotNights + 1 : 0;
      if (night.spot === 'driveway') s.driveway = ended;
      if (ticket) s.cash -= SPOT.tickets.fine;
    }
    s.cash -= life.cost;
    // Supplies and sickness (Phase 22.4c): a van night uses water and washing (the truck
    // stop's shower puts some back), and might leave you sick, from what the night was like.
    let fell: ReturnType<typeof sickRoll> = null;
    if (night) {
      if (!isSick(s)) fell = sickRoll(s, night.heat);
      s.supplies = Math.max(
        0,
        Math.min(100, s.supplies - SUPPLIES.night + (night.spot === 'truckstop' ? SUPPLIES.truckstop : 0)),
      );
    }
    // Psyche (Phase 22.4d): the day that's ending settles it, then it drifts toward even.
    const wasWord = psycheWord(s.psyche.level);
    s.psyche = psycheBy(s, where !== 'van');
    s.day += 1;
    // A spot out of town is a drive back in the morning.
    s.min = DAY.wakeMin + (night?.drive ?? 0);
    const rest =
      where === 'exped'
        ? back
        : where === 'ledge'
          ? WALL.bivy.energy
          : (rough ? BODY.roughEnergy : BODY.sleepEnergy) -
            (hungry ? BODY.hungryNight : 0) +
            life.energy +
            (night?.energy ?? 0);
    if (fell) s.sick = { kind: fell.kind, until: s.day + fell.days };
    // Sick, you get less back from a night.
    s.energy = clamp100(s.energy + rest + (isSick(s) ? SICK.energy : 0));
    s.skin = clamp100(s.skin + BODY.sleepSkin + life.skin);
    if (!away) s.fed = clamp100(s.fed - (where === 'ledge' ? WALL.bivy.fed : BODY.nightFed));
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
    // A flight you didn't take (Phase 24.2): the booking's gone, and the money with it.
    if (s.booked && s.booked.day < s.day && !s.expedition) {
      line(`The flight to ${EXPEDITIONS[s.booked.id]!.name} left without you. The money went with it.`);
      s.booked = null;
    }
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
    else if (away) {
      // Nothing to say: the expedition's day says it.
    } else if (rough) line("The card won't take the van spot. You sleep in the pullout. It's cold.");
    else if (night && night.spot !== 'lot')
      line(fill(SPOT_LINE[night.spot], { who: PEOPLE[drivewayHost(s) ?? '']?.name ?? 'A friend' }));
    else
      line(
        s.cash < 0
          ? `Van spot, ${TEXT_VALUES.spot}. You're $${-s.cash} in the hole.`
          : `Van spot, ${TEXT_VALUES.spot}. Morning comes anyway.`,
      );
    if (night?.wanted) line(`${SPOT_NAME[night.wanted]} wouldn’t work tonight. The Lot, then.`);
    // Winter (Phase 22.2c): the heater burns a tank, or the cold gets in.
    if (night?.heat) {
      s.gear.propane = (s.gear.propane ?? 0) - 1;
      if (s.gear.propane <= 0) line('The heater coughs out the last of the propane. The gear shop has more.');
    } else if (night && night.cold < 0)
      line('A winter night in the van. You sleep in everything you own, and it isn’t enough.');
    // A warning, once a year, before winter comes.
    if (
      seasonOf(s.day + WINTER.warnDays - 1) === 'winter' &&
      seasonOf(s.day + WINTER.warnDays - 2) !== 'winter'
    )
      line('The nights are getting cold. Dale at the garage fits heaters, and the gear shop sells propane.');
    if (ticket)
      line(
        `A ticket under the wiper: ${money(SPOT.tickets.fine)}. The parking people have noticed you live here.`,
      );
    if (skimped) line('The card won’t stretch to how you like to live. A dirtbag night, then.');
    if (hungry) line('You went to bed hungry, and it shows.');
    // Signed-up shifts you didn't work: a warning each, and the last one costs the job.
    const missed = s.shifts.filter((x) => x.day <= ended);
    s.shifts = s.shifts.filter((x) => x.day > ended);
    for (const m of missed) {
      const j = JOBS[m.job]!;
      const n = (s.strikes[m.job] ?? 0) + 1;
      if (n < WORK.strikes) {
        s.strikes[m.job] = n;
        line(
          `You didn't show for your shift at ${PLACES[j.place]!.name}. That's a warning, ${n} of ${WORK.strikes - 1}.`,
        );
        continue;
      }
      delete s.strikes[m.job];
      s.jobs[m.job] = 0;
      s.benched[m.job] = ended + 1 + WORK.benchDays;
      s.shifts = s.shifts.filter((x) => x.job !== m.job);
      line(
        `Another no-show, and ${PLACES[j.place]!.name} lets you go. They'll take you back from day ${s.benched[m.job]}, as ${j.ranks[0]!.toLowerCase()}.`,
      );
    }
    if (s.dog && !away) {
      s.dog.fed = Math.max(0, s.dog.fed - DOG.nightFed);
      if (s.dog.fed < DOG.hungryBelow)
        line(`${s.dog.name}'s bowl is empty. He's been decent about it, which is worse.`);
      // Something from his rounds, with the perk (Phase 22.7).
      const found = scoutFinds(s);
      if (found) {
        s.pantry[found] = (s.pantry[found] ?? 0) + 1;
        line(fill(DOG_FIND_LINE, { name: s.dog.name, what: INGREDIENTS[found]!.name.toLowerCase() }));
      }
    }
    // His years (Phase 22.7): the morning he goes gray, slows down, has a scare at the vet.
    if (s.dog) {
      const was = dogAge(s.dog, ended);
      const now = dogAge(s.dog, s.day);
      const at = (age: number) => was < age && now >= age;
      const say = (t: string) => line(fill(t, { name: s.dog!.name, years: String(now) }));
      if (at(DOG.gray)) say(DOG_AGE_LINE.gray);
      if (at(DOG.senior)) say(DOG_AGE_LINE.senior);
      DOG.vet.forEach((v, i) => {
        if (!at(v.age)) return;
        const scare = DOG_VET[i]!;
        s.cash -= v.cost;
        line(`${scare.title}: ${scare.sit} ${scare.out} The vet: ${money(v.cost)}.`);
      });
      // The last day, the morning it comes, at the van.
      if (where === 'van' && now >= DOG.end) s.encounter = { kind: 'farewell', id: s.dog.name };
    }
    // The battery loses a little every night; the morning it's flat, you know.
    const charged = s.van.battery > 0;
    s.van.battery = round2(Math.max(0, s.van.battery - VAN.night));
    if (charged && s.van.battery <= 0)
      line('The van won’t turn over. The battery’s flat. A jump gets you across town, and no further.');
    if (s.injury && s.day >= s.injury.until) heal();
    if (fell)
      line(
        `You wake up with ${SICK_NAME[fell.kind]}. ${fell.kind === 'toothache' ? 'It won’t pass on its own: the clinic.' : 'A few days of feeling it.'}`,
      );
    else if (s.sick && s.sick.kind !== 'toothache' && s.day >= s.sick.until) {
      line('You wake up feeling human again.');
      s.sick = null;
    }
    const word = psycheWord(s.psyche.level);
    if (word !== wasWord && (word === 'low' || word === 'psyched')) line(PSYCHE_LINE[word]);
    if (night && s.supplies < SUPPLIES.low && s.supplies + SUPPLIES.night >= SUPPLIES.low)
      line('The water jugs are nearly dry and you could use a shower. The lake, the market or the gym.');
    if (ended % 7 === 0) {
      const bills = weeklyBills(s);
      s.cash -= bills;
      line(
        s.insurance === 'none'
          ? `Registration: $${bills}. No insurance: the week's bills don't care about your card.`
          : `Registration and insurance: $${bills}. The week's bills don't care about your card.`,
      );
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
  // Phase 24. A pitch of yours fixed: on up, or the summit.
  const expedPitch = () => {
    const x = s.expedition!;
    const e = EXPEDITIONS[x.id]!;
    x.pitch += 1;
    if (x.pitch >= e.pitches) {
      summit();
      return;
    }
    line(
      yourPitch(x.pitch, !x.partner)
        ? `Pitch ${x.pitch} fixed. ${e.pitches - x.pitch} to go, and the next is yours too.`
        : `Pitch ${x.pitch} fixed. That's your block. ${PEOPLE[x.partner!]?.name ?? 'Your partner'} leads the next.`,
    );
  };
  // Phase 24.3. Getting home, however it ended: the days go by on the way back to the Lot.
  const homeward = (e: { name: string; home: number }) => {
    for (let d = 0; d < e.home; d++) sleep('away');
    line(
      `Back at the Lot after ${e.home === 1 ? 'a day' : `${e.home} days`} on the road home from ${e.name}.`,
    );
  };
  // Phase 24.5. Home, however it ended: your partner closer or further for it, the road
  // back, the trip in the book, and its card.
  const cameHome = (end: TripEnd) => {
    const x = s.expedition!;
    const e = EXPEDITIONS[x.id]!;
    s.expedition = null;
    const d = x.partner ? tripBond(e, end, x.pitch) : 0;
    if (x.partner && d) bond(x.partner, meet(x.partner).bond + d);
    homeward(e);
    s.book.push({
      id: x.id,
      day: s.day,
      end,
      high: x.pitch,
      partner: x.partner,
      nights: x.nights,
      seen: [...x.seen],
      told: false,
    });
    events.push({ k: 'home', id: x.id });
  };
  // Phase 24. The summit: paid the first time (Phase 24.9, Evan's call: a summit pays once, as
  // a wall does, or one you're well past is a farm), a lesson for the head, and home.
  const summit = () => {
    const x = s.expedition!;
    const e = EXPEDITIONS[x.id]!;
    const pay = tripPay(s, x.id);
    if (pay) spend({ cash: pay });
    train({ head: EXPED.head });
    const who = x.partner ? `, with ${PEOPLE[x.partner]?.name ?? x.partner}` : ', alone';
    line(
      pay
        ? `${e.name}: the summit of ${e.objective}, on day ${x.day}${who}. The sponsors pay ${money(pay)}, and you'll be telling this one for years. ${skillsNote({ head: EXPED.head })}.`
        : `${e.name}: the summit of ${e.objective} again, on day ${x.day}${who}. Nobody pays for the same photos twice. ${skillsNote({ head: EXPED.head })}.`,
    );
    cameHome('summit');
  };
  // A night on the portaledge: less back than the night before, the rations eaten, the wall a
  // day older. Out of days, and it's home with what you fixed.
  const portaledge = () => {
    const x = s.expedition!;
    const e = EXPEDITIONS[x.id]!;
    // Out of food and water (Phase 24.2): there's no night up here without them.
    if (x.food <= 0) {
      line(`${e.name}: the water's gone. You rap off with ${x.pitch} of ${e.pitches} pitches fixed.`);
      cameHome('water');
      return;
    }
    x.food -= 1;
    const back = nightGives(x.nights, x.ledge, bagKg(e, x.food, x.ledge, x.stove));
    sleep('exped', back);
    s.fed = clamp100(Math.max(s.fed, EXPED.ration));
    x.nights += 1;
    x.day += 1;
    if (x.day > e.days) {
      line(
        `${e.name}: out of time, ${x.pitch} of ${e.pitches} pitches fixed. You fly home with a story and nothing else.`,
      );
      cameHome('time');
      return;
    }
    // Phase 24.4: some mornings, something happens up there. Never twice a trip, never more
    // than a couple; the stove's only where there's one and the water's snow, and somebody
    // else's bad day only with a partner to share it.
    if (x.seen.length >= EXPED.events.max) return;
    const roll = Rng.fromStream(s.seed, 'events').derive(`wall-${x.id}-${s.day}`);
    if (roll.next() >= EXPED.events.odds) return;
    const can = WALL_EVENTS.filter(
      (w) => !x.seen.includes(w.id) && (!w.melt || (e.melt && x.stove)) && (!w.roped || x.partner),
    );
    const w = can[Math.floor(roll.next() * can.length)];
    if (!w) return;
    x.seen.push(w.id);
    s.encounter = { kind: 'wall', id: w.id };
    events.push({ k: 'encounter', kind: 'wall', id: w.id });
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
      // A knock on the van (Phase 22.6a): the night waits for your answer.
      const night = nightAt(s);
      const k = night.rough ? null : knockTonight(s, night.spot);
      if (k) {
        s.encounter = { kind: 'knock', id: k.id };
        s.deck = { ...s.deck, last: s.day, knock: s.day, seen: [...s.deck.seen, k.id].slice(-10) };
        events.push({ k: 'encounter', kind: 'knock', id: k.id });
        return null;
      }
      sleep();
      return null;
    }
    const cost = actCost(s, d);
    // The lake's catch is rolled when you cast, at the hour you cast (Phase 22.3b).
    const caught = d.fish ? fishCatch(s) : 0;
    // So is a hustle's take (Phase 22.5a), by the day.
    const take = d.hustle ? hustleTake(s, d.hustle) : 0;
    spend(cost);
    for (const f of d.sets ?? []) if (!s.today.includes(f)) s.today.push(f);
    if (d.trains) train(d.trains);
    if (d.dog?.adopt) s.dog = { name: nextDogName(s), since: s.day, fed: 60, bond: 0 };
    if (s.dog && d.dog?.fill) s.dog.fed = 100;
    if (s.dog && d.dog?.bond) dogBond(d.dog.bond);
    if (d.gear) s.gear[d.gear.id] = d.gear.set ?? (s.gear[d.gear.id] ?? 0) + (d.gear.add ?? 0);
    if (d.van) s.van[d.van] = 100;
    // Phase 22.3: the pantry, the meals, the day's fuel, and the cups of coffee.
    if (d.buys) s.pantry[d.buys] = (s.pantry[d.buys] ?? 0) + INGREDIENTS[d.buys]!.servings;
    if (d.recipe) {
      const r = RECIPES[d.recipe]!;
      for (const u of r.uses) s.pantry[u] = (s.pantry[u] ?? 0) - 1;
      if (r.fuels) s.fueled = s.day;
    }
    if (d.meal) {
      s.meals.push(d.meal);
      if (s.meals.length > FOOD.same) s.meals.splice(0, s.meals.length - FOOD.same);
    }
    // Supplies (Phase 22.4c).
    if (d.supplies) s.supplies = Math.min(100, s.supplies + d.supplies);
    // A doctor (Phase 22.4c): half of what's left of a sickness, and a toothache seen to.
    if (d.doctor && s.sick) {
      if (s.sick.kind === 'toothache' || s.sick.until - s.day <= 1) {
        s.sick = null;
        line('Seen to. You feel better before you’re back at the van.');
      } else {
        s.sick = { ...s.sick, until: s.day + Math.ceil((s.sick.until - s.day) / 2) };
        line('Rest, fluids, and something from the pharmacy. It’ll pass sooner.');
      }
    }
    // The clinic (Phase 22.4a): physio takes a day off, cortisone half of what's left.
    if (d.clinic && s.injury) {
      const left = s.injury.until - s.day;
      const cut = d.clinic === 'physio' ? CLINIC.physio.days : Math.floor(left / 2);
      s.injury = { ...s.injury, until: s.injury.until - cut };
      if (d.clinic === 'cortisone') s.jab = s.day;
      if (s.injury.until <= s.day) heal();
      else line(`${cut === 1 ? 'A day' : `${cut} days`} off your ${s.injury.kind}.`);
    }
    // Physio settles a flare of an old injury, too.
    if (d.clinic === 'physio' && s.flare) {
      line(`The physio works on your old ${MARK_NAME[s.flare.area as Mark]} injury. It settles.`);
      s.flare = null;
    }
    // The lake: whatever bites, cooked on the shore.
    if (d.fish) {
      const n = caught;
      s.fed = clamp100(s.fed + n * LAKE.fish);
      line(
        n === 0
          ? 'Two hours, one nibble, no fish. The lake wins this round.'
          : `${n === 1 ? 'A trout' : `${n} trout`}, cooked on a flat rock by the water. +${n * LAKE.fish} food.`,
      );
    }
    // The hustle (Phase 22.5a): cans are cash; the bins and the shore are a meal, when
    // there's one.
    if (d.hustle === 'cans') {
      spend({ cash: take });
      line(`A bag of cans to the depot. ${money(take)}.`);
    } else if (d.hustle) {
      s.fed = clamp100(s.fed + take);
      if (take) {
        s.meals.push(d.hustle);
        if (s.meals.length > FOOD.same) s.meals.splice(0, s.meals.length - FOOD.same);
      }
      line(
        d.hustle === 'bins'
          ? take
            ? `Day-old bread and a bag of bruised apples. +${take} food.`
            : 'Someone got there first. The bins are empty but for cardboard.'
          : `Greens, a handful of berries, some mushrooms you’re fairly sure about. +${take} food.`,
      );
    }
    if (d.coffee) {
      if (coffeesToday(s) >= FOOD.coffees)
        line('One cup too many. Your hands shake and your head doesn’t get the memo.');
      s.today.push('coffee');
    }
    // Tips, where a job has them, on top of the shift's pay.
    const tips = d.job ? tipsFor(s, d.job.id) : 0;
    if (tips) spend({ cash: tips });
    if (d.says)
      line(
        d.job
          ? `${d.says} +${money((cost.cash ?? 0) + tips)}${tips ? `, ${money(tips)} of it tips` : ''}.`
          : d.says,
      );
    if (d.saysOneOf) line(ofDay(s, id, d.saysOneOf));
    if (d.job) {
      // Only a shift you signed up for counts toward promotion; a walk-in just pays.
      const job = d.job.id;
      const booked = s.shifts.findIndex((x) => x.job === job && x.day === s.day);
      if (booked < 0) {
        line('A walk-in: paid, and that’s all. Signed-up shifts are the ones that count toward a raise.');
        return null;
      }
      s.shifts.splice(booked, 1);
      const was = rankAt(s, job);
      s.jobs[job] = shiftsAt(s, job) + d.job.shifts;
      const now = rankAt(s, job);
      if (now > was)
        line(
          `Promoted: ${rankName(s, job)}. That's +${money(raiseAt(s, job) - JOBS[job]!.raise * was)} a shift.`,
        );
    }
    return null;
  };
  // The van's miles: tires and engine wear by the minute.
  const wear = (min: number) => {
    s.van.tires = round2(Math.max(0, s.van.tires - VAN.wear.tires * min));
    s.van.engine = round2(Math.max(0, s.van.engine - VAN.wear.engine * min));
  };
  // Getting there, however you did.
  const arriveAt = (id: string) => {
    s.at = id;
    s.x = null;
    // Every drive with Scout is a ride-along; out at the crag he gets up to something.
    if (s.dog) dogBond(DOG.rideBond);
    if (PLACES[id]!.crag) {
      s.trips += 1;
      // Psyche (Phase 22.4d): a day out, and somewhere you'd never been, if you hadn't. A crag
      // you'd logged a line at before this was counted is one you'd been to.
      const been = s.crags.includes(id) || Object.keys(s.routes).some((r) => ROUTES[r]?.place === id);
      if (!s.crags.includes(id)) s.crags.push(id);
      const flag = been ? 'crag' : 'new-crag';
      if (!s.today.includes(flag)) s.today.push(flag);
      if (s.trips === DOG.offerTrips && !s.dog) line(DOG_OFFER.first);
      if (s.dog && !s.today.includes('dog-out')) {
        s.today.push('dog-out');
        line(dogLine(s, 'crag')!);
      }
    }
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
  // Phase 22.9b: a blackjack hand played out: the dealer draws if you're still in, and the
  // table pays what it owes.
  const settleBj = () => {
    const c = s.cards!;
    const h = c.bj!;
    const deck = bjDeck(s, c.hands);
    const name = PEOPLE[c.who]?.name ?? c.who;
    let dealer = h.dealer;
    if (bjTotal(h.you).n <= 21 && !isBlackjack(h.you) && !isBlackjack(h.dealer))
      dealer = dealerPlays(h.dealer, deck, h.next).dealer;
    const { back, how } = bjSettle(h.you, dealer, h.bet);
    c.chips += back;
    c.hands++;
    c.bj = null;
    const you = `${cardsName(h.you)} (${bjTotal(h.you).n})`;
    const them = `${cardsName(dealer)} (${bjTotal(dealer).n})`;
    const net = back - h.bet;
    const SAY: Record<string, string> = {
      blackjack: `Blackjack. ${name} pays you ${money(net)} without looking happy about it.`,
      'dealer blackjack': `${name} turns over ${them}. Blackjack. ${money(h.bet)} gone.`,
      bust: `${you}: bust. ${money(h.bet)} to ${name}.`,
      'dealer bust': `You stand on ${you}. ${name} draws to ${them} and busts. Up ${money(net)}.`,
      win: `${you} against ${them}. Up ${money(net)}.`,
      push: `${you} against ${them}. A push.`,
      lose: `${you} against ${them}. ${money(h.bet)} to ${name}.`,
    };
    line(SAY[how]!);
  };
  // A hold'em hand to its next street, or to the showdown after the river.
  const nextStreet = () => {
    const he = s.cards!.he!;
    if (he.street < 2) {
      he.street++;
      return;
    }
    const c = s.cards!;
    const name = PEOPLE[c.who]?.name ?? c.who;
    const mine = handValue([...he.you, ...he.board]);
    const theirs = handValue([...he.them, ...he.board]);
    const shown = `${name} shows ${cardsName(he.them)}, ${handWord([...he.them, ...he.board])}. You have ${handWord([...he.you, ...he.board])}.`;
    if (mine === theirs) {
      c.chips += he.pot / 2;
      endHoldem(null, `${shown} A split pot.`);
    } else endHoldem(mine > theirs, shown);
  };
  // A hold'em hand over: the pot to whoever took it, a hand played on them, and a bet of yours
  // on the river they called and beat goes down as caught.
  const endHoldem = (won: boolean | null, said: string) => {
    const c = s.cards!;
    const he = c.he!;
    const name = PEOPLE[c.who]?.name ?? c.who;
    const r = (s.reads[c.who] ??= { hands: 0, caught: 0 });
    const had = readsOn(s, c.who).length;
    r.hands++;
    if (won === false && he.bet && he.street === 2) r.caught++;
    if (won) c.chips += he.pot;
    c.hands++;
    c.he = null;
    const outcome =
      won === null ? '' : won ? ` You take ${money(he.pot)}.` : ` ${name} takes ${money(he.pot)}.`;
    line(`${said}${outcome}`);
    const now = readsOn(s, c.who);
    if (now.length > had) line(`You’re getting a read on ${name}: ${now[now.length - 1]}`);
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

  // What a hitchhiker or a stop does to you (Phase 22.6b), a share `k` of it for a stop
  // you've pulled in at before.
  const roadFx = (fx: RoadFx, k = 1) => {
    if (fx.cash) spend({ cash: fx.cash });
    if (fx.energy) s.energy = clamp100(s.energy + Math.round(fx.energy * k));
    if (fx.skin) s.skin = clamp100(s.skin + Math.round(fx.skin * k));
    if (fx.fed) s.fed = clamp100(s.fed + Math.round(fx.fed * k));
    const p = roadPsyche((fx.psyche ?? 0) * k);
    if (p) s.psyche = { ...s.psyche, level: clamp100(s.psyche.level + p) };
    if (fx.guitar) s.guitar = round2(s.guitar + fx.guitar);
    if (fx.beta) {
      const l = lessonAt(s);
      if (l) {
        const c = l.r.cruxes.find((x) => x.id === l.crux)!;
        const b = l.r.beta[l.beta]!;
        learn(
          l.r.id,
          l.beta,
          'told',
          `On the receipt: ${l.r.name}, at ${c.name.replace(/^The /, 'the ')}, ${b.short}. New beta: ${b.name.toLowerCase()}.`,
        );
      }
    }
  };
  // An answer on the road: false if there's no such answer.
  const road_ = (e: NonNullable<GameState['encounter']>, i: number): boolean => {
    if (e.kind === 'hitch') {
      const h = hitcherById(e.id);
      const opts = h ? hitchOpts(s, h) : [];
      const o = opts[i];
      if (!h || !o) return false;
      s.encounter = null;
      // The first time you pick them up, they remember what you did; drive past, and they
      // don't know you yet.
      if (s.deck.met[h.id] === undefined && i < h.opts.length)
        s.deck = { ...s.deck, met: { ...s.deck.met, [h.id]: i } };
      line(o.out);
      roadFx(o.fx);
      return true;
    }
    const x = stopById(e.id);
    if (!x || i > 1) return false;
    s.encounter = null;
    if (i === 1) {
      line('You keep driving. It’ll be there next time.');
      return true;
    }
    const first = !s.deck.stops.includes(x.id);
    spend({ min: EVENTS.stop.min });
    if (first) s.deck = { ...s.deck, stops: [...s.deck.stops, x.id] };
    line(first ? `${x.name}. ${x.blurb}` : `${x.name} again. Still good, if not quite like the first time.`);
    roadFx(x.fx, first ? 1 : EVENTS.stop.again);
    return true;
  };

  // Bond with your dog, and each perk it earns said the day it does (Phase 22.7).
  const dogBond = (add: number) => {
    const d = s.dog!;
    const was = d.bond;
    d.bond = Math.min(100, d.bond + add);
    for (const [p, at] of Object.entries(DOG.perks) as [Perk, number][])
      if (was < at && d.bond >= at) line(fill(DOG_PERK_LINE[p], { name: d.name }));
  };

  // A call on the walk out (Phase 22.6c): it adds up, and the last stage's call gets you
  // out, clean, rough or hurt, and says so, in the journal too.
  const walkOut = (e: NonNullable<GameState['encounter']>, i: number): boolean => {
    const ep = epicByKind(e.id);
    const stage = e.stage ?? 0;
    const o = ep?.stages[stage]?.opts[i];
    if (!ep || !o || !e.tally) return false;
    const t = {
      risk: e.tally.risk + o.risk,
      energy: e.tally.energy + (o.energy ?? 0),
      fed: e.tally.fed + (o.fed ?? 0),
      skin: e.tally.skin + (o.skin ?? 0),
      psyche: e.tally.psyche + (o.psyche ?? 0),
      hours: e.tally.hours + (o.hours ?? 1),
    };
    if (stage + 1 < ep.stages.length) {
      s.encounter = { ...e, stage: stage + 1, tally: t };
      return true;
    }
    s.encounter = null;
    const end = epicEnd(t.risk);
    spend({ min: t.hours * 60 });
    s.energy = clamp100(s.energy + t.energy);
    s.fed = clamp100(s.fed + t.fed);
    s.skin = clamp100(s.skin + t.skin);
    s.psyche = { ...s.psyche, level: clamp100(s.psyche.level + roadPsyche(t.psyche + EVENTS.epic.psyche)) };
    line(ep.ends[end]);
    note(`${ep.title} at ${PLACES[s.at]!.name}: ${ep.story[end]}.`);
    if (end === 'bad') {
      // Hurt on the way out: an ankle, a tier 1 or 2, seeded by the day.
      const r = Rng.fromStream(s.seed, 'events').derive(`epic-hurt-${s.day}`);
      const tier = (r.next() < 0.5 ? 1 : 2) as 1 | 2;
      const [lo, hi] = INJURY.days[tier - 1]!;
      injure(
        { kind: LANDING_NAME[tier - 1]!, tier, until: s.day + 1 + r.int(lo, hi) },
        `Somewhere on the way out: a ${LANDING_NAME[tier - 1]}.`,
      );
    }
    return true;
  };

  // A Free Solo run that ended: nothing more happens to this climber.
  if (s.dead) return refuse('That climber is gone.');

  // A hand of liar's dice (Phase 22.9a): finish it first.
  if (s.table && a.t !== 'dice' && a.t !== 'stand' && a.t !== 'pick') return refuse('Finish the hand first.');
  // Sat at cards (Phase 22.9b): get up first.
  if (s.cards && a.t !== s.cards.game && a.t !== 'stand' && a.t !== 'pick')
    return refuse('You’re sat at cards.');

  // Someone at the door (Phase 22.6): nothing happens until you've answered.
  if (s.encounter && a.t !== 'answer' && a.t !== 'stand' && a.t !== 'pick')
    return refuse(s.encounter.kind === 'knock' ? 'Someone’s at the door.' : 'First things first: an answer.');

  // Broken down on the road: nothing happens until you've found a way out.
  if (s.breakdown && a.t !== 'fix' && a.t !== 'stand' && a.t !== 'pick')
    return refuse('The van’s broken down. First things first.');

  // Away on an expedition: the valley waits. Only the expedition's own day goes on.
  // Phase 24: up there, a pitch of yours is a go like any other.
  const upThere =
    (a.t === 'go' || a.t === 'done' || a.t === 'rest' || a.t === 'name') &&
    EXPED_ROUTES[a.route]?.exped === s.expedition?.id;
  // Something happening up there (Phase 24.4) is answered like any encounter.
  const wallCall = a.t === 'answer' && s.encounter?.kind === 'wall';
  if (s.expedition && a.t !== 'exped' && a.t !== 'stand' && a.t !== 'pick' && !upThere && !wallCall)
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
      // Phase 24.2: book a trip, paid up front; cancel it for half back; leave on the day.
      if (a.do === 'book') {
        if (s.expedition) return refuse("You're already away.");
        if (s.booked) return refuse(`You’re booked for ${EXPEDITIONS[s.booked.id]!.name} already.`);
        if (!a.plan) return refuse('Plan it first.');
        const why = planBlocked(s, a.id, a.plan);
        if (why) return refuse(`${why}.`);
        const cost = planCost(s, a.id, a.plan);
        if (s.cash < cost) return refuse(`${e.name} costs ${money(cost)}, in hand.`);
        spend({ cash: -cost });
        s.booked = { id: a.id, ...a.plan };
        // A week's notice and the shifts in the trip come off the schedule; any less and
        // they're still yours to miss (Phase 24.3).
        const w = tripDays(a.id, a.plan.day);
        const clash = s.shifts.filter((x) => x.day >= w.from && x.day <= w.to);
        if (clash.length && a.plan.day - s.day >= EXPED.notice) {
          s.shifts = s.shifts.filter((x) => !clash.includes(x));
          line(
            `You give notice: ${clash.length === 1 ? 'a shift comes' : `${clash.length} shifts come`} off your week.`,
          );
        } else if (clash.length)
          line(
            `That's ${clash.length === 1 ? 'a shift' : `${clash.length} shifts`} you're signed up for while you're away. Short notice: they'll count as missed.`,
          );
        line(
          a.plan.day === s.day
            ? `${e.name}, booked and paid for. You leave today.`
            : `${e.name}, booked and paid for. You fly out on day ${a.plan.day}.`,
        );
        break;
      }
      if (a.do === 'cancel') {
        const b = s.booked;
        if (!b || b.id !== a.id) return refuse('Nothing booked.');
        const back = Math.round(planCost(s, b.id, b) * EXPED.refund);
        s.booked = null;
        spend({ cash: back });
        line(`You cancel ${e.name}. ${money(back)} comes back; the rest is the airline's.`);
        break;
      }
      if (a.do === 'go') {
        const b = s.booked;
        if (s.expedition) return refuse("You're already away.");
        if (!b || b.id !== a.id) return refuse('Book it first.');
        if (b.day !== s.day) return refuse(`Your flight is on day ${b.day}.`);
        if (s.at !== 'lot') return refuse('Expeditions leave from the Lot.');
        if (s.mode !== 'solo' && (!b.partner || !partners(s).includes(b.partner)))
          return refuse(`${PEOPLE[b.partner ?? '']?.name ?? 'Your partner'} won’t come now.`);
        if (s.wall) s.wall = null;
        s.booked = null;
        // Getting there (Phase 24.3): the days go by on the way.
        line(e.getThere);
        for (let d = 0; d < e.out; d++) sleep('away');
        s.expedition = {
          id: a.id,
          day: 1,
          pitch: 0,
          partner: b.partner,
          nights: 0,
          food: b.food,
          ledge: b.ledge,
          stove: b.stove,
          seen: [],
        };
        s.min = DAY.wakeMin;
        line(
          `${e.name}, ${e.region}: ${e.objective}. ${e.pitches} pitches, food and water for ${b.food + 1} days${b.partner ? `, with ${PEOPLE[b.partner]?.name ?? b.partner}. You lead first` : ', alone'}.${s.dog ? ' The dog stays with friends at the Lot.' : ''}`,
        );
        break;
      }
      const x = s.expedition;
      if (!x || x.id !== a.id) return refuse("You're not on it.");
      if (a.do === 'bail') {
        line(
          `${e.name}: you rap off, ${x.pitch} of ${e.pitches} pitches fixed. Nobody argues with going home alive.`,
        );
        cameHome('bail');
        break;
      }
      if (a.do === 'camp') {
        line(
          stormOn(s.seed, a.id, e, s.day)
            ? 'The storm on the wall all day. You sit it out on the portaledge.'
            : 'You clip in for the night. The ledge creaks; the haul bag swings.',
        );
        portaledge();
        break;
      }
      // Their block, or yours handed over: you second and haul while they lead, and the day's done.
      if (!x.partner) return refuse('Nobody to hand it to. You’re alone up here.');
      if (stormOn(s.seed, a.id, e, s.day)) return refuse('A storm’s on the wall. Nobody leads in this.');
      if (s.today.includes('exped')) return refuse('That’s the day.');
      const name = PEOPLE[x.partner]?.name ?? x.partner;
      const fixed = partnerDay(s, e, a.id, x.partner, x.pitch);
      spend({ energy: -EXPED.follow });
      s.today.push('exped');
      climbedWith(x.partner);
      x.pitch += fixed;
      if (x.pitch >= e.pitches) {
        summit();
        break;
      }
      line(
        fixed
          ? `${name} leads ${fixed === 1 ? 'a pitch' : `${fixed} pitches`}. You jug and haul behind. ${e.pitches - x.pitch} to go.`
          : `${name} spends the day on pitch ${x.pitch + 1} and comes back down it. Tomorrow.`,
      );
      break;
    }

    case 'signup': {
      const why = signupBlocked(s, a.job, a.day, a.on);
      if (why) return refuse(why);
      if (a.on) {
        s.shifts.push({ job: a.job, day: a.day });
        s.shifts.sort((x, y) => x.day - y.day);
      } else s.shifts = s.shifts.filter((x) => !(x.job === a.job && x.day === a.day));
      break;
    }

    case 'spot': {
      if (!(a.spot in SPOTS)) return refuse('No such spot.');
      const why = spotBlocked(s, a.spot);
      if (why) return refuse(why);
      s.spot = a.spot;
      break;
    }

    case 'insure': {
      if (!(a.plan in PLANS)) return refuse('No such plan.');
      s.insurance = a.plan;
      break;
    }

    case 'lifestyle': {
      if (!(a.tier in LIFESTYLE)) return refuse('Not a way to live.');
      s.lifestyle = a.tier;
      break;
    }

    // Phase 23.4: a path's next tier, claimed.
    case 'path': {
      if (!s.climber.name) return refuse('Make a climber first.');
      const why = pathBlocked(s, a.id);
      if (why) return refuse(why);
      const p = PATHS[a.id]!;
      const n = tiersOn(s, a.id) + 1;
      s.paths = { ...s.paths, tiers: { ...s.paths.tiers, [a.id]: n } };
      const t = p.tiers[n - 1]!;
      line(
        n === p.tiers.length
          ? `${t.name}. ${p.title}: ${p.line}`
          : `${p.name}: ${t.name}. ${edgeText(t.edge)}`,
      );
      break;
    }

    // Phase 23.3: what you're climbing for, for good.
    case 'calling': {
      if (!s.climber.name) return refuse('Make a climber first.');
      if (s.calling.id) return refuse('You know what you’re climbing for.');
      if (!OPEN_CALLINGS.includes(a.id)) return refuse('Not one you can take up.');
      s.calling = { id: a.id, since: s.day, rungs: [], offered: true };
      // The crowds hear about it (v0.956's shifts, Phase 23.5).
      s.scene = shift(s.scene, CALLING_SCENE[a.id] ?? {});
      line(`${CALLINGS[a.id]!.name}. You say it out loud, once, to nobody.`);
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
        // Phase 23.2: they say where they came from, and nothing's re-dealt.
        s.origin = CAME_ACROSS;
        s.talents = { ids: [], known: [], from: { ...skills } };
        break;
      }
      const start = STARTS[a.start];
      if (!start) return refuse('Pick how you climb.');
      const origin = a.origin ? ORIGINS[a.origin] : undefined;
      if (a.origin && !origin) return refuse('Pick where you came from.');
      const skills = { ...start.skills };
      // Phase 23.2: where you came from, on top of how you climb; and what's in you, dealt.
      if (origin) {
        for (const [k, v] of Object.entries(origin.skills) as [keyof Skills, number][])
          skills[k] = Math.max(1, skills[k] + v);
        s.cash += origin.fx.cash ?? 0;
        s.origin = a.origin!;
      }
      s.climber = { name, start: a.start, skills };
      // Talents come with an origin: the climber the screen makes; a bare one (a test's, a
      // bot's) gets neither.
      s.talents = { ids: origin ? dealTalents(s.seed) : [], known: [], from: { ...skills } };
      if (origin) line(origin.open);
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
      const from = s.at;
      const r = road(s.at, a.to);
      const to = PLACES[a.to];
      if (!r || !to) return refuse("There's no road there.");
      if (to.minGrade !== undefined && gradeOf(s.climber.skills) < to.minGrade)
        return refuse(`${to.name}: ${to.locked ?? 'not yet.'}`);
      if (to.unlock && !s.unlocked.includes(a.to))
        return refuse(`${to.name} is a trip you haven't paid for yet: ${money(to.unlock)}, once.`);
      // A maxed-out card never strands you: you drive on what's in the tank. A permit isn't
      // gas: the ranger doesn't take fumes.
      // The old guard's say-so gets you in free (Phase 23.5).
      const permit = permitFor(s, a.to);
      if (permit && headroom(s) < permit)
        return refuse(`${to.name} needs a ${money(permit)} permit, and the card won't cover it.`);
      // The van first: a flat battery gets a jump for a drive across town, and a part that's
      // shot won't take a drive out of town either, except home or to the garage. Town is
      // always in reach, so a broke climber can always get to a shift.
      const fixing = a.to === 'garage' || a.to === 'lot';
      if (s.van.battery <= 0 && r.min >= VAN.from && !fixing)
        return refuse(
          'The battery’s flat. A jump gets you across town, not out of it. The garage is in Midtown.',
        );
      const shot = unsafePart(s);
      if (shot && r.min >= VAN.from && !fixing)
        return refuse(
          `The ${PART_NAME[shot].toLowerCase()} won’t make it out of town. The garage is in Midtown.`,
        );
      // The walk out (Phase 22.6c): before the drive, the trail back to the van, which can
      // turn into a night of its own. You drive once you're out.
      const epic = epicNow(s, from);
      if (epic) {
        s.encounter = {
          kind: 'epic',
          id: epic,
          stage: 0,
          tally: { risk: 0, energy: 0, fed: 0, skin: 0, psyche: 0, hours: 0 },
        };
        s.deck = { ...s.deck, last: s.day, epic: s.day };
        events.push({ k: 'encounter', kind: 'epic', id: epic });
        break;
      }
      spend({ cash: -permit });
      if (s.wall) {
        line(`You rap off ${WALLS[s.wall.id]!.name}. The wall will be there.`);
        s.wall = null;
      }
      const gas = gasFor(s, r.cash);
      const declined = gas > 0 && headroom(s) < gas;
      const broke = breakdownRoll(s, r.min, a.to);
      wear(broke ? Math.round(r.min / 2) : r.min);
      spend({ cash: declined ? 0 : -gas, energy: r.min >= 30 ? -BODY.driveEnergy : 0 });
      if (declined) line("The card's declined at the pump. You make it on fumes.");
      else if (gas >= 12) line(`Gas, ${money(gas)}. The van starts on the second try.`);
      else if (gas > 0) line(`Gas, ${money(gas)}.`);
      if (permit) line(`Permit, ${money(permit)}. The ranger doesn't look up.`);
      if (broke) {
        const half = Math.round(r.min / 2);
        spend({ min: half });
        s.van[broke] = Math.min(s.van[broke], VAN.broken);
        s.breakdown = { part: broke, to: a.to, rest: r.min - half, bodged: false };
        line(BREAKDOWN_LINE[broke]);
        break;
      }
      spend({ min: r.min });
      arriveAt(a.to);
      // On the road (Phase 22.6b): a hitchhiker or a stop, waiting on you at the other end.
      const e = driveEncounter(s, from, a.to);
      if (e) {
        s.encounter = e;
        s.deck = { ...s.deck, last: s.day, [e.kind]: s.day };
        events.push({ k: 'encounter', kind: e.kind, id: e.id });
        break;
      }
      // Phase 23.5: at the crag, a call you made coming back, or a new one put to you.
      const echo = echoDue(s);
      const call = echo ? null : stanceDue(s, a.to);
      if (echo) {
        s.encounter = { kind: 'echo', id: echo };
        s.scene = { ...s.scene, echoLast: s.day };
        events.push({ k: 'encounter', kind: 'echo', id: echo });
      } else if (call) {
        s.encounter = { kind: 'stance', id: call };
        s.scene = { ...s.scene, last: s.day };
        events.push({ k: 'encounter', kind: 'stance', id: call });
      }
      break;
    }

    // A breakdown's way out: a tow to the garage, a bodge, limping on, or a friend.
    case 'fix': {
      const b = s.breakdown;
      if (!b) return refuse('The van’s running.');
      const dest = PLACES[b.to]!.name;
      if (a.how === 'tow') {
        spend({ cash: -VAN.tow.cash, min: VAN.tow.min });
        s.breakdown = null;
        line(
          `A tow truck, ${money(VAN.tow.cash)} and an hour and a half. The van rides to the garage backwards.`,
        );
        arriveAt('garage');
      } else if (a.how === 'bodge') {
        if (b.bodged) return refuse('You’ve tried that. It isn’t going to hold.');
        b.bodged = true;
        spend({ min: VAN.bodge.min });
        if (!bodgeHolds(s)) {
          line(BODGE_FAILED[b.part]);
          break;
        }
        s.van[b.part] = VAN.bodge.to;
        s.breakdown = null;
        line(BODGE_HELD[b.part]);
        spend({ min: b.rest });
        arriveAt(b.to);
      } else if (a.how === 'limp') {
        spend({ min: b.rest * VAN.limp.slow, energy: -VAN.limp.energy });
        s.breakdown = null;
        line(`You limp the rest of the way to ${dest}, hazards on, at half the speed of anything else.`);
        arriveAt(b.to);
      } else {
        const who = friendFor(s);
        // A hitchhiker you were good to, if nobody you'd call can (Phase 22.6b).
        const hitch = who ? null : hitchFriend(s);
        if (!who && !hitch) return refuse('Nobody you’d call for this. Not yet.');
        spend({ min: VAN.friend.min });
        s.van[b.part] = Math.max(s.van[b.part], VAN.friend.to);
        s.breakdown = null;
        line(
          who
            ? `${PEOPLE[who]!.name} drives out with a jack and a thermos, and doesn't mention it again. Not much, anyway.`
            : `${hitch!.friend![0]!.toUpperCase()}${hitch!.friend!.slice(1)} pulls up behind you. They remember the ride: a jack, a hand, and no talk of owing anybody.`,
        );
        spend({ min: b.rest });
        arriveAt(b.to);
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
      if (!r || (r.exped ? r.exped !== s.expedition?.id : r.place !== s.at))
        return refuse("That line isn't here.");
      const why = goBlocked(s, r);
      if (why) return refuse(`${why}.`);
      // Phase 24: up there there's no crowd, no queue and no sun on it; your partner belays.
      // Phase 23.4: how you climb, counted before the go takes its toll.
      s.habits = countGo(s, r);
      if (r.exped) {
        spend(goCost(r, s));
        const L = logOf(s, a.route);
        L.goes += 1;
        L.goesToday += 1;
        if (s.expedition!.partner) climbedWith(s.expedition!.partner);
        if (!s.today.includes('exped')) s.today.push('exped');
        break;
      }
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

    // Phase 22.9a: horseshoes at the fire, against everyone there. Bond with each, as a day
    // climbing together gives, and no more than one a day.
    case 'shoes': {
      const why = gameBlocked(s, 'shoes');
      if (why) return refuse(`${why}.`);
      if (a.throws.length !== GAMES.shoes.throws || !a.throws.every((x) => [0, 0.5, 1].includes(x)))
        return refuse('Not a game.');
      const mine = a.throws.reduce((t, x) => t + throwPoints(x), 0);
      const ringers = a.throws.filter((x) => x === 1).length;
      const players = atFire(s);
      spend({ min: GAMES.min, energy: -GAMES.energy });
      s.today.push('shoes');
      const results = players.map((w) => {
        const them = theirShoes(s, w);
        const name = PEOPLE[w]?.name ?? w;
        climbedWith(w);
        return mine > them
          ? `you beat ${name}, ${mine} to ${them}`
          : mine < them
            ? `${name} beats you, ${them} to ${mine}`
            : `you and ${name} tie at ${mine}`;
      });
      line(
        `${ringersSaid(ringers)} in four throws, and ${results.join('; ')}. The stake rings the rest of the night in your head.`,
      );
      break;
    }

    // Phase 24.5: the last trip told at the fire, once. Everyone there counts it as a day
    // together, as the games do; psyche for you, more for a summit.
    case 'story': {
      const why = storyBlocked(s);
      if (why) return refuse(`${why}.`);
      const t = lastTrip(s)!;
      const ps = EXPED.story.psyche;
      spend({ min: EXPED.story.min });
      t.told = true;
      for (const w of atFire(s)) climbedWith(w);
      s.psyche = {
        ...s.psyche,
        level: clamp100(s.psyche.level + (t.end === 'summit' ? ps.summit : ps.short)),
      };
      line(fill(TRIP_STORY[t.end], tripWords(t)));
      break;
    }

    // Phase 22.9a: a hand of liar's dice with whoever's first at the fire.
    case 'dice': {
      if (a.do === 'deal') {
        const why = gameBlocked(s, 'dice');
        if (why) return refuse(`${why}.`);
        const who = atFire(s)[0]!;
        spend({ min: GAMES.min, energy: -GAMES.energy });
        s.today.push('dice');
        s.table = dealDice(s, who);
        climbedWith(who);
        break;
      }
      const t = s.table;
      if (!t) return refuse('No hand on the go.');
      const name = PEOPLE[t.who]?.name ?? t.who;
      const total = (face: number) => count(t.mine, face) + count(t.theirs, face);
      s.table = null;
      if (a.do === 'call') {
        const n = total(t.bid.face);
        line(
          n >= t.bid.n
            ? `You call it. The cups come up: ${bidWords(n, t.bid.face)}. ${name} was telling the truth, and enjoys it.`
            : `You call it. The cups come up: ${bidWords(n, t.bid.face)}. ${name} was bluffing, and takes it well, mostly.`,
        );
        break;
      }
      const bid = yourRaise(t);
      if (!theyCall(t, bid)) {
        line(`${bidSaid(bid.n, bid.face)}, you say. ${name} looks into the cup a long time and lets it go.`);
        break;
      }
      const n = total(bid.face);
      line(
        n >= bid.n
          ? `${bidSaid(bid.n, bid.face)}, you say, and ${name} calls it. ${bidSaid(n, bid.face)} on the table. Yours.`
          : `${bidSaid(bid.n, bid.face)}, you say, and ${name} calls it. ${bidSaid(n, bid.face)} on the table. ${name} is insufferable about it.`,
      );
      break;
    }

    // Phase 22.9b: blackjack at the fire, dealt by whoever's there.
    case 'bj': {
      if (a.do === 'sit') {
        const why = cardsBlocked(s, 'bj');
        if (why) return refuse(`${why}.`);
        const chips = Math.min(Math.floor(s.cash), GAMES.bj.cap);
        spend({ min: GAMES.min, energy: -GAMES.energy, cash: -chips });
        s.today.push('bj');
        s.cards = { game: 'bj', who: atFire(s)[0]!, chips, hands: 0, bj: null, he: null };
        line(`You sit down with ${money(chips)}. ${PEOPLE[s.cards.who]?.name ?? s.cards.who} shuffles.`);
        break;
      }
      const c = s.cards;
      if (!c || c.game !== 'bj') return refuse('You’re not sat at blackjack.');
      if (a.do === 'leave') {
        if (c.bj) return refuse('Finish the hand first.');
        s.cash += c.chips;
        s.cards = null;
        line(`You get up with ${money(c.chips)}.`);
        break;
      }
      if (a.do === 'deal') {
        if (c.bj) return refuse('There’s a hand on the go.');
        if (c.hands >= GAMES.bj.hands) return refuse('That’s the last hand tonight.');
        if (c.chips < GAMES.bj.bet) return refuse('Not enough in front of you for a hand.');
        const deck = bjDeck(s, c.hands);
        c.chips -= GAMES.bj.bet;
        c.bj = { you: [deck[0]!, deck[2]!], dealer: [deck[1]!, deck[3]!], next: 4, bet: GAMES.bj.bet };
        // The dealer peeks: a blackjack either side ends it now.
        if (isBlackjack(c.bj.dealer) || isBlackjack(c.bj.you)) settleBj();
        break;
      }
      const h = c.bj;
      if (!h) return refuse('No hand on the go.');
      const deck = bjDeck(s, c.hands);
      if (a.do === 'hit') {
        h.you.push(deck[h.next++]!);
        if (bjTotal(h.you).n >= 21) settleBj();
        break;
      }
      if (a.do === 'double') {
        if (h.you.length !== 2) return refuse('Only on your first two cards.');
        if (c.chips < h.bet) return refuse('Not enough in front of you to double.');
        c.chips -= h.bet;
        h.bet *= 2;
        h.you.push(deck[h.next++]!);
      }
      settleBj();
      break;
    }

    // Phase 22.9b: heads-up hold'em with someone at the fire, for money, and reads on them.
    case 'holdem': {
      if (a.do === 'sit') {
        const who = a.who ?? atFire(s)[0];
        const why = cardsBlocked(s, 'holdem', who);
        if (why) return refuse(`${why}.`);
        const chips = Math.min(Math.floor(s.cash), GAMES.holdem.cap);
        spend({ min: GAMES.min, energy: -GAMES.energy, cash: -chips });
        s.today.push('holdem');
        s.cards = { game: 'holdem', who: who!, chips, hands: 0, bj: null, he: null };
        line(`You sit down across from ${PEOPLE[who!]?.name ?? who} with ${money(chips)}.`);
        break;
      }
      const c = s.cards;
      if (!c || c.game !== 'holdem') return refuse('You’re not sat at hold’em.');
      const H = GAMES.holdem;
      if (a.do === 'leave') {
        if (c.he) return refuse('Finish the hand first.');
        s.cash += c.chips;
        s.cards = null;
        line(`You get up with ${money(c.chips)}.`);
        break;
      }
      if (a.do === 'deal') {
        if (c.he) return refuse('There’s a hand on the go.');
        if (c.hands >= H.hands) return refuse('That’s the last hand tonight.');
        if (c.chips < handNeeds('holdem')) return refuse('Not enough in front of you for a hand.');
        const deck = deckFor(s, `he-${c.who}-${s.day}-${c.hands}`);
        c.chips -= H.ante;
        c.he = {
          you: [deck[0]!, deck[2]!],
          them: [deck[1]!, deck[3]!],
          board: deck.slice(4, 9),
          street: 0,
          pot: 2 * H.ante,
          facing: 0,
          bet: false,
        };
        break;
      }
      const he = c.he;
      if (!he) return refuse('No hand on the go.');
      const B = H.bets[he.street]!;
      if (a.do === 'fold') {
        endHoldem(false, he.facing ? `You fold to the bet.` : `You fold.`);
        break;
      }
      if (he.facing) {
        if (a.do === 'bet') return refuse('Call it or fold.');
        c.chips -= he.facing;
        he.pot += 2 * he.facing;
        he.facing = 0;
        he.bet = false;
        nextStreet();
        break;
      }
      if (a.do === 'bet') {
        c.chips -= B;
        he.pot += B;
        he.bet = true;
        if (theirMove(s, he, c.who, true, c.hands) === 'fold') {
          endHoldem(true, `${PEOPLE[c.who]?.name ?? c.who} folds.`);
          break;
        }
        he.pot += B;
        nextStreet();
        break;
      }
      // A check: they bet, or the street goes by.
      he.bet = false;
      if (theirMove(s, he, c.who, false, c.hands) === 'bet') {
        he.facing = B;
        break;
      }
      nextStreet();
      break;
    }

    // Phase 22.8: a dream. Pick one, put cash in the pot toward it (in hand, not on the card),
    // take the pot back, or claim the dream once the pot covers it.
    case 'dream': {
      const D = s.dream;
      if (a.do === 'pick') {
        const d = dreamById(a.id ?? '');
        if (!d) return refuse('No such dream.');
        if (owns(s, d.id)) return refuse(`${d.name} is yours already.`);
        s.dream = { ...D, pick: d.id };
        line(`${d.name}, then. ${money(d.cost)}. The jar has ${money(D.pot)} in it.`);
        break;
      }
      if (a.do === 'stash') {
        const n = Math.floor(a.amount ?? 0);
        if (!(n > 0)) return refuse('Nothing to put in.');
        if (s.cash < n) return refuse('Not in hand. The jar takes cash, not the card.');
        s.cash -= n;
        s.dream = { ...D, pot: D.pot + n };
        line(`${money(n)} in the jar. ${money(D.pot + n)} saved.`);
        break;
      }
      if (a.do === 'take') {
        if (!D.pot) return refuse('The jar’s empty.');
        s.cash += D.pot;
        s.dream = { ...D, pot: 0 };
        line(`You tip the jar out: ${money(D.pot)}. It’ll be there to fill again.`);
        break;
      }
      const d = D.pick ? dreamById(D.pick) : undefined;
      if (!d) return refuse('Pick a dream first.');
      if (D.pot < d.cost) return refuse(`${d.name} is ${money(d.cost)}. The jar has ${money(D.pot)}.`);
      s.dream = { pick: null, pot: D.pot - d.cost, owned: [...D.owned, d.id] };
      // The Rig comes with every upgrade Dale fits; Home Base with a kitchen.
      if (d.id === 'rig') for (const u of Object.keys(UPGRADE)) s.gear[u] = 1;
      if (d.id === 'homebase') s.gear.kitchen = 1;
      line(d.claimed);
      note(`${d.name}, day ${s.day}. ${d.perk}`);
      break;
    }

    // Phase 22.6: an answer to the encounter you're in. A knock's answer, then the rest of
    // the night.
    case 'answer': {
      const e = s.encounter;
      // The last day (Phase 22.7): how you spend it, and then he's gone.
      if (e?.kind === 'farewell') {
        const o = DOG_FAREWELL.opts[a.opt];
        const d = s.dog;
        if (!o || !d) return refuse('Nobody’s asking.');
        const years = dogAge(d, s.day);
        s.encounter = null;
        line(o.out);
        line(
          fill(d.bond >= DOG.tiers[2]! ? DOG_FAREWELL.close.best : DOG_FAREWELL.close.other, {
            years: String(years),
          }),
        );
        note(
          `${d.name}, ${years} years. ${o.legacy[0]!.toUpperCase()}${o.legacy.slice(1)}. Best dog in the valley and everybody knew it.`,
        );
        s.dogs = [...s.dogs, { name: d.name, years, day: s.day }];
        s.dog = null;
        break;
      }
      if (e?.kind === 'epic') {
        if (!walkOut(e, a.opt)) return refuse('Nobody’s asking.');
        break;
      }
      // Phase 24.4: up on the wall, the call and what it costs.
      if (e?.kind === 'wall') {
        const w = wallEventById(e.id);
        const o = w?.opts[a.opt];
        const x = s.expedition;
        if (!w || !o || !x) return refuse('Nobody’s asking.');
        s.encounter = null;
        const fx = o.fx;
        line(o.out);
        if (fx.energy) s.energy = clamp100(s.energy + fx.energy);
        if (fx.food) x.food = Math.max(0, x.food + fx.food);
        if (fx.pitch) x.pitch = Math.max(0, x.pitch + fx.pitch);
        if (fx.ledge === false) x.ledge = false;
        if (fx.bond && x.partner) bond(x.partner, meet(x.partner).bond + fx.bond);
        if (fx.psyche) s.psyche = { ...s.psyche, level: clamp100(s.psyche.level + fx.psyche) };
        if (fx.day) portaledge();
        break;
      }
      // Phase 23.5: a call, or a call coming back, and where it leaves you.
      if (e?.kind === 'stance' || e?.kind === 'echo') {
        const echo = e.kind === 'echo' ? ECHOES[e.id] : undefined;
        const opts = echo ? echoOpts(echo) : stanceOpts(s, e.id);
        const o = opts[a.opt];
        if (!o) return refuse('Nobody’s asking.');
        s.encounter = null;
        s.scene = shift(s.scene, o.fx);
        if (echo) s.scene.echoes = [...s.scene.echoes, { id: e.id, turned: a.opt === 1, day: s.day }];
        else s.scene.stances = [...s.scene.stances, { id: e.id, opt: a.opt, day: s.day }];
        if (o.fx.energy) s.energy = clamp100(s.energy + o.fx.energy);
        if (o.fx.psyche) s.psyche = { ...s.psyche, level: clamp100(s.psyche.level + o.fx.psyche) };
        note(o.out);
        break;
      }
      if (e?.kind === 'hitch' || e?.kind === 'stop') {
        if (!road_(e, a.opt)) return refuse('Nobody’s asking.');
        break;
      }
      const k = e ? knockById(e.id) : undefined;
      const o = k?.opts[a.opt];
      if (!e || !k || !o) return refuse('Nobody’s asking.');
      const fx = o.fx;
      s.encounter = null;
      if (fx.cash) spend({ cash: fx.cash });
      if (fx.energy) s.energy = clamp100(s.energy + fx.energy);
      if (fx.supplies) s.supplies = Math.max(0, Math.min(100, s.supplies + fx.supplies));
      const p = knockPsyche(fx);
      if (p) s.psyche = { ...s.psyche, level: clamp100(s.psyche.level + p) };
      const host = drivewayHost(s);
      if (fx.bond && host) bond(host, meet(host).bond + fx.bond);
      line(o.out);
      sleep();
      break;
    }

    // Phase 22.5b: a set outside the café, and how clean it was (0 to 1).
    case 'busk': {
      const why = buskBlocked(s);
      if (why) return refuse(`${why}.`);
      if (!(a.acc >= 0 && a.acc <= 1)) return refuse('Not a set.');
      const was = guitarRank(s.guitar);
      const heads = buskHeads(s);
      const tips = buskTips(s, a.acc);
      spend({ min: BUSK.min, energy: -BUSK.energy, cash: tips });
      s.today.push('busked');
      s.guitar = round2(s.guitar + practiceOf(a.acc));
      const how =
        a.acc >= 0.85
          ? 'Clean all the way through.'
          : a.acc >= 0.5
            ? 'A couple of fluffed chords. Nobody seems to mind.'
            : 'You lose the thread twice and start one song over.';
      const who =
        heads <= 0
          ? 'Nobody stops.'
          : heads === 1
            ? 'One person stops to listen.'
            : `${heads} people stop to listen.`;
      line(`${how} ${who} ${tips ? `${money(tips)} in the case.` : 'The case stays empty.'}`);
      const now = guitarRank(s.guitar);
      if (now !== was && now !== 'beginner') line(RANK_LINE[now]);
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
        if (r.exped && s.expedition?.id === r.exped) expedPitch();
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
        // A send of the style you were afraid of ends the fear (Phase 22.4b).
        if (s.fear.includes(r.type)) {
          s.fear = s.fear.filter((f) => f !== r.type);
          line(`That's the fear gone. ${STYLE_NAME[r.type]} lines feel like yours again.`);
        }
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
        const where = indoor(r.place) ? 'in' : 'out';
        got[k] = round2(
          got[k]! * CLIMB.learn * (lap ? CLIMB.repeatLearn : 1) * gym * spent * gainMult(s, k, where),
        );
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
        // A bad landing, a deck or the worst of injuries leaves you afraid of the style.
        if ((landed || s.injury?.tier === 3) && !s.fear.includes(r.type)) {
          s.fear.push(r.type);
          line(`${STYLE_NAME[r.type]} lines won't feel the same for a while. Send one and it'll pass.`);
        }
      }
      // An old injury where this line loads you can flare (Phase 22.4b).
      if (!hurt && scarred(s, r.type) && !s.flare && flareRoll(s, goN)) {
        const area = AREA[r.type];
        s.flare = { area, until: s.day + SCARS.flareDays };
        line(`Your old ${MARK_NAME[area]} injury flares up. It'll settle in a few days, or with physio.`);
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
  // Hungry and broke for the first time: where the net is (Phase 22.5a).
  if (s.climber.name && needsTeaching(s)) {
    s.seen.push('hustle');
    line(HUSTLE_TEACH);
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
  // Phase 23.2: a talent you didn't know you had, now you do.
  if (s.climber.name)
    for (const id of talentsShowing(s)) {
      s.talents.known.push(id);
      const t = TALENTS[id]!;
      note(
        `${t.good ? 'Something you didn’t know about yourself' : 'Something you’d rather not know'}: ${t.name}. ${t.desc}`,
      );
    }
  // Phase 23.1: anything that's just gone in the Record Book, each with its card.
  if (s.climber.name) {
    const got = newlyEarned(s);
    for (const r of got) s.record[r.id] = s.day;
    if (got.length) events.push({ k: 'record', ids: got.map((r) => r.id) });
  }
  // Phase 23.4: a path tier you could claim, said once; a style mastered; a quirk named.
  if (s.climber.name) {
    const can = newlyClaimable(s);
    if (can.length) {
      s.paths = { ...s.paths, told: [...s.paths.told, ...can] };
      for (const k of can) {
        const [id, n] = k.split(':');
        const p = PATHS[id!]!;
        line(`You could claim ${p.tiers[Number(n) - 1]!.name}, on the ${p.name} path. It’s on the You page.`);
      }
    }
    for (const k of newMastery(s)) {
      s.mastery = [...s.mastery, k];
      const m = masteryOf(k)!;
      const why = k in MASTERY ? `${MASTERY_AT.sends} ${k} lines sent. ` : '';
      note(`${m.name}. ${why}${m.line} ${edgeText(m.edge)}`);
    }
    const q = quirkFor(s);
    if (q) {
      s.quirk = q;
      const Q = QUIRKS[q]!;
      note(`${Q.name}. ${Q.line} ${edgeText(Q.edge)}`);
    }
  }
  // Phase 23.3: asked what you're climbing for, once; and a rung of its ambition, met.
  if (s.climber.name) {
    if (callingDue(s)) {
      s.calling = { ...s.calling, offered: true };
      events.push({ k: 'calling' });
    }
    const c = callingOf(s);
    for (const i of c ? newRungs(s) : []) {
      s.calling = { ...s.calling, rungs: [...s.calling.rungs, s.day] };
      const p = CALLING.psyche[i] ?? 0;
      s.psyche = { ...s.psyche, level: clamp100(s.psyche.level + p) };
      note(`${c!.name}, ${i + 1} of ${c!.rungs.length}: ${rungText(c!.rungs[i]!)}. ${c!.said[i]}`);
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
