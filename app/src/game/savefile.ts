// Phase 14.2 (Evan's call): your save as a file, to keep, to carry to another browser or
// device, or to bring back; from Phase 15, a demo's climber into the full game. The file is
// the save exactly as the game keeps it, so it loads by the same rules as any save.
import { fromSave, toSave, type GameState, type LoadResult } from '../sim';

// Far past any save (a long career is under 200 KB): a file this big is something else.
const MOST = 4 * 1024 * 1024;

// "dirtbag-robin-day-12.json": who and when, in a name any system takes.
export function saveFileName(s: GameState): string {
  const who =
    s.climber.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'climber';
  return `dirtbag-${who}-day-${s.day}.json`;
}

// Hands the save to the browser (or the desktop's save dialog) as a file; its name.
export function exportSave(s: GameState): string {
  const name = saveFileName(s);
  const url = URL.createObjectURL(new Blob([toSave(s, __APP_VERSION__)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return name;
}

// A file someone picked, read as a save: loaded and migrated as any save is, or why not.
export async function readSave(f: Blob): Promise<LoadResult> {
  if (f.size > MOST) return { ok: false, why: 'too big to be a save' };
  return fromSave(await f.text());
}
