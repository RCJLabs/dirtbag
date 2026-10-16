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

export default defineConfig(({ mode }) => ({
  // Relative asset URLs, so the same build runs at the site root, under a subpath or as a preview.
  base: './',
  plugins: [react(), pwa(), ...(mode === 'demo' ? [demoContent()] : [])],
  // Phase 14.5: `--mode demo` builds the demo (sim/edition.ts) into dist-demo, beside the
  // full game's dist.
  define: { __APP_VERSION__: JSON.stringify(version), __DEMO__: JSON.stringify(mode === 'demo') },
  build: { target: 'es2022', outDir: mode === 'demo' ? 'dist-demo' : 'dist' },
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
