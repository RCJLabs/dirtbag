// Copies exactly what the site serves into _site/ (what deploy.yml publishes): the rebuild's
// build (app/dist), the privacy page, CNAME, and .well-known/assetlinks.json. Without that last
// one the Play app loses domain verification and shows a browser address bar. Nothing else in
// the repo ships, so nothing becomes public by accident.
//
//   npm run build --prefix app && npm run stage [-- out-dir]
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { ROOT, packageVersion } from './lib/version.mjs';

const DIST = join(ROOT, 'app', 'dist');
const FILES = ['privacy.html', 'CNAME'];
const DIRS = ['.well-known'];

const out = resolve(process.argv[2] || join(ROOT, '_site'));
if (!existsSync(join(DIST, 'index.html'))) {
  console.error('cannot stage: app/dist has no build. Run: npm run build --prefix app');
  process.exit(1);
}
const missing = [...FILES, ...DIRS].filter((f) => !existsSync(join(ROOT, f)));
if (missing.length) {
  console.error(`cannot stage, missing: ${missing.join(', ')}`);
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(DIST, out, { recursive: true });
for (const f of [...FILES, ...DIRS]) cpSync(join(ROOT, f), join(out, f), { recursive: true });

// version.json names the commit being deployed. The version alone can't tell a new deployment
// from the old one on a redeploy or rollback; the commit can, so deploy.yml waits for it before
// testing the live site.
const commit = process.env.GITHUB_SHA || execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
writeFileSync(join(out, 'version.json'), JSON.stringify({ version: packageVersion(), commit }) + '\n');

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]));
const files = walk(out);
const total = files.reduce((n, f) => n + statSync(f).size, 0);
console.log(`staged ${files.length} files, ${(total / 1e3).toFixed(1)} KB → ${out}`);
for (const f of files) console.log(`  ${f.slice(out.length + 1)}`);
