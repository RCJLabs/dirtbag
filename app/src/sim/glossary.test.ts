// Phase 22.9c: the glossary. Every word once, in a group the journal shows, said in a
// sentence; and v0.956's trivia terms (technique, gear, culture) all made it across.
import { describe, expect, it } from 'vitest';
import { WORD_GROUP, WORDS } from './content/glossary';

describe('the words', () => {
  it('has each term once, in a group, said as a sentence', () => {
    const terms = WORDS.map((w) => w.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
    for (const w of WORDS) {
      expect(WORD_GROUP[w.group]).toBeDefined();
      expect(w.says).toMatch(/^[A-Z].*[.]$/);
      // The definition doesn't lean on the word it defines.
      expect(w.says.toLowerCase().startsWith(`${w.term.toLowerCase()} `)).toBe(false);
    }
    for (const g of Object.keys(WORD_GROUP)) expect(WORDS.some((w) => w.group === g)).toBe(true);
  });

  it('keeps every term v0.956’s trivia asked about', () => {
    const v0956 = [
      'Heel hook',
      'Sandbag',
      'Dyno',
      'Beta',
      'Onsight',
      'Flash',
      'Smear',
      'Sloper',
      'Chalk',
      'Sticky rubber',
      'Cam',
      'Quickdraw',
      'Belay device',
      'Nut',
      'Crash pad',
      'Dirtbag',
      'V-scale',
      'YDS',
      'Redpoint',
      'First ascent',
    ];
    const have = new Set(WORDS.map((w) => w.term));
    expect(v0956.filter((t) => !have.has(t))).toEqual([]);
  });
});
