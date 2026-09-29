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
} from '../sim';
import type { Game, SheetId } from '../game/game';
import { CRAGS } from '../view/layout';
import { whoAround, type Who } from './who';

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
  let note = [bodyNote(cost), a.note && fill(a.note, TEXT_VALUES)].filter(Boolean).join('. ');
  if (a.sleep && !why) {
    if (headroom(s) < MONEY.vanSpot) note = "The card won't cover the spot: a cold night in the pullout.";
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

function driveRow(game: Game, s: GameState, to: string, label: string): Row {
  const r = road(s.at, to)!;
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
    case 'van':
      return {
        title: 'Your van',
        sub: isNight(s.min) ? 'Bed made. Mostly.' : `Home, for ${TEXT_VALUES.spot} a night at the Lot.`,
        close: true,
        rows: [
          actRow(game, s, 'lot.cook'),
          ...(isNight(s.min) ? [] : [actRow(game, s, 'lot.rest')]),
          actRow(game, s, 'lot.sleep'),
          mapRow(game),
        ],
      };

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
      return {
        title: 'The desk',
        sub: s.today.includes('pass')
          ? "Your hand's stamped. Climb till ten."
          : "The kid at the desk doesn't look up. The set changes every seven days.",
        close: true,
        rows: [actRow(game, s, 'gym.pass'), actRow(game, s, 'gym.set'), mapRow(game)],
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
      const notes = shut || sky.length ? [...(shut ? [`${shut}.`] : []), ...sky] : undefined;
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
        const label = CRAGS[scene]
          ? 'Walk to the wall'
          : scene === 'gym'
            ? 'Walk in'
            : 'Walk back to the van';
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
      const how =
        r.disc === 'boulder'
          ? `${aFoot(id.fall.ft)} drop to the pads from move ${id.fall.move} of ${r.moves}.`
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
      return {
        title: SEND_NAME[id.style],
        sub: `${lineName(s, r)}, ${lineGrade(s, r)}, on go ${id.go}.${r.disc === 'sport' ? " Rent's still due." : ''}`,
        close: false,
        notes: [...id.notes, ...(gained ? [gained] : [])],
        rows: [
          {
            label:
              r.disc === 'sport'
                ? 'Lower off and walk out'
                : r.place === 'gym'
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

    default:
      return null;
  }
}
