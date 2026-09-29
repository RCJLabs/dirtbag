// The one door into a game's state: act(state, action) -> { state, events }. The clock,
// money and body only move here, and only because of an action. Nothing ticks while you
// stand still. The UI stages the events; it never edits the state itself.

import { cold, daysOff, freshLoad, goLoad, projected, ratio, rollInjury } from './body';
import { gains, gradeOf, STARTS, type GoSummary } from './climber';
import { headroom, holds, unmet } from './cond';
import { routeById, routesAt } from './content/gym';
import { CLINIC_LINE, FIRST_FREE_LINE, HEALED_LINE, HURT_LINE } from './content/injuries';
import { ACTS, PLACES, road, TEXT_VALUES } from './content/places';
import { PEOPLE, TALK } from './content/people';
import { SEND_NAME, effGrade, gradeLabel, gradeName, type RouteDef } from './content/routes';
import { BODY, CLIMB, DAY, INJURY, LOAD, MONEY } from './dials';
import { fill, money } from './format';
import { whereIs } from './presence';
import type { Action, Delta, GameEvent, GameState, Result, RouteLog, SendStyle, Skills } from './types';
import { conditionsAt, seasonOf } from './weather';

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

function logOf(s: GameState, route: string): RouteLog {
  return (s.routes[route] ??= emptyLog());
}

export const routeOfId = (s: GameState, id: string): RouteDef | undefined => routeById(s.seed, id);

// ---- queries the UI shares with the rules, so a button never offers what act() refuses ----

// What one go on this line costs you.
export function goCost(r: RouteDef): Required<Pick<Delta, 'min' | 'energy' | 'fed' | 'skin'>> {
  const kind = r.place === 'gym' ? 'gym' : r.disc;
  const c = CLIMB.go[kind];
  const skin = Math.round(CLIMB.skin[r.type] * (r.place === 'gym' ? 1 : CLIMB.rockSkin));
  return { min: c.min, energy: -c.energy, fed: -c.fed, skin: -skin };
}

export const restCost = (r: RouteDef): number => CLIMB.restMin[r.disc];

// Who'd belay you on a rope here, now.
export function belayer(s: GameState): string | null {
  for (const who of ['hazel', 'sage']) if (whereIs(s.seed, who, s.day, s.min) === s.at) return who;
  return null;
}

