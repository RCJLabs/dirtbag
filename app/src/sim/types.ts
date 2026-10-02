// The shape of a game in progress. Everything here is plain JSON: it is the save file.
// Ids are strings looked up in content/, so adding a place or a route never touches a type.

export interface Skills {
  power: number;
  fingers: number;
  endurance: number;
  technique: number;
  head: number;
}
export type SkillId = keyof Skills;

export interface Climber {
  // Empty until you've made your climber on the first screen.
  name: string;
  // Which of the four starts you picked.
  start: string;
  skills: Skills;
}

export interface GameState {
  seed: string;
  day: number;
  // Minutes since midnight of `day`. Runs past 24 h on a late night; sleeping resets it.
  min: number;
  // Dollars. Negative is debt on the card.
  cash: number;
  energy: number; // 0..100
  skin: number; // 0..100
  // How fed you are, 0..100: v0.956's hunger meter. At 0 you can't climb or work.
  fed: number;
  // The place you and the van are at.
  at: string;
  // Where you stand in that place's scene, so a reload puts you back on the same spot.
  // Null means where you'd arrive: by the van.
  x: number | null;
  // Flags that last until you sleep ("had Hazel's coffee", "worked a shift").
  today: string[];
  climber: Climber;
  // Training load, and what it's done to you.
  load: Load;
  injury: Injury | null;
  // Injuries so far: the first one's bill is waived.
  hurt: number;
  routes: Record<string, RouteLog>;
  // Lines you put up first, by route id: what you named them and how you called the grade.
  firsts: Record<string, FirstAscent>;
  // The people you climb with, by id.
  people: Record<string, PersonLog>;
  // A first-ascent race with Dex: the line, and the last day you have to send it.
  race: { route: string; until: number } | null;
  // Trips out to a crag, and your dog once one has picked you.
  trips: number;
  dog: DogLog | null;
  // Act I's goals done, in order.
  goals: number;
  // Trips you've paid to open for good, by place id (v0.956's unlocked): Moonstone's haul.
  unlocked: string[];
  // Your kit, by id in content/gear.ts: condition, uses left, or 1 for owned (Phase 21.1).
  gear: Record<string, number>;
  // Your training block (Phase 21.3).
  training: Training;
  // Shifts worked at each job (content/jobs.ts): what your rank there is earned from.
  jobs: Record<string, number>;
  // Phase 22.1. The shifts you've signed up for, soonest first; warnings for signed-up
  // shifts you didn't work, by job; and the day each job that let you go will take you back.
  shifts: { job: string; day: number }[];
  strikes: Record<string, number>;
  benched: Record<string, number>;
  // How you live (dials.ts LIFESTYLE): paid at the van every night.
  lifestyle: 'dirtbag' | 'comfortable' | 'plush';
  // Phase 22.2b. Where you park for the night (dials.ts SPOTS), nights in a row at the Lot
  // (what tickets come from), and the last night you used a friend's driveway.
  spot: 'lot' | 'trailhead' | 'truckstop' | 'driveway' | 'ridge';
  lotNights: number;
  driveway: number;
  // Phase 22.2a. The van's parts, 0 to 100, and the breakdown you're sat beside, if any: the
  // part that went, where you were headed, the minutes of driving left, and whether you've
  // tried a bodge.
  van: { tires: number; engine: number; battery: number };
  // Phase 22.3. Servings in the pantry, by ingredient (content/food.ts); the last few meals,
  // newest last (ramen, the special, a recipe's id); and the day a meal fueled you, if any.
  pantry: Record<string, number>;
  // Phase 22.4a. Your insurance plan (dials.ts PLANS), and the day of your last cortisone
  // shot (0 for never): the next injury inside three weeks lands a tier worse.
  insurance: 'none' | 'catastrophic' | 'full';
  jab: number;
  // Phase 22.4b. Where old injuries left a mark (content/injuries.ts Mark); a flare of one,
  // and the day it passes; and the styles a bad fall left you afraid of.
  scars: string[];
  flare: { area: string; until: number } | null;
  fear: string[];
  // Phase 22.4c. Water and washing, 0 to 100; and what you're sick with, if anything, and the
  // day it passes (a toothache waits for the clinic).
  supplies: number;
  sick: { kind: 'cold' | 'bug' | 'toothache'; until: number } | null;
  // Phase 22.4d. Psyche, 0 to 100, and the days in a row with nothing to lift it; and the
  // crags you've been to since, which is what makes one new.
  psyche: { level: number; stale: number };
  crags: string[];
  // Phase 22.5a. One-time lines you've had, so they aren't said twice ("hustle").
  seen: string[];
  // Phase 22.5b. Sets played outside the café, each counted by how clean it was: what your
  // guitar playing, and the crowd it draws, comes from.
  guitar: number;
  // Phase 22.6. The event deck: the day of the last encounter of any kind, the night of the
  // last knock, and the knocks heard, oldest first; and the encounter you're in, if any,
  // which waits for your answer.
  // Phase 22.6b adds the day of the last hitchhiker and stop, the stops you've found, and the
  // hitchhikers you've picked up, by the answer you gave the first time.
  deck: {
    last: number;
    knock: number;
    seen: string[];
    hitch: number;
    stop: number;
    stops: string[];
    met: Record<string, number>;
    // Phase 22.6c: the day of the last walk-out.
    epic: number;
  };
  // Phase 22.9a. A hand of liar's dice you're in: who with, the dice, and the bid on it.
  table: { who: string; mine: number[]; theirs: number[]; bid: { n: number; face: number } } | null;
  // Phase 22.9b. Sat down to cards at the fire: which game, who with, what's in front of you,
  // hands played tonight, and the hand on the go (cards are 0–51: rank, then suit).
  cards: {
    game: 'bj' | 'holdem';
    who: string;
    chips: number;
    hands: number;
    bj: { you: number[]; dealer: number[]; next: number; bet: number } | null;
    // A hold'em hand: the street (0 before the flop, 1 the flop, 2 the turn and river), the
    // pot, a bet of theirs you're facing, and whether you bet the last street.
    he: {
      you: number[];
      them: number[];
      board: number[];
      street: number;
      pot: number;
      facing: number;
      bet: boolean;
    } | null;
  } | null;
  // Phase 22.9b. Hold'em with each person: hands played, and the times they caught you
  // betting a loser.
  reads: Record<string, { hands: number; caught: number }>;
  // Phase 22.8. Your dream: the one you're saving for, the pot (the card and the bills never
  // touch it), and the ones you own.
  dream: {
    pick: 'rig' | 'warchest' | 'homebase' | null;
    pot: number;
    owned: ('rig' | 'warchest' | 'homebase')[];
  };
  // Phase 22.7. The dogs you've had, and lost: their names, their years, the day.
  dogs: { name: string; years: number; day: number }[];
  // A walk-out (Phase 22.6c) has stages: the one you're on, and what the calls so far add up to.
  encounter: {
    kind: 'knock' | 'hitch' | 'stop' | 'epic' | 'farewell' | 'wall';
    id: string;
    stage?: number;
    tally?: { risk: number; energy: number; fed: number; skin: number; psyche: number; hours: number };
  } | null;
  meals: string[];
  fueled: number;
  breakdown: { part: 'tires' | 'engine'; to: string; rest: number; bodged: boolean } | null;
  // On a multi-pitch wall (Phase 21.5): which, and the index of the next pitch.
  wall: { id: string; next: number } | null;
  // Away on an expedition (Phase 24): which, the day of it you're on, pitches fixed, who
  // you're roped to (none, soloing), and the nights on the portaledge so far.
  // Phase 24.2: and what's in the haul bag: days of food and water left, the portaledge, the
  // stove.
  expedition: {
    id: string;
    day: number;
    pitch: number;
    partner: string | null;
    nights: number;
    food: number;
    ledge: boolean;
    stove: boolean;
    // Phase 24.4: what's happened up there this trip.
    seen: string[];
  } | null;
  // Phase 24.2. An expedition booked and paid for: the day you leave, who's coming, and the
  // haul bag you packed.
  booked: (TripPlan & { id: string }) | null;
  // Phase 24.5. Every expedition you've come home from, oldest first: the stub of Phase 23's
  // Record Book, and where a high point is kept.
  book: TripLog[];
  // Phase 23.2. Where you came from (content/origins.ts), null for a climber from before
  // origins; and the talents you were dealt, the ones you've found out, and your skills the
  // day you started, which they show against.
  origin: string | null;
  talents: { ids: string[]; known: string[]; from: Skills };
  // Phase 23.1. The Record Book: each entry you've earned (content/record.ts), and the day.
  record: Record<string, number>;
  // Phase 21.6. The speed wall at Send City: your best time in seconds, and today's runs.
  speed: { pb: number | null; runs: number; day: number };
  // How this climber climbs, chosen at the start and for good: with a rope, or Free Solo
  // (every outdoor sport line and wall pitch without one; a fall ends it).
  mode: 'rope' | 'solo';
  // The solo you're on right now: set when you pull on, cleared when you top out. If the
  // game closes with it set, you didn't.
  soloing: string | null;
  // How a Free Solo run ended, if it has.
  dead: { route: string; day: number; hi: number } | null;
  // The message log: every line the game has told you, newest last.
  log: LogLine[];
}

