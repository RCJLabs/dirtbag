// The balance harness: bots play whole seasons on the sim, and this reads the curves Phase
// 6's targets are written against. Pure like the rest of the sim; `npm run harness` prints
// the tables (harness/season.harness.ts).

import { FIRE_LINES, LEDGE_LINES, SEND_CHEERS } from './content/ambient';
import { FOLKS_CALLS } from './content/folks';
import { GIFTS, NAMED_FOR } from './content/gifts';
import { TALK } from './content/people';
import { expedLoop, humanHands, playDays, playGo, type BotRun, type Strategy } from './bot';
import { bjTotal, boardAt, equity, handNeeds, isPair } from './cards';
import { CLIMB, EXPED, GAMES } from './dials';
import { EXPEDITIONS } from './content/expeditions';
import { defaultPlan, planOdds, tripPay } from './expeditions';
import { needFor, STARTS } from './climber';
import { ECHOES } from './content/scene';
import { ORIGINS } from './content/origins';
import { indoor } from './content/gym';
import { PLACES } from './content/places';
import type { RouteDef } from './content/routes';
import { newMastery } from './paths';
import { atFire, fireOut } from './fire';
import { atLeast, FACES, inCup, inPlay, least } from './perudo';
import { DICE_STYLE } from './content/perudo';
import { act, newGame, routeOfId } from './game';
import type { Action, GameState } from './types';
import { Rng } from './rng';
import { runway } from './tonight';
import { forecastFrom, type Sure } from './forecast';
import { belayBlocked, belayLine, cleanBelay, playRope, ropeResult, startRope } from './belay';
import { skyAt, skyOn } from './weather';

// Runway is the van's own measure (tonight.ts): the harness and the player read the same one.
export { BASE_BURN, runway } from './tonight';

export interface SeasonOpts {
  start: string;
  strategy: Strategy;
  days: number;
  // Human-ish hands (seeded per go) or careful ones.
  human: boolean;
  reckless?: boolean;
  // An origin to make the climber with (Phase 23.2); none by default, so the targets don't move.
  origin?: string;
  // A player who reads everything (Phase 17.7): the fire every night, the locals' sits.
  social?: boolean;
  // A ladder the career bot climbs besides the story (Phase 18.7).
  focus?: 'comp' | 'media' | 'business';
  // Phase 31.4: a family's kid, from the handover.
  from?: GameState;
  // Phase 32.5: a career that looks for the Hollow.
  hollow?: boolean;
}

export function season(seed: string, o: SeasonOpts): BotRun {
  let n = 0;
  return playDays(seed, {
    start: o.start,
    strategy: o.strategy,
    days: o.days,
    reckless: o.reckless,
    origin: o.origin,
    social: o.social,
    focus: o.focus,
    from: o.from,
    hollow: o.hollow,
    hands: o.human ? () => humanHands(Rng.fromStream(seed, 'session').derive(`bot-go-${n++}`)) : undefined,
  });
}

// Phase 17.7: the authored social lines a run can show, as said (lines with a {blank} in
// them aside), and the ambient ones among them (the fire, and what's said at a send).
export function socialLines(): { social: Set<string>; ambient: Set<string> } {
  const ambient = new Set(
    [FIRE_LINES, SEND_CHEERS, LEDGE_LINES].flatMap((pools) => Object.values(pools).flat()),
  );
  const social = new Set(ambient);
  for (const t of Object.values(TALK))
    for (const n of Object.values(t.nodes))
      for (const o of n.opts) if (o.fx?.line && !o.fx.line.includes('{')) social.add(o.fx.line);
  for (const g of Object.values(GIFTS)) social.add(g.line);
  for (const g of Object.values(NAMED_FOR)) social.add(g.line);
  for (const c of FOLKS_CALLS) for (const o of c.opts) social.add(o.out);
  return { social, ambient };
}

// A run's lines as day and text.
export const linesOf = (run: BotRun): { day: number; text: string }[] =>
  run.lines.map((l) => {
    const m = /^day (\d+): (.*)$/s.exec(l);
    return { day: Number(m?.[1] ?? 0), text: m?.[2] ?? l };
  });

export interface Checkpoint {
  day: number;
  grade: number;
  cash: number;
  runway: number;
  // Days worked in the seven days up to here.
  workDays: number;
  sends: number;
}

