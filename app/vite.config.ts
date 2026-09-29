/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { pwa } from './build/pwa';

// package.json is the one place the version lives; the build reads it from there.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

export default defineConfig(({ mode }) => ({
  // Relative asset URLs, so the same build runs at the site root, under a subpath or as a preview.
  base: './',
  plugins: [react(), pwa()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  build: { target: 'es2022' },
  // `--mode harness` runs the balance harness instead of the tests.
  test: {
    include: mode === 'harness' ? ['harness/**/*.harness.ts'] : ['src/**/*.test.ts'],
    environment: 'node',
  },
}));
