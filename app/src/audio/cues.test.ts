// Criterion 1 of Phase 13: every verb has a sound. Every act the valley offers maps to a
// cue, and every crux verb has one for your hands going down.
import { describe, expect, it } from 'vitest';
import { ACTS } from '../sim/content/places';
import { actCue, VERB_CUES } from './cues';

describe('cues', () => {
  it('give every act a sound, by what it does to you', () => {
    for (const [id, a] of Object.entries(ACTS)) expect(actCue(a), id).toBeTruthy();
    expect(actCue(ACTS['lot.sleep']!)).toBe('sleep');
    expect(actCue(ACTS['cafe.shift']!)).toBe('earn');
    expect(actCue(ACTS['lot.cook']!)).toBe('eat');
    expect(actCue(ACTS['gym.pass']!)).toBe('pay');
  });

  it('give every crux verb a sound, and a hold-to-load a second for letting go', () => {
    for (const v of ['tension', 'timing', 'load'] as const) expect(VERB_CUES[v].down).toBeTruthy();
    expect(VERB_CUES.load.up).toBe('release');
  });
});