export function checkpoints(run: BotRun, at: number[]): Checkpoint[] {
  return at.map((day) => {
    const d = run.days[day - 1];
    if (!d) throw new Error(`the run ended before day ${day}`);
    const week = run.days.slice(Math.max(0, day - 7), day);
    return {
      day,
      grade: d.grade,
      cash: d.cash,
      runway: runway(d.cash),
      workDays: week.filter((w) => w.workMin > 0).length,
      sends: run.sends.filter((x) => Number(/^day (\d+)/.exec(x)?.[1]) <= day).length,
    };
  });
}

// The first day the bot tied into a line of this grade or harder, or null.
export const firstTry = (run: BotRun, grade: number): number | null =>
  run.days.find((d) => d.hardest >= grade)?.day ?? null;

// The first day an injury landed, or null.
export const firstInjury = (run: BotRun): number | null =>
  run.injuries.length ? Number(/^day (\d+)/.exec(run.injuries[0]!)?.[1]) : null;

// The first day there was nothing new left within reach anywhere, or null. Days the body
// kept you off the rock ("resting") don't count: the lines were still there.
export const contentOut = (run: BotRun): number | null =>
  run.days.find((d) => d.where === 'nothing')?.day ?? null;

export const median = (xs: number[]): number => {
  const a = [...xs].sort((x, y) => x - y);
  return a.length ? (a[Math.floor((a.length - 1) / 2)]! + a[Math.ceil((a.length - 1) / 2)]!) / 2 : NaN;
};

// Phase 22's criterion 2, for the games at the fire (22.9): over `nights` nights with Hazel
// and Sage both up, what each game pays an hour. Bond is the most anyone's moved in a day
// with every game played; money is the night's net at blackjack by the book, and at hold'em
// three plain ways: always bet, always call, and on the hand's odds.
// Phase 36.1: a game of liar's dice played through as the others play it, from your own cup:
// call a bid that looks less likely than `doubt`, else the raise likeliest to be true, opening
// as a stranger at the fire would (DICE_STYLE). Where it left you, and whether you took it.
export function perudoGame(s0: GameState, doubt = 0.4): { s: GameState; won: boolean } {
  let s = act(s0, { t: 'dice', do: 'deal' }).state;
  for (let g = 0; g < 400 && s.table && !s.table.over; g++) {
    const t = s.table;
    const mine = t.seats[0]!.dice;
    const unseen = inPlay(t) - mine.length;
    const likely = (n: number, face: number) => atLeast(n - inCup(mine, face), unseen);
    let a: Action = { t: 'dice', do: 'call' };
    if (t.shown) a = { t: 'dice', do: 'next' };
    else if (!t.bid || likely(t.bid.n, t.bid.face) >= doubt) {
      const bids = FACES.map((face) => ({
        face,
        n: t.bid
          ? least(t.bid, face)
          : Math.max(1, Math.floor(inCup(mine, face) + unseen / 3 - DICE_STYLE.caution)),
      })).filter((b) => b.n <= inPlay(t));
      const best = bids.sort((x, y) => likely(y.n, y.face) - likely(x.n, x.face))[0];
      if (best) a = { t: 'dice', do: 'bid', ...best };
    }
    s = act(s, a).state;
  }
  const won = s.table?.over === 'you';
  return { s: act(s, { t: 'dice', do: 'leave' }).state, won };
}