export function goBlocked(s: GameState, r: RouteDef): string | null {
  if (r.place === 'gym') {
    if (s.min >= 22 * 60) return 'Send City is closed';
    if (!s.today.includes('pass')) return 'Buy a day pass at the desk first';
  } else {
    const c = conditionsAt(s.seed, s.day, r.place);
    if (c.closed) return c.closed;
    if (!c.open) return 'The rock is soaked';
    if (s.min >= CLIMB.darkFrom) return 'Too dark to climb';
    if (r.disc === 'sport' && !belayer(s)) return 'Nobody here to belay you';
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
  const sleep = () => {
    const ended = s.day;
    const hungry = s.fed < BODY.hungryBelow;
    const rough = headroom(s) < MONEY.vanSpot;
    if (!rough) s.cash -= MONEY.vanSpot;
    s.day += 1;
    s.min = DAY.wakeMin;
    const rest = (rough ? BODY.roughEnergy : BODY.sleepEnergy) - (hungry ? BODY.hungryNight : 0);
    s.energy = clamp100(s.energy + rest);
    s.skin = clamp100(s.skin + BODY.sleepSkin);
    s.fed = clamp100(s.fed - BODY.nightFed);
    // The day's load folds into the averages.
    const p = projected(s.load);
    s.load = { acute: round2(p.acute), chronic: round2(p.chronic), today: 0 };
    s.today = [];
    for (const r of Object.values(s.routes)) {
      r.goesToday = 0;
      r.sentToday = false;
    }
    s.at = 'lot';
    s.x = null;
    if (rough) line("The card won't take the van spot. You sleep in the pullout. It's cold.");
    else
      line(
        s.cash < 0
          ? `Van spot, ${TEXT_VALUES.spot}. You're $${-s.cash} in the hole.`
          : `Van spot, ${TEXT_VALUES.spot}. Morning comes anyway.`,
      );
    if (hungry) line('You went to bed hungry, and it shows.');
    if (s.injury && s.day >= s.injury.until) {
      line(fill(HEALED_LINE, { kind: s.injury.kind }));
      s.injury = null;
    }
    if (ended % 7 === 0) {
      const bills = MONEY.registration + MONEY.insurance;
      s.cash -= bills;
      line(`Registration and insurance: $${bills}. The week's bills don't care about your card.`);
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
    spend(d.cost);
    for (const f of d.sets ?? []) if (!s.today.includes(f)) s.today.push(f);
    if (d.trains) train(d.trains);
    if (d.says) line(d.says);
    return null;
  };
  // A day climbing together, watching or belaying, counts once toward the bond.
  const climbedWith = (who: string) => {
    const p = (s.people[who] ??= { bond: 0, last: 0 });
    if (p.last === s.day) return;
    p.bond += 1;
    p.last = s.day;
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

  switch (a.t) {
    case 'create': {
      if (s.climber.name) return refuse('You already are who you are.');
      const name = a.name.trim().slice(0, NAME_MAX).trim();
      const start = STARTS[a.start];
      if (!name) return refuse('You need a name.');
      if (!start) return refuse('Pick how you climb.');
      s.climber = { name, start: a.start, skills: { ...start.skills } };
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
      if (Object.keys(fx).length && whereIs(s.seed, talk.who, s.day, s.min) !== s.at)
        return refuse("They're not here.");
      // Talking to someone is meeting them.
      s.people[talk.who] ??= { bond: 0, last: 0 };
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
      if (fx.line) line(fx.line);
      events.push({ k: 'talk', node: opt.next ?? null });
      break;
    }

    case 'travel': {
      const r = road(s.at, a.to);
      const to = PLACES[a.to];
      if (!r || !to) return refuse("There's no road there.");
      if (to.minGrade !== undefined && gradeOf(s.climber.skills) < to.minGrade)
        return refuse(`${to.name}: ${to.locked ?? 'not yet.'}`);
      // A maxed-out card never strands you: you drive on what's in the tank.
      const declined = r.cash > 0 && headroom(s) < r.cash;
      spend({ min: r.min, cash: declined ? 0 : -r.cash, energy: r.min >= 30 ? -BODY.driveEnergy : 0 });
      s.at = a.to;
      s.x = null;
      if (declined) line("The card's declined at the pump. You make it on fumes.");
      else if (r.cash >= 12) line(`Gas, ${money(r.cash)}. The van starts on the second try.`);
      else if (r.cash > 0) line(`Gas, ${money(r.cash)}.`);
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
      spend(goCost(r));
      const L = logOf(s, a.route);
      L.goes += 1;
      L.goesToday += 1;
      const who = r.disc === 'sport' ? belayer(s) : null;
      if (who) climbedWith(who);
      // A sandbag shows itself on your first go.
      if (L.goes === 1 && r.trueGrade !== undefined && r.trueGrade !== r.grade)
        line(
          r.trueGrade > r.grade
            ? `That's no ${gradeLabel(r)}. Locals have been sandbagging it.`
            : `That's no ${gradeLabel(r)}. It's soft, and you're not complaining.`,
        );
      if (
        r.place !== 'gym' &&
        s.min >= conditionsAt(s.seed, s.day, r.place).greaseFrom &&
        !s.today.includes('grease')
      ) {
        s.today.push('grease');
        line("Sun's on the wall. Everything feels greasy.");
      }
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
      // What the go put through you, and whether it cost you: judged on the state it was
      // climbed in, before it counts as your warm-up.
      const wasCold = cold(s, r);
      const load = goLoad(
        CLIMB.go[r.place === 'gym' ? 'gym' : r.disc].energy,
        r.grade,
        res.sent ? 1 : res.hi / r.moves,
      );
      s.load.today = round2(s.load.today + load);
      const goN = Object.values(s.routes).reduce((t, x) => t + x.goesToday, 0);
      const hurt = rollInjury(s, r, load, wasCold, goN);
      if (!s.today.includes('warm')) s.today.push('warm');
      s.skin = clamp100(s.skin - Math.max(0, res.skin));
      L.hi = Math.max(L.hi, Math.min(r.moves, Math.max(0, Math.floor(res.hi))));
      if (res.sent) {
        const style: SendStyle = L.goes === 1 ? (L.told.length ? 'flash' : 'onsight') : 'redpoint';
        L.sent ??= { day: s.day, go: L.goes, style };
        L.sentToday = true;
        events.push({ k: 'sent', route: a.route, style, go: L.goes });
        if (r.open && !s.firsts[r.id] && L.sent.day === s.day && L.sent.go === L.goes)
          events.push({ k: 'fa', route: r.id });
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
        const gym = r.place === 'gym' && (k === 'technique' || k === 'endurance') ? CLIMB.gymSpecialty : 1;
        got[k] = round2(got[k]! * CLIMB.learn * (lap ? CLIMB.repeatLearn : 1) * gym * spent);
      }
      train(got);
      const after = gradeOf(s.climber.skills);
      events.push({ k: 'skills', gains: got, grade: after > before ? after : null });
      if (after > before) line(`Something clicks. You're climbing V${after} now.`);
      if (hurt) {
        s.injury = hurt;
        const days = hurt.until - s.day - 1;
        const kind = hurt.kind;
        const text = fill(HURT_LINE[hurt.tier - 1]!, {
          route: r.name,
          kind,
          Kind: kind[0]!.toUpperCase() + kind.slice(1),
          days,
        });
        events.push({ k: 'injured', kind, tier: hurt.tier, days, text });
        note(text);
        const bill = s.hurt === 0 ? 0 : INJURY.clinic[hurt.tier - 1]!;
        if (hurt.tier > 1) line(bill ? fill(CLINIC_LINE, { cost: money(bill) }) : FIRST_FREE_LINE);
        if (bill) spend({ cash: -bill });
        s.hurt += 1;
      }
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
