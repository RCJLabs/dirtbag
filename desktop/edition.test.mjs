// Phase 15.3: which game a copy is, from what pack.mjs left beside it or what a run was told.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { editionOf } from './edition.js';

const dir = (edition) => {
  const d = mkdtempSync(join(tmpdir(), 'dirtbag-edition-'));
  if (edition !== undefined) writeFileSync(join(d, 'edition.json'), JSON.stringify({ edition }));
  return d;
};

test('a copy with nothing beside it is the full game', () => {
  const e = editionOf(dir());
  assert.equal(e.demo, false);
  assert.equal(e.name, 'Dirtbag');
  assert.equal(e.build, 'dist');
  assert.equal(e.steamKey, 'appId');
});

test('a copy packed as the demo is the demo, with a name and a Steam app of its own', () => {
  const e = editionOf(dir('demo'));
  assert.equal(e.demo, true);
  assert.equal(e.name, 'Dirtbag Demo');
  assert.equal(e.build, 'dist-demo');
  assert.equal(e.steamKey, 'demoAppId');
});

test('a run told which it is believes it, and anything else is the full game', () => {
  assert.equal(editionOf(dir(), { DIRTBAG_EDITION: 'demo' }).demo, true);
  assert.equal(editionOf(dir('demo'), { DIRTBAG_EDITION: 'full' }).demo, false);
  assert.equal(editionOf(dir('something'), {}).demo, false);
});
