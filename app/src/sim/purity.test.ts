// The sim must run the same everywhere: in the browser, in Node for the bots, and in the
// tests. So it never reaches for the page, storage, the network, real time or unseeded
// randomness, and never imports the layers above it. tsconfig.sim.json already denies it
// the DOM's types; this catches what types can't (Math.random, Date) and upward imports.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SIM = new URL('.', import.meta.url).pathname;
const FORBIDDEN: [RegExp, string][] = [
  [/\bMath\.random\b/, 'Math.random (use Rng)'],
  [/\bDate\b/, 'Date (the sim has its own clock)'],
  [/\bperformance\b/, 'performance'],
  [/\b(window|document|navigator|localStorage|sessionStorage|indexedDB)\b/, 'browser globals'],
  [/\b(setTimeout|setInterval|requestAnimationFrame|queueMicrotask)\b/, 'timers'],
  [/\bfetch\s*\(/, 'network'],
  [/\bprocess\b/, 'Node globals'],
  [/from\s+['"]\.\.\/+(?:\.\.\/)*(view|ui|game)\b/, 'imports from the layers above'],
];

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? files(join(dir, e.name))
      : e.name.endsWith('.ts') && !e.name.endsWith('.test.ts')
        ? [join(dir, e.name)]
        : [],
  );
}

// Comments may talk about what the code avoids; only code counts.
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

describe('sim purity', () => {
  const all = files(SIM);
  it('finds the sim sources', () => expect(all.length).toBeGreaterThan(5));
  for (const f of all) {
    it(relative(SIM, f), () => {
      const src = code(readFileSync(f, 'utf8'));
      const hits = FORBIDDEN.filter(([re]) => re.test(src)).map(([, why]) => why);
      expect(hits).toEqual([]);
    });
  }
});
