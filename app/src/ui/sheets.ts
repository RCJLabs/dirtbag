// What each list sheet says and offers, built fresh from the state every render, so a sheet
// can never show a price or an option the rules have moved past. Labels come from the
// sim's numbers through its formatters.

import {
  STORY,
  storyOf,
  LINE_SCENE,
  theLine,
  tierOf,
  AGE,
  ageOf,
  epilogue,
  epitaph,
  startAge,
  tallyLines,
  tallyOf,
  ACTS,
  blockOf,
  BOARD_WEEKS,
  BODY,
  bodyNote,
  clock,
  clockShort,
  conditionsAt,
  costLabel,
  DOG,
  DOG_OFFER,
  DOG_TIER_NAME,
  dogTier,
  fill,
  goBlocked,
  gradeLabel,
  gradeOf,
  headroom,
  isNight,
  lineGrade,
  lineName,
  MONEY,
  money,
  PLACES,
  restCost,
  actCost,
  road,
  ROUTES,
  routeOfId,
  routesAt,
  SEND_NAME,
  SKILLS,
  TEXT_VALUES,
  unmet,
  WEEK_DAYS,
  type GameState,
  type RouteDef,
  type Skills,
  type Sky,
  tonight,
  type Tonight,
  PHASES,
  PHASE_NAME,
  phaseLock,
  PREHAB,
  prehabBlocked,
  prehabCost,
  PROTOCOLS,
  sessionCost,
  sessionGains,
  skillsNote,
  taperDay,
  taperWait,
  trainBlocked,
  nextRank,
  rankName,
  indoor,
  EXPED,
  EXPEDITIONS,
  gradeName,
  has,
  expedPitches,
  tripDays,
  wallEventById,
  wallNote,
  recordById,
  CALLINGS,
  OPEN_CALLINGS,
  STANCES,
  ECHOES,
  recapLines,
  recapOf,
  HOME,
  echoOpts,
  stanceOpts,
  sceneNote,
  permitFor,
  callingTerms,
  ambitionText,
  highPoint,
  lastTrip,
  storyBlocked,
  tripBond,
  tripPay,
  tripWords,
  TRIP_BOND,
  TRIP_END,
  CLIMB,
  goCost,
  nightBack,
  partnerTry,
  bagKg,
  forecastCall,
  defaultPlan,
  partnerGrade,
  partners,
  planBlocked,
  planCost,
  planOdds,
  sendChance,
  stormOn,
  summitOdds,
  yourPitch,
  WALLS,
  wallPay,
  CROWD,
  crowdAt,
  type Crowd,
  SPEED,
  speedBlocked,
  speedGains,
  runsToday,
  signedUp,
  dayName,
  JOBS,
  friendFor,
  PART_NAME,
  PARTS,
  partWord,
  PEOPLE,
  VAN,
  nightAt,
  SPOT_NAME,
  gasFor,
  bodgeOdds,
  INGREDIENTS,
  RECIPES,
  BUSK,
  buskBlocked,
  bjTotal,
  boardAt,
  CARD_NAME,
  cardName,
  cardsBlocked,
  cardsName,
  handNeeds,
  readsOn,
  STYLES,
  type CardGame,
  atFire,
  bidWords,
  gameBlocked,
  GAMES,
  yourRaise,
  knockById,
  drivewayHost,
  expedCost,
  DREAMS,
  owns,
  hitcherById,
  hitchOpts,
  hitchFriend,
  stopById,
  EVENTS,
  epicByKind,
  DOG_FAREWELL,
  dogAge,
  dogStage,
  nextDogName,
  buskRate,
  guitarRank,
  RANK_NAME,
  folksDue,
  FOLKS_CALLS,
  HOLIDAYS,
  HOLIDAY_WITH,
  PLAY,
  type Season,
} from '../sim';
import { blockLine, phaseNote, prehabNote, taperNote } from './training';
import type { Game, SheetId } from '../game/game';
import { CRAGS } from '../view/layout';
import { whoAround, type Who } from './who';
import { planLine } from '../game/plan';

export interface Row {
  label: string;
  cost?: string;
  note?: string;
  off?: boolean;
  run: () => void;
}

export interface ListSpec {
  title: string;
  sub?: string;
  rows: Row[];
  close: boolean;
  notes?: string[];
  // Plain lines under the sub, for a sheet that tells rather than warns (the tally).
  lines?: string[];
  // How far a go got, in moves, against your best before it (none on a first go), with the
  // cruxes shaded.
  reach?: { moves: number; cruxes: [number, number][]; go: number; best: number | null };
  // A place card's header: the place drawn as you'd find it at that minute, and said.
  head?: { place: string; min: number; say: string };
  // Who's around then.
  who?: Who;
  // At the van at night: what going to bed would do.
  tonight?: Tonight;
}

// A card of a line you've sent, to keep: from its sent sheet, or later from its beta sheet.
export const cardRow = (game: Game, back: SheetId & { route: string }): Row => ({
  label: 'Keep a card of it',
  note: 'The line on its wall, the grade and the day, drawn here to save or send on.',
  run: () => game.openSheet({ k: 'card', route: back.route, back }),
});

// "An 8-foot", "an 11-foot", "an 18-foot": said, those numbers start with a vowel.
const aFoot = (ft: number) => `${/^(8|1[18]$)/.test(String(ft)) ? 'An' : 'A'} ${ft}-foot`;

export const SKILL_NAME: Record<keyof Skills, string> = {
  power: 'Power',
  fingers: 'Fingers',
  endurance: 'Endurance',
  technique: 'Technique',
  head: 'Head',
};

// "+2.3 endurance · +1.1 technique": what a go taught you, big gains first.
export function gainsLine(g: Partial<Skills>): string {
  return SKILLS.filter((k) => (g[k] ?? 0) >= 0.05)
    .sort((a, b) => g[b]! - g[a]!)
    .map((k) => `+${g[k]!.toFixed(1)} ${k}`)
    .join(' · ');
}

function actRow(game: Game, s: GameState, id: string): Row {
  const a = ACTS[id]!;
  const why = unmet(s, a.needs);
  const cost = actCost(s, a);
  // A shift you didn't sign up for is a walk-in: it pays, and that's all.
  const walkIn = a.job && !signedUp(s, a.job.id, s.day) ? 'A walk-in: it won’t count toward a raise' : '';
  let note = [bodyNote(cost), a.note && fill(a.note, TEXT_VALUES), a.job && jobNote(s, a.job.id), walkIn]
    .filter(Boolean)
    .join('. ');
  if (a.sleep && !why) {
    const n = nightAt(s);
    note = n.rough
      ? "The card won't cover the spot: a cold night in the pullout."
      : `${SPOT_NAME[n.spot]}.${n.wanted ? ` ${SPOT_NAME[n.wanted]} won’t work tonight.` : ''}`;
    if (s.fed < BODY.hungryBelow) note += ' You’ll sleep hungry.';
  }
  return {
    label: a.label,
    cost: costLabel(cost, a.sleep ? 'van spot' : ''),
    note: why ?? note,
    off: !!why,
    run: () => game.doAct(id),
  };
}

// A shift with a minigame (Phase 18): what playing it is called. The plain row works it in
// a tap; this one opens the day's brief.
const PLAYED: Record<string, string> = {
  set: 'Set to the brief',
  cafe: 'Work the rush',
  diner: 'Work the floor',
};

// An act's row, and its play row after it if its job has a minigame (not on a double).
function actRows(game: Game, s: GameState, id: string): Row[] {
  const a = ACTS[id]!;
  const label = a.job && a.job.shifts === 1 ? PLAYED[a.job.id] : undefined;
  if (!label) return [actRow(game, s, id)];
  const why = unmet(s, a.needs);
  return [
    actRow(game, s, id),
    {
      label,
      cost: costLabel(actCost(s, a)),
      note: why ?? `The shift, played: its pay, and up to ${Math.round(PLAY.top * 100)}% more played well.`,
      off: !!why,
      run: () => game.openSheet({ k: 'shift', act: id }),
    },
  ];
}

// Into the train sheet: the block you're in, or why there's nothing to do there yet.
function trainRow(game: Game, s: GameState): Row {
  const board = s.at === 'lot' && !s.gear.hangboard;
  return {
    label: 'Train',
    note: board ? `${blockLine(s)} A hangboard would put sessions here; prehab needs nothing.` : blockLine(s),
    run: () => game.openSheet({ k: 'train' }),
  };
}

