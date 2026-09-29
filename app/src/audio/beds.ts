// What's playing under everything: the place you're at, as its data says it sounds, turned
// by the hour and the sky. Pure, so a test can hold every place to having one.
import { conditionsAt, isNight, PLACES, type GameState } from '../sim';

// Every layer the ambience engine can play, 0 to 1.
export interface Bed {
  wind: number;
  birds: number;
  crickets: number;
  fire: number;
  creek: number;
  rain: number;
  room: number;
  murmur: number;
  clinks: number;
  hawk: number;
}

export const QUIET: Bed = {
  wind: 0,
  birds: 0,
  crickets: 0,
  fire: 0,
  creek: 0,
  rain: 0,
  room: 0,
  murmur: 0,
  clinks: 0,
  hawk: 0,
};

// The map is a paper thing in your hands: a little wind, whatever the valley's doing.
export const ON_THE_MAP: Bed = { ...QUIET, wind: 0.12 };

export function bedFor(s: GameState, place: string): Bed {
  const a = PLACES[place]?.ambience;
  if (!a) return ON_THE_MAP;
  const night = isNight(s.min);
  const rain = conditionsAt(s.seed, s.day, place).sky === 'rain';
  const indoors = (a.room ?? 0) > 0;
  const outBirds = rain ? 0 : (a.birds ?? 0);
  return {
    wind: rain && !indoors ? Math.max(a.wind ?? 0, 0.5) : (a.wind ?? 0),
    birds: night ? 0 : outBirds,
    crickets: night && !indoors ? outBirds : 0,
    // The fire's lit all day at the Lot, but it's only a fire after dark.
    fire: (a.fire ?? 0) * (night ? 1 : 0.35),
    creek: a.creek ?? 0,
    // Rain on the roof, muffled, indoors.
    rain: rain ? (indoors ? 0.35 : 0.8) : 0,
    room: a.room ?? 0,
    murmur: a.murmur ?? 0,
    clinks: a.clinks ?? 0,
    hawk: rain ? 0 : (a.hawk ?? 0),
  };
}