export function gamesAtFire(seed: string, nights: number) {
  const base: GameState = {
    ...act(newGame(seed), { t: 'create', name: 'Bot', start: 'allrounder' }).state,
    people: { hazel: { bond: 10, last: 0 }, sage: { bond: 40, last: 0 } },
  };
  const night = (s: GameState, d: number): GameState => ({
    ...s,
    day: d,
    min: 21 * 60,
    energy: 100,
    cash: 200,
    today: [],
  });
  // Bond: a night of every game, on nights both are up; the most anyone gained in one.
  let bondDay = 0;
  let s = base;
  for (let d = 1, n = 0; n < nights; d++) {
    s = night(s, d);
    if (!atFire(s).includes('sage')) continue;
    n++;
    const was = { ...s.people };
    s = act(s, { t: 'shoes', throws: [1, 0.5, 0, 1] }).state;
    s = perudoGame(s).s;
    for (const g of ['bj', 'holdem'] as const) {
      s = act(s, { t: g, do: 'sit' } as Action).state;
      s = act(s, { t: g, do: 'leave' } as Action).state;
    }
    for (const w of Object.keys(was)) bondDay = Math.max(bondDay, s.people[w]!.bond - was[w]!.bond);
  }
  // Blackjack by the book, at the top bet, hand after hand till the chips or the fire run out
  // (36.2): hit to 17 against a 7 or better, to 12 otherwise, soft to 18; double 11, and 10
  // against a 9 or worse; split aces and eights, nines but against a 7 or a ten or better, and
  // the small pairs against a small card. Its money an hour by the clock's minutes a hand.
  let bj = 0;
  let bjHands = 0;
  const top = Math.max(...GAMES.bj.bets);
  s = base;
  for (let d = 1; d <= nights; d++) {
    s = act(night(s, d), { t: 'bj', do: 'sit' }).state;
    const start = s.cards!.chips;
    while (s.cards!.chips >= top && !fireOut(s)) {
      s = act(s, { t: 'bj', do: 'deal', bet: top }).state;
      bjHands++;
      for (let g = 0; g < 20 && s.cards!.bj && !s.cards!.bj.paid; g++) {
        const h = s.cards!.bj;
        const mine = h.you[h.at]!;
        const y = bjTotal(mine.cards);
        const up = bjTotal([h.dealer[0]!]).n;
        const v = bjTotal([mine.cards[0]!]).n;
        const room = s.cards!.chips >= mine.bet;
        const split =
          room &&
          h.you.length === 1 &&
          isPair(mine.cards) &&
          (v === 11 ||
            v === 8 ||
            (v === 9 && up !== 7 && up < 10) ||
            (v === 7 && up <= 7) ||
            (v === 6 && up <= 6) ||
            (v <= 3 && up <= 7));
        const dbl = room && mine.cards.length === 2 && !y.soft && (y.n === 11 || (y.n === 10 && up < 10));
        const hit = y.soft ? y.n <= 17 : y.n <= 11 || (y.n <= 16 && up >= 7);
        s = act(s, { t: 'bj', do: split ? 'split' : dbl ? 'double' : hit ? 'hit' : 'stand' }).state;
      }
    }
    bj += s.cards!.chips - start;
    s = act(s, { t: 'bj', do: 'leave' }).state;
  }
  // Hold'em round the fire (36.3), on nights Hazel and Sage are both there, hand after hand
  // till the chips or the fire run out: always betting, always calling, or by the odds against
  // the field. Its money an hour by the clock's minutes a hand.
  const holdem = (way: 'bet' | 'call' | 'odds') => {
    let net = 0;
    let hands = 0;
    let t = base;
    for (let d = 1, n = 0; n < nights; d++) {
      t = night(t, d);
      if (!atFire(t).includes('sage')) continue;
      n++;
      t = act(t, { t: 'holdem', do: 'sit' }).state;
      const start = t.cards!.chips;
      while (t.cards!.chips >= handNeeds('holdem') && !fireOut(t)) {
        t = act(t, { t: 'holdem', do: 'deal' }).state;
        hands++;
        for (let g = 0; g < 40 && t.cards!.he && !t.cards!.he.won; g++) {
          const h = t.cards!.he;
          const field = h.seats.filter((p) => p.in).length - 1;
          const e = equity(
            h.seats[0]!.hole,
            h.board.slice(0, boardAt(h.street)),
            `bot-${d}-${t.cards!.hands}-${h.street}-${h.said.length}`,
            t,
            field,
          );
          const fair = 1 / (field + 1);
          const raise = way === 'bet' || (way === 'odds' && e > 1.3 * fair);
          const stay = way !== 'odds' || e > 0.85 * fair;
          const owe = h.bet - h.seats[0]!.put;
          t = act(t, { t: 'holdem', do: raise ? 'bet' : owe > 0 && !stay ? 'fold' : 'call' }).state;
        }
      }
      net += t.cards!.chips - start;
      t = act(t, { t: 'holdem', do: 'leave' }).state;
    }
    return net / ((hands * GAMES.holdem.min) / 60);
  };
  // Liar's dice (36.1): a game's minutes, and how many a player reading their cup takes, with
  // Hazel and Sage (a fair share is a third).
  let diceMin = 0;
  let diceWon = 0;
  let diceGames = 0;
  s = base;
  for (let d = 1; diceGames < nights; d++) {
    s = night(s, d);
    if (!atFire(s).includes('sage')) continue;
    const g = perudoGame(s);
    diceMin += g.s.min - s.min;
    diceWon += g.won ? 1 : 0;
    diceGames++;
  }
  const ways = ['bet', 'call', 'odds'] as const;
  return {
    bondDay,
    dice: { min: diceMin / diceGames, won: diceWon / diceGames },
    bj: bj / ((bjHands * GAMES.bj.min) / 60),
    holdem: Object.fromEntries(ways.map((k) => [k, holdem(k)])) as Record<string, number>,
  };
}

