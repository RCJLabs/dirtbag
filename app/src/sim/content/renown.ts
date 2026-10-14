// Phase 28.4: the crew's renown, as data (Evan's call: lines only). The threads, the old
// guard and the strangers at the crag say the crew's name more the more it's done. {crew} is
// filled with its name where the line is said.

import type { KeeperLine } from './keepers';
import type { TalkDef, TalkNode } from './people';

// The threads: what a thread about you says, once the crew's name is going round.
export const CREW_HEAT = [
  'A thread’s going round about {crew}: somebody says the send trains are staged and the projects were soft.',
  'Somebody’s posted a photo of {crew} at the crag captioned “who are these people”. It has a lot of replies.',
];

// The strangers at a busy crag, by how far the name's gone.
export const RENOWN_CROWD: KeeperLine[] = [
  { text: '"Wait, are you with {crew}? My friend won’t stop talking about you lot."', when: { renown: 1 } },
  { text: '"{crew}? Never heard of you." A pause. "Should I have?"', when: { renown: 1 } },
  {
    text: 'Two kids at the base are arguing about who in {crew} is the strongest. Neither of them picks you.',
    when: { renown: 2 },
  },
  {
    text: '"You’re {crew}, right? Somebody said you’d be here. Somebody always says that now."',
    when: { renown: 2 },
  },
  {
    text: '"Is it true {crew} have a project nobody’s allowed to talk about?" It is not true.',
    when: { renown: 3 },
  },
  {
    text: 'Somebody asks you to sign their guidebook, under a line you’ve never climbed. You sign it anyway.',
    when: { renown: 3 },
  },
];

// The shops, once the name's known in town.
export const RENOWN_KEEPERS: Record<string, KeeperLine[]> = {
  shop: [
    {
      text: 'The kid at the till asks if {crew} need anything. You lot are on first-name terms with the tape shelf.',
      when: { renown: 2 },
    },
  ],
  diner: [
    {
      text: 'Otis has heard of {crew}. Otis has opinions about {crew}. Otis shares them.',
      when: { renown: 2 },
    },
  ],
};

// The old guard: Ray on the rail and Frank by his stove, a line each time the name goes
// further. Said once.
const OLD_GUARD: Record<string, [string, string, string]> = {
  ray: [
    '"{crew}," Ray says, like he’s tasting it. "Heard it twice this week. We had a name once. Nobody remembers it, which is how you know we earned it."',
    'Ray points his thermos at the wall. "The kids talk about {crew} like you’re weather. Something that happens to a crag." He seems to approve.',
    '"I’ve watched four crews worth the name from this rail," Ray says. "{crew} makes five. Don’t let it go to your head. It goes to everyone’s head."',
  ],
  frank: [
    'Frank heard about {crew} at the hardware store. "Fella said you lot climb like you owe someone money." He means it kindly. You take it that way.',
    '"People come through asking after {crew}," Frank says. "I tell them I’ve never heard of you. Saves you the bother."',
    'Frank’s painted something on the side of his truck: {crew}, slightly misspelled. He won’t fix it.',
  ],
};

export const renownStarts = (who: string): TalkDef['start'] =>
  OLD_GUARD[who] ? [3, 2, 1].map((n) => ({ when: { renownBeat: `${who}/${n}` }, node: `renown-${n}` })) : [];

export const renownNodes = (who: string): Record<string, TalkNode> =>
  OLD_GUARD[who]
    ? Object.fromEntries(
        OLD_GUARD[who]!.map((text, i) => [
          `renown-${i + 1}`,
          { calls: true as const, text, opts: [{ label: 'Fair', fx: { seen: `renown-${who}-${i + 1}` } }] },
        ]),
      )
    : {};
