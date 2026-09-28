import { describe, expect, it } from 'vitest';
import { hashSeed, Rng } from './rng';

const fnv = (units: number[]) => {
  let h = 0x811c9dc5;
  for (const u of units) {
    h ^= u;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

describe('rng', () => {
  // Copied from Dirtbag-UE/Sim/tests/test_main.cpp (TestRngGoldenVectors). Both games must
  // produce these for the seed "golden"; if they move here, seeds stop meaning the same
  // thing in both, and every existing save's world changes.
  it('matches the Unreal harness golden vectors', () => {
    const rng = Rng.fromSeed('golden');
    const expected = [
      0.59432327281683683, 0.94342079781927168, 0.30383505066856742, 0.76765315467491746, 0.47240672400221229,
    ];
    for (const e of expected) expect(Math.abs(rng.next() - e)).toBeLessThan(1e-15);
  });

  // Also from the Unreal harness: hashing is over UTF-16 code units, so "Þórr" is four BMP
  // units and an emoji is a surrogate pair.
  it('hashes seeds over UTF-16 code units', () => {
    expect(hashSeed('Þórr')).toBe(fnv([0x00de, 0x00f3, 0x0072, 0x0072]));
    expect(hashSeed('\u{1F600}')).toBe(fnv([0xd83d, 0xde00]));
    expect(hashSeed('abc')).toBe(fnv([0x61, 0x62, 0x63]));
  });

  it('is deterministic per seed, and streams and derivations never share draws', () => {
    const a = Rng.fromSeed('grim-fjord-123');
    const b = Rng.fromSeed('grim-fjord-123');
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
    expect(Rng.fromStream('grim-fjord-123', 'session').next()).not.toBe(
      Rng.fromStream('grim-fjord-123', 'events').next(),
    );
    const base = Rng.fromSeed('grim-fjord-123');
    expect(base.derive('day-4').next()).not.toBe(Rng.fromSeed('grim-fjord-123').next());
    expect(base.derive('day-4').seed).toBe('grim-fjord-123::day-4');
  });

  it('keeps int() inside its inclusive range and reaches both ends', () => {
    const r = Rng.fromSeed('range');
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = r.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7]);
  });
});