// What's in the pantry, and where more comes from.
function pantryNote(s: GameState): string {
  const have = Object.entries(s.pantry)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${n} ${INGREDIENTS[id]!.name.toLowerCase()}`);
  const stove = s.gear.kitchen ? '' : ' A camp kitchen from the garage would cook it.';
  return `${have.length ? have.join(', ') : 'Empty'}. Supplies ${Math.round(s.supplies)}. The market’s in Midtown.${stove}`;
}

// Your next shift, from the van: where the week's schedule and how you live are.
function weekNote(s: GameState): string {
  const next = s.shifts[0];
  const shift = next
    ? `Next shift: ${JOBS[next.job]!.name}, ${next.day === s.day ? 'today' : dayName(next.day)}.`
    : 'No shifts signed up for.';
  return `${shift} Parked at ${SPOT_NAME[s.spot].replace(/^The /, 'the ').replace(/^A /, 'a ')}. The schedule, where you park, and how you live.`;
}

// Where you stand at a job: your rank, and what the next one takes.
function jobNote(s: GameState, job: string): string {
  const next = nextRank(s, job);
  if (!next) return `${rankName(s, job)}, as high as it goes`;
  const need = [
    next.shifts ? `${next.shifts} more shift${next.shifts > 1 ? 's' : ''}` : '',
    next.grade !== null ? `climbing V${next.grade}` : '',
  ].filter(Boolean);
  return `${rankName(s, job)}. ${next.name} takes ${need.join(' and ')}`;
}

function driveRow(game: Game, s: GameState, to: string, label: string): Row {
  const r0 = road(s.at, to)!;
  // Gas as the drive will charge it, tune-up and all.
  const r = { ...r0, cash: gasFor(s, r0.cash) };
  const permit = permitFor(s, to);
  const declined = r.cash > 0 && headroom(s) < r.cash + permit;
  if (permit && headroom(s) < permit)
    return {
      label,
      cost: costLabel({ min: r.min, cash: -(r.cash + permit) }, 'gas and permit'),
      note: `The ${money(permit)} permit won't go on the card.`,
      off: true,
      run: () => game.travel(to),
    };
  return {
    label,
    cost: costLabel({ min: r.min, cash: -(r.cash + permit) }, permit ? 'gas and permit' : 'gas'),
    note: declined ? "The card won't take the gas. You'd be running on fumes." : undefined,
    run: () => game.travel(to),
  };
}

// A trip you pay for once, in cash in hand: what it buys, and what's short.
function unlockRow(game: Game, s: GameState, id: string): Row {
  const cost = PLACES[id]!.unlock!;
  const short = s.cash < cost;
  return {
    label: 'Buy the haul for the trip',
    cost: costLabel({ cash: -cost }),
    note: short
      ? `Pads, water jugs and a guidebook. You need ${money(cost)} in hand, not on the card.`
      : 'Pads, water jugs and a guidebook. Pay once, and the trip is yours.',
    off: short,
    run: () => game.unlock(id),
  };
}

// Where you stand on a problem: sent and how, how close you've got, or not touched yet.
function problemNote(s: GameState, r: RouteDef): string {
  const log = s.routes[r.id];
  if (log?.sent) return `${SEND_NAME[log.sent.style]}, day ${log.sent.day}.`;
  if (log?.goes) return `${log.goes} go${log.goes > 1 ? 'es' : ''}. Your best: move ${log.hi} of ${r.moves}.`;
  return `${r.type[0]!.toUpperCase()}${r.type.slice(1)}, ${r.moves} moves. Not tried.`;
}

// Out of the valley, the sky's its own: what it's doing there today.
const SKY_OUT: Record<Sky, string> = {
  prime: 'Out there today: cold and dry. The best friction.',
  fair: 'Out there today: fair.',
  hot: 'Out there today: hot. Greasy by lunch.',
  rain: 'Out there today: rain. The rock’s soaked.',
};
const skyNote = (sky: Sky): string => SKY_OUT[sky];

const mapRow = (game: Game): Row => ({
  label: 'Open the map',
  run: () => {
    game.closeSheet();
    game.openMap();
  },
});

// Busking outside the café (Phase 22.5b): what you play like, and what an ordinary crowd
// pays that an hour.
function buskRow(game: Game, s: GameState): Row {
  const why = buskBlocked(s);
  return {
    label: 'Busk out front',
    cost: costLabel({ min: BUSK.min, energy: -BUSK.energy }),
    note: why
      ? `${why}.`
      : `${RANK_NAME[guitarRank(s.guitar)]}: about ${money(Math.round(buskRate(s.guitar)))} an hour on an ordinary crowd, played clean. Strum as the marker crosses the band.`,
    off: !!why,
    run: () => game.buskStart(),
  };
}

const cap = (x: string) => `${x[0]!.toUpperCase()}${x.slice(1)}`;
// Phase 22.7: how old your dog is, in a few words (v0.956's).
const DOG_STAGE = {
  pup: 'still a pup',
  prime: 'in his prime',
  gray: 'going gray',
  senior: 'slowing down',
  old: 'old, and yours',
};

// Phase 22.8: the jar in a line, for the van.
function dreamNote(s: GameState): string {
  const d = DREAMS.find((x) => x.id === s.dream.pick);
  const owned = DREAMS.filter((x) => owns(s, x.id)).map((x) => x.name);
  const saving = d
    ? `${money(s.dream.pot)} of ${money(d.cost)} toward ${d.name}.`
    : s.dream.pot
      ? `${money(s.dream.pot)} in the jar, and no dream picked.`
      : 'Pick one, and put something toward it.';
  return owned.length ? `${saving} Yours: ${owned.join(', ')}.` : saving;
}

// Phase 22.9b: sitting down to cards: what it costs, or why not.
function sitRow(
  game: Game,
  s: GameState,
  label: string,
  g: CardGame,
  who: string | undefined,
  note: string,
): Row {
  const why = cardsBlocked(s, g, who);
  return {
    label,
    cost: costLabel({ min: GAMES.min, energy: -GAMES.energy }),
    note: why ? `${why}.` : note,
    off: !!why,
    run: () => (g === 'bj' ? game.bj('sit') : game.holdem('sit', who)),
  };
}

// How far off the next read on someone is.
function readsLeft(s: GameState, who: string): string {
  const played = s.reads[who]?.hands ?? 0;
  const next = GAMES.holdem.reads.find((n) => n > played);
  const name = PEOPLE[who]?.name ?? who;
  return next === undefined ? '' : `${next - played} more hands and you’ll have a read on ${name}.`;
}

// Phase 22.9b: the card table, sat down: the hand on the go, or the next one, and getting up.
function cardsSheet(game: Game, s: GameState, c: NonNullable<GameState['cards']>): ListSpec {
  const name = PEOPLE[c.who]?.name ?? c.who;
  const front = `In front of you: ${money(c.chips)}.`;
  const last = c.game === 'bj' ? GAMES.bj.hands : GAMES.holdem.hands;
  const between = (deal: Row): ListSpec => ({
    title: CARD_NAME[c.game],
    sub: `${front} ${c.hands ? `${c.hands} of ${last} hands played.` : `Up to ${last} hands tonight.`}`,
    notes: c.game === 'holdem' ? readsOn(s, c.who) : undefined,
    close: false,
    rows: [
      c.hands >= last ? { ...deal, off: true, note: 'That’s the last hand tonight.' } : deal,
      {
        label: 'Get up',
        note: `${money(c.chips)} back in your pocket.`,
        run: () => (c.game === 'bj' ? game.bj('leave') : game.holdem('leave')),
      },
    ],
  });
  if (c.game === 'bj') {
    const h = c.bj;
    if (!h) {
      const short = c.chips < GAMES.bj.bet;
      return between({
        label: 'Deal',
        cost: costLabel({ cash: -GAMES.bj.bet }),
        note: short ? 'Not enough in front of you for a hand.' : undefined,
        off: short,
        run: () => game.bj('deal'),
      });
    }
    const can = h.you.length === 2 && c.chips >= h.bet;
    return {
      title: 'Blackjack',
      sub: `You have ${cardsName(h.you)} (${bjTotal(h.you).n}). ${name} shows ${cardName(h.dealer[0]!)}. ${money(h.bet)} on it; ${money(c.chips)} in front of you.`,
      close: false,
      rows: [
        { label: 'Hit', run: () => game.bj('hit') },
        { label: 'Stand', run: () => game.bj('stand') },
        {
          label: 'Double',
          cost: costLabel({ cash: -h.bet }),
          note: can
            ? 'One more card, then you stand.'
            : h.you.length === 2
              ? 'Not enough in front of you.'
              : 'Only on your first two cards.',
          off: !can,
          run: () => game.bj('double'),
        },
      ],
    };
  }
  const he = c.he;
  if (!he) {
    const short = c.chips < handNeeds('holdem');
    const [b0, b1, b2] = GAMES.holdem.bets;
    return between({
      label: 'Deal',
      cost: costLabel({ cash: -GAMES.holdem.ante }),
      note: short
        ? 'Not enough in front of you for a hand.'
        : `An ante each, then bets of ${money(b0!)} before the flop, ${money(b1!)} on it, and ${money(b2!)} on the turn and river.`,
      off: short,
      run: () => game.holdem('deal'),
    });
  }
  const shown = boardAt(he.street);
  const board = shown ? `On the board: ${cardsName(he.board.slice(0, shown))}.` : 'Nothing on the board yet.';
  const B = GAMES.holdem.bets[he.street]!;
  return {
    title: `Hold’em with ${name}`,
    sub: `You have ${cardsName(he.you)}. ${board} The pot’s ${money(he.pot)}.${he.facing ? ` ${name} bets ${money(he.facing)}.` : ''} ${front}`,
    notes: readsOn(s, c.who),
    close: false,
    rows: he.facing
      ? [
          { label: 'Call', cost: costLabel({ cash: -he.facing }), run: () => game.holdem('call') },
          { label: 'Fold', run: () => game.holdem('fold') },
        ]
      : [
          { label: 'Check', run: () => game.holdem('call') },
          { label: 'Bet', cost: costLabel({ cash: -B }), run: () => game.holdem('bet') },
          { label: 'Fold', run: () => game.holdem('fold') },
        ],
  };
}

