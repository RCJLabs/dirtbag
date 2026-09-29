// Criterion 3 of Phase 13: the licence ledger covers all audio. Every cue and every layer
// of ambience is in it, and anything not made in code names a recording with a licence.
import { describe, expect, it } from 'vitest';
import { QUIET } from './beds';
import ledger from './ledger.json';
import { VOICES } from './voices';

describe('the licence ledger', () => {
  const sounds = ledger.sounds as Record<string, { made: string; in?: string; recording?: string }>;
  const recordings = ledger.recordings as { file: string; author: string; licence: string; url: string }[];

  it('lists every cue and every layer of ambience, and nothing that isn’t one', () => {
    const all = [...Object.keys(VOICES), ...Object.keys(QUIET)].sort();
    expect(Object.keys(sounds).sort()).toEqual(all);
  });

  it('says where each one comes from: code, or a recording with its licence', () => {
    for (const [id, s] of Object.entries(sounds)) {
      expect(['code', 'recording'], id).toContain(s.made);
      if (s.made === 'code') expect(s.in, id).toMatch(/^src\/audio\//);
      else
        expect(
          recordings.map((r) => r.file),
          id,
        ).toContain(s.recording);
    }
    for (const r of recordings) {
      expect(r.author, r.file).toBeTruthy();
      expect(['CC0-1.0', 'CC-BY-4.0'], r.file).toContain(r.licence);
      expect(r.url, r.file).toMatch(/^https:\/\//);
    }
  });
});