// Phase 24: an expedition played through by a climber's hands, choosing each day as the odds
// assume: wait out a storm; on your block, lead it a go at a time while you can, or hand it to
// your partner when their day is the better bet; on theirs, second it. Whether it summited.
export const expedTrip = (s0: GameState, id: string, hands: string): boolean => expedRun(s0, id, hands).top;

// The same trip, with what it came to (Phase 24.9): whether it summited, the calendar days
// from leaving to the Lot again, and the cash it made or cost, pay against the trip and food.
// The week's bills come either way, so they're left out of it.
export function expedRun(
  s0: GameState,
  id: string,
  hands: string,
): { top: boolean; days: number; net: number } {
  const e = EXPEDITIONS[id]!;
  const rng = Rng.fromSeed(hands);
  let top = false;
  const run = (st: GameState, a: Action): GameState => {
    const r = act(st, a);
    if (r.events.some((ev) => ev.k === 'line' && /the summit of/.test(ev.text))) top = true;
    return r.state;
  };
  const plan = defaultPlan(s0, id);
  const none = { top: false, days: 0, net: 0 };
  if (!plan) return none;
  const booked = run(s0, { t: 'exped', id, do: 'book', plan });
  // What booking cost, so the bills on the way don't count against the trip.
  let net = booked.cash - s0.cash;
  let s = run(booked, { t: 'exped', id, do: 'go' });
  if (!s.expedition) return none;
  // Played as the career bot plays it (bot.ts).
  expedLoop(
    () => s,
    (a) => {
      const r = act(s, a);
      if (r.events[0]?.k === 'refused') return false;
      if (r.events.some((ev) => ev.k === 'line' && /the summit of/.test(ev.text))) top = true;
      s = r.state;
      return true;
    },
    (g) => humanHands(rng.derive(`go-${g}-${s.day}`)),
  );
  if (top) net += tripPay(s0, id);
  return { top, days: s.day - s0.day, net };
}

// Phase 24's criterion 4: for each objective, a climber at its grade roped to Sage, `trips`
// times on different seeds: the summit odds shown the morning they set off, and how often the
// bots' hands got up it.
export function expedCalibration(trips: number) {
  return Object.entries(EXPEDITIONS).map(([id, e]) => {
    let shown = 0;
    let got = 0;
    for (let k = 0; k < trips; k++) {
      const base = act(newGame(`cal-${id}-${k}`), { t: 'create', name: 'Bot', start: 'allrounder' }).state;
      const v = needFor(e.grade) + 0.3;
      const s0: GameState = {
        ...base,
        cash: e.cost + 1000,
        energy: 100,
        fed: 90,
        climber: { ...base.climber, skills: { power: v, fingers: v, endurance: v, technique: v, head: v } },
        people: { sage: { bond: 8, last: 0 } },
      };
      // What a climber at that grade has mastered by then (Phase 23.4), so the odds shown see it.
      s0.mastery = newMastery(s0);
      const plan = defaultPlan(s0, id);
      shown += plan ? planOdds(s0, id, plan) : 0;
      if (expedTrip(s0, id, `hands-${id}-${k}`)) got++;
    }
    return { id, grade: e.grade, shown: shown / trips, got: got / trips };
  });
}

