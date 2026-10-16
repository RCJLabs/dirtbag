// The game's keys (the save, the plan, the settings) in one file in the user-data folder,
// which Steam Cloud syncs (Phase 14.3, Evan's call). Each write goes to a temporary file and is
// renamed over the old one, so a crash mid-write never leaves half a save. A file that won't
// read is moved aside, never written over: the save rule, at the file's level.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const FORMAT = 'dirtbag-desktop';

export function fileStore(path) {
  let keys = {};
  let raw = null;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    // No file yet: a first launch.
  }
  if (raw !== null) {
    try {
      const f = JSON.parse(raw);
      if (f?.format !== FORMAT || typeof f.keys !== 'object' || f.keys === null)
        throw new Error('not a key file');
      keys = Object.fromEntries(Object.entries(f.keys).filter(([, v]) => typeof v === 'string'));
    } catch {
      renameSync(path, `${path}.unreadable-${Date.now()}`);
    }
  }

  const write = () => {
    mkdirSync(dirname(path), { recursive: true });
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, JSON.stringify({ format: FORMAT, keys }));
    renameSync(tmp, path);
  };
  // A change that the disk refuses is undone, so what's held is what's on disk.
  const change = (k, apply) => {
    const had = Object.hasOwn(keys, k);
    const was = keys[k];
    apply();
    try {
      write();
      return true;
    } catch {
      if (had) keys[k] = was;
      else delete keys[k];
      return false;
    }
  };

  return {
    all: () => ({ ...keys }),
    set: (k, v) => change(k, () => (keys[k] = v)),
    remove: (k) => !Object.hasOwn(keys, k) || change(k, () => delete keys[k]),
  };
}
