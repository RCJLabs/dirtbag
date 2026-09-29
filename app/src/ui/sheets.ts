// What each list sheet says and offers, built fresh from the state every render, so a sheet
// can never show a price or an option the rules have moved past. Labels come from the
// sim's numbers through its formatters.

import {
  ACTS,
  BODY,
  bodyNote,
  conditionsAt,
  costLabel,
  DAY,
  DOG,
  DOG_OFFER,
  DOG_TIER_NAME,
  dogTier,
  fill,
  goBlocked,
  gradeOf,
  headroom,
  isNight,
  lineGrade,
  lineName,
  MONEY,
  PLACES,
  restCost,
  road,
  routeOfId,
  SEND_NAME,
  SKILLS,
  TEXT_VALUES,
  unmet,
  type GameState,
  type Skills,
} from '../sim';
import type { Game, SheetId } from '../game/game';
import { CRAGS } from '../view/layout';

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
}

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
  let note = [bodyNote(a.cost), a.note && fill(a.note, TEXT_VALUES)].filter(Boolean).join('. ');
  if (a.sleep && !why) {
    if (headroom(s) < MONEY.vanSpot) note = "The card won't cover the spot: a cold night in the pullout.";
    if (s.fed < BODY.hungryBelow) note += ' You’ll sleep hungry.';
  }
  return {
    label: a.label,
    cost: costLabel(a.cost, a.sleep ? 'van spot' : ''),
    note: why ?? note,
    off: !!why,
    run: () => game.doAct(id),
  };
}

function driveRow(game: Game, s: GameState, to: string, label: string): Row {
  const r = road(s.at, to)!;
  const declined = r.cash > 0 && headroom(s) < r.cash;
  return {
    label,
    cost: costLabel({ min: r.min, cash: -r.cash }, 'gas'),
    note: declined ? "The card won't take the gas. You'd be running on fumes." : undefined,
    run: () => game.travel(to),
  };
}

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
        sub: s.min >= DAY.bedFrom ? 'Bed made. Mostly.' : `Home, for ${TEXT_VALUES.spot} a night at the Lot.`,
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

    case 'place': {
      const p = PLACES[id.id]!;
      const here = s.at === id.id;
      const sub = fill(here ? p.here : p.away, TEXT_VALUES);
      // A crag that's shut for the season says so before you burn the gas; one that's
      // above your grade doesn't let you go at all.
      const shut = conditionsAt(s.seed, s.day, id.id).closed;
      const notes = shut ? [`${shut}.`] : undefined;
      if (!here) {
        const locked = p.minGrade !== undefined && gradeOf(s.climber.skills) < p.minGrade;
        const drive = driveRow(game, s, id.id, 'Drive here');
        return {
          title: p.name,
          sub,
          close: true,
          notes: locked ? [p.locked ?? 'Not yet.'] : notes,
          rows: [locked ? { ...drive, off: true, note: undefined } : drive],
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
          ? `A ${id.fall.ft}-foot drop to the pads from move ${id.fall.move} of ${r.moves}.`
          : `A ${id.fall.ft}-foot catch at move ${id.fall.move} of ${r.moves}.`;
      const why = goBlocked(s, r);
      const gained = gainsLine(id.gains);
      return {
        title: `Off at ${where}`,
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
