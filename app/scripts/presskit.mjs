// Phase 15.4: the press kit, put together from what store:art just made and the words in
// docs/PRESSKIT.md, with the game's description lifted from docs/STORE.md (Steam's), so the
// kit never says something the store page doesn't. A folder and a zip of it, in store-art/.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { zip } from './zip.mjs';

const DOCS = new URL('../../docs/', import.meta.url).pathname;

// A text block from STORE.md, by its key.
function block(md, key) {
  const m = md.match(new RegExp('```text ' + key + '\\n([\\s\\S]*?)\\n```'));
  if (!m) throw new Error(`no ${key} block in docs/STORE.md`);
  return m[1];
}

// The kit's markdown: PRESSKIT.md without its note to Evan, and Steam's About This Game (which
// opens with the short description's line) after the fact sheet.
function words() {
  const kit = readFileSync(join(DOCS, 'PRESSKIT.md'), 'utf8');
  const store = readFileSync(join(DOCS, 'STORE.md'), 'utf8');
  const [title, , ...rest] = kit.split('\n\n');
  const body = rest.join('\n\n');
  const at = body.indexOf('## Made in code');
  const description = `## The game\n\n${block(store, 'steam-about')}\n`;
  return `${title}\n\n${body.slice(0, at)}${description}\n${body.slice(at)}`;
}

// The kit, from the art in `out` (store-art/); the zip's path.
export function presskit(out) {
  const dir = join(out, 'dirtbag-presskit');
  rmSync(dir, { recursive: true, force: true });
  const put = (from, to) => {
    mkdirSync(join(dir, to, '..'), { recursive: true });
    cpSync(join(out, from), join(dir, to));
  };
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'presskit.md'), words());
  put('steam/library-logo.png', 'logo/dirtbag-logo.png');
  put('steam/community-icon.png', 'logo/dirtbag-icon.png');
  for (const f of readdirSync(join(out, 'steam')))
    if (/^(header|main|vertical|library-capsule|library-hero)/.test(f) && !f.startsWith('library-header'))
      put(`steam/${f}`, `capsules/${f}`);
  for (const f of readdirSync(join(out, 'steam')))
    if (/^\d\d-/.test(f)) put(`steam/${f}`, `screenshots/${f}`);
  for (const f of readdirSync(join(out, 'play'))) put(`play/${f}`, `phone/${f}`);

  const walk = (d) =>
    readdirSync(d)
      .sort()
      .flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  const files = walk(dir).map((f) => [`dirtbag-presskit/${relative(dir, f)}`, readFileSync(f)]);
  const path = join(out, 'dirtbag-presskit.zip');
  writeFileSync(path, zip(files));
  return path;
}
