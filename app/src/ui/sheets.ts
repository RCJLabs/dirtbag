// What each sheet says and offers, built fresh from the state every render, so a sheet can
// never show a price or an option the rules have moved past. Labels come from the sim's
// numbers through its formatters.

import {
  ACTS,
  bodyNote,
  CLIMB,
  costLabel,
  DAY,
  fill,
  MONEY,
  PLACES,
  road,
  ROUTES,
  STYLE_NAME,
  TEXT_VALUES,
  unmet,
  type GameState,
} from '../sim';
import type { Game, SheetId } from '../game/game';

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

function actRow(game: Game, s: GameState, id: string): Row {
  const a = ACTS[id]!;
  const why = unmet(s, a.needs);
  const note = [bodyNote(a.cost), a.note && fill(a.note, TEXT_VALUES)].filter(Boolean).join('. ');
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
  return { label, cost: costLabel({ min: r.min, cash: -r.cash }, 'gas'), run: () => game.travel(to) };
}

export function buildSheet(game: Game, id: SheetId, s: GameState): ListSpec | null {
  switch (id.k) {
    case 'van':
      return {
        title: 'Your van',
        sub: s.min >= DAY.bedFrom ? 'Bed made. Mostly.' : `Home, for ${TEXT_VALUES.spot} a night at the Lot.`,
        close: true,
        rows: [
          actRow(game, s, 'lot.cook'),
          actRow(game, s, 'lot.sleep'),
          {
            label: 'Open the map',
            run: () => {
              game.closeSheet();
              game.openMap();
            },
          },
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
        rows: [
          ...(back ? [driveRow(game, s, 'lot', 'Drive back to the Lot')] : []),
          {
            label: 'Open the map',
            run: () => {
              game.closeSheet();
              game.openMap();
            },
          },
        ],
      };
    }

    case 'place': {
      const p = PLACES[id.id]!;
      const here = s.at === id.id;
      const sub = fill(here ? p.here : p.away, TEXT_VALUES);
      if (!here) return { title: p.name, sub, close: true, rows: [driveRow(game, s, id.id, 'Drive here')] };
      if (p.scene) {
        const scene = p.scene;
        const label = scene === 'crag' ? 'Walk to the wall' : 'Walk back to the van';
        return { title: p.name, sub, close: true, rows: [{ label, run: () => game.enterScene(scene) }] };
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
      const r = ROUTES[id.route]!;
      const crux = r.cruxes.find((c) => c.id === id.fall.crux);
      const where = crux ? crux.name.replace(/^The /, 'the ') : 'the wall';
      const hi = s.routes[id.route]?.hi ?? 0;
      const tired = s.energy < CLIMB.minEnergy;
      const raw = s.skin < CLIMB.minSkin;
      return {
        title: `Off at ${where}`,
        sub: `${id.fall.text} A ${id.fall.ft}-foot catch at move ${id.fall.move} of ${r.moves}. High point: move ${hi}.`,
        close: false,
        notes: id.notes,
        rows: [
          {
            label: 'Rest, then go again',
            cost: costLabel({ min: CLIMB.restMin }),
            note: tired
              ? 'Too tired.'
              : raw
                ? 'Your skin is done for today.'
                : 'Pump back to zero. Change your beta if you want.',
            off: tired || raw,
            run: () => game.rest(),
          },
          { label: 'Walk off', run: () => game.walkOff() },
        ],
      };
    }

    case 'sent': {
      const r = ROUTES[id.route]!;
      return {
        title: STYLE_NAME[id.style],
        sub: `${r.name}, ${r.grade}, on go ${id.go}. Rent's still due.`,
        close: false,
        rows: [{ label: 'Lower off and walk out', run: () => game.walkOff() }],
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

    case 'beta':
      return null;
  }
}
