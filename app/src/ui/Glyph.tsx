// Phase 14.6: the few marks the game's fonts don't have, drawn here: a tick, a cross, a ring,
// a back arrow and the four suits. Without them a system falls back to whatever font has the
// character, or to a box where none does (a Steam Deck's fonts aren't a phone's). Each is
// drawn in the text's colour at the text's size, and read out as the character it stands for.
// Text that might hold one goes through glyphs(); glyphs.test.ts holds the game's strings to
// the fonts plus these (marks.ts).
import { Fragment, type ReactNode } from 'react';
import { GLYPHS, MARKS } from './marks';

const ANY = new RegExp(`([${GLYPHS.join('')}])`);

export function Glyph({ c }: { c: string }) {
  const m = MARKS[c];
  if (!m) return <>{c}</>;
  return (
    <svg className="glyph" viewBox="0 0 16 16" role="img" aria-label={c}>
      <path
        d={m.d}
        fill={m.fill ? 'currentColor' : 'none'}
        stroke={m.fill ? 'none' : 'currentColor'}
        strokeWidth={m.fill ? undefined : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Text with any of the marks in it, the marks drawn; text without, as it was.
export function glyphs(text: string): ReactNode {
  if (!ANY.test(text)) return text;
  return text
    .split(ANY)
    .map((part, i) => (MARKS[part] ? <Glyph key={i} c={part} /> : <Fragment key={i}>{part}</Fragment>));
}