// Phase 22.9a: who's at the fire, for the van.
function fireNote(s: GameState): string {
  const here = atFire(s).map((w) => PEOPLE[w]?.name ?? w);
  return here.length
    ? `${here.join(' and ')} ${here.length > 1 ? 'are' : 'is'} up. Horseshoes, or dice.`
    : 'Just the coals.';
}

// Phase 24.5: the last trip's story at the fire, while it's still untold.
const storyRow = (game: Game, s: GameState): Row[] => {
  const t = lastTrip(s);
  if (!t || t.told) return [];
  const why = storyBlocked(s);
  const here = atFire(s).map((w) => PEOPLE[w]?.name ?? w);
  const ps = EXPED.story.psyche;
  return [
    {
      label: `Tell them about ${EXPEDITIONS[t.id]!.name}`,
      cost: costLabel({ min: EXPED.story.min }),
      note: why
        ? `${why}.`
        : `+${t.end === 'summit' ? ps.summit : ps.short} psyche, and a night with ${here.join(' and ')} that counts as a day together.`,
      off: !!why,
      run: () => game.story(),
    },
  ];
};

// Phase 24.5: where you got to on an objective before, for the planner.
const highNote = (s: GameState, id: string): string[] => {
  const hp = highPoint(s, id);
  if (!hp) return [];
  const e = EXPEDITIONS[id]!;
  return [
    hp.summit
      ? `You’ve stood on top of ${e.objective}.`
      : `Your high point: ${hp.high} of ${e.pitches} pitches.`,
  ];
};

// Phase 24.5: a trip's card, home again: how it ended, what happened, what it paid, your
// partner, and where it leaves your high point.
function homeSheet(game: Game, s: GameState): ListSpec | null {
  const t = lastTrip(s);
  if (!t) return null;
  const e = EXPEDITIONS[t.id]!;
  const w = tripWords(t);
  const before = highPoint({ ...s, book: s.book.slice(0, -1) }, t.id);
  const d = t.partner ? tripBond(e, t.end, t.high) : 0;
  const happened = t.seen.map((id) => wallEventById(id)?.title).filter(Boolean);
  const notes = [
    `${t.nights === 1 ? 'A night' : `${t.nights} nights`} on the wall.${happened.length ? ` Up there: ${happened.join('; ')}.` : ''}`,
  ];
  if (t.end === 'summit')
    notes.push(before?.summit ? 'You’d been paid for it before.' : `The sponsors paid ${money(e.pays)}.`);
  else if (!before) {
    if (t.high) notes.push('Your high point on it, for next time.');
  } else if (before.summit || t.high <= before.high)
    notes.push(
      before.summit
        ? `You’ve stood on top of it before.`
        : `Your high point is still ${before.high} pitches.`,
    );
  else notes.push(`A new high point: ${t.high} pitches, past your ${before.high}.`);
  if (d) notes.push(fill(d > 0 ? TRIP_BOND.closer : TRIP_BOND.further, w));
  if (!t.told) notes.push('Tell it at the fire some night.');
  return {
    title: e.name,
    sub: `${fill(TRIP_END[t.end], w)}, ${t.partner ? `with ${w.partner}` : 'alone'}.`,
    notes,
    close: false,
    rows: [{ label: 'Right', run: () => game.closeSheet() }],
  };
}

