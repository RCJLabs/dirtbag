// The Record Book (Phase 23.1): what you've done that's worth writing down, each with its
// story. v0.956 kept three books of it (29 feats, 5 milestones, 8 story cards), and the same
// moment could fire three of them; here each moment is one entry, and `from` says which of
// v0.956's it took in. An entry whose system the rebuild hasn't built yet `waits` for it, and
// stays out of the book until then. `aim` is what earns it, worked out in record.ts. Ids are
// stable: Phase 14 maps them to Steam achievements.

export type RecordAim =
  | { sends: number }
  | { grade: number }
  | { style: 'flash' | 'onsight' }
  | { outside: true }
  | { fa: number }
  | { shift: true }
  | { regular: true }
  | { letGo: true }
  | { cash: number }
  | { gear: number }
  | { dream: string }
  | { brokeDown: true }
  | { bond: number }
  | { circuit: true }
  | { hurt: true }
  | { day: number }
  | { summit: true }
  | { dog: true }
  | { rival: true };

export interface RecordEntry {
  id: string;
  title: string;
  // What earns it, said plainly, for the book's page.
  desc: string;
  // The card when it's earned.
  story: string;
  // v0.956's feats (f1), milestones (k8) and story cards (mge) it took in.
  from: string[];
  aim?: RecordAim;
  // The system it's waiting on, when the rebuild hasn't built it.
  waits?: string;
}

