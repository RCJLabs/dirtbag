// Phase 20.1: what's new, by version, newest first (`news.json`): the words the game shows after
// an update, and the ones Play's "What's new" takes as they are (`npm run check` holds each to
// Play's 500 characters). The demo's build takes the empty twin: these name the whole valley.
import type { News } from './news';
import notes from './news.json';

export const NEWS: News[] = notes;