export function buildSheet(game: Game, id: SheetId, s: GameState): ListSpec | null {
  switch (id.k) {
    case 'van': {
      const { plan, yesterday } = game.ui.get().plans;
      return {
        title: 'Your van',
        sub: isNight(s.min) ? 'Bed made. Mostly.' : `Home, for ${TEXT_VALUES.spot} a night at the Lot.`,
        tonight: isNight(s.min) ? tonight(s) : undefined,
        close: true,
        rows: [
          // Phase 17.6: a call from home, waiting on the phone.
          ...(folksDue(s) !== null
            ? [{ label: 'Call home back', note: 'A missed call from home.', run: () => game.callHome() }]
            : []),
          actRow(game, s, 'lot.cook'),
          // Phase 22.3: with a camp kitchen, the recipes, and what's in the pantry for them.
          ...(s.gear.kitchen ? Object.keys(RECIPES).map((id) => actRow(game, s, `lot.${id}`)) : []),
          {
            label: 'The pantry',
            note: pantryNote(s),
            run: () => game.openSheet({ k: 'place', id: 'market' }),
          },
          ...(isNight(s.min) ? [] : [actRow(game, s, 'lot.rest')]),
          // Phase 22.5a: the cans, by day.
          ...(isNight(s.min) ? [] : [actRow(game, s, 'lot.cans')]),
          trainRow(game, s),
          {
            label: 'Your week',
            note: weekNote(s),
            run: () => game.openSheet({ k: 'week' }),
          },
          // Phase 22.8: the jar, and what it's for.
          {
            label: 'Dreams',
            note: dreamNote(s),
            run: () => game.openSheet({ k: 'dreams' }),
          },
          {
            label: 'Under the hood',
            note: `${PARTS.map((p) => `${PART_NAME[p]} ${partWord(s.van[p])}`).join(', ')}. The garage is in Midtown.`,
            run: () => game.openSheet({ k: 'journal', page: 'you' }),
          },
          // Phase 24.2: a trip you've booked, and the day you fly.
          ...(s.booked
            ? [
                {
                  label: `${EXPEDITIONS[s.booked.id]!.name}, booked`,
                  note: s.booked.day === s.day ? 'You fly out today.' : `You fly out on day ${s.booked.day}.`,
                  run: () => game.openSheet({ k: 'exped', id: s.booked!.id }),
                },
              ]
            : []),
          {
            label: 'Expeditions',
            note: 'Big walls a long way from here, bought in cash and climbed a day at a time.',
            run: () => game.openSheet({ k: 'expeds' }),
          },
          // Phase 22.9a: the fire, and the games there.
          ...(isNight(s.min)
            ? [{ label: 'The fire', note: fireNote(s), run: () => game.openSheet({ k: 'fire' }) }]
            : []),
          actRow(game, s, 'lot.sleep'),
          ...(plan.length
            ? [{ label: 'Run the plan', note: `${planLine(plan)}.`, run: () => game.runPlan(plan) }]
            : []),
          {
            label: 'Plan the day',
            note: plan.length
              ? undefined
              : yesterday.length
                ? 'It starts from yesterday, as you played it.'
                : 'Drives, shifts and meals in one go. It waits while you climb.',
            run: () => game.openSheet({ k: 'plan' }),
          },
          mapRow(game),
        ],
      };
    }

    case 'cragVan': {
      const back = road(s.at, 'lot');
      return {
        title: 'The van',
        sub: back
          ? `Parked on the shoulder. It's $${back.cash} of gas back to the Lot.`
          : 'Parked on the shoulder.',
        close: true,
        rows: [...(back ? [driveRow(game, s, 'lot', 'Drive back to the Lot')] : []), mapRow(game)],
      };
    }

    case 'desk':
      if (s.at === 'center')
        return {
          title: 'The desk',
          sub: s.today.includes('centerpass')
            ? 'Wristband on. The comp wall is yours till ten.'
            : 'The comp team is warming up on problems you’d project. The set changes every seven days.',
          close: true,
          rows: [actRow(game, s, 'center.pass'), trainRow(game, s), mapRow(game)],
        };
      if (s.at === 'cave')
        return {
          title: 'The desk',
          sub: s.today.includes('cavepass')
            ? "Your hand's stamped. Climb till ten."
            : 'Someone behind the desk is taping a finger. The set changes every seven days.',
          close: true,
          rows: [
            actRow(game, s, 'cave.pass'),
            actRow(game, s, 'cave.coach'),
            trainRow(game, s),
            mapRow(game),
          ],
        };
      return {
        title: 'The desk',
        sub: s.today.includes('pass')
          ? "Your hand's stamped. Climb till ten."
          : "The kid at the desk doesn't look up. The set changes every seven days.",
        close: true,
        rows: [
          actRow(game, s, 'gym.pass'),
          ...actRows(game, s, 'gym.set'),
          actRow(game, s, 'gym.shower'),
          trainRow(game, s),
          mapRow(game),
        ],
      };

    case 'board': {
      const probs = routesAt(s.seed, 'gym', s.day).filter((r) => r.board);
      // Days until the next set goes up: the day after this block's last.
      const next = blockOf(s.day) * WEEK_DAYS * BOARD_WEEKS + 1 - s.day;
      return {
        title: 'The board',
        sub: `The steep panel in the back: ${probs.length} problems, ${gradeLabel(probs[0]!)} to ${gradeLabel(probs.at(-1)!)}, lit on the grid. Board grades run stiff, and they stay up ${BOARD_WEEKS} weeks. A new set goes up ${next === 1 ? 'tomorrow' : `in ${next} days`}.`,
        close: true,
        rows: probs.map((r) => ({
          label: r.name,
          cost: gradeLabel(r),
          note: problemNote(s, r),
          run: () => game.lookUp(r.id),
        })),
      };
    }

    case 'place': {
      const p = PLACES[id.id]!;
      const here = s.at === id.id;
      // The card shows the place as you'd find it: now if you're here, or after the drive.
      const min = here ? s.min : s.min + (road(s.at, id.id)?.min ?? 0);
      const head = { place: id.id, min, say: `${p.name}, ${clockShort(min)}.` };
      const who = p.scene ? whoAround(s, id.id, min) : undefined;
      const sub = fill(here ? p.here : p.away, {
        ...TEXT_VALUES,
        lines: Object.values(ROUTES).filter((r) => r.place === id.id).length,
      });
      // A crag that's shut for the season says so before you burn the gas; one that's
      // above your grade doesn't let you go at all. One out of the valley has its own
      // weather, so its card says what it's doing out there.
      const here_ = conditionsAt(s.seed, s.day, id.id);
      const shut = here_.closed;
      const sky = PLACES[id.id]?.ownSky ? [skyNote(here_.sky)] : [];
      const crowd = p.crowd && !shut ? [crowdNote(crowdAt(s.seed, s.day, min, id.id))] : [];
      const extra = [...(shut ? [`${shut}.`] : []), ...sky, ...crowd];
      const notes = extra.length ? extra : undefined;
      if (!here) {
        const locked = p.minGrade !== undefined && gradeOf(s.climber.skills) < p.minGrade;
        const drive = driveRow(game, s, id.id, 'Drive here');
        const unpaid = !!p.unlock && !s.unlocked.includes(id.id);
        return {
          title: p.name,
          sub,
          close: true,
          head,
          who,
          notes: locked ? [p.locked ?? 'Not yet.'] : notes,
          rows: locked
            ? [{ ...drive, off: true, note: undefined }]
            : unpaid
              ? [unlockRow(game, s, id.id)]
              : [drive],
        };
      }
      if (p.scene) {
        const scene = p.scene;
        const label = CRAGS[scene] ? 'Walk to the wall' : indoor(id.id) ? 'Walk in' : 'Walk back to the van';
        return {
          title: p.name,
          sub,
          close: true,
          head,
          who,
          notes,
          rows: [{ label, run: () => game.enterScene(scene) }],
        };
      }
      // A card-only place: you're here until you drive somewhere, but the card still closes
      // onto the map, as every other card does (Evan, 0.975.0: a card with no ✕ read as stuck).
      const onward = Object.keys(PLACES).filter((o) => o !== id.id && road(id.id, o));
      return {
        title: p.name,
        sub,
        close: true,
        head,
        rows: [
          ...p.acts.flatMap((a) => actRows(game, s, a)),
          // Phase 22.5b: a set out front.
          ...(id.id === 'cafe' ? [buskRow(game, s)] : []),
          ...onward.map((o) =>
            driveRow(game, s, o, o === 'lot' ? 'Drive back to the Lot' : `Drive to ${PLACES[o]!.name}`),
          ),
        ],
      };
    }

    case 'fall': {
      const r = routeOfId(s, id.route)!;
      const crux = r.cruxes.find((c) => c.id === id.fall.crux);
      const where = id.fall.extra
        ? 'a move that’s a crux for you'
        : crux
          ? crux.name.replace(/^The /, 'the ')
          : 'the wall';
      const hi = s.routes[id.route]?.hi ?? 0;
      const how = r.dws
        ? `${aFoot(id.fall.ft)} drop into the sea from move ${id.fall.move} of ${r.moves}. You swim back to the shelf.`
        : r.disc === 'boulder'
          ? `${aFoot(id.fall.ft)} drop to the pads from move ${id.fall.move} of ${r.moves}.`
          : id.fall.deck
            ? `${aFoot(id.fall.ft)} fall from move ${id.fall.move} of ${r.moves}, and nothing held it off the ground.`
            : `${aFoot(id.fall.ft)} catch at move ${id.fall.move} of ${r.moves}.`;
      const why = goBlocked(s, r);
      const gained = gainsLine(id.gains);
      return {
        title: `Off at ${where}`,
        reach: {
          moves: r.moves,
          cruxes: r.cruxes.map((c): [number, number] => [c.from, c.to]),
          go: id.fall.move,
          best: id.best,
        },
        sub: `${id.fall.text} ${how} High point: move ${hi}.`,
        close: false,
        notes: [...id.notes, ...(gained ? [gained] : [])],
        rows: [
          {
            label: 'Rest, then go again',
            cost: costLabel({ min: restCost(r) }),
            note: why ? `${why}.` : 'Pump back to zero. Change your beta if you want.',
            off: !!why,
            run: () => game.rest(),
          },
          { label: 'Walk off', run: () => game.walkOff() },
        ],
      };
    }

    case 'sent': {
      const r = routeOfId(s, id.route)!;
      const gained = gainsLine(id.gains);
      if (r.wall) return pitchSent(game, s, id, r, gained);
      return {
        title: SEND_NAME[id.style],
        sub: `${lineName(s, r)}, ${lineGrade(s, r)}, on go ${id.go}.${r.disc === 'sport' ? " Rent's still due." : r.disc === 'trad' ? ' On gear you placed.' : ''}`,
        close: false,
        notes: [...id.notes, ...(gained ? [gained] : [])],
        rows: [
          {
            label:
              r.disc === 'sport'
                ? 'Lower off and walk out'
                : r.disc === 'trad'
                  ? 'Clean your gear and walk out'
                  : r.dws
                    ? 'Jump off, and swim back'
                    : indoor(r.place)
                      ? 'Drop onto the mats'
                      : 'Walk down the back',
            run: () => game.walkOff(),
          },
          ...(id.first ? [cardRow(game, id)] : []),
        ],
      };
    }

    case 'dog': {
      const d = s.dog;
      if (!d)
        return {
          title: nextDogName(s),
          sub: DOG_OFFER.sub.replaceAll('Scout', nextDogName(s)),
          close: true,
          rows: [
            actRow(game, s, 'lot.adopt'),
            {
              label: DOG_OFFER.no,
              run: () => {
                game.closeSheet();
                game.toast(DOG_OFFER.left);
              },
            },
          ],
        };
      const days = s.day - d.since;
      const fed =
        d.fed >= 80
          ? 'Fed, and pleased about it.'
          : d.fed < DOG.hungryBelow
            ? 'He keeps checking the food bin.'
            : 'He could eat.';
      return {
        title: d.name,
        sub: `${DOG_TIER_NAME[dogTier(d.bond)]}. ${cap(DOG_STAGE[dogStage(d, s.day)])}: ${dogAge(d, s.day)} in dog years. ${days ? `With you ${days} day${days > 1 ? 's' : ''}.` : 'Yours since this morning.'} ${fed}`,
        close: true,
        rows: [actRow(game, s, 'lot.kibble'), actRow(game, s, 'lot.play')],
      };
    }

    // Too long for a toast: it waits on a card, and stays in the journal.
    case 'note':
      return {
        title: `Day ${id.day} · ${clock(id.min)}`,
        sub: id.text,
        close: false,
        rows: [{ label: 'Right', run: () => game.closeSheet() }],
      };

    case 'home':
      return homeSheet(game, s);

    // Phase 23.1: in the Record Book, with its story.
    case 'record': {
      const [r, ...also] = id.ids.map(recordById).filter((x) => !!x);
      if (!r) return null;
      return {
        title: r.title,
        sub: r.story,
        notes: [
          `In the Record Book, day ${s.record[r.id] ?? s.day}.${also.length ? ` Also in it: ${also.map((x) => x!.title).join(', ')}.` : ''}`,
        ],
        close: false,
        rows: [{ label: 'Right', run: () => game.closeSheet() }],
      };
    }

    // Phase 23.7: a year done, in what it held.
    case 'year':
      return {
        title: `Year ${id.n}`,
        sub: recapLines(recapOf(s, id.n)).join(' '),
        close: false,
        rows: [{ label: 'On to the next', run: () => game.closeSheet() }],
      };

    // Phase 23.7: the Homecoming, had.
    case 'homecoming': {
      const r = routeOfId(s, id.route);
      const names =
        id.who.length > 1
          ? `${id.who.slice(0, -1).join(', ')} and ${id.who.at(-1)}`
          : (id.who[0] ?? 'everyone');
      return {
        title: 'The Homecoming',
        sub: `Everyone came out for it. You sent ${r ? lineName(s, r) : 'it'} with ${names} at the bottom, and for once nobody was looking at their own project.`,
        notes: [`${money(HOME.cash)} in a coffee can somebody passed round. Psyche +${HOME.psyche}.`],
        close: false,
        rows: [{ label: 'Right', run: () => game.closeSheet() }],
      };
    }

    // Phase 23.3: what you're climbing for. Asked once, at the fire; put off, it waits on the
    // You page.
    case 'calling': {
      if (s.calling.id) return null;
      return {
        title: 'What are you climbing for?',
        sub: 'Hazel, at the fire: “You’ve sent enough to know what you like. So what is it you’re after?” Whatever you say, you’re saying it for good.',
        close: false,
        rows: [
          ...OPEN_CALLINGS.map((cid) => {
            const c = CALLINGS[cid]!;
            const t = callingTerms(c);
            return {
              label: c.name,
              note: `${c.blurb} ${[...t.perks, ...t.costs].join(' ')} Ambition: ${ambitionText(c)}.`,
              run: () => {
                game.dispatch({ t: 'calling', id: cid });
                game.closeSheet();
              },
            };
          }),
          { label: 'Not yet', note: 'It’ll keep, on the You page.', run: () => game.closeSheet() },
        ],
      };
    }

    // The Line (Phase 16.3): the naming, who was there, then what now. The credits, the third
    // step, are drawn by Sheet.tsx.
    case 'line': {
      const l = theLine(s);
      const on = (step: number) => () => game.openSheet({ k: 'line', step });
      if (id.step === 0)
        return {
          title: LINE_SCENE.naming.title,
          sub: fill(LINE_SCENE.naming.text, {
            name: l?.name ?? 'the line',
            grade: `V${l?.grade ?? 18}`,
            place: l?.place ?? 'the crag',
          }),
          notes: [`${money(STORY[STORY.length - 1]!.end.cash)}.`],
          close: false,
          rows: [{ label: 'Go on', run: on(1) }],
        };
      if (id.step === 1) {
        const end = STORY[STORY.length - 1]!.end;
        const there = Object.entries(end.with ?? {})
          .filter(([who]) => tierOf(s.people[who]?.bond ?? 0) >= HOME.tier)
          .map(([, t]) => t);
        if (s.dog) there.push(fill(LINE_SCENE.there.dog, { name: s.dog.name }));
        return {
          title: LINE_SCENE.there.title,
          sub: [end.text, ...(there.length ? there : [LINE_SCENE.there.alone])].join(' '),
          close: false,
          rows: [{ label: 'Go on', run: on(2) }],
        };
      }
      const c = LINE_SCENE.choice;
      return {
        title: c.title,
        sub: c.text,
        close: false,
        rows: [
          { label: c.retire.label, note: c.retire.note, run: () => game.dispatch({ t: 'retire' }) },
          { label: c.keep.label, note: c.keep.note, run: () => game.closeSheet() },
        ],
      };
    }

    // An act's end (Phase 16.2): its scene, and a line for each person close enough to be there.
    // Phase 17.6: a holiday's night at the fire, and who was there.
    case 'holiday': {
      const h = HOLIDAYS[id.id as Season];
      if (!h) return null;
      const here = id.who.flatMap((w) => (HOLIDAY_WITH[w] ? [HOLIDAY_WITH[w]!] : []));
      return {
        title: h.name,
        sub: here.length ? `${h.text} ${here.join(' ')} You stay up till the fire’s gray.` : h.alone,
        close: false,
        rows: [{ label: 'Morning', run: () => game.closeSheet() }],
      };
    }
    case 'act': {
      const end = storyOf(s)[id.n - 1]?.end;
      if (!end) return null;
      const there = Object.entries(end.with ?? {})
        .filter(([who]) => tierOf(s.people[who]?.bond ?? 0) >= HOME.tier)
        .map(([, l]) => l);
      return {
        title: end.title,
        sub: [end.text, ...there].join(' '),
        notes: [`${money(end.cash)}.`],
        close: false,
        rows: [{ label: 'Keep climbing', run: () => game.closeSheet() }],
      };
    }

    case 'restart':
      return {
        title: 'Start over?',
        sub: `A new first morning: $${MONEY.start}, a van, and Hazel at the fire. This game is gone for good.`,
        close: true,
        rows: [
          { label: 'Start a new game', run: () => game.restart() },
          { label: 'Keep playing', run: () => game.closeSheet() },
        ],
      };

    case 'train': {
      const where = indoor(s.at) ? 'gym' : 'van';
      const rows: Row[] = Object.entries(PROTOCOLS)
        .filter(([, p]) => p.where === where)
        .map(([pid, p]) => {
          const why = trainBlocked(s, pid);
          const got = skillsNote(sessionGains(s, p));
          return {
            label: p.name,
            cost: costLabel(sessionCost(p)),
            note: why ? `${why}.` : `${p.what} ${got}. ${bodyNote(sessionCost(p))}.`,
            off: !!why,
            run: () => game.train(pid),
          };
        });
      if (where === 'van') {
        const why = prehabBlocked(s);
        rows.push({
          label: PREHAB.name,
          cost: costLabel(prehabCost()),
          note: why ? `${why}.` : prehabNote(),
          off: !!why,
          run: () => game.train('prehab'),
        });
      }
      const tw = taperWait(s);
      const tapering = taperDay(s) > 0;
      return {
        title: where === 'gym' ? `Train at ${PLACES[s.at]!.name}` : 'Train at the van',
        sub: `${blockLine(s)} One session a day.`,
        close: true,
        rows: [
          ...rows,
          {
            label: 'Change phase',
            note: phaseNote(s.training.phase),
            run: () => game.openSheet({ k: 'phases' }),
          },
          {
            label: 'Taper for a send',
            note: tapering
              ? 'You’re tapering.'
              : tw
                ? `Too soon after the last one: ${tw} more day${tw > 1 ? 's' : ''}.`
                : taperNote(),
            off: tapering || tw > 0,
            run: () => game.taper(),
          },
        ],
      };
    }

    case 'phases': {
      const lock = phaseLock(s);
      return {
        title: 'Your phase',
        sub: blockLine(s),
        close: true,
        rows: [
          ...PHASES.map((ph) => {
            const now = ph === s.training.phase;
            return {
              label: PHASE_NAME[ph],
              note: now
                ? `You’re in it. ${phaseNote(ph)}`
                : lock
                  ? `Locked ${lock} more day${lock > 1 ? 's' : ''}. ${phaseNote(ph)}`
                  : phaseNote(ph),
              off: now || lock > 0,
              run: () => {
                if (!game.setPhase(ph)) game.openSheet({ k: 'train' });
              },
            };
          }),
          { label: 'Back', run: () => game.openSheet({ k: 'train' }) },
        ],
      };
    }

    case 'wall':
      return wallSheet(game, s, id.id);

    case 'speed': {
      const why = speedBlocked(s);
      const left = SPEED.fresh - runsToday(s);
      const pb = s.speed.pb;
      return {
        title: 'The speed wall',
        sub: `${SPEED.holds} holds, the same on every speed wall in the world. Three lights, and go on the third.`,
        notes: [
          pb === null ? 'No time on the board yet.' : `Your best: ${pb.toFixed(2)} s.`,
          left > 0
            ? `${left} more run${left > 1 ? 's' : ''} today will teach you: ${skillsNote(speedGains(s))}.`
            : 'Your legs are done learning today. The clock still runs.',
        ],
        close: true,
        rows: [
          {
            label: 'Race the clock',
            cost: costLabel({ min: SPEED.min, energy: -SPEED.energy, skin: -SPEED.skin }),
            note: why ? `${why}.` : 'Grab with alternate hands. The same hand twice and you slip.',
            off: !!why,
            run: () => game.speedStart(),
          },
        ],
      };
    }

    // Phase 22.6a: someone at the door. No close: the night waits on an answer.
    case 'encounter': {
      const e = s.encounter;
      // Phase 22.6b: a hitchhiker, the first time or again; a stop, and the detour it is.
      if (e?.kind === 'hitch') {
        const h = hitcherById(e.id);
        if (!h) return null;
        const again = s.deck.met[h.id] !== undefined;
        return {
          title: h.who,
          sub: again
            ? h.again.open
            : `${h.sign === 'no sign' ? 'No sign.' : `“${h.sign}”, the sign says.`} ${h.look} ${h.pitch}`,
          close: false,
          rows: hitchOpts(s, h).map((o, i) => ({ label: o.label, run: () => game.answer(i) })),
        };
      }
      // A call from home, returned.
      if (e?.kind === 'folks') {
        const c = FOLKS_CALLS[Number(e.id)];
        if (!c) return null;
        return {
          title: c.title,
          sub: c.sit,
          close: false,
          rows: c.opts.map((o, i) => ({
            label: o.label,
            ...(o.cash ? { note: money(-o.cash) } : o.home ? { note: 'For good: this ends it.' } : {}),
            run: () => game.answer(i),
          })),
        };
      }
      // Phase 22.7: your dog's last day. No close: there's only how you spend it.
      if (e?.kind === 'farewell') {
        const d = s.dog;
        if (!d) return null;
        return {
          title: d.name,
          sub: DOG_FAREWELL.sit,
          close: false,
          rows: DOG_FAREWELL.opts.map((o, i) => ({ label: o.label, run: () => game.answer(i) })),
        };
      }
      // Phase 23.5: a call put to you at the crag, or one you made, coming back.
      if (e?.kind === 'stance' || e?.kind === 'echo') {
        const echo = e.kind === 'echo' ? ECHOES[e.id] : undefined;
        const st = echo ? undefined : STANCES[e.id];
        if (!echo && !st) return null;
        const opts = echo ? echoOpts(echo) : stanceOpts(s, e.id);
        return {
          title: (echo ?? st)!.title,
          sub: (echo ?? st)!.sit,
          close: false,
          rows: opts.map((o, i) => ({ label: o.label, note: sceneNote(o.fx), run: () => game.answer(i) })),
        };
      }
      // Phase 24.4: something happening up on the wall, and its calls.
      if (e?.kind === 'wall') {
        const w = wallEventById(e.id);
        if (!w) return null;
        const p = s.expedition?.partner;
        const who = p ? (PEOPLE[p]?.name ?? p) : undefined;
        return {
          title: w.title,
          sub: w.sit,
          close: false,
          rows: w.opts.map((o, i) => ({
            label: o.label,
            note: `${o.sub} ${wallNote(o.fx, who)}.`,
            run: () => game.answer(i),
          })),
        };
      }
      // Phase 22.6c: a walk-out, a stage at a time.
      if (e?.kind === 'epic') {
        const ep = epicByKind(e.id);
        const st = ep?.stages[e.stage ?? 0];
        if (!ep || !st) return null;
        return {
          title: ep.title,
          sub: e.stage ? st.sit : `${ep.open} ${st.sit}`,
          close: false,
          rows: st.opts.map((o, i) => ({ label: o.label, note: o.sub, run: () => game.answer(i) })),
        };
      }
      if (e?.kind === 'stop') {
        const x = stopById(e.id);
        if (!x) return null;
        const seen = s.deck.stops.includes(x.id);
        return {
          title: x.name,
          sub: seen
            ? `The turnoff for ${x.name}. You know the way.`
            : `A turnoff you haven’t taken, for ${x.name}.`,
          close: false,
          rows: [
            {
              label: 'Pull over',
              cost: costLabel({ min: EVENTS.stop.min, cash: x.fx.cash }),
              run: () => game.answer(0),
            },
            { label: 'Keep driving', run: () => game.answer(1) },
          ],
        };
      }
      const k = e ? knockById(e.id) : undefined;
      if (!k) return null;
      const host = drivewayHost(s);
      return {
        title: k.title,
        sub: fill(k.sit, { who: host ? PEOPLE[host]!.name : 'Your friend' }),
        close: false,
        rows: k.opts.map((o, i) => ({ label: o.label, run: () => game.answer(i) })),
      };
    }

    // Phase 22.9a: the fire at night, and the games with whoever's there.
    case 'fire': {
      if (s.cards) return cardsSheet(game, s, s.cards);
      const tb = s.table;
      if (tb) {
        const name = PEOPLE[tb.who]?.name ?? tb.who;
        const up = yourRaise(tb);
        return {
          title: 'Liar’s dice',
          sub: `Your cup: ${[...tb.mine].sort().join(' ')}. ${name} bids ${bidWords(tb.bid.n, tb.bid.face)}, between the two cups.`,
          close: false,
          rows: [
            {
              label: 'Call it',
              note: `You’re right if there are fewer than ${bidWords(tb.bid.n, tb.bid.face)} under both cups.`,
              run: () => game.dice('call'),
            },
            {
              label: `Raise: ${bidWords(up.n, up.face)}`,
              note: `${name} can call it, or let it go.`,
              run: () => game.dice('raise'),
            },
          ],
        };
      }
      const here = atFire(s).map((w) => PEOPLE[w]?.name ?? w);
      const game_ = (label: string, g: 'shoes' | 'dice', note: string, run: () => void): Row => {
        const why = gameBlocked(s, g);
        return {
          label,
          cost: costLabel({ min: GAMES.min, energy: -GAMES.energy }),
          note: why ? `${why}.` : note,
          off: !!why,
          run,
        };
      };
      return {
        title: 'The fire',
        sub: !isNight(s.min)
          ? 'Coals and a coffee pot. It’s lit again after dark.'
          : here.length
            ? `${here.join(' and ')}, and a camp chair with your name on it.`
            : 'Just you and the coals tonight.',
        close: true,
        rows: [
          actRow(game, s, 'lot.sit'),
          ...storyRow(game, s),
          game_(
            'Horseshoes',
            'shoes',
            `Four throws each against ${here.join(' and ') || 'whoever’s up'}. Throw as the marker crosses the band.`,
            () => game.shoesStart(),
          ),
          game_(
            'Liar’s dice',
            'dice',
            `Five dice each, no wilds, a hand with ${here[0] ?? 'whoever’s up'}. One bid: call it or raise.`,
            () => game.dice('deal'),
          ),
          // Phase 22.9b: cards, for money.
          sitRow(
            game,
            s,
            'Blackjack',
            'bj',
            undefined,
            `${money(GAMES.bj.bet)} a hand, up to ${GAMES.bj.hands} hands, and you sit down with ${money(GAMES.bj.cap)} at most. ${here[0] ?? 'Whoever’s up'} deals.`,
          ),
          ...atFire(s)
            .filter((w) => STYLES[w])
            .map((w) => {
              const name = PEOPLE[w]?.name ?? w;
              const reads = readsOn(s, w);
              return sitRow(
                game,
                s,
                `Hold’em with ${name}`,
                'holdem',
                w,
                `Heads-up, ${money(GAMES.holdem.cap)} at most. ${reads.length ? reads.join(' ') : readsLeft(s, w)}`,
              );
            }),
        ],
      };
    }

    // Phase 22.8: dreams. Pick one, fill the jar in hand, claim it when it's covered.
    case 'dreams': {
      const D = s.dream;
      const pick = DREAMS.find((x) => x.id === D.pick);
      const hand = Math.max(0, Math.floor(s.cash));
      const put = (n: number): Row => ({
        label: `Put ${money(n)} in the jar`,
        note: hand < n ? `You have ${money(hand)} in hand. The jar doesn’t take the card.` : undefined,
        off: hand < n,
        run: () => game.dream('stash', undefined, n),
      });
      return {
        title: 'Dreams',
        sub: `${money(D.pot)} in the jar. The card and the week’s bills never touch it.`,
        close: true,
        rows: [
          ...DREAMS.map((x): Row => {
            const mine = owns(s, x.id);
            const chosen = D.pick === x.id;
            return {
              label: x.name,
              cost: mine ? undefined : costLabel({ cash: -x.cost }, 'to save'),
              note: mine
                ? `Yours. ${x.perk}`
                : `${x.blurb} ${x.perk}${chosen ? ' The one you’re saving for.' : ''}`,
              off: mine,
              run: () =>
                chosen && D.pot >= x.cost
                  ? game.dream('claim')
                  : !chosen
                    ? game.dream('pick', x.id)
                    : undefined,
            };
          }),
          ...(pick && D.pot >= pick.cost
            ? [
                {
                  label: `Claim ${pick.name}`,
                  note: `${money(pick.cost)} from the jar.`,
                  run: () => game.dream('claim'),
                },
              ]
            : []),
          put(20),
          put(100),
          ...(hand > 0
            ? [{ label: `Put all ${money(hand)} in`, run: () => game.dream('stash', undefined, hand) }]
            : []),
          ...(D.pot > 0
            ? [
                {
                  label: 'Tip the jar out',
                  note: `${money(D.pot)} back in hand.`,
                  run: () => game.dream('take'),
                },
              ]
            : []),
        ],
      };
    }

    case 'breakdown': {
      const b = s.breakdown;
      if (!b) return null;
      const to = PLACES[b.to]!.name;
      const who = friendFor(s);
      // Phase 22.6b: a hitchhiker you were good to, if nobody you'd call can.
      const hitch = who ? null : hitchFriend(s);
      const tow = { min: VAN.tow.min, cash: -VAN.tow.cash };
      return {
        title: 'Broken down',
        sub: `On the shoulder, halfway to ${to}. The ${PART_NAME[b.part].toLowerCase()} ${b.part === 'tires' ? 'are' : 'is'} done.`,
        close: false,
        rows: [
          ...(who
            ? [
                {
                  label: `Call ${PEOPLE[who]!.name}`,
                  cost: costLabel({ min: VAN.friend.min + b.rest }),
                  note: `A jack, a spare and an afternoon of theirs. On to ${to}, and the part good for a while.`,
                  run: () => game.fix('friend'),
                },
              ]
            : hitch
              ? [
                  {
                    label: `Wave down ${hitch.friend}`,
                    cost: costLabel({ min: VAN.friend.min + b.rest }),
                    note: `They’re coming the other way, and they remember the ride. A jack, a hand, and on to ${to}.`,
                    run: () => game.fix('friend'),
                  },
                ]
              : []),
          {
            label: 'Bodge it',
            cost: costLabel({ min: VAN.bodge.min }),
            note: b.bodged
              ? 'You’ve tried. It isn’t going to hold.'
              : `${s.gear.toolkit ? 'The tool kit, and a plan' : 'Tape, zip ties and hope'}. It holds about ${Math.round(bodgeOdds(s) * 10)} times in 10, and then it’s on to ${to}.`,
            off: b.bodged,
            run: () => game.fix('bodge'),
          },
          {
            label: `Limp on to ${to}`,
            cost: costLabel({ min: b.rest * VAN.limp.slow, energy: -VAN.limp.energy }),
            note: 'Hazards on, half speed. The part’s shot when you get there: next stop, the garage.',
            run: () => game.fix('limp'),
          },
          {
            label: 'Call a tow',
            cost: costLabel(tow, 'tow'),
            note: 'To the garage in Midtown, and the van with it. Not to the crag.',
            run: () => game.fix('tow'),
          },
        ],
      };
    }

    // Phase 16.1: hanging it up is for good, so it's asked.
    case 'hangup':
      return {
        title: 'Hang it up?',
        sub: `${ageOf(s)}, and ${ageOf(s) - startAge(s)} years on rock. There’s no coming back from this one: the shoes go in a box, and the tally’s all that’s left.`,
        close: true,
        rows: [
          {
            label: 'Hang it up',
            note: 'For good.',
            run: () => game.dispatch({ t: 'retire' }),
          },
          {
            label: 'One more season',
            note: `Your body calls it at ${AGE.forced} either way.`,
            run: () => game.closeSheet(),
          },
        ],
      };

    case 'retired': {
      const r = s.life.retired;
      if (!r) return null;
      const t = tallyOf(s);
      return {
        title: 'A climbing life',
        sub: `${s.climber.name}, ${t.age}: ${t.years} years on rock. ${r.forced ? 'Your body called it.' : r.home ? 'You went home for good.' : 'You called it yourself.'} ${epitaph(t)}`,
        // What became of you (Phase 16.4), then the numbers.
        lines: [...epilogue(s).map((l) => l.text), ...tallyLines(t)],
        close: false,
        rows: [
          // Phase 16.5: the kid you coached, with what carries.
          {
            label: 'Climb on as the kid you coached',
            note: `${s.climber.name}’s van, their lines on the topos under their name, the family’s Record Book${s.dog ? `, ${s.dog.name}` : ''}. Your own name, and everything else to earn.`,
            run: () => game.climbOn(),
          },
          {
            label: 'Start a new climber',
            note: 'Nothing carried. A new first morning in a new valley.',
            run: () => game.restart(),
          },
        ],
      };
    }

    case 'dead': {
      const d = s.dead;
      if (!d) return null;
      const r = routeOfId(s, d.route);
      const sent = Object.entries(s.routes)
        .filter(([, L]) => L.sent)
        .map(([rid]) => routeOfId(s, rid))
        .filter((x): x is RouteDef => !!x);
      const hardest = [...sent].sort((a, b) => b.grade - a.grade)[0];
      return {
        title: 'Free Solo, over',
        sub: `${s.climber.name} came off ${r ? lineName(s, r) : 'the wall'}${d.hi ? ` at move ${d.hi + 1}` : ''}, with no rope, on day ${d.day}.`,
        notes: [
          sent.length
            ? `${sent.length} line${sent.length > 1 ? 's' : ''} sent, the hardest ${lineName(s, hardest!)}, ${lineGrade(s, hardest!)}.`
            : 'Nothing sent. It was early.',
        ],
        close: false,
        rows: [
          {
            label: 'Start a new climber',
            note: 'A new first morning. There’s no next climber for this one.',
            run: () => game.restart(),
          },
        ],
      };
    }

    case 'expeds':
      return {
        title: 'Expeditions',
        sub: 'Paid in cash, up front. Out there, every day is one call: lead, dig deep, rest, or go home.',
        close: true,
        rows: [
          ...Object.entries(EXPEDITIONS).map(([eid, e]) => ({
            label: e.name,
            cost: costLabel({ cash: -expedCost(s, e.cost) }),
            note: `${e.objective}, ${e.region}. ${payLine(s, eid)} ${oddsLine(s, eid)}`,
            run: () => game.openSheet({ k: 'exped', id: eid }),
          })),
          { label: 'Back', run: () => game.openSheet({ k: 'van' }) },
        ],
      };

    case 'exped':
      return expedSheet(game, s, id.id);

    default:
      return null;
  }
}

