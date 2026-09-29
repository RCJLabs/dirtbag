// Who made what: the credits screen's lines. Sound comes from the licence ledger, so a
// recording that replaces a synthesised sound is credited the moment it's listed.
import ledger from '../audio/ledger.json';

export interface Credit {
  what: string;
  who: string;
}

const recordings = ledger.recordings as { file: string; what?: string; author: string; licence: string }[];
const music = ledger.music as { title: string; author: string; licence: string }[];

export const CREDITS: { head: string; lines: Credit[] }[] = [
  { head: 'The game', lines: [{ what: 'Dirtbag', who: 'RCJ Labs' }] },
  {
    head: 'Art',
    lines: [{ what: 'Landscapes, people and the valley', who: 'Drawn in code, no asset packs' }],
  },
  {
    head: 'Sound',
    lines: [
      { what: 'Effects and ambience', who: 'Made in code, in your browser' },
      ...recordings.map((r) => ({ what: r.what ?? r.file, who: `${r.author}, ${r.licence}` })),
      ...(music.length
        ? music.map((m) => ({ what: `“${m.title}”`, who: `${m.author}, ${m.licence}` }))
        : [{ what: 'Music', who: 'Not yet' }]),
    ],
  },
  {
    head: 'Fonts',
    lines: [
      { what: 'Patrick Hand and Patrick Hand SC', who: 'Patrick Wagesreiter, SIL Open Font License 1.1' },
      { what: 'Big Shoulders Display', who: 'SIL Open Font License 1.1' },
    ],
  },
];
