// Phase 41: the forecast said. A call and how sure it is ("Prime, likely"), the radio's line
// from its dials, and what a sky does to the rock, from the windows the rules use.
import { CLIMB, fill, FORECAST, inWords, SKY_NAME, type Call, type Sky } from '../sim';

// The words, every number filled from the dials (FORECAST, CLIMB.sky), never typed in. They
// live here, not in the sim's content: "window" is a word the sim's purity test keeps out.
const SAYS = {
  // The café's card.
  radio:
    'The radio behind the bar, on the valley’s next {days} days. Tomorrow’s call comes true about {near} times in ten; {days} days out, about {far}.',
  // A call: "Prime, likely".
  call: '{sky}, {word}',
  // What the day's sky does to every window outdoors: the beta sheet, the week and the café.
  prime: 'Cold and dry: every window {pct} wider.',
  hot: 'Hot: every window {pct} tighter.',
  seep: 'Still seeping from the rain: every window {pct} tighter.',
  rain: 'The rock’s shut.',
};

export const callSaid = (c: Call): string =>
  c.word ? fill(SAYS.call, { sky: SKY_NAME[c.sky], word: c.word }) : SKY_NAME[c.sky];

const pct = (f: number): string => `${Math.round(Math.abs(f - 1) * 100)}%`;

// What the day does to every window: cold and dry widens them, heat and seeping tighten them.
// Shaded rock never minds the heat. Nothing for a fair day.
export function friction(sky: Sky, seeping = false, shaded = false): string {
  const says =
    sky === 'rain'
      ? [SAYS.rain]
      : [
          ...(sky === 'prime' ? [fill(SAYS.prime, { pct: pct(CLIMB.sky.prime) })] : []),
          ...(sky === 'hot' && !shaded ? [fill(SAYS.hot, { pct: pct(CLIMB.sky.hot) })] : []),
          ...(seeping ? [fill(SAYS.seep, { pct: pct(CLIMB.sky.seep) })] : []),
        ];
  return says.join(' ');
}

export const radioLine = (): string =>
  fill(SAYS.radio, {
    days: inWords(FORECAST.days),
    near: inWords(Math.round(FORECAST.near * 10)),
    far: inWords(Math.round(FORECAST.far * 10)),
  });
