// Phase 25.7: the glossary's words, found in a sheet's text: lowercase uses only, so the
// game's names stay names; each word once, three at most; the longest word first.
import { describe, expect, it } from 'vitest';
import { WORDS } from '../sim';
import { glossSplit, wordOf } from './gloss';

const marked = (text: string) => glossSplit(text).flatMap((p) => (typeof p === 'string' ? [] : [p.term]));

describe('glossary words in a sheet’s text', () => {
  it('marks the climbing words and leaves the text whole', () => {
    const text = 'A pumpy line to a crux on crimps, then a dyno.';
    expect(marked(text)).toEqual(['Crux', 'Crimp', 'Dyno']);
    expect(
      glossSplit(text)
        .map((p) => (typeof p === 'string' ? p : p.text))
        .join(''),
    ).toBe(text);
  });

  it('leaves the game’s names alone, and the words too common to mean it', () => {
    expect(marked('The Pump at Roadside Crag, then Send City.')).toEqual([]);
    expect(marked('Your go: a send on the crag, soft for the grade.')).toEqual([]);
  });

  it('marks each word once, three at most, the longest first', () => {
    expect(marked('A send train, a jug, a jug, a sloper, a pocket.')).toEqual([
      'Send train',
      'Jug',
      'Sloper',
    ]);
    expect(marked('Graded on the YDS, or the V-scale.')).toEqual(['YDS', 'V-scale']);
  });

  it('finds every entry it could mark', () => {
    for (const w of WORDS) expect(wordOf(w.term)?.says).toBe(w.says);
  });
});
