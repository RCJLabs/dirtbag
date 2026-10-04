// Every roped line has its line drawn on its wall: Miller's Bluff's six had none till Phase
// 25.7, and a go on one, once bolted, had nothing to climb.
import { describe, expect, it } from 'vitest';
import { onWall, ROUTES } from '../sim';
import { topoFor } from './paint/wall';

describe('the walls’ lines', () => {
  it('draw every roped line, bottom to top, on the close-up', () => {
    for (const r of Object.values(ROUTES).filter(onWall)) {
      const t = topoFor(r);
      expect(t, r.id).toBeTruthy();
      expect(t.d[0]![1], r.id).toBeGreaterThan(t.d[t.d.length - 1]![1]);
    }
  });
});
