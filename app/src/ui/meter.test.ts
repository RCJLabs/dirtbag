// Phase 14.6: the frame meter's sums.
import { describe, expect, it } from 'vitest';
import { frameStats, Meter, meterLine } from './meter';

describe('the frame meter', () => {
  it('counts frames a second, the slowest, and the ones that missed a 60 Hz frame', () => {
    const steady = frameStats(Array(60).fill(1000 / 60));
    expect(steady).toEqual({ fps: 60, worst: 17, slow: 0 });
    const hitch = frameStats([...Array(57).fill(1000 / 60), 50]);
    expect(hitch.slow).toBe(1);
    expect(hitch.worst).toBe(50);
    expect(meterLine(steady)).toBe('60 fps · slowest 17 ms · 0 slow');
  });

  it('says it every half second, over the last second', () => {
    const m = new Meter();
    const said = [];
    for (let i = 0; i <= 180; i++) {
      const f = m.frame((i * 1000) / 60);
      if (f) said.push(f);
    }
    expect(said.length).toBe(6);
    expect(said.at(-1)!.fps).toBe(60);
  });
});
