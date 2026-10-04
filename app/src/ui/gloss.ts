// Phase 25.7: the glossary's words, found where they appear in a sheet's text, to be tapped
// for their entry. Only lowercase uses (an acronym as it's written): the game's names are
// capitalized, so The Pump stays a route and Send City a gym. Each word once, three at most,
// and none of the words too common to mean the climbing sense.

import { WORDS, type Word } from '../sim';

// Too common, or part of the game's names, to mark: a go, Send City, Roadside Crag, the game.
const SKIP = new Set(['Go', 'Send', 'Crag', 'Soft', 'Nut', 'Dirtbag', 'Lip']);
const MAX = 3;

const LINKED = WORDS.filter((w) => !SKIP.has(w.term));
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const form = (w: Word) =>
  w.term === w.term.toUpperCase() || /[A-Z]-/.test(w.term) ? w.term : w.term.toLowerCase();
// Longest first, so "send train" wins over anything inside it.
const ORDER = [...LINKED].sort((a, b) => b.term.length - a.term.length);
const RE = new RegExp(`(?<![\\w-])(${ORDER.map((w) => esc(form(w))).join('|')})(?:e?s)?(?![\\w-])`, 'g');
const BY_FORM = new Map(LINKED.map((w) => [form(w), w]));

export type Piece = string | { text: string; term: string };

// A text split into plain runs and the words to mark.
export function glossSplit(text: string): Piece[] {
  const out: Piece[] = [];
  const seen = new Set<string>();
  let at = 0;
  for (const m of text.matchAll(RE)) {
    const w = BY_FORM.get(m[1]!);
    if (!w || seen.has(w.term) || seen.size >= MAX) continue;
    seen.add(w.term);
    if (m.index! > at) out.push(text.slice(at, m.index));
    out.push({ text: m[0], term: w.term });
    at = m.index! + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

export const wordOf = (term: string): Word | undefined => WORDS.find((w) => w.term === term);
