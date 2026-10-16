// Phase 15.4: the trailer's beats, as saves to load and play while a recorder runs (the loop
// the market audit asks a trailer to show: van, shift, crag, send, fire, with the climbing as
// the hero). Each is the v75 fixture's career, two hundred days in, put where the beat is and
// at its hour, on a day the place is dry and open. Dev only: /trailer.html under `npm run dev`
// loads them; beats.test.ts holds each to the save's rules.
import { conditionsAt, ROUTES, type GameState } from '../sim';

export interface Beat {
  id: string;
  name: string;
  // What to do once it's loaded, for the one recording it.
  play: string;
  make: (base: GameState) => GameState;
}

// The first day from this one, inside three weeks, that `place` is dry and open; its morning
// news cleared, since nothing happened on a day jumped to.
function dryDay(s: GameState, place: string): GameState {
  for (let day = s.day; day < s.day + 21; day++) {
    const c = conditionsAt(s.seed, day, place);
    if (c.sky !== 'rain' && c.open && !c.closed && !c.seeping)
      return day === s.day ? s : { ...s, day, today: [] };
  }
  return s;
}

const at = (s: GameState, place: string, min: number): GameState => ({
  ...dryDay(s, place),
  at: place,
  min,
  x: null,
  encounter: null,
});

// A line climbed fresh: its log cleared, so the go is a first one and the send gets its card.
function fresh(s: GameState, route: string): GameState {
  const routes = { ...s.routes };
  delete routes[route];
  return { ...s, routes };
}

// The hardest boulder at a place that this climber hasn't sent, or its hardest, fresh.
function hardestAt(s: GameState, place: string): string {
  const lines = Object.values(ROUTES)
    .filter((r) => r.place === place && r.disc === 'boulder' && !r.exped)
    .sort((a, b) => b.grade - a.grade);
  return (lines.find((r) => !s.routes[r.id]?.sent) ?? lines[0]!).id;
}

export const BEATS: Beat[] = [
  {
    id: 'lot-morning',
    name: 'The Lot, a morning',
    play: 'Walk to the fire, past Scout. Open the van. The day starts here.',
    make: (s) => at(s, 'lot', 7 * 60 + 40),
  },
  {
    id: 'shift',
    name: 'A shift at the café',
    play: 'Drive to the café from the map and work the morning: the money, then the clock.',
    make: (s) => at(s, 'lot', 6 * 60 + 30),
  },
  {
    id: 'crag',
    name: 'Roadside, afternoon',
    play: 'Arrive and walk the wall as the sun comes round: people at the foot of the lines.',
    make: (s) => at(s, 'road', 14 * 60),
  },
  {
    id: 'send',
    name: 'The highball, sent',
    play: 'Tap Highball Arête, pick the beta, and climb it. Keep the card.',
    make: (s) => fresh(at(s, 'road', 16 * 60 + 30), 'highball'),
  },
  {
    id: 'limit',
    name: 'At the limit, Moonstone',
    play: 'The hardest problem out there: the pump, the cruxes, a fall or a send.',
    make: (s) => {
      const t = at(s, 'moon', 9 * 60);
      return fresh(t, hardestAt(t, 'moon'));
    },
  },
  {
    id: 'fire',
    name: 'The fire, at night',
    play: 'The lights on, the crew around, Scout. Sit at the fire and listen.',
    make: (s) => at(s, 'lot', 20 * 60 + 30),
  },
];
