// Phase 19.2: the acknowledger's hooks, on the project Bubblewrap itself would generate from
// twa-manifest.json: its own templates, rendered by its own generator, with no icons fetched.
// Needs `npm ci --prefix twa`. Run: node --test twa/
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { BILLING, hook } from './acknowledge.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(HERE, 'package.json'));
const { TwaGenerator, TwaManifest, util } = require('@bubblewrap/core');
const { FeatureManager } = require('@bubblewrap/core/dist/lib/features/FeatureManager');
const TEMPLATES = join(dirname(require.resolve('@bubblewrap/core/package.json')), 'template_project');

// The Java and the Gradle file as `bubblewrap update` writes them, in a directory of their own.
async function generated() {
  const root = mkdtempSync(join(tmpdir(), 'dirtbag-twa-'));
  cpSync(join(HERE, '..', 'twa-manifest.json'), join(root, 'twa-manifest.json'));
  const manifest = await TwaManifest.fromFile(join(root, 'twa-manifest.json'));
  const args = {
    ...manifest,
    ...new FeatureManager(manifest),
    shareTargetIntentFilter: TwaGenerator.generateShareTargetIntentFilter(manifest),
    generateShortcuts: manifest.generateShortcuts,
    escapeJsonString: util.escapeJsonString,
    escapeGradleString: util.escapeGradleString,
    toAndroidScreenOrientation: util.toAndroidScreenOrientation,
  };
  const g = new TwaGenerator();
  await g.applyTemplate(join(TEMPLATES, 'app/build.gradle'), join(root, 'app/build.gradle'), args);
  for (const f of ['Application.java', 'DelegationService.java'])
    await g.applyJavaTemplate(TEMPLATES, root, manifest.packageId, f, args);
  return { root, java: join(root, 'app/src/main/java', ...manifest.packageId.split('.')) };
}

test('Bubblewrap’s project, as generated, has Play Billing, and Chrome can reach it', async () => {
  const { root, java } = await generated();
  const gradle = readFileSync(join(root, 'app/build.gradle'), 'utf8');
  assert.match(gradle, /androidbrowserhelper:billing:/);
  // The delegation service is exported as this flag says (AndroidManifest.xml's
  // android:exported="@bool/enableNotification"), and the Digital Goods API comes through it.
  assert.match(gradle, /enableNotifications: true,/);
  assert.match(readFileSync(join(java, 'DelegationService.java'), 'utf8'), /DigitalGoodsRequestHandler/);
});

test('the acknowledger goes in, called from the app’s start and from the page’s calls', async () => {
  const { root, java } = await generated();
  hook(root);
  const app = readFileSync(join(java, 'Application.java'), 'utf8');
  assert.match(app, /super\.onCreate\(\);\s+PlayAcknowledger\.run\(this\);/);
  const delegation = readFileSync(join(java, 'DelegationService.java'), 'utf8');
  assert.match(delegation, /registerExtraCommandHandler\(new DigitalGoodsRequestHandler/);
  assert.match(delegation, /onExtraCommand\([\s\S]*PlayAcknowledger\.run\(getApplicationContext\(\)\);/);
  assert.match(delegation, /return super\.onExtraCommand\(commandName, args, callbackRemote\);\s+}\s+}\s*$/);
  assert.match(readFileSync(join(java, 'PlayAcknowledger.java'), 'utf8'), /^package io\.github\.rcjlabs\.dirtbag;/m);
  assert.match(readFileSync(join(root, 'app/build.gradle'), 'utf8'), new RegExp(`implementation '${BILLING}'`));
});

test('hooking twice changes nothing', async () => {
  const { root, java } = await generated();
  hook(root);
  const files = ['Application.java', 'DelegationService.java'].map((f) => join(java, f));
  const once = [...files, join(root, 'app/build.gradle')].map((f) => readFileSync(f, 'utf8'));
  hook(root);
  assert.deepEqual(
    [...files, join(root, 'app/build.gradle')].map((f) => readFileSync(f, 'utf8')),
    once,
  );
});

test('a template that has moved on stops the build', async () => {
  const { root, java } = await generated();
  writeFileSync(join(java, 'Application.java'), 'public class Application {}\n');
  assert.throws(() => hook(root), /Application\.java: no "super\.onCreate\(\);"/);
});

test('Play Billing without notifications is refused, as Bubblewrap refuses it', async () => {
  const { root } = await generated();
  const m = JSON.parse(readFileSync(join(root, 'twa-manifest.json'), 'utf8'));
  writeFileSync(join(root, 'twa-manifest.json'), JSON.stringify({ ...m, enableNotifications: false }));
  assert.throws(() => hook(root), /needs enableNotifications/);
});

test('without Play Billing on, there is nothing to hook', async () => {
  const { root } = await generated();
  const m = JSON.parse(readFileSync(join(root, 'twa-manifest.json'), 'utf8'));
  writeFileSync(join(root, 'twa-manifest.json'), JSON.stringify({ ...m, features: {} }));
  assert.throws(() => hook(root), /Play Billing is off/);
});
