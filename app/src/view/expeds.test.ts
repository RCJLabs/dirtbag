// The expeditions' scenes (Phase 24.6–24.8) against their content: every objective has its
// own, and its storms snow exactly where its water's snow.
import { describe, expect, it } from 'vitest';
import { EXPEDITIONS } from '../sim';
import { expedSpot, SCENED, SNOWS } from './paint/expeds';

describe('expedition scenes', () => {
  it('paint every objective, and snow where the water is snow', () => {
    for (const [id, e] of Object.entries(EXPEDITIONS)) {
      expect(SCENED).toContain(id);
      expect(SNOWS(id)).toBe(!!e.melt);
    }
  });

  it('put your portaledge higher on the wall with every pitch fixed', () => {
    for (const id of Object.keys(EXPEDITIONS)) {
      const ys = [0, 0.25, 0.5, 0.75, 1].map((k) => expedSpot(id, k)[1]);
      for (let i = 1; i < ys.length; i++) expect(ys[i]!).toBeLessThan(ys[i - 1]!);
    }
  });
});