// Who else is out, and what it means for you: the queue, and the beta.
export function crowdNote(c: Crowd): string {
  const q = CROWD.queue;
  switch (c) {
    case 'empty':
      return 'Nobody else out. The place is yours.';
    case 'quiet':
      return 'A few others out. No waiting.';
    case 'busy':
      return `Busy: ${q.rope.busy} min in line for a rope, and people at the base who know the beta.`;
    case 'packed':
      return `Packed: ${q.rope.packed} min in line for a rope, ${q.boulder.packed} for a boulder, and beta whether you want it or not.`;
  }
}

const pct = (p: number): string => `${Math.round(p * 100)}%`;

// The summit's odds before you pay, with whoever'd come, as the go's own model has them.
function oddsLine(s: GameState, id: string): string {
  const e = EXPEDITIONS[id]!;
  const plan = defaultPlan(s, id);
  const head = `${e.pitches} pitches in ${e.days} days, storms ${pct(e.stormOdds)} of them.`;
  if (!plan) return `${head} Nobody you climb with is close enough yet to come.`;
  const who = plan.partner ? `with ${PEOPLE[plan.partner]?.name ?? plan.partner}` : 'alone';
  return `${head} Summit odds for you, ${who}, leaving today: ${pct(planOdds(s, id, plan))}.`;
}