export const RECORD: RecordEntry[] = [
  {
    id: 'firstsend',
    title: 'First Send',
    desc: 'Send your first line.',
    story:
      'You pulled on, you topped out. Doesn’t matter that it was easy. You’re a climber now: everything starts here.',
    from: ['f1:send1', 'mge:firstsend'],
    aim: { sends: 1 },
  },
  {
    id: 'flash',
    title: 'First Try',
    desc: 'Send a line on your first go.',
    story:
      'Walked up, read it, sent it cold. For a second the whole sequence was just there before you moved. That’s the thing everyone chases.',
    from: ['f1:flash1', 'mge:flash'],
    aim: { style: 'flash' },
  },
  {
    id: 'onsight',
    title: 'Cold Read',
    desc: 'Onsight a line: first go, no beta, outside.',
    story:
      'Nobody told you anything. You read it from the ground, guessed right twice and lucky once, and clipped the chains. It counts more than it should.',
    from: ['f1:onsight1'],
    aim: { style: 'onsight' },
  },
  {
    id: 'outside',
    title: 'On Real Rock',
    desc: 'Send your first line outside.',
    story:
      'Plastic is practice. This was stone: cold, sharp, indifferent. The chalk on your hands smells like the rest of your life now.',
    from: ['f1:outdoor1', 'mge:outdoor'],
    aim: { outside: true },
  },
  {
    id: 'fa',
    title: 'First Ascent',
    desc: 'Climb a line nobody has and name it.',
    story:
      'Nobody had done it. Now it has a name, and the name is yours to have picked. Somebody will repeat it and complain about the grade. Let them.',
    from: ['f1:fa1'],
    aim: { fa: 1 },
  },
  {
    id: 'prolific',
    title: 'Prolific',
    desc: 'Claim three first ascents.',
    story:
      'Three lines carry names you gave them. People are starting to look at blank rock and wonder whether you’ve already been there.',
    from: ['k8:prolific'],
    aim: { fa: 3 },
  },
  {
    id: 'v5',
    title: 'A Real Climber',
    desc: 'Send V5 or 5.12a.',
    story:
      'V5: the grade where people stop saying “I just started.” Your body does what you ask now. Most of the time.',
    from: ['f1:v5', 'mge:v5'],
    aim: { grade: 5 },
  },
  {
    id: 'v10',
    title: 'Double Digits',
    desc: 'Send V10 or 5.14a.',
    story:
      'V10. Not many make it here. The van’s a wreck, the bank account’s a punchline, and you climb V10. Worth every cold morning.',
    from: ['f1:v10', 'mge:v10'],
    aim: { grade: 10 },
  },
  {
    id: 'v15',
    title: 'World Class',
    desc: 'Send V15 or 5.15c.',
    story:
      'There are people who climb this hard, and there are people who read about them. You moved from one list to the other today and nobody rang a bell.',
    from: ['f1:v15', 'k8:worldclass'],
    aim: { grade: 15 },
  },
  {
    id: 'v18',
    title: 'Off the Charts',
    desc: 'Send V18: the top of the scale.',
    story:
      'There’s no number after this one. You sat at the top for a long time, not because it was hard to leave but because there was nowhere higher to look.',
    from: ['f1:v18'],
    aim: { grade: 18 },
  },
  {
    id: 'send10',
    title: 'Tick List',
    desc: 'Send ten lines.',
    story:
      'Ten. Somewhere around the sixth you stopped writing them down and started remembering them anyway. That’s how a tick list starts.',
    from: ['f1:send10'],
    aim: { sends: 10 },
  },
  {
    id: 'send50',
    title: 'Crusher',
    desc: 'Send fifty lines.',
    story:
      'Fifty sends. Your tips have a callus where the callus used to be. People at the crag nod at you now like you’re furniture, which is the nicest thing a crag does.',
    from: ['f1:send50'],
    aim: { sends: 50 },
  },
  {
    id: 'circuit',
    title: 'The Full Circuit',
    desc: 'Send at every crag open to you.',
    story:
      'Every crag on the map has a line of yours on it. The map looks smaller than it did. That’s the trouble with maps.',
    from: ['k8:circuit'],
    aim: { circuit: true },
  },
  {
    id: 'rival',
    title: 'Past the Rival',
    desc: 'Climb harder than Dex.',
    story:
      'Dex has been the measuring stick this whole time. Today you climbed harder. It settles nothing, but you’ll remember this one.',
    from: ['mge:passrival'],
    aim: { rival: true },
  },
  {
    id: 'hurt',
    title: 'The Body Keeps Score',
    desc: 'Get hurt climbing.',
    story:
      'A finger that won’t take load. The first time the body says no. Every climber meets this wall; the ones who last learn to listen.',
    from: ['mge:injury'],
    aim: { hurt: true },
  },
  {
    id: 'year',
    title: 'A Year on the Road',
    desc: 'Last a year out of the van.',
    story:
      'A full year out of the van. Sunrises at the crag, gas-station coffee, the rare shower. You’d be lying if you said you missed the apartment.',
    from: ['mge:year', 'k8:dirtbagyr'],
    aim: { day: 56 },
  },
  {
    id: 'shift',
    title: 'Clocked In',
    desc: 'Work your first shift.',
    story:
      'A shift on somebody else’s floor. The money’s not much, but it’s chalk and gas and another week out here, which was always the trade.',
    from: ['f1:shift1'],
    aim: { shift: true },
  },
  {
    id: 'regular',
    title: 'Regular',
    desc: 'Earn a raise at a job.',
    story:
      'They know your name at work now, and they’ve stopped asking when you’re leaving. You’ve stopped knowing the answer.',
    from: ['f1:regular'],
    aim: { regular: true },
  },
  {
    id: 'letgo',
    title: 'Burned a Bridge',
    desc: 'Get let go from a job.',
    story:
      'You picked the crag over the shift one too many times and they noticed. There are other jobs. There are fewer days like the one you had instead.',
    from: ['f1:fired'],
    aim: { letGo: true },
  },
  {
    id: 'grand',
    title: 'First Grand',
    desc: 'Have $1,000 in hand.',
    story:
      'A thousand dollars, all at once, all yours. You counted it twice and then worked out how many weeks of gas it was. Climbers can’t help it.',
    from: ['f1:grand'],
    aim: { cash: 1000 },
  },
  {
    id: 'loaded',
    title: 'Loaded',
    desc: 'Have $5,000 in hand.',
    story:
      'Five grand. For a dirtbag that’s not money, it’s a decision waiting to be made. The trick is making it before the van makes it for you.',
    from: ['f1:baller'],
    aim: { cash: 5000 },
  },
  {
    id: 'kit',
    title: 'Kitted Out',
    desc: 'Own five kinds of kit.',
    story:
      'Everything you own fits in the van, and most of it is for climbing. Somebody asked if you had a hobby. You didn’t understand the question.',
    from: ['f1:gear5'],
    aim: { gear: 5 },
  },
  {
    id: 'rig',
    title: 'Home Sweet Van',
    desc: 'Build out the Dream Rig.',
    story:
      'A bed that isn’t a pad on a sheet of plywood. A stove that lights first time. You lay awake the first night just listening to it not rattle.',
    from: ['f1:van1'],
    aim: { dream: 'rig' },
  },
  {
    id: 'brokedown',
    title: 'Stranded',
    desc: 'Break down on the road.',
    story:
      'The van stopped and wouldn’t start again. You sat on the bumper and did the arithmetic of a tow. Every dirtbag has this afternoon. Now you’ve had yours.',
    from: ['f1:booted'],
    aim: { brokeDown: true },
  },
  {
    id: 'crew',
    title: 'Tight Crew',
    desc: 'Get close to someone you climb with.',
    story:
      'There’s someone you’d give your last cam to, and they’d tell you to keep it. That’s a partner. The rest is just people who belay.',
    from: ['f1:crew'],
    aim: { bond: 3 },
  },
  {
    id: 'summit',
    title: 'The Top of Something',
    desc: 'Summit an expedition.',
    story:
      'Days of hauling, nights hanging off a wall, and then there was no more up. You stood there longer than you meant to. Everyone does.',
    from: [],
    aim: { summit: true },
  },
  {
    id: 'dog',
    title: 'Good Dog',
    desc: 'Take in a dog.',
    story:
      'He sleeps on your feet and steals your spot by the fire. Somehow the van feels bigger with him in it, which isn’t how vans work.',
    from: [],
    aim: { dog: true },
  },
  // Waiting on systems the rebuild hasn't built: in the book when they are.
  {
    id: 'guidebook',
    title: 'Guidebook Author',
    desc: 'Write and publish a crag’s guide.',
    story: '',
    from: ['f1:guidebook'],
    waits: 'guidebooks',
  },
  {
    id: 'comp',
    title: 'Game On',
    desc: 'Compete in a comp.',
    story: '',
    from: ['f1:comp1'],
    waits: 'comps',
  },
  {
    id: 'compwin',
    title: 'Top Step',
    desc: 'Win a comp.',
    story: '',
    from: ['f1:compwin'],
    waits: 'comps',
  },
  {
    id: 'olympics',
    title: 'Olympic Medalist',
    desc: 'Podium at the Games.',
    story: '',
    from: ['k8:olymedal'],
    waits: 'comps',
  },
  {
    id: 'trait',
    title: 'Known For It',
    desc: 'Earn a trait.',
    story: '',
    from: ['f1:trait1'],
    waits: 'paths (Phase 23.4)',
  },
  {
    id: 'famous',
    title: 'Internet Famous',
    desc: 'Reach 5,000 followers.',
    story: '',
    from: ['f1:famous'],
    waits: 'media',
  },
  {
    id: 'sponsored',
    title: 'Sponsored',
    desc: 'Land a sponsor.',
    story: '',
    from: ['f1:sponsored'],
    waits: 'sponsors',
  },
  {
    id: 'pro',
    title: 'Going Pro',
    desc: 'Turn pro.',
    story: '',
    from: ['f1:pro'],
    waits: 'sponsors',
  },
  {
    id: 'giving',
    title: 'Dirtbag Philanthropist',
    desc: 'Give $1,000 to charity, over a life.',
    story: '',
    from: ['f1:giving1000'],
    waits: 'giving',
  },
  {
    id: 'retired',
    title: 'The Long Game',
    desc: 'Retire and tally your legacy.',
    story: '',
    from: ['f1:retired'],
    waits: 'retirement',
  },
];

export const recordById = (id: string): RecordEntry | undefined => RECORD.find((r) => r.id === id);

// Every feat, milestone and story card v0.956 had: what the book must hold, merged.
export const V0956_RECORD = {
  f1: [
    'send1',
    'flash1',
    'onsight1',
    'outdoor1',
    'fa1',
    'guidebook',
    'v5',
    'v10',
    'v15',
    'v18',
    'send10',
    'send50',
    'shift1',
    'regular',
    'fired',
    'grand',
    'baller',
    'gear5',
    'van1',
    'booted',
    'comp1',
    'compwin',
    'crew',
    'trait1',
    'famous',
    'sponsored',
    'pro',
    'giving1000',
    'retired',
  ],
  k8: ['circuit', 'olymedal', 'dirtbagyr', 'prolific', 'worldclass'],
  mge: ['firstsend', 'v10', 'passrival', 'v5', 'flash', 'outdoor', 'injury', 'year'],
};
