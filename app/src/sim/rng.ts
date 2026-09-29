// Seeded randomness for the sim. Same algorithm, seeding and stream names as
// Dirtbag-UE/Sim/DirtbagRng, so a seed means the same thing in both games. The golden
// vectors in rng.test.ts are the Unreal harness's; if they move, every existing seed
// names a different world, which is save-breaking by definition.
//
// mulberry32, seeded by FNV-1a over UTF-16 code units. JS strings are already UTF-16, so
// charCodeAt yields exactly the units the C++ port decodes UTF-8 into.

// Named streams keep one system's draws from shifting another's. Adding a stream is safe;
// renaming one silently changes every seed that uses it.
export type Stream = 'worldgen' | 'session' | 'events';

export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// The bare generator, for code that only needs a repeatable sequence from a number (the
// painters' scenery, for one). Sim systems use Rng, which carries its seed for derive().
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private readonly draw: () => number;

  private constructor(readonly seed: string) {
    this.draw = mulberry32(hashSeed(seed));
  }

  static fromSeed(seed: string): Rng {
    return new Rng(seed);
  }

  static fromStream(seed: string, stream: Stream): Rng {
    return new Rng(`${seed}#${stream}`);
  }

  // Uniform in [0, 1).
  next(): number {
    return this.draw();
  }

  // Uniform integer in [min, max], inclusive.
  int(min: number, max: number): number {
    return min + Math.floor(this.draw() * (max - min + 1));
  }

  float(min: number, max: number): number {
    return min + this.draw() * (max - min);
  }

  chance(p: number): boolean {
    return this.draw() < p;
  }

  // A fresh generator salted with a label (one per day, per route, per attempt), so systems
  // never share a draw sequence and nothing needs to store generator state in the save.
  derive(label: string): Rng {
    return new Rng(`${this.seed}::${label}`);
  }
}
