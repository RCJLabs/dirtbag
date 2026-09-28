// Minimal static server for local checks and CI. No dependencies on purpose: the smoke test
// must not depend on a dev server that could mask what GitHub Pages actually serves.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';

// Explicit charset matters: index.html declares <meta charset> after ~13 MB of inline script,
// far past the 1024-byte prescan window, so without the header Chromium may guess the encoding.
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
};

export async function startServer({ root = '.', port = 0, host = '127.0.0.1' } = {}) {
  const base = resolve(root);
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (path.endsWith('/')) path += 'index.html';
      const file = resolve(join(base, path));
      if (file !== base && !file.startsWith(base + sep)) throw Object.assign(new Error('outside root'), { code: 'ENOENT' });
      if (!(await stat(file)).isFile()) throw Object.assign(new Error('not a file'), { code: 'ENOENT' });
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (e) {
      res.writeHead(e.code === 'ENOENT' ? 404 : 500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(e.code === 'ENOENT' ? 'not found' : 'server error');
    }
  });
  await new Promise((ok) => server.listen(port, host, ok));
  const url = `http://${host}:${server.address().port}/`;
  // closeAllConnections: a browser's keep-alive sockets would otherwise outlive close(), and the
  // smoke test's offline step relies on the server being truly gone.
  const close = () =>
    new Promise((ok) => {
      server.close(() => ok());
      server.closeAllConnections();
    });
  return { url, close };
}

// `node scripts/lib/serve.mjs [root] [port]` for poking at the build by hand.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { url } = await startServer({ root: process.argv[2] || '.', port: Number(process.argv[3] || 4173) });
  console.log(`serving ${resolve(process.argv[2] || '.')} at ${url}`);
}
