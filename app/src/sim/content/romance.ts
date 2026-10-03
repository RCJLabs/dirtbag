// Phase 17.4: the romances, Sage's and Mara's (Evan's call), past v0.956's four beats. The
// spark; the first fight; one van or two; their chance against yours; together. And the end,
// when it comes, with real words. Each fork is answered in its own voice; the rules are
// romance.ts's.

import { ROMANCE } from '../dials';
import type { TalkDef, TalkNode } from './people';

const beat = (text: string, opts: TalkNode['opts']): TalkNode => ({ calls: true, text, opts });

export interface Romance {
  beats: TalkNode[];
  end: TalkNode;
}

export const ROMANCES: Record<string, Romance> = {
  sage: {
    beats: [
      beat(
        'Sage is quiet on the walk out, then stops at the cars. "I keep picking lines I think you’d like," she says, "and then I keep wanting to watch you on them. I’ve been reading this one for a while."',
        [
          {
            label: 'Kiss her',
            primary: true,
            fx: { romance: 'start', line: 'You and Sage. Neither of you says anything clever about it.' },
          },
          {
            label: '"Let’s keep climbing together"',
            fx: { romance: 'friends', line: 'Sage nods, and means it. "Good. You’re my best belay."' },
          },
        ],
      ),
      beat(
        'Sage is short with you all morning, then all at once: "You took the onsight. On my project. You didn’t even ask." She isn’t wrong.',
        [
          {
            label: 'Apologise properly',
            primary: true,
            fx: {
              romance: 'next',
              bond: 1,
              line: 'You apologise properly. Sage makes you mean it, then lets it go.',
            },
          },
          {
            label: 'Dig in',
            fx: {
              romance: 'next',
              away: ROMANCE.cool,
              line: 'Neither of you gives. Sage climbs somewhere else for {away} days.',
            },
          },
        ],
      ),
      beat(
        '"Two vans, two stoves, two of everything," Sage says, counting on her fingers. "One of them could go."',
        [
          {
            label: 'Move into hers',
            primary: true,
            fx: {
              romance: 'next',
              line: 'You move into Sage’s van. Her books take up more room than you do.',
            },
          },
          {
            label: 'She moves into yours',
            fx: { romance: 'next', line: 'Sage moves into your van and labels the shelves.' },
          },
          {
            label: 'Keep two vans',
            fx: { romance: 'next', line: 'Two vans, parked close. It suits you both.' },
          },
        ],
      ),
      beat(
        'The guiding company wants Sage for the whole season up north. "Real money. A real season." She’s watching your face, not the letter.',
        [
          {
            label: '"Go. I’ll be here."',
            primary: true,
            fx: {
              romance: 'next',
              away: ROMANCE.apart,
              line: 'Sage goes north. Back in {away} days. She calls on the clear nights.',
            },
          },
          {
            label: '"Stay. Please."',
            fx: {
              romance: 'next',
              line: 'She stays. Neither of you mentions it again, which is its own kind of mentioning.',
            },
          },
        ],
      ),
      beat(
        'A year, near enough. Sage hands you a topo she’s drawn of your first day out together, every move she remembers. Some of them didn’t happen. "They did the way I tell it."',
        [
          {
            label: 'Keep it',
            primary: true,
            fx: { romance: 'next', line: 'You and Sage: together, by any reckoning.' },
          },
        ],
      ),
    ],
    end: beat(
      'Sage finds you at the van. She’s worked out what to say and she says it plainly. "We don’t climb together any more. We’re not much of anything together any more. I’d rather say it than watch it." She doesn’t cry, and then she does.',
      [
        {
          label: 'Let her go',
          primary: true,
          fx: { romance: 'end', line: 'You and Sage are done. She keeps her distance for a while.' },
        },
      ],
    ),
  },
  mara: {
    beats: [
      beat(
        'Mara lowers you off and doesn’t let go of the rope straight away. "I don’t do this," she says. "Whatever this is. So if we’re doing it, don’t make it weird."',
        [
          {
            label: '"We’re doing it"',
            primary: true,
            fx: {
              romance: 'start',
              line: 'You and Mara. She tells you not to make it weird. You don’t, much.',
            },
          },
          {
            label: '"Let’s not, then"',
            fx: { romance: 'friends', line: '"Good," Mara says, a bit too fast.' },
          },
        ],
      ),
      beat('Mara won’t look at you. "You told Rico." You did. "One thing. I asked for one thing."', [
        {
          label: 'Apologise properly',
          primary: true,
          fx: {
            romance: 'next',
            bond: 1,
            line: 'You apologise. Mara says it’s fine in a voice that means it will be.',
          },
        },
        {
          label: '"It’s Rico. He’d have guessed"',
          fx: {
            romance: 'next',
            away: ROMANCE.cool,
            line: 'Mara climbs alone for {away} days. Then she’s back, and you don’t talk about it.',
          },
        },
      ]),
      beat('"Your van is a disgrace," Mara says. "Mine has a system." It does have a system.', [
        {
          label: 'Move into hers',
          primary: true,
          fx: { romance: 'next', line: 'You move into Mara’s van, and into her system.' },
        },
        {
          label: 'She moves into yours',
          fx: { romance: 'next', line: 'Mara moves into your van and reorganises it in an afternoon.' },
        },
        {
          label: 'Keep two vans',
          fx: { romance: 'next', line: 'Two vans. Hers is tidier. You both like it that way.' },
        },
      ]),
      beat(
        'An expedition wants Mara: two months, the kind of invite that doesn’t come twice. She’s already packed, in her head. "Tell me not to go and I won’t. Don’t tell me that."',
        [
          {
            label: '"Go."',
            primary: true,
            fx: {
              romance: 'next',
              away: ROMANCE.apart,
              line: 'Mara goes. Back in {away} days. Her postcards are three words long.',
            },
          },
          {
            label: 'Ask her to stay',
            fx: { romance: 'next', line: 'She stays. She’s cross about it for a week, and then she isn’t.' },
          },
        ],
      ),
      beat(
        'Mara climbs your project, clips the chains and lowers off without a word. At the bottom she says, "Don’t celebrate," and kisses you.',
        [
          {
            label: 'Celebrate anyway',
            primary: true,
            fx: { romance: 'next', line: 'You and Mara: together. She still won’t say the word.' },
          },
        ],
      ),
    ],
    end: beat(
      'Mara’s already decided; you can tell from how she’s coiled the rope. "This isn’t working. I don’t do things that aren’t working." A pause. "I’m sorry. I am."',
      [
        {
          label: 'Let her go',
          primary: true,
          fx: { romance: 'end', line: 'You and Mara are done. She keeps her distance for a while.' },
        },
      ],
    ),
  },
};

// The start entries and nodes for a talk tree: the end first, when it's come, then the beats.
export const romanceStarts = (who: string): TalkDef['start'] =>
  ROMANCES[who]
    ? [
        { when: { strained: who }, node: 'love-end' },
        ...ROMANCES[who]!.beats.map((_, i) => ({
          when: { romance: `${who}/${i + 1}` },
          node: `love-${i + 1}`,
        })),
      ]
    : [];
export const romanceNodes = (who: string): Record<string, TalkNode> =>
  ROMANCES[who]
    ? {
        'love-end': ROMANCES[who]!.end,
        ...Object.fromEntries(ROMANCES[who]!.beats.map((n, i) => [`love-${i + 1}`, n])),
      }
    : {};
