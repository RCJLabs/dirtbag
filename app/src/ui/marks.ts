// Phase 14.6: the marks the game's fonts lack, as Glyph.tsx draws them.

// A 16 by 16 box. Lines are stroked, the suits filled.
export const MARKS: Record<string, { d: string; fill?: true }> = {
  '✓': { d: 'M3 8.5l3.5 3.5L13 4.5' },
  '✕': { d: 'M4 4l8 8M12 4l-8 8' },
  '○': { d: 'M12.5 8a4.5 4.5 0 1 1-9 0a4.5 4.5 0 1 1 9 0z' },
  '←': { d: 'M13 8H3M7 4L3 8l4 4' },
  '♠': {
    d: 'M8 1.8C6 4.8 2.5 6.8 2.5 9.6c0 1.8 1.4 3 3 3 .9 0 1.6-.4 2-.9-.2 1.3-.8 2.2-1.6 2.7h4.2c-.8-.5-1.4-1.4-1.6-2.7.4.5 1.1.9 2 .9 1.6 0 3-1.2 3-3C13.5 6.8 10 4.8 8 1.8z',
    fill: true,
  },
  '♥': {
    d: 'M8 14.2S2 10.2 2 6.2C2 4.4 3.4 3 5.1 3c1.3 0 2.3.8 2.9 1.9C8.6 3.8 9.6 3 10.9 3 12.6 3 14 4.4 14 6.2c0 4-6 8-6 8z',
    fill: true,
  },
  '♦': { d: 'M8 1.5L13 8l-5 6.5L3 8z', fill: true },
  '♣': {
    d: 'M8 1.8a2.7 2.7 0 0 0-2.3 4.1A2.7 2.7 0 1 0 7 10.9c-.2 1.5-.8 2.5-1.7 3.3h5.4c-.9-.8-1.5-1.8-1.7-3.3a2.7 2.7 0 1 0 1.3-5A2.7 2.7 0 0 0 8 1.8z',
    fill: true,
  },
};

export const GLYPHS = Object.keys(MARKS);
