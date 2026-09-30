// What each list sheet says and offers, built fresh from the state every render, so a sheet
// can never show a price or an option the rules have moved past. Labels come from the
// sim's numbers through its formatters.

import {
  ACT_I_END,
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
  pitchOdds,
  stormOn,
  summitOdds,
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

// Into the train sheet: the block you're in, or why there's nothing to do there yet.
function trainRow(game: Game, s: GameState): Row {
  const board = s.at === 'lot' && !s.gear.hangboard;
  return {
    label: 'Train',
    note: board ? `${blockLine(s)} A hangboard would put sessions here; prehab needs nothing.` : blockLine(s),
    run: () => game.openSheet({ k: 'train' }),
  };
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
  const permit = PLACES[to]?.permit ?? 0;
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
          actRow(game, s, 'lot.cook'),
          ...(isNight(s.min) ? [] : [actRow(game, s, 'lot.rest')]),
          trainRow(game, s),
          {
            label: 'Your week',
            note: weekNote(s),
            run: () => game.openSheet({ k: 'week' }),
          },
          {
            label: 'Under the hood',
            note: `${PARTS.map((p) => `${PART_NAME[p]} ${partWord(s.van[p])}`).join(', ')}. The garage is in Midtown.`,
            run: () => game.openSheet({ k: 'journal', page: 'you' }),
          },
          {
            label: 'Expeditions',
            note: 'Big walls a long way from here, bought in cash and climbed a day at a time.',
            run: () => game.openSheet({ k: 'expeds' }),
          },
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
        rows: [actRow(game, s, 'gym.pass'), actRow(game, s, 'gym.set'), trainRow(game, s), mapRow(game)],
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
      // A card-only place: you're here until you drive somewhere, so there's no close.
      const onward = Object.keys(PLACES).filter((o) => o !== id.id && road(id.id, o));
      return {
        title: p.name,
        sub,
        close: false,
        head,
        rows: [
          ...p.acts.map((a) => actRow(game, s, a)),
          ...onward.map((o) =>
            driveRow(game, s, o, o === 'lot' ? 'Drive back to the Lot' : `Drive to ${PLACES[o]!.name}`),
          ),
        ],
      };
    }

    case 'fall': {
      const r = routeOfId(s, id.route)!;
      const crux = r.cruxes.find((c) => c.id === id.fall.crux);
      const where = crux ? crux.name.replace(/^The /, 'the ') : 'the wall';
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
          title: 'Scout',
          sub: DOG_OFFER.sub,
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
        sub: `${DOG_TIER_NAME[dogTier(d.bond)]}. ${days ? `With you ${days} day${days > 1 ? 's' : ''}.` : 'Yours since this morning.'} ${fed}`,
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

    case 'act':
      return {
        title: ACT_I_END.title,
        sub: ACT_I_END.text,
        close: false,
        rows: [{ label: 'Keep climbing', run: () => game.closeSheet() }],
      };

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

    case 'breakdown': {
      const b = s.breakdown;
      if (!b) return null;
      const to = PLACES[b.to]!.name;
      const who = friendFor(s);
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
            cost: costLabel({ cash: -e.cost }),
            note: `${e.objective}, ${e.region}. ${oddsLine(s, eid)}`,
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

// The summit's odds before you pay: leading every fair day you've the energy for, and
// digging deep every one.
function oddsLine(s: GameState, id: string): string {
  const e = EXPEDITIONS[id]!;
  const k = s.climber.skills;
  return `${e.pitches} pitches in ${e.days} days, storms ${pct(e.stormOdds)} of them. Summit odds for you: ${pct(summitOdds(k, e, false))} leading, ${pct(summitOdds(k, e, true))} digging deep.`;
}

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
function expedSheet(game: Game, s: GameState, id: string): ListSpec {
  const e = EXPEDITIONS[id]!;
  const k = s.climber.skills;
  const x = s.expedition?.id === id ? s.expedition : null;
  if (!x) {
    const why = s.expedition
      ? `You're on ${EXPEDITIONS[s.expedition.id]!.name}.`
      : s.at !== 'lot'
        ? 'Expeditions leave from the Lot.'
        : gradeOf(k) < e.gradeReq
          ? `${e.name} wants V${e.gradeReq}. You climb V${gradeOf(k)}.`
          : s.cash < e.cost
            ? `${money(e.cost)} in hand, not on the card. You have ${money(Math.max(0, s.cash))}.`
            : null;
    return {
      title: e.name,
      sub: `${e.objective}, ${e.region}. ${e.blurb}`,
      notes: [oddsLine(s, id), `The summit pays ${money(e.pays)}. Anything short of it pays nothing.`],
      close: true,
      rows: [
        {
          label: 'Go',
          cost: costLabel({ cash: -e.cost }),
          note: why ?? 'Food, flights and a porter. The van waits at the Lot.',
          off: !!why,
          run: () => void game.exped(id, 'go'),
        },
        { label: 'Back', run: () => game.openSheet({ k: 'expeds' }) },
      ],
    };
  }
  const storm = stormOn(s.seed, id, e, s.day);
  const from = { day: x.day, pitch: x.pitch, energy: x.energy };
  const lead = (dig: boolean): Row => {
    const cost = dig ? EXPED.dig : EXPED.lead;
    const tired = x.energy < cost;
    return {
      label: dig ? 'Dig deep' : 'Lead the next pitch',
      note: storm
        ? 'Not in this.'
        : tired
          ? 'Not enough left in you. Rest.'
          : `${pct(pitchOdds(k, e, dig))} to fix pitch ${x.pitch + 1}. Costs ${cost} of your ${x.energy} energy.`,
      off: storm || tired,
      run: () => void game.exped(id, dig ? 'dig' : 'lead'),
    };
  };
  return {
    title: `${e.name}, day ${x.day} of ${e.days}`,
    sub: `${x.pitch} of ${e.pitches} pitches fixed. ${storm ? 'A storm on the wall today.' : 'Clear today.'}`,
    notes: [
      `Left in you on the wall: ${x.energy} of ${EXPED.energy}. Summit odds from here: ${pct(summitOdds(k, e, false, from))} leading, ${pct(summitOdds(k, e, true, from))} digging deep.`,
    ],
    close: false,
    rows: [
      lead(false),
      lead(true),
      {
        label: 'Rest in camp',
        note: `${EXPED.rest} energy back${storm ? ', and the storm goes by without you' : ''}.`,
        run: () => void game.exped(id, 'rest'),
      },
      {
        label: 'Call it off',
        note: 'Home with what you’ve fixed, which pays nothing. The money’s spent either way.',
        run: () => void game.exped(id, 'bail'),
      },
    ],
  };
}