// Phase 24's criterion 5: what a trip comes to a day away, for a climber at every grade an
// objective is offered at, from the lowest it takes to two past its own, roped to Sage.
// `first`: its first summit, paid; `again`: once it has paid, a summit pays nothing. Each is
// the mean net cash over the mean days away, `trips` trips a grade.
export function expedFarm(trips: number) {
  return Object.entries(EXPEDITIONS).flatMap(([id, e]) => {
    const rows = [];
    for (let g = e.gradeReq; g <= e.grade + 2; g++) {
      let net = 0;
      let paid = 0;
      let days = 0;
      for (let k = 0; k < trips; k++) {
        const base = act(newGame(`farm-${id}-${g}-${k}`), {
          t: 'create',
          name: 'Bot',
          start: 'allrounder',
        }).state;
        const v = needFor(g) + 0.3;
        const s0: GameState = {
          ...base,
          cash: e.cost * 2 + 2000,
          energy: 100,
          fed: 90,
          climber: { ...base.climber, skills: { power: v, fingers: v, endurance: v, technique: v, head: v } },
          people: { sage: { bond: 8, last: 0 } },
        };
        s0.mastery = newMastery(s0);
        const r = expedRun(s0, id, `farm-hands-${id}-${g}-${k}`);
        net += r.net;
        paid += r.top ? tripPay(s0, id) : 0;
        days += r.days;
      }
      rows.push({ id, grade: g, days: days / trips, first: net / days, again: (net - paid) / days });
    }
    return rows;
  });
}

// Phase 23's criterion 2: every stance's echo lands later in the game. For each echo, bots
// that answer its call the way it comes back for play on (a balanced season, up to `days`),
// a seed at a time, until it lands; when the call came and when the echo did, or never.
export function echoLanding(seeds: number, days: number) {
  return Object.entries(ECHOES).map(([id, e]) => {
    for (let k = 0; k < seeds; k++) {
      const r = playDays(`echo-${id}-${k}`, { days, strategy: 'balanced', answers: { [e.stance]: e.opt } });
      const call = r.state.scene.stances.find((x) => x.id === e.stance);
      const echo = r.state.scene.echoes.find((x) => x.id === id);
      if (call && echo) return { id, call: call.day, echo: echo.day, seeds: k + 1 };
    }
    return { id, call: null, echo: null, seeds };
  });
}

// Phase 23's criterion 1: two climbers made differently play their first week differently,
// and the harness can tell them apart. Bots made with each origin (or each start) play a
// week; each run is described by what it did (goes indoors and out, hours worked, sessions,
// drives, sends, the styles of its goes, and what it went for first); a nearest-centroid
// classifier, leaving each run out of its own class, names where each came from.
function weekProfile(r: BotRun): number[] {
  let gin = 0;
  let gout = 0;
  let train = 0;
  let drives = 0;
  const ty: Record<string, number> = { crimp: 0, power: 0, endurance: 0, technical: 0, dyno: 0, crack: 0 };
  const goes: RouteDef[] = [];
  for (const a of r.actions) {
    if (a.t === 'go') {
      const x = routeOfId(r.state, a.route);
      if (!x) continue;
      goes.push(x);
      ty[x.type] = (ty[x.type] ?? 0) + 1;
      if (indoor(x.place)) gin++;
      else gout++;
    }
    if (a.t === 'train') train++;
    if (a.t === 'travel') drives++;
  }
  const n = Math.max(1, gin + gout);
  const first = goes.slice(0, 10);
  return [
    gin,
    gout,
    r.days.reduce((m, d) => m + d.workMin, 0) / 60,
    train,
    drives,
    r.sends.length,
    first.filter((x) => x.disc === 'boulder').length,
    first.filter((x) => x.type === 'technical').length,
    ...Object.values(ty).map((v) => (10 * v) / n),
  ];
}

function classify(rows: { y: string; x: number[] }[]) {
  const k = rows[0]!.x.length;
  const mean = Array<number>(k).fill(0);
  const sd = Array<number>(k).fill(0);
  for (const r of rows) r.x.forEach((v, i) => (mean[i]! += v / rows.length));
  for (const r of rows) r.x.forEach((v, i) => (sd[i]! += (v - mean[i]!) ** 2 / rows.length));
  const z = rows.map((r) => ({ y: r.y, x: r.x.map((v, i) => (v - mean[i]!) / (Math.sqrt(sd[i]!) || 1)) }));
  const ys = [...new Set(z.map((q) => q.y))];
  const wrong: Record<string, string[]> = {};
  let ok = 0;
  for (const [j, r] of z.entries()) {
    let best = '';
    let bd = Infinity;
    for (const y of ys) {
      const mem = z.filter((q, i) => q.y === y && i !== j);
      const c = Array<number>(k).fill(0);
      for (const q of mem) q.x.forEach((v, i) => (c[i]! += v / mem.length));
      const d = c.reduce((s, v, i) => s + (v - r.x[i]!) ** 2, 0);
      if (d < bd) {
        bd = d;
        best = y;
      }
    }
    if (best === r.y) ok++;
    else (wrong[r.y] ??= []).push(best);
  }
  return { acc: ok / rows.length, chance: 1 / ys.length, wrong };
}

