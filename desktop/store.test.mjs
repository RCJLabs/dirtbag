// The desktop's key file: what's set is on disk, a broken file is moved aside and never
// written over, and a write the disk refuses changes nothing.
import { strict as assert } from 'node:assert';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileStore } from './store.js';

const dir = () => mkdtempSync(join(tmpdir(), 'dirtbag-store-'));

test('keeps each key on disk, and reads it back on the next launch', () => {
  const d = dir();
  const path = join(d, 'dirtbag.json');
  const a = fileStore(path);
  assert.deepEqual(a.all(), {});
  assert.equal(a.set('dirtbag.save', '{"v":1}'), true);
  assert.equal(a.set('dirtbag.plan', '[]'), true);
  assert.equal(a.remove('dirtbag.plan'), true);
  assert.equal(a.remove('nothing'), true);
  assert.deepEqual(fileStore(path).all(), { 'dirtbag.save': '{"v":1}' });
  assert.deepEqual(readdirSync(d), ['dirtbag.json']);
});

test('moves a file it can’t read aside, and starts empty without touching it', () => {
  const d = dir();
  const path = join(d, 'dirtbag.json');
  writeFileSync(path, '{"format":"dirtbag-desktop","keys":{"dirtbag.save":"trunc');
  const s = fileStore(path);
  assert.deepEqual(s.all(), {});
  const aside = readdirSync(d).find((f) => f.startsWith('dirtbag.json.unreadable-'));
  assert.ok(aside);
  assert.match(readFileSync(join(d, aside), 'utf8'), /trunc$/);
});

test('changes nothing when the disk refuses a write', () => {
  const d = dir();
  const s = fileStore(join(d, 'saves', 'dirtbag.json'));
  s.set('dirtbag.save', 'old');
  // The folder gone and a file in its place: no write can land, whoever's running.
  rmSync(join(d, 'saves'), { recursive: true });
  writeFileSync(join(d, 'saves'), '');
  assert.equal(s.set('dirtbag.save', 'new'), false);
  assert.equal(s.set('dirtbag.plan', '[]'), false);
  assert.deepEqual(s.all(), { 'dirtbag.save': 'old' });
});
