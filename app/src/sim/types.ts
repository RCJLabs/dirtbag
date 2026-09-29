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
  | { t: 'create'; name: string; start: string; carry?: Skills }
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
  | { t: 'taper' };

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
  // The action wasn't allowed; `why` says so in the game's voice.
  | { k: 'refused'; why: string };

export interface Result {
  state: GameState;
  events: GameEvent[];
}
