// The one door into a game's state: act(state, action) -> { state, events }. The clock,
// money and body only move here, and only because of an action. Nothing ticks while you
// stand still. The UI stages the events; it never edits the state itself.

import { holds, unmet } from './cond';
import { ACTS, road, TEXT_VALUES } from './content/places';
import { TALK } from './content/people';
import { ROUTES, STYLE_NAME } from './content/routes';
import { BODY, CLIMB, DAY, MONEY } from './dials';
import { fill, money } from './format';
import type { Action, Delta, GameEvent, GameState, Result, RouteLog, Style } from './types';

// The message log keeps this many lines; older ones fall off the front.
export const LOG_MAX = 200;

export function newGame(seed: string): GameState {
  return {
    seed,
    day: 1,
    min: DAY.firstMin,
    cash: MONEY.start,
    energy: BODY.startEnergy,
    skin: BODY.startSkin,
    at: 'lot',
    x: null,
    today: [],
    routes: {},
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

function logOf(s: GameState, route: string): RouteLog {
  return (s.routes[route] ??= emptyLog());
}

// Queries the UI shares with the rules, so a button can never offer what act() refuses.
export function goBlocked(s: GameState): string | null {
  if (s.min >= CLIMB.darkFrom) return 'Too dark to climb';
  if (s.energy < CLIMB.minEnergy) return 'Too tired to try';
  if (s.skin < CLIMB.minSkin) return 'Your skin is done for today';
  return null;
}

export function knowsBeta(s: GameState, route: string, crux: string, beta: string): boolean {
  const c = ROUTES[route]?.cruxes.find((x) => x.id === crux);
  if (!c || !c.beta.includes(beta)) return false;
  return c.beta[0] === beta || !!s.routes[route]?.known.includes(beta);
}

export function talkStart(s: GameState, talk: string): string | null {
  return TALK[talk]?.start.find((e) => !e.when || holds(s, e.when))?.node ?? null;
}

export function goesToday(s: GameState): number {
  return Object.values(s.routes).reduce((n, r) => n + r.goesToday, 0);
}

export function act(s0: GameState, a: Action): Result {
  const s = clone(s0);
  const events: GameEvent[] = [];
  const refuse = (why: string): Result => ({ state: s0, events: [{ k: 'refused', why }] });
  const line = (text: string) => {
    events.push({ k: 'line', text });
    s.log.push({ day: s.day, min: s.min, text });
    if (s.log.length > LOG_MAX) s.log.splice(0, s.log.length - LOG_MAX);
  };
  const spend = (d: Delta) => {
    const was = s.cash;
    s.min += d.min ?? 0;
    s.cash += d.cash ?? 0;
    s.energy = clamp100(s.energy + (d.energy ?? 0));
    s.skin = clamp100(s.skin + (d.skin ?? 0));
    if (was >= 0 && s.cash < 0) line(`You're $${-s.cash} in the hole. It goes on the card.`);
  };
  const runAct = (id: string): string | null => {
    const d = ACTS[id];
    if (!d) return 'Nothing to do there.';
    const why = unmet(s, d.needs);
    if (why) return why;
    if (d.sleep) {
      // Sleep carries its own debt line, so it doesn't go through spend().
      s.cash += d.cost.cash ?? 0;
      s.day += 1;
      s.min = DAY.wakeMin;
      s.energy = clamp100(s.energy + BODY.sleepEnergy);
      s.skin = clamp100(s.skin + BODY.sleepSkin);
      s.today = [];
      for (const r of Object.values(s.routes)) {
        r.goesToday = 0;
        r.sentToday = false;
      }
      s.at = 'lot';
      s.x = null;
      const spot = TEXT_VALUES.spot;
      line(
        s.cash < 0
          ? `Van spot, ${spot}. You're $${-s.cash} in the hole.`
          : `Van spot, ${spot}. Morning comes anyway.`,
      );
      return null;
    }
    spend(d.cost);
    if (d.says) line(d.says);
    return null;
  };
  const learn = (route: string, beta: string, how: 'fall' | 'told', text: string) => {
    const L = logOf(s, route);
    if (L.known.includes(beta)) return;
    L.known.push(beta);
    if (how === 'told') L.told.push(beta);
    events.push({ k: 'learned', route, beta, how, text });
    if (text) s.log.push({ day: s.day, min: s.min, text });
  };

  switch (a.t) {
    case 'act': {
      const why = runAct(a.act);
      if (why) return refuse(why);
      break;
    }

    case 'say': {
      const node = TALK[a.talk]?.nodes[a.node];
      const opt = node?.opts[a.opt];
      if (!opt || (opt.when && !holds(s, opt.when))) return refuse('They have nothing to say to that.');
      const fx = opt.fx ?? {};
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
      if (fx.line) line(fx.line);
      events.push({ k: 'talk', node: opt.next ?? null });
      break;
    }

    case 'travel': {
      const r = road(s.at, a.to);
      if (!r) return refuse("There's no road there.");
      spend({ min: r.min, cash: -r.cash, energy: -BODY.driveEnergy });
      s.at = a.to;
      s.x = null;
      line(fill(r.says, { cash: money(r.cash) }));
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
      const r = ROUTES[a.route];
      if (!r || !r.cruxes.length) return refuse(r?.blurb ?? 'Not a route.');
      const why = goBlocked(s);
      if (why) return refuse(`${why}.`);
      spend({ min: CLIMB.goMin, energy: -CLIMB.goEnergy, skin: -CLIMB.goSkin });
      const L = logOf(s, a.route);
      L.goes += 1;
      L.goesToday += 1;
      // Same test startAttempt() uses, after the go's time is on the clock.
      if (s.min >= CLIMB.greaseFrom && !s.today.includes('grease')) {
        s.today.push('grease');
        line("Sun's on the wall. Everything feels greasy.");
      }
      break;
    }

    case 'rest':
      spend({ min: CLIMB.restMin });
      break;

    case 'done': {
      const r = ROUTES[a.route];
      if (!r) return refuse('Not a route.');
      const L = logOf(s, a.route);
      const res = a.result;
      s.skin = clamp100(s.skin - Math.max(0, res.skin));
      L.hi = Math.max(L.hi, Math.min(r.moves, Math.max(0, Math.floor(res.hi))));
      if (res.sent) {
        const style: Style = L.goes === 1 ? (L.told.length ? 'flash' : 'onsight') : 'redpoint';
        L.sent ??= { day: s.day, go: L.goes, style };
        L.sentToday = true;
        events.push({ k: 'sent', route: a.route, style, go: L.goes });
        s.log.push({
          day: s.day,
          min: s.min,
          text: `${STYLE_NAME[style]}: ${r.name}, ${r.grade}, on go ${L.goes}.`,
        });
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
      break;
    }
  }
  return { state: s, events };
}