export type PhaseId = 'base' | 'build' | 'peak' | 'deload';

export interface Training {
  phase: PhaseId;
  // The day this phase began.
  since: number;
  // The day your last taper began, or null if you've never tapered.
  taper: number | null;
  // The last day prehab covers; 0 for never.
  prehab: number;
}

export interface Load {
  // Exponentially weighted averages of daily load (v0.956's acute:chronic model), and today's
  // running total, folded in at sleep.
  acute: number;
  chronic: number;
  today: number;
}

export interface Injury {
  kind: string;
  tier: 1 | 2 | 3;
  // The day you can climb again.
  until: number;
}

export interface RouteLog {
  // Beta you've learned beyond each crux's obvious sequence.
  known: string[];
  // Of those, the ones someone showed or told you. A first-go send with any is a flash.
  told: string[];
  // Crux id -> the beta you'll use there.
  pick: Record<string, string>;
  // Crux id -> times you've come off there.
  falls: Record<string, number>;
  goes: number;
  goesToday: number;
  // Your high point, in moves.
  hi: number;
  sent: SendRecord | null;
  sentToday: boolean;
}

export interface DogLog {
  name: string;
  // The day he picked you.
  since: number;
  // How fed he is, and how close you are, both 0-100.
  fed: number;
  bond: number;
}

