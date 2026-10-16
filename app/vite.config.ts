/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { demoContent } from './build/demo';
import { pwa } from './build/pwa';

// package.json is the one place the version lives; the build reads it from there.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// Phase 19.1: the gate (game/unlock.ts), off until launch. DIRTBAG_GATE=1 turns it on for the
// site (deploy.yml, Evan's switch); `--mode gated` builds it on into dist-gated for its e2e.
const gated = (mode: string): boolean => mode === 'gated' || process.env.DIRTBAG_GATE === '1';
const outDir = (mode: string): string =>
  mode === 'demo' ? 'dist-demo' : mode === 'gated' ? 'dist-gated' : 'dist';

export default defineConfig(({ mode }) => ({
  // Relative asset URLs, so the same build runs at the site root, under a subpath or as a preview.
  base: './',
  plugins: [react(), pwa(), ...(mode === 'demo' ? [demoContent()] : [])],
  // Phase 14.5: `--mode demo` builds the demo (sim/edition.ts) into dist-demo, beside the
  // full game's dist.
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __DEMO__: JSON.stringify(mode === 'demo'),
    __GATE__: JSON.stringify(gated(mode)),
  },
  build: { target: 'es2022', outDir: outDir(mode) },
  // `--mode harness` runs the balance harness instead of the tests; `--mode demo` plays the
  // demo's build of the sim (harness/*.play.ts).
  test: {
    include:
      mode === 'harness'
        ? ['harness/**/*.harness.ts']
        : mode === 'demo'
          ? ['harness/**/*.play.ts']
          : mode === 'diff'
            ? ['harness/**/*.diff.ts']
            : ['src/**/*.test.ts'],
    environment: 'node',
  },
}));
