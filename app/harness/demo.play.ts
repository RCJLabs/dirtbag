// Phase 14.5b: the demo's build of the sim, played. `vitest --mode demo` swaps in the
// `*.demo.ts` twins (build/demo.ts) and sets __DEMO__, so this is the sim as the demo ships
// it, with the later crags, the story past Act I, the expeditions and the Hollow gone. The
// career bot plays it from the first morning: nothing it reaches for is missing, and it comes
// to the demo's last morning.
import { expect, it } from 'vitest';
import { playDays } from '../src/sim/bot';
import { EXPEDITIONS } from '../src/sim/content/expeditions';
import { demoOver } from '../src/sim/demo';
import { DEMO } from '../src/sim/edition';

const SEEDS = ['demo-a', 'demo-b', 'demo-c', 'demo-d'];

it('is the demo: its flag set, and the full game’s content not there', () => {
  expect(DEMO).toBe(true);
  expect(Object.keys(EXPEDITIONS)).toEqual([]);
});

it('plays through to its last morning, every seed, with nothing missing on the way', () => {
  for (const seed of SEEDS) {
    const run = playDays(seed, { days: 200, strategy: 'career' });
    expect(demoOver(run.state), `${seed}: day ${run.state.day}, ${run.state.goals} goals`).toBe(true);
    // A bot that asks for what the demo hasn't got is reaching past its edges.
    expect(run.refused, seed).toEqual([]);
    process.stdout.write(`  ${seed}: over on day ${run.state.day}\n`);
  }
});