export interface FirstAscent {
  name: string;
  // Who got it, when it wasn't you.
  by?: string;
  // Soft, true or stout: your grade call against the listed grade (v0.956's FA call).
  call: -1 | 0 | 1;
  day: number;
}

export interface PersonLog {
  // How well you know each other, from days climbed together (one a day at most).
  bond: number;
  // The last day you climbed together.
  last: number;
  // The day you met.
  since?: number;
  // Their arc: beats played, and the day of the last one.
  arc?: number;
  beatDay?: number;
  // Away until this day (Sage's guiding stint).
  away?: number;
  // You asked them out somewhere today: they're there from `from` till their day ends.
  invite?: { day: number; place: string; from: number };
  // Whether you climbed harder than them at the last night's reckoning.
  ahead?: boolean;
}

// How a line's first send went, kept in its log.
export type SendStyle = 'onsight' | 'flash' | 'redpoint';
// How any send went: a line you've already sent is a repeat, never a second redpoint.
export type GoStyle = SendStyle | 'repeat';

export interface SendRecord {
  day: number;
  go: number;
  style: SendStyle;
}

export interface LogLine {
  day: number;
  min: number;
  text: string;
}

// A change in body, money or time. Positive cash is income, negative energy is effort.
export interface Delta {
  min?: number;
  cash?: number;
  energy?: number;
  skin?: number;
  fed?: number;
}

