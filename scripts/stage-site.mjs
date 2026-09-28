// Copies exactly what dirtbag.rcjlabs.com serves into a clean folder (default _site/) for the
// Pages deploy. An allowlist on purpose: the repo also holds docs, scripts and the TWA config,
// none of which belong on the site. `.well-known/` is the one that must never be dropped — without
// assetlinks.json the Play app loses domain verification and shows a browser address bar.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, statSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT, packageVersion } from './lib/version.mjs';

const FILES = ['index.html', 'service-worker.js', 'manifest.webmanifest', 'favicon.ico', 'privacy.html', 'CNAME'];
const DIRS = ['icons', '.well-known'];

const out = resolve(process.argv[2] || join(ROOT, '_site'));
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const missing = [...FILES, ...DIRS].filter((f) => !existsSync(join(ROOT, f)));
if (missing.length) {
  console.error(`cannot stage, missing: ${missing.join(', ')}`);
  process.exit(1);
}
for (const f of [...FILES, ...DIRS]) cpSync(join(ROOT, f), join(out, f), { recursive: true });

// version.json names the commit being deployed. The version alone can't tell a new deployment
// from the old one on a redeploy or rollback; the commit can, so deploy.yml waits for it before
// testing the live site.
const commit = process.env.GITHUB_SHA || execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
writeFileSync(join(out, 'version.json'), JSON.stringify({ version: packageVersion(), commit }) + '\n');

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]));
const files = walk(out);
const total = files.reduce((n, f) => n + statSync(f).size, 0);
console.log(`staged ${files.length} files, ${(total / 1e6).toFixed(2)} MB → ${out}`);
for (const f of files) console.log(`  ${f.slice(out.length + 1)}`);