export function weekOneTold(seeds: number) {
  const run = (o: { origin?: string; start?: string }) =>
    Array.from({ length: seeds }, (_, i) => weekProfile(playDays(`made-${i}`, { days: 7, ...o })));
  const origins = classify(Object.keys(ORIGINS).flatMap((o) => run({ origin: o }).map((x) => ({ y: o, x }))));
  const starts = classify(Object.keys(STARTS).flatMap((st) => run({ start: st }).map((x) => ({ y: st, x }))));
  return { origins, starts };
}

// Phase 37: the session, measured. On `n` busy mornings at Roadside, a climber `under` grades
// below Crimpfest joins the session on it and goes, with a bot's hands, till it's sent or the
// session's decided, answering every find the same way: always telling them, or always keeping
// it. What each pays a session: how often you're first to the top, overall and in the sessions
// where you found its move (the only ones the answer can change: a first-go send finds
// nothing), and the bond and old-guard standing it moved (the day together's bond is in both,
// and so is any call the crag put to you, answered the first way).
export type SeshPay = {
  sessions: number;
  found: number;
  first: number;
  firstFound: number;
  bond: number;
  old: number;
};
export function seshMeasure(seed: string, n: number, under = 0.5): Record<'share' | 'keep', SeshPay> {
  const route = 'crimpfest';
  const created = act(newGame(seed), { t: 'create', name: 'Bot', start: 'allrounder' }).state;
  const r0 = routeOfId(created, route)!;
  const k = needFor(r0.grade - under);
  const base: GameState = {
    ...created,
    climber: { ...created.climber, skills: { power: k, fingers: k, endurance: k, technique: k, head: k } },
    people: { dex: { bond: 2, last: 0, since: 1 }, sage: { bond: 4, last: 0, since: 1 } },
  };
  const out = {} as Record<'share' | 'keep', SeshPay>;
  for (const policy of ['share', 'keep'] as const) {
    const t = { sessions: 0, first: 0, found: 0, firstFound: 0, bond: 0, old: 0 };
    for (let d = 8; t.sessions < n && d < 8 + n * 40; d++) {
      const s0: GameState = {
        ...base,
        day: d,
        at: 'road',
        min: 10 * 60,
        energy: 100,
        skin: 100,
        today: ['crag', 'warm'],
        // No call from the crag today (a stance moves the old guard too): it's the session's
        // pay being measured.
        scene: { ...base.scene, last: d, echoLast: d },
      };
      const j = act(s0, { t: 'sesh', do: 'join', route });
      if (j.events[0]?.k === 'refused') continue;
      t.sessions++;
      let s = j.state;
      let found = false;
      const hands = humanHands(Rng.fromStream(seed, 'events').derive(`sesh-hands-${d}`));
      for (let g = 0; g < 16 && s.sesh; g++) {
        // A call the crag puts to you between goes, answered the first way, as the bots do.
        if (s.encounter) {
          s = act(s, { t: 'answer', opt: 0 }).state;
          continue;
        }
        if (s.sesh.seats.every((p) => p.sent)) break;
        if (s.sesh.found.some((f) => f.by === 'you' && f.shared === null)) {
          t.found++;
          found = true;
          s = act(s, { t: 'sesh', do: policy }).state;
          continue;
        }
        const go = act(s, { t: 'go', route });
        if (go.events[0]?.k === 'refused') break;
        s = act(go.state, {
          t: 'done',
          route,
          result: playGo(go.state, routeOfId(go.state, route)!, hands),
        }).state;
      }
      t.first += s.seshFirsts;
      if (found) t.firstFound += s.seshFirsts;
      t.bond += Object.entries(s.people).reduce((b, [w, p]) => b + p.bond - (s0.people[w]?.bond ?? 0), 0);
      t.old += s.scene.old - s0.scene.old;
    }
    const per = (x: number) => Math.round((x / Math.max(1, t.sessions)) * 100) / 100;
    out[policy] = {
      sessions: t.sessions,
      found: per(t.found),
      first: per(t.first),
      firstFound: Math.round((t.firstFound / Math.max(1, t.found)) * 100) / 100,
      bond: per(t.bond),
      old: per(t.old),
    };
  }
  return out;
}

