// Phase 14.5b: every module only the full game has (`*.full.ts`) has a demo twin (`*.demo.ts`)
// with the same exports, which the demo's build takes in its place (build/demo.ts). A twin
// missing, or short an export, would break the demo's build or its sim.
import { describe, expect, it } from 'vitest';

const full = import.meta.glob<Record<string, unknown>>('./**/*.full.ts', { eager: true });
const demo = import.meta.glob<Record<string, unknown>>('./**/*.demo.ts', { eager: true });

describe('the demo’s twins', () => {
  it('stand in for every full-game module, export for export', () => {
    expect(Object.keys(full).length).toBeGreaterThan(0);
    for (const [path, mod] of Object.entries(full)) {
      const twin = demo[path.replace(/\.full\.ts$/, '.demo.ts')];
      expect(twin, `${path} has no demo twin`).toBeDefined();
      expect(Object.keys(twin!).sort(), path).toEqual(Object.keys(mod).sort());
    }
    // And no twin stands in for nothing.
    for (const path of Object.keys(demo))
      expect(full, path).toHaveProperty([path.replace(/\.demo\.ts$/, '.full.ts')]);
  });
});
