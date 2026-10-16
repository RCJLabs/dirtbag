// Phase 14.6b: what each of the pad's buttons and the keyboard's keys does, as the player sets
// it in Settings. The D-pad, the stick and the arrows always move; Enter always presses; the
// right trigger is always a second hold. Everything else is a role a button or a key takes.

export type PadRole = 'a' | 'b' | 'y' | 'start' | 'select' | 'lb' | 'rb';
export type KeyRole = 'press' | 'back' | 'map' | 'journal' | 'plan' | 'left' | 'right';

export interface Binds {
  // Each role's button, by its index in the standard mapping.
  pad: Record<PadRole, number>;
  // Each role's key, as KeyboardEvent.key has it (letters in lower case).
  keys: Record<KeyRole, string>;
}

export const DEFAULT_BINDS: Binds = {
  pad: { a: 0, b: 1, y: 3, start: 9, select: 8, lb: 4, rb: 5 },
  keys: { press: ' ', back: 'Escape', map: 'm', journal: 'j', plan: 'p', left: 'f', right: 'j' },
};

export const PAD_ROLES = Object.keys(DEFAULT_BINDS.pad) as PadRole[];
export const KEY_ROLES = Object.keys(DEFAULT_BINDS.keys) as KeyRole[];

export const ROLE_NAME: Record<PadRole | KeyRole, string> = {
  a: 'Press, hold and strum',
  b: 'Back',
  y: 'The plan',
  start: 'The journal',
  select: 'The map',
  lb: 'Left hand, on the speed wall',
  rb: 'Right hand, on the speed wall',
  press: 'Press, hold and strum',
  back: 'Back',
  map: 'The map',
  journal: 'The journal',
  plan: 'The plan',
  left: 'Left hand, on the speed wall',
  right: 'Right hand, on the speed wall',
};

// The buttons a role can take: the face buttons, the bumpers, the left trigger, the two in the
// middle and the sticks' clicks. The right trigger is the second hold, the D-pad moves, and
// the guide button is Steam's.
export const BINDABLE = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11];

// Each button as it's printed: an Xbox pad's names, which Steam Input hands a game by default,
// or a Steam Deck's.
const XBOX = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'LS', 'RS'];
const DECK = ['A', 'B', 'X', 'Y', 'L1', 'R1', 'L2', 'R2', 'View', 'Menu', 'L3', 'R3'];
export const buttonName = (i: number, deck = false): string => (deck ? DECK : XBOX)[i] ?? `Button ${i}`;

export const keyName = (k: string): string =>
  k === ' ' ? 'Space' : k === 'Escape' ? 'Esc' : k.length === 1 ? k.toUpperCase() : k;

// Keys no role takes: they move, type into a field, or belong to the browser.
const RESERVED = /^(Arrow|Tab$|Enter$|Shift|Control|Alt|Meta|CapsLock$|F\d+$|Dead$|Unidentified$|Process$)/;
export const keyOf = (key: string): string | null =>
  RESERVED.test(key) ? null : key.length === 1 ? key.toLowerCase() : key;

// The speed wall's hands are only read on the wall, so J can be both the journal and the right
// hand; everywhere else, one key does one thing.
const WALL: KeyRole[] = ['left', 'right'];
const sameGroup = (a: KeyRole, b: KeyRole) => WALL.includes(a) === WALL.includes(b);

// A role given a button: whichever role had that button takes this one's old button.
export function bindPad(b: Binds, role: PadRole, button: number): Binds {
  if (!BINDABLE.includes(button)) return b;
  const pad = { ...b.pad };
  const had = PAD_ROLES.find((r) => r !== role && pad[r] === button);
  if (had) pad[had] = pad[role];
  pad[role] = button;
  return { ...b, pad };
}

// A role given a key, the same way, within the roles read together.
export function bindKey(b: Binds, role: KeyRole, key: string): Binds {
  const k = keyOf(key);
  if (!k) return b;
  const keys = { ...b.keys };
  const had = KEY_ROLES.find((r) => r !== role && sameGroup(r, role) && keys[r] === k);
  if (had) keys[had] = keys[role];
  keys[role] = k;
  return { ...b, keys };
}

// The bindings as kept in Settings, or the defaults for anything missing or wrong. A
// setting that left two roles on one button would leave one of them unreachable, so it
// isn't kept.
export function readBinds(x: unknown): Binds {
  const v = (typeof x === 'object' && x !== null ? x : {}) as Partial<Binds>;
  const pad = { ...DEFAULT_BINDS.pad };
  for (const r of PAD_ROLES) {
    const i = (v.pad as Record<string, unknown> | undefined)?.[r];
    if (typeof i === 'number' && BINDABLE.includes(i)) pad[r] = i;
  }
  const keys = { ...DEFAULT_BINDS.keys };
  for (const r of KEY_ROLES) {
    const k = (v.keys as Record<string, unknown> | undefined)?.[r];
    if (typeof k === 'string' && keyOf(k) === k) keys[r] = k;
  }
  const padOk = new Set(Object.values(pad)).size === PAD_ROLES.length;
  const keysOk = KEY_ROLES.every((a) =>
    KEY_ROLES.every((b) => a === b || !sameGroup(a, b) || keys[a] !== keys[b]),
  );
  return { pad: padOk ? pad : { ...DEFAULT_BINDS.pad }, keys: keysOk ? keys : { ...DEFAULT_BINDS.keys } };
}
