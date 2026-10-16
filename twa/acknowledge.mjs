// Phase 19.2: hooks PlayAcknowledger.java into the Android project Bubblewrap generates, since
// Bubblewrap has no way to add code of our own. Run after `bubblewrap update`, before Gradle
// (build-twa.yml). It copies the class beside the generated ones, calls it from the app's start
// (Application) and from every call the page makes through the Digital Goods API
// (DelegationService), and adds Play's billing library, pinned, for it to compile against.
// It fails on anything it can't find, so a Bubblewrap template that's moved on stops the build
// rather than shipping an app that never acknowledges and has every purchase refunded.
//
//   node twa/acknowledge.mjs [project directory]     (default: the repo root, where Bubblewrap writes)
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// The version androidbrowserhelper's billing 1.2.0 (Bubblewrap 1.25.0's) uses: Play requires 8
// or later for updates from 31 Aug 2026. Move it with Bubblewrap, deliberately.
export const BILLING = 'com.android.billingclient:billing:8.3.0';
const MARK = 'PlayAcknowledger';

// Replaces `anchor` in a file once, or fails saying which file and what's missing.
function edit(file, anchor, replacement) {
  const text = readFileSync(file, 'utf8');
  if (text.includes(MARK) || text.includes(BILLING)) return; // already hooked
  const at = text.indexOf(anchor);
  if (at < 0) throw new Error(`${file}: no ${JSON.stringify(anchor)} to hook the acknowledger onto`);
  writeFileSync(file, text.slice(0, at) + replacement + text.slice(at + anchor.length));
}

export function hook(root) {
  const manifest = JSON.parse(readFileSync(join(root, 'twa-manifest.json'), 'utf8'));
  if (!manifest.features?.playBilling?.enabled)
    throw new Error('twa-manifest.json: Play Billing is off, so there is nothing to acknowledge');
  // Bubblewrap exports the delegation service, which Chrome reaches the app through (the Digital
  // Goods API included), only with notifications on, and refuses Play Billing without them.
  if (manifest.enableNotifications !== true)
    throw new Error('twa-manifest.json: Play Billing needs enableNotifications, or Chrome can’t reach the app');
  const java = join(root, 'app/src/main/java', ...manifest.packageId.split('.'));
  const source = readFileSync(join(HERE, 'PlayAcknowledger.java'), 'utf8');
  if (!source.includes(`package ${manifest.packageId};`))
    throw new Error(`PlayAcknowledger.java: its package isn't ${manifest.packageId}`);
  copyFileSync(join(HERE, 'PlayAcknowledger.java'), join(java, 'PlayAcknowledger.java'));

  edit(
    join(java, 'Application.java'),
    'super.onCreate();',
    'super.onCreate();\n      PlayAcknowledger.run(this);',
  );
  // The Digital Goods API reaches the app as an extra command on its delegation service.
  const delegation = join(java, 'DelegationService.java');
  const text = readFileSync(delegation, 'utf8');
  if (!text.includes(MARK)) {
    const end = text.lastIndexOf('}');
    if (end < 0 || !/extends\s+com\.google\.androidbrowserhelper\.trusted\.DelegationService\b/.test(text))
      throw new Error(`${delegation}: not the delegation service the acknowledger expects`);
    writeFileSync(
      delegation,
      text.slice(0, end) +
        `
    // Phase 19.2: the page asked Play something; acknowledge whatever it has bought.
    @Override
    public android.os.Bundle onExtraCommand(
            String commandName,
            android.os.Bundle args,
            androidx.browser.trusted.TrustedWebActivityCallbackRemote callbackRemote) {
        ${MARK}.run(getApplicationContext());
        return super.onExtraCommand(commandName, args, callbackRemote);
    }
` +
        text.slice(end),
    );
  }
  // Beside the app's own dependencies, where Bubblewrap puts the billing helper's.
  const deps = "implementation fileTree(include: ['*.jar'], dir: 'libs')";
  edit(join(root, 'app/build.gradle'), deps, `${deps}\n    implementation '${BILLING}'`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ?? join(HERE, '..');
  hook(root);
  console.log(`✓ the Android project acknowledges Play purchases (${BILLING})`);
}