// Phase 24.9: what the summit pays, the first time only.
const payLine = (s: GameState, id: string): string => {
  const pay = tripPay(s, id);
  return pay
    ? `The first summit pays ${money(pay)}.`
    : 'You’ve been paid for this one; the top pays nothing now.';
};

// A wall from its foot, or from wherever you are on it.
function wallSheet(game: Game, s: GameState, id: string): ListSpec {
  const w = WALLS[id]!;
  const on = s.wall?.id === id ? s.wall : null;
  const topped = !!s.routes[w.pitches[w.pitches.length - 1]!]?.sent;
  const notes = w.pitches.map((pid, i) => {
    const r = ROUTES[pid]!;
    const mark = on && i < on.next ? ' ✓' : on && i === on.next ? ' ← next' : '';
    return `${i + 1}. ${r.name}, ${gradeLabel(r)}${mark}`;
  });
  const sub = `${PLACES[w.place]!.name}. ${w.pitches.length} pitches, ${gradeName('sport', w.grade)} at the hardest. ${w.line}`;
  if (!on) {
    const rope = has(s, 'rope');
    const other = s.wall ? WALLS[s.wall.id]!.name : null;
    return {
      title: w.name,
      sub,
      notes: [
        ...notes,
        topped
          ? 'You’ve topped it. Again is for you.'
          : `The first summit pays ${money(wallPay(w))} for the photos.`,
      ],
      close: true,
      rows: [
        {
          label: 'Rack up and start',
          note: other
            ? `You're on ${other}. Rap off it first.`
            : rope
              ? 'A pitch at a time, in order. Sleep on it if the day runs out.'
              : 'Walls need a rope of your own. The gear shop sells them.',
          off: !rope || !!other,
          run: () => {
            if (!game.wall(id, 'start')) game.lookUp(w.pitches[0]!);
          },
        },
      ],
    };
  }
  const next = ROUTES[w.pitches[on.next]!]!;
  const night = isNight(s.min);
  return {
    title: w.name,
    sub: on.next ? `On the wall, ${on.next} of ${w.pitches.length} pitches done.` : sub,
    notes,
    close: true,
    rows: [
      {
        label: `Climb pitch ${on.next + 1}: ${next.name}`,
        note: goBlocked(s, next) ?? undefined,
        run: () => game.lookUp(next.id),
      },
      {
        label: 'Bivy on the ledge',
        note: !on.next
          ? 'You’re still on the ground. The van’s right there.'
          : night
            ? 'A thin night tied in: less sleep than the van, nothing to pay, and you wake where you stopped.'
            : 'Once it’s dark. Climb while it’s light.',
        off: !on.next || !night,
        run: () => void game.wall(id, 'bivy'),
      },
      {
        label: 'Rap off',
        note: 'Down to the van. Next time you start from the bottom.',
        run: () => {
          if (!game.wall(id, 'retreat')) game.closeSheet();
        },
      },
    ],
  };
}

