// v0.956, which R3 retires (Evan's call: retire it and let players take their saves), kept
// everything in this browser's localStorage under "dirtbag-" keys; the rebuild's are
// "dirtbag.". Those keys hold the career it was playing ("dirtbag-save-v3"), three manual
// slots ("dirtbag-slot-N", each with a "-meta" summary) and the last "What's new" seen.
// Nothing here writes or deletes them: the old career stays where it was, and can be kept as
// a file, byte for byte, whenever the player asks.

import { asSkills, gradeOf, type Skills } from '../sim';

const PREFIX = 'dirtbag-';
const CAREER = 'dirtbag-save-v3';
const SLOT = /^dirtbag-slot-\d+$/;
export const LEGACY_FILE = 'dirtbag-v0956-career.json';

export interface Legacy {
  name: string | null;
  // As v0.956 had them, uncapped: the sim caps them if they come across.
  skills: Skills | null;
  grade: number | null;
}

function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function keysOf(ls: Storage): string[] {
  const out: string[] = [];
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k?.startsWith(PREFIX)) out.push(k);
  }
  return out.sort();
}

function read(ls: Storage, key: string): Record<string, unknown> | null {
  try {
    const raw = ls.getItem(key);
    const v: unknown = raw ? JSON.parse(raw) : null;
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// The v0.956 climber in this browser: the career it was playing, or failing that the
// manual save written last. Null if there isn't one.
export function findLegacy(ls: Storage | null = store()): Legacy | null {
  if (!ls) return null;
  let save = read(ls, CAREER);
  if (!save) {
    const slots = keysOf(ls)
      .filter((k) => SLOT.test(k))
      .map((k) => ({ k, at: Number(read(ls, `${k}-meta`)?.savedAt) || 0 }))
      .sort((a, b) => b.at - a.at);
    for (const { k } of slots) if ((save = read(ls, k))) break;
  }
  if (!save) return null;
  const name = typeof save.name === 'string' && save.name.trim() ? save.name.trim() : null;
  const skills = asSkills(save.skills);
  if (!name && !skills) return null;
  return { name, skills, grade: skills ? gradeOf(skills) : null };
}

// Every key v0.956 kept here, exactly as it kept them, in one file. Null if it kept none.
export function legacyFile(ls: Storage | null = store(), now = new Date()): string | null {
  if (!ls) return null;
  const keys = keysOf(ls);
  if (!keys.length) return null;
  const kept = Object.fromEntries(keys.map((k) => [k, ls.getItem(k)]));
  return JSON.stringify({ format: 'dirtbag-v0956-export', exported: now.toISOString(), keys: kept }, null, 2);
}

// Hands the file to the browser to save. False if there's nothing to save.
export function saveLegacyFile(): boolean {
  const text = legacyFile();
  if (!text) return false;
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = LEGACY_FILE;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