export type Action =
  // `carry`: a v0.956 climber's skills, when they come across rather than picking a start.
  | { t: 'create'; name: string; start: string; origin?: string; carry?: Skills; solo?: true }
  | { t: 'act'; act: string }
  | { t: 'say'; talk: string; node: string; opt: number }
  | { t: 'travel'; to: string }
  | { t: 'unlock'; place: string }
  | { t: 'stand'; x: number }
  | { t: 'pick'; route: string; crux: string; beta: string }
  | { t: 'go'; route: string }
  | { t: 'rest'; route: string }
  | { t: 'done'; route: string; result: GoResult }
  | { t: 'name'; route: string; name: string; call: -1 | 0 | 1 }
  // Phase 21.3: a session (a protocol's id, or 'prehab'), a phase, a taper.
  | { t: 'train'; protocol: string }
  | { t: 'phase'; phase: PhaseId }
  | { t: 'taper' }
  // Phase 21.5: a wall (start it, bivy on it, or retreat), and an expedition (go, then a day
  // at a time (Phase 24): your pitches are goes; second your partner's block, make camp for
  // the night, or bail).
  | { t: 'wall'; wall: string; do: 'start' | 'bivy' | 'retreat' }
  | { t: 'exped'; id: string; do: 'book' | 'cancel' | 'go' | 'follow' | 'camp' | 'bail'; plan?: TripPlan }
  // Phase 21.6: ask the crowd at the base for a line's beta.
  | { t: 'ask'; route: string }
  // A run on the speed wall: its time in real seconds, from the green light to the buzzer,
  // or null for a false start.
  | { t: 'speed'; real: number | null }
  // Phase 22.1: sign up for a job's shift on a day (or drop it), and how you live.
  | { t: 'signup'; job: string; day: number; on: boolean }
  | { t: 'lifestyle'; tier: 'dirtbag' | 'comfortable' | 'plush' }
  // Phase 22.2a: a way out of a breakdown.
  | { t: 'fix'; how: 'tow' | 'bodge' | 'limp' | 'friend' }
  // Phase 22.2b: where you park for the night, from now on.
  | { t: 'spot'; spot: 'lot' | 'trailhead' | 'truckstop' | 'driveway' | 'ridge' }
  // Phase 22.4a: your insurance plan, from the next bills on.
  | { t: 'insure'; plan: 'none' | 'catastrophic' | 'full' }
  // Phase 22.5b: a set outside the café, and how clean it was, 0 to 1.
  | { t: 'busk'; acc: number }
  // Phase 22.6: an answer to the encounter you're in, by its option's index.
  | { t: 'answer'; opt: number }
  // Phase 22.8: a dream to pick, cash for the pot, the pot back, or the dream claimed.
  | { t: 'dream'; do: 'pick' | 'stash' | 'take' | 'claim'; id?: string; amount?: number }
  // Phase 22.9a: horseshoes, with each throw's score (1 clean, a half near, 0 off), and a
  // hand of liar's dice: dealt, then called or raised.
  | { t: 'shoes'; throws: number[] }
  | { t: 'dice'; do: 'deal' | 'call' | 'raise' }
  // Phase 24.5: the last trip's story, told at the fire.
  | { t: 'story' }
  // Phase 22.9b: cards at the fire. Sit down (with whom, for hold'em), deal a hand, play it,
  // and get up with what's in front of you.
  | { t: 'bj'; do: 'sit' | 'deal' | 'hit' | 'stand' | 'double' | 'leave' }
  | { t: 'holdem'; do: 'sit' | 'deal' | 'fold' | 'call' | 'bet' | 'leave'; who?: string };

// Phase 24.5. A trip come home from: which, the calendar day you got back, how it ended, the
// pitches fixed, who was on the rope, the nights up there, what happened, and whether you've
// told it at the fire yet.
export type TripEnd = 'summit' | 'bail' | 'water' | 'time';
export interface TripLog {
  id: string;
  day: number;
  end: TripEnd;
  high: number;
  partner: string | null;
  nights: number;
  seen: string[];
  told: boolean;
}

// Phase 24.2. A trip as you plan it: the day you leave, who comes, and the haul bag.
export interface TripPlan {
  day: number;
  partner: string | null;
  food: number;
  ledge: boolean;
  stove: boolean;
}

// What a finished go hands back to the game.
export interface GoResult {
  sent: boolean;
  // The highest move reached, counting from 1.
  hi: number;
  // The crux you came off, or null if you were pumped off between cruxes.
  fellAt: string | null;
  // The beta you tried, crux by crux, in order: what the go practised.
  tried: string[];
  // Extra skin the beta cost on the way (crimpy sequences).
  skin: number;
  // Trad: the feet you hit the ground from, if a fall had nothing to catch it.
  deck?: number;
}

export type GameEvent =
  // A line for the toast lane. Every one is also written to the log.
  | { k: 'line'; text: string }
  // New beta, with the line that tells you how you saw it.
  | { k: 'learned'; route: string; beta: string; how: 'fall' | 'told' | 'watched'; text: string }
  | { k: 'sent'; route: string; style: GoStyle; go: number }
  // What a go taught you, and your grade if it moved.
  | { k: 'skills'; gains: Partial<Skills>; grade: number | null }
  // The first ascent of an open line: it's yours to name.
  | { k: 'fa'; route: string }
  // A goal of the act done, or the whole act.
  | { k: 'goal'; id: string }
  | { k: 'act'; n: number }
  // A go that hurt you, with the line that says so (logged, and shown on the go's sheet).
  | { k: 'injured'; kind: string; tier: 1 | 2 | 3; days: number; text: string }
  // A conversation moves to another node, or ends (null).
  | { k: 'talk'; node: string | null }
  // An encounter begins (Phase 22.6): it waits for an answer.
  | { k: 'encounter'; kind: 'knock' | 'hitch' | 'stop' | 'epic' | 'farewell' | 'wall'; id: string }
  // Back from an expedition (Phase 24.5): its card, from the newest entry in the book.
  | { k: 'home'; id: string }
  // Entries in the Record Book, just earned (Phase 23.1): one moment, one card, the first
  // entry's story and the rest named under it.
  | { k: 'record'; ids: string[] }
  // The action wasn't allowed; `why` says so in the game's voice.
  | { k: 'refused'; why: string };

export interface Result {
  state: GameState;
  events: GameEvent[];
}