// A pitch sent: on to the next, or off the top.
function pitchSent(
  game: Game,
  s: GameState,
  id: SheetId & { k: 'sent' },
  r: RouteDef,
  gained: string,
): ListSpec {
  const w = WALLS[r.wall!]!;
  const on = s.wall?.id === r.wall ? s.wall : null;
  const next = on ? ROUTES[w.pitches[on.next]!]! : null;
  return {
    title: SEND_NAME[id.style],
    sub: `${lineName(s, r)}, ${lineGrade(s, r)}, on go ${id.go}. ${
      next ? `Pitch ${on!.next} of ${w.pitches.length}.` : `The top of ${w.name}.`
    }`,
    close: false,
    notes: [...id.notes, ...(gained ? [gained] : [])],
    rows: next
      ? [
          { label: `On to pitch ${on!.next + 1}: ${next.name}`, run: () => game.lookUp(next.id) },
          {
            label: 'Sit on the belay',
            note: 'Back to the wall, where you can rap off or, after dark, bivy.',
            run: () => game.walkOff(),
          },
        ]
      : [{ label: 'Walk off the top', run: () => game.walkOff() }, ...(id.first ? [cardRow(game, id)] : [])],
  };
}

// An expedition: what it asks before you go, and each day's call once you're there.
// Phase 24.2: an expedition booked, or being planned: who comes, when, and the haul bag, with
// the odds moving as you choose.
function planSheet(game: Game, s: GameState, id: string): ListSpec {
  const e = EXPEDITIONS[id]!;
  const head = { title: e.name, sub: `${e.objective}, ${e.region}. ${e.blurb}`, close: true };
  const back: Row = { label: 'Back', run: () => game.openSheet({ k: 'expeds' }) };
  const b = s.booked;
  if (b) {
    const mine = b.id === id;
    const when = b.day === s.day ? 'today' : `on day ${b.day}`;
    if (!mine)
      return {
        ...head,
        notes: [`You’re booked for ${EXPEDITIONS[b.id]!.name}, leaving ${when}.`],
        rows: [back],
      };
    const away = s.at !== 'lot' ? 'Expeditions leave from the Lot.' : null;
    return {
      ...head,
      notes: [
        `Booked: you leave ${when}${b.partner ? `, with ${PEOPLE[b.partner]?.name ?? b.partner}` : ', alone'}, with food and water for ${b.food + 1} days.`,
        `Summit odds: ${pct(planOdds(s, id, b))}, choosing well each day.`,
      ],
      rows: [
        ...(b.day === s.day
          ? [
              {
                label: 'Leave now',
                note: away ?? `The van waits at the Lot.${s.dog ? ' The dog stays with friends.' : ''}`,
                off: !!away,
                run: () => void game.exped(id, 'go'),
              },
            ]
          : []),
        {
          label: 'Cancel the trip',
          note: `${money(Math.round(planCost(s, id, b) * EXPED.refund))} back. The rest is the airline’s.`,
          run: () => void game.exped(id, 'cancel'),
        },
        back,
      ],
    };
  }
  const plan = game.tripPlan(id);
  if (!plan)
    return {
      ...head,
      notes: ['Nobody you climb with is close enough yet to come. Free Solo goes alone.'],
      rows: [back],
    };
  const who = plan.partner ? (PEOPLE[plan.partner]?.name ?? plan.partner) : null;
  const crew = partners(s);
  const kg = bagKg(e, plan.food, plan.ledge, plan.stove);
  const H = EXPED.haul;
  const why = planBlocked(s, id, plan);
  const cost = planCost(s, id, plan);
  const short =
    s.cash < cost ? `${money(cost)} in hand, not on the card. You have ${money(Math.max(0, s.cash))}.` : null;
  // The forecast for the first week from the day you'd leave: a word a day.
  const span = tripDays(id, plan.day);
  const calls = Array.from({ length: Math.min(7, e.days) }, (_, i) => {
    const d = span.wall + i;
    return d - s.day >= EXPED.forecast.horizon ? 'anyone’s guess' : forecastCall(s, id, d);
  });
  const clash = s.shifts.filter((x) => x.day >= span.from && x.day <= span.to).length;
  const clashNote = !clash
    ? ''
    : plan.day - s.day >= EXPED.notice
      ? ` ${clash === 1 ? 'A shift' : `${clash} shifts`} in it come off your week: that’s a week’s notice.`
      : ` ${clash === 1 ? 'A shift' : `${clash} shifts`} in it, at short notice: missed, and a warning each.`;
  const leaveOn = (d: number) => (d === s.day ? 'today' : `on day ${d} (in ${d - s.day})`);
  return {
    ...head,
    notes: [
      `Summit odds with this plan: ${pct(planOdds(s, id, plan))}, choosing well each day.`,
      ...highNote(s, id),
      `Away from the valley days ${span.from} to ${span.to} at the most. The week’s bills still come.${clashNote}`,
      `The haul bag: ${kg} of ${H.max} kg, with food and water for ${plan.food + 1} days. When it runs out, you come down. Every kg over ${H.free} costs you energy each night, hauling it.`,
    ],
    rows: [
      ...(who
        ? [
            {
              label: `With ${who}`,
              note:
                crew.length > 1
                  ? `${who} leads about ${gradeName('boulder', partnerGrade(s, plan.partner!))} up there. Tap for someone else.`
                  : `${who} leads about ${gradeName('boulder', partnerGrade(s, plan.partner!))} up there. Nobody else is close enough.`,
              run: () => {
                if (crew.length > 1)
                  game.planTrip(id, { partner: crew[(crew.indexOf(plan.partner!) + 1) % crew.length]! });
              },
            },
          ]
        : [{ label: 'Alone', note: 'Free Solo: every pitch is yours.', off: true, run: () => undefined }]),
      {
        label: `Leave ${leaveOn(plan.day)}`,
        note: `${e.getThere} On the wall from day ${span.wall}; the forecast from then: ${calls.join(', ')}. The further out, the less it knows. Tap for a later day.`,
        run: () => game.planTrip(id, { day: plan.day >= s.day + EXPED.ahead ? s.day : plan.day + 1 }),
      },
      {
        label: 'A day more food and water',
        cost: costLabel({ cash: -EXPED.food }),
        note:
          plan.food >= e.days - 1
            ? `Enough for all ${e.days} days already.`
            : `${H.perDay * (e.melt && !plan.stove ? 2 : 1)} kg heavier.`,
        off: plan.food >= e.days - 1,
        run: () => game.planTrip(id, { food: plan.food + 1 }),
      },
      {
        label: 'A day less',
        note:
          plan.food <= 1
            ? 'Two days is the least.'
            : `${H.perDay * (e.melt && !plan.stove ? 2 : 1)} kg lighter.`,
        off: plan.food <= 1,
        run: () => game.planTrip(id, { food: plan.food - 1 }),
      },
      {
        label: plan.ledge ? 'The portaledge: packed' : 'The portaledge: left behind',
        note: plan.ledge
          ? `${H.ledge} kg. Tap to leave it: nights on a ledge give back half.`
          : `Nights on a ledge give back half. Tap to pack it: ${H.ledge} kg.`,
        run: () => game.planTrip(id, { ledge: !plan.ledge }),
      },
      ...(e.melt
        ? [
            {
              label: plan.stove ? 'The stove and fuel: packed' : 'The stove: left behind',
              note: plan.stove
                ? `${H.stove} kg, to melt snow for water. Tap to leave it and carry your water instead.`
                : `You carry your water: twice the weight a day. Tap to pack it: ${H.stove} kg.`,
              run: () => game.planTrip(id, { stove: !plan.stove }),
            },
          ]
        : []),
      {
        label: 'Book it',
        cost: costLabel({ cash: -cost }),
        note: why
          ? `${why}.`
          : (short ?? 'Flights, permits, food and water, paid now. The van waits at the Lot.'),
        off: !!why || !!short,
        run: () => void game.book(id),
      },
      back,
    ],
  };
}

