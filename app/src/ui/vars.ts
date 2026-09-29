import type { CSSProperties } from 'react';

// Values for the stylesheet: levels and geometry from the game, as custom properties. It's
// the only thing a component sets inline; how anything looks lives in styles.css, and
// `npm run check` fails on any other inline style.
export const vars = (v: Record<`--${string}`, string | number>): CSSProperties => v as CSSProperties;