// Phase 41's criterion 1: the forecast comes true as often as it says. Every call the radio
// makes over `days` days in `seeds` worlds, for the valley and for each place with its own
// sky, counted by how far out it was made and by the word it said: how often it came true,
// against the chance it gave (that word's mean).
export interface CallTally {
  n: number;
  right: number;
  said: number;
}
export function forecastCalibration(seeds: number, days: number) {
  const byLead: Record<number, CallTally> = {};
  const byWord: Partial<Record<Sure, CallTally>> = {};
  const add = (t: CallTally | undefined, right: boolean, sure: number): CallTally => ({
    n: (t?.n ?? 0) + 1,
    right: (t?.right ?? 0) + (right ? 1 : 0),
    said: (t?.said ?? 0) + sure,
  });
  const skies = [undefined, ...Object.keys(PLACES).filter((id) => PLACES[id]!.ownSky)];
  for (let k = 0; k < seeds; k++) {
    const seed = `forecast-${k}`;
    for (const place of skies)
      for (let from = 1; from <= days; from++)
        for (const c of forecastFrom(seed, from, place)) {
          const right = c.sky === (place ? skyAt(seed, c.day, place) : skyOn(seed, c.day));
          byLead[c.day - from] = add(byLead[c.day - from], right, c.sure);
          byWord[c.word!] = add(byWord[c.word!], right, c.sure);
        }
  }
  const rate = (t: CallTally): CallTally => ({ n: t.n, right: t.right / t.n, said: t.said / t.n });
  return {
    byLead: Object.entries(byLead).map(([lead, t]) => ({ lead: Number(lead), ...rate(t) })),
    byWord: Object.entries(byWord).map(([word, t]) => ({ word: word as Sure, ...rate(t!) })),
  };
}

// Phase 42's criterion 2: holding a rope can't out-bond a day climbing together. On `n` open
// mornings at Roadside with Hazel (bond 3): what a go with her there moves her bond, what a
// clean belay of her moves it, and both, in either order; and how often a bot's hands, a
// person's misses and all, make the belay clean.
export function belayMeasure(n: number) {
  const sum = { together: 0, belay: 0, goThenBelay: 0, belayThenGo: 0, clean: 0, days: 0 };
  const CLEAN = { band: 1, soft: true };
  for (let k = 0; k < n; k++) {
    const seed = `belay-${k}`;
    const base = act(newGame(seed), { t: 'create', name: 'Bot', start: 'allrounder' }).state;
    for (let d = 30; d < 200; d++) {
      const s: GameState = {
        ...base,
        day: d,
        at: 'road',
        x: null,
        min: 10 * 60,
        energy: 100,
        skin: 100,
        today: ['crag', 'warm'],
        people: { hazel: { bond: 3, last: 0, since: 1, talked: true, arc: 9, beatDay: 1, life: 9 } },
      };
      if (belayBlocked(s, 'hazel')) continue;
      const bond = (t: GameState) => (t.people.hazel?.bond ?? 3) - 3;
      const go = (t: GameState) => act(t, { t: 'go', route: 'warm' }).state;
      const belay = (t: GameState) => act(t, { t: 'belay', who: 'hazel', result: CLEAN }).state;
      sum.together += bond(go(s));
      sum.belay += bond(belay(s));
      sum.goThenBelay += bond(belay(go(s)));
      sum.belayThenGo += bond(go(belay(s)));
      const r = belayLine(s, 'road')!;
      if (cleanBelay(ropeResult(playRope(startRope(s, 'hazel', r), Rng.fromSeed(`hands-${k}`))))) sum.clean++;
      sum.days++;
      break;
    }
  }
  const per = (x: number) => x / Math.max(1, sum.days);
  return {
    days: sum.days,
    together: per(sum.together),
    belay: per(sum.belay),
    goThenBelay: per(sum.goThenBelay),
    belayThenGo: per(sum.belayThenGo),
    clean: per(sum.clean),
  };
}