function expedSheet(game: Game, s: GameState, id: string): ListSpec {
  const e = EXPEDITIONS[id]!;
  const k = s.climber.skills;
  const x = s.expedition?.id === id ? s.expedition : null;
  if (!x) return planSheet(game, s, id);
  const storm = stormOn(s.seed, id, e, s.day);
  const ps = expedPitches(id);
  const r = ps[x.pitch]!;
  const mine = yourPitch(x.pitch, !x.partner);
  const who = x.partner ? (PEOPLE[x.partner]?.name ?? x.partner) : null;
  const done = s.today.includes('exped');
  const dark = s.min >= CLIMB.darkFrom;
  const odds = summitOdds(s, id, { ...x, on: s.day, energy: s.energy });
  const pitch = `pitch ${x.pitch + 1}, ${r.name} (${gradeLabel(r)}, ${r.type})`;
  const theirTry = x.partner ? partnerTry(s, e, x.partner, r, x.day) : 0;
  const rows: Row[] = [];
  if (mine) {
    const why = storm
      ? 'Not in this.'
      : dark
        ? 'Too dark. Make camp.'
        : s.energy < CLIMB.minEnergy
          ? 'Nothing left in you today. Make camp.'
          : null;
    rows.push({
      label: `Lead ${pitch}`,
      cost: why ? undefined : costLabel(goCost(r, s)),
      note: why ?? `About ${pct(sendChance(s, r))} a go for you, today.`,
      off: !!why,
      run: () => game.lookUp(r.id),
    });
  }
  if (who && !done) {
    const why = storm ? 'Not in this.' : dark ? 'Too dark. Make camp.' : null;
    rows.push({
      label: mine ? `Hand it to ${who}` : `Second ${who}’s block`,
      cost: why ? undefined : costLabel({ energy: -EXPED.follow }),
      note:
        why ??
        `${who} leads ${mine ? 'it' : pitch} and on, the rest of the day: about ${pct(theirTry)} a try, ${EXPED.partner.tries} tries. You jug and haul.`,
      off: !!why,
      run: () => void game.exped(id, 'follow'),
    });
  }
  rows.push(
    {
      label: 'Make camp',
      note: storm
        ? `Sit the storm out on the portaledge. The night gives back ${nightBack(x.nights)} energy.`
        : `Clip in for the night. It gives back ${nightBack(x.nights)} energy, less than the last.`,
      run: () => void game.exped(id, 'camp'),
    },
    {
      label: 'Rap off and go home',
      note: 'Home with what you’ve fixed, which pays nothing. The money’s spent either way.',
      run: () => void game.exped(id, 'bail'),
    },
  );
  return {
    title: `${e.name}, day ${x.day} of ${e.days}`,
    sub: `${x.pitch} of ${e.pitches} pitches fixed. ${storm ? 'A storm on the wall today.' : 'Clear today.'} ${mine ? (who ? 'Your block.' : 'Every pitch is yours.') : `${who}’s block.`}`,
    notes: [
      `Summit odds from here: ${pct(odds)}, choosing well each day.`,
      `Energy ${Math.round(s.energy)}. ${who ? `Roped to ${who}.` : 'Alone.'}`,
    ],
    close: false,
    rows,
  };
}
