// Splits the single-file build (index.html) into the parts the size report and build compare
// care about. The layout is what vite-plugin-singlefile emits today:
//   <script>window.__AUDIO__={"name.mp3":"data:…"};</script>    music, base64
//   <script>window.__ASSETS__={"sprite":"data:…"};</script>      sprites, base64
//   <script type="module">…</script>                              the app bundle
//   <style>…</style>                                              the CSS
// Everything else is the "shell". If the build layout changes, update the markers here.
import { createHash } from 'node:crypto';

const MARKERS = {
  audio: ['<script>window.__AUDIO__=', '</script>'],
  assets: ['<script>window.__ASSETS__=', '</script>'],
  js: ['<script type="module">', '</script>'],
  css: ['<style>', '</style>'],
};

export const bytes = (s) => Buffer.byteLength(s, 'utf8');
export const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// Decoded size of a base64 data URI, without decoding it.
function dataUriBytes(uri) {
  const b64 = uri.slice(uri.indexOf(',') + 1);
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}

function parseMap(body) {
  // Body is `{…};` — valid JSON once the trailing semicolon is dropped.
  const json = body.trim().replace(/;$/, '');
  const obj = JSON.parse(json);
  const entries = {};
  for (const [name, uri] of Object.entries(obj)) {
    entries[name] = { uri, decoded: dataUriBytes(uri), sha: sha256(uri) };
  }
  return entries;
}

export function splitBuild(html) {
  const parts = {};
  let shell = html;
  for (const [key, [open, close]] of Object.entries(MARKERS)) {
    const a = html.indexOf(open);
    if (a < 0) throw new Error(`build layout changed: no "${open}" in index.html`);
    const b = html.indexOf(close, a + open.length);
    if (b < 0) throw new Error(`build layout changed: "${open}" is never closed`);
    const tag = html.slice(a, b + close.length);
    const body = html.slice(a + open.length, b);
    parts[key] = { bytes: bytes(tag), body };
    shell = shell.replace(tag, `<!--${key}-->`);
  }
  parts.audio.entries = parseMap(parts.audio.body);
  parts.assets.entries = parseMap(parts.assets.body);
  parts.shell = { bytes: bytes(shell), body: shell };
  parts.total = bytes(html);
  return parts;
}
