// Phase 14.5b (Evan's call: the demo build lacks the later content outright). The game keeps
// what only the full game has (the later crags' lines and rock, the story past Act I, the
// expeditions, the Hollow) in `*.full.ts` modules, and each has a `*.demo.ts` twin with the
// same exports, empty. The demo's build takes the twin, so none of it is in the demo's files.
import type { Plugin } from 'vite';

export function demoContent(): Plugin {
  return {
    name: 'dirtbag-demo-content',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!source.endsWith('.full')) return null;
      const r = await this.resolve(source, importer, { ...options, skipSelf: true });
      return r && { ...r, id: r.id.replace(/\.full\.ts$/, '.demo.ts') };
    },
  };
}
