// Phase 25 (Evan's call, 4 Oct 2026): music made in code, to hear how it turns out. What
// plays where: a mood for the place and the hour, pure so a test can hold every place to
// one. The engine (music.ts) turns a mood into notes.
import { EXPEDITIONS, indoor, isNight, PLACES, seasonOf, type GameState } from '../sim';

export type Mood = 'camp' | 'fire' | 'crag' | 'town' | 'road' | 'big';

export interface MoodDef {
  // Beats a minute.
  bpm: number;
  // The key's root, as a MIDI note, and the scale its tunes are made from (semitones up).
  root: number;
  scale: number[];
  // The chords, a bar each, as scale degrees (0 is the root's chord), looped.
  chords: number[];
  // How busy the tune is (0 to 1: the share of eighths with a note), and what plays.
  busy: number;
  bass: boolean;
  beat: boolean;
  // The pad's brightness: its filter's cutoff, in Hz.
  bright: number;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const MIXO = [0, 2, 4, 5, 7, 9, 10];

export const MOODS: Record<Mood, MoodDef> = {
  // Morning at the Lot: coffee on, the day ahead. Warm, unhurried.
  camp: {
    bpm: 76,
    root: 55,
    scale: MAJOR,
    chords: [0, 4, 5, 3],
    busy: 0.45,
    bass: true,
    beat: false,
    bright: 1400,
  },
  // After dark at the fire: slow, low, a lot of room in it.
  fire: {
    bpm: 60,
    root: 50,
    scale: DORIAN,
    chords: [0, 6, 5, 6],
    busy: 0.25,
    bass: true,
    beat: false,
    bright: 900,
  },
  // Out at the rock: open, a little lift.
  crag: {
    bpm: 84,
    root: 57,
    scale: MIXO,
    chords: [0, 6, 3, 0],
    busy: 0.4,
    bass: true,
    beat: false,
    bright: 1800,
  },
  // Town and the gyms: lighter, a soft beat under it.
  town: {
    bpm: 92,
    root: 53,
    scale: MAJOR,
    chords: [1, 4, 0, 5],
    busy: 0.5,
    bass: true,
    beat: true,
    bright: 2200,
  },
  // On the map, or driving: a steady pulse.
  road: {
    bpm: 100,
    root: 52,
    scale: MIXO,
    chords: [0, 4, 3, 0],
    busy: 0.35,
    bass: true,
    beat: true,
    bright: 1600,
  },
  // An expedition: wide and slow, the weather in it.
  big: {
    bpm: 56,
    root: 48,
    scale: DORIAN,
    chords: [0, 3, 5, 4],
    busy: 0.2,
    bass: false,
    beat: false,
    bright: 700,
  },
};

// What plays here now. A crag after dark, or in winter, has the fire's mood.
export function moodFor(s: GameState, place: string, map: boolean): Mood {
  if (map) return 'road';
  if (place in EXPEDITIONS || s.expedition) return 'big';
  if (place === 'lot') return isNight(s.min) ? 'fire' : 'camp';
  const p = PLACES[place];
  if (p?.crag) return isNight(s.min) || seasonOf(s.day) === 'winter' ? 'fire' : 'crag';
  if (indoor(place) || p) return 'town';
  return 'road';
}
