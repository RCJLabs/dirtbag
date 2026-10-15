// Phase 31.3: a name the old guard knows (Evan's call: lines plus standing). Ray and Frank have
// a word for a family's kid, once, as the old guard had the forebear: well (high), neither way
// (mid), or not (low; FACTION's bands); the crowd at a crag and the shops in town say it too.
// {forebear} is filled from the family.

import type { KeeperLine } from './keepers';
import type { TalkDef, TalkNode } from './people';

export type KinBand = 'high' | 'mid' | 'low';
export const KIN_BANDS: KinBand[] = ['high', 'mid', 'low'];

export const KIN_OLD_GUARD: Record<string, Record<KinBand, { text: string; label: string }>> = {
  ray: {
    high: {
      text: '“You’re {forebear}’s kid.” Ray looks you over like a topo he doesn’t trust yet. “They never chipped a hold in their life. See you don’t either.”',
      label: 'I won’t',
    },
    mid: {
      text: '“{forebear}’s kid,” Ray says, to the wall more than to you. “They were all right. Took them long enough.”',
      label: 'Fair',
    },
    low: {
      text: 'Ray doesn’t offer a hand. “{forebear}’s kid. We had words, {forebear} and me, years back. Nothing to do with you. Yet.”',
      label: 'Fair enough',
    },
  },
  frank: {
    high: {
      text: '“Knew {forebear} before you were a rumor,” Frank says. “Best feet on a slab I ever saw. Show me yours sometime.”',
      label: 'Sometime',
    },
    mid: {
      text: 'Frank squints at you over his coffee. “{forebear}’s kid. You’ve got the look. Whether you’ve got the head, we’ll find out.”',
      label: 'We will',
    },
    low: {
      text: '“{forebear} and I didn’t see eye to eye,” Frank says. “I don’t hold it against you. I’ll just be watching.”',
      label: 'Fair enough',
    },
  },
};

export const kinStarts = (who: string): TalkDef['start'] =>
  KIN_OLD_GUARD[who] ? KIN_BANDS.map((b) => ({ when: { kinBeat: `${who}/${b}` }, node: `kin-${b}` })) : [];

export const kinNodes = (who: string): Record<string, TalkNode> =>
  KIN_OLD_GUARD[who]
    ? Object.fromEntries(
        KIN_BANDS.map((b) => [
          `kin-${b}`,
          {
            calls: true as const,
            text: KIN_OLD_GUARD[who]![b].text,
            opts: [{ label: KIN_OLD_GUARD[who]![b].label, fx: { seen: `kin-${who}` } }],
          },
        ]),
      )
    : {};

// A stranger at a crag who knew them.
export const KIN_CROWD: KeeperLine[] = [
  {
    text: 'Someone at the base squints at you. “You climb like {forebear}. That’s a compliment, mostly.”',
    when: { kin: true },
  },
  {
    text: '“{forebear}’s kid? There’s a hold on the warm-up we still call {forebear}’s pinch. Nobody remembers why.”',
    when: { kin: true },
  },
  {
    text: 'A stranger asks if you’re related to {forebear}. You say yes. They tell you a story about {forebear} you’ve never heard, and you’re not sure any of it’s true.',
    when: { kin: true },
  },
];

// The shops in town, who knew them as a customer.
export const KIN_KEEPERS: Record<string, KeeperLine[]> = {
  diner: [
    {
      text: '“You’re {forebear}’s kid,” the waitress says. “They took their coffee black and their eggs burnt. You don’t have to.”',
      when: { kin: true },
    },
  ],
  shop: [
    {
      text: '“{forebear} bought their ropes here for years. Always the same color. Never said why, and I never asked.”',
      when: { kin: true },
    },
  ],
  garage: [
    {
      text: 'Dale pats the van’s hood. “Knew this thing when {forebear} had it. Knew {forebear} too. Neither of them ever let me finish a job properly.”',
      when: { kin: true },
    },
  ],
};
