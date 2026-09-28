// The shape of a game in progress. Everything here is plain JSON: it is the save file.
// Ids are strings looked up in content/, so adding a place or a route never touches a type.

export interface GameState {
  seed: string;
  day: number;
  // Minutes since midnight of `day`. Runs past 24 h on a late night; sleeping resets it.
  min: number;
  // Dollars. Negative is debt on the card.
  cash: number;
  energy: number; // 0..100
  skin: number; // 0..100
  // The place you and the van are at.
  at: string;
  // Where you stand in that place's scene, so a reload puts you back on the same spot.
  // Null means where you'd arrive: by the van.
  x: number | null;
  // Flags that last until you sleep ("had Hazel's coffee").
  today: string[];
  routes: Record<string, RouteLog>;
  // The message log: every line the game has told you, newest last.
  log: LogLine[];
}

export interface RouteLog {
  // Beta you've learned beyond each crux's obvious sequence.
  known: string[];
  // Of those, the ones someone told you. A first-go send with any of these is a flash.
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

export type Style = 'onsight' | 'flash' | 'redpoint';

export interface SendRecord {
  day: number;
  go: number;
  style: Style;
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
}

export type Action =
  | { t: 'act'; act: string }
  | { t: 'say'; talk: string; node: string; opt: number }
  | { t: 'travel'; to: string }
  | { t: 'stand'; x: number }
  | { t: 'pick'; route: string; crux: string; beta: string }
  | { t: 'go'; route: string }
  | { t: 'rest'; route: string }
  | { t: 'done'; route: string; result: GoResult };

// What a finished go hands back to the game.
export interface GoResult {
  sent: boolean;
  // The highest move reached, counting from 1.
  hi: number;
  // The crux you came off, or null if you were pumped off between cruxes.
  fellAt: string | null;
  // Extra skin the beta cost on the way (crimpy sequences).
  skin: number;
}

export type GameEvent =
  // A line for the toast lane. Every one is also written to the log.
  | { k: 'line'; text: string }
  // New beta, with the line that tells you how you saw it.
  | { k: 'learned'; route: string; beta: string; how: 'fall' | 'told'; text: string }
  | { k: 'sent'; route: string; style: Style; go: number }
  // A conversation moves to another node, or ends (null).
  | { k: 'talk'; node: string | null }
  // The action wasn't allowed; `why` says so in the game's voice.
  | { k: 'refused'; why: string };

export interface Result {
  state: GameState;
  events: GameEvent[];
}
