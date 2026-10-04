// Phase 25: the music made in code. A mood for every place and hour; tunes in the mood's
// scale, leaning on its chords; nothing out of key.
import { describe, expect, it } from 'vitest';
import { newGame, PLACES } from '../sim';
import { MOODS, moodFor, type Mood } from './moods';
import { chordOf, noteAt, phrase } from './music';
import { mulberry32 } from '../view/kit/noise';

// Day 50: summer, and mid-morning.
const s = { ...newGame('music'), min: 10 * 60, day: 50 };

describe('the music', () => {
  it('has a mood for every place, by the hour', () => {
    for (const id of Object.keys(PLACES)) expect(Object.keys(MOODS)).toContain(moodFor(s, id, false));
    expect(moodFor(s, 'lot', false)).toBe('camp');
    expect(moodFor({ ...s, min: 22 * 60 }, 'lot', false)).toBe('fire');
    expect(moodFor(s, 'gorge', false)).toBe('crag');
    expect(moodFor({ ...s, day: 20 }, 'gorge', false)).toBe('fire');
    expect(moodFor(s, 'gym', false)).toBe('town');
    expect(moodFor(s, 'gorge', true)).toBe('road');
    expect(moodFor(s, 'elcap', false)).toBe('big');
  });

  it('keeps every note of a tune in its mood’s scale', () => {
    for (const [id, m] of Object.entries(MOODS) as [Mood, (typeof MOODS)[Mood]][]) {
      const inKey = (n: number) => m.scale.includes((((n - m.root) % 12) + 12) % 12);
      for (const deg of m.chords) for (const n of chordOf(m, deg)) expect(inKey(n), id).toBe(true);
      const r = mulberry32(id.length * 31);
      for (let bar = 0; bar < 40; bar++) {
        const p = phrase(m, m.chords[bar % m.chords.length]!, 7, r);
        expect(p).toHaveLength(8);
        for (const d of p) if (d !== null) expect(inKey(noteAt(m, d)), id).toBe(true);
      }
    }
  });

  it('rests as much as its mood says, busier in town than at the fire', () => {
    const notes = (mood: Mood) => {
      const m = MOODS[mood];
      const r = mulberry32(7);
      let n = 0;
      for (let bar = 0; bar < 200; bar++) n += phrase(m, 0, 7, r).filter((d) => d !== null).length;
      return n;
    };
    expect(notes('town')).toBeGreaterThan(notes('fire'));
  });
});
