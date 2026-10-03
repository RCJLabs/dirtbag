// Phase 17.5: giving, not just getting. A thing for each of them, once a week (GIVE.every),
// bought for what it costs; a line you put up, named for one of them; and Frank brought to
// the fire. Each says something back in their own voice.

export interface Gift {
  // What you give, as the button says it.
  what: string;
  cost: number;
  line: string;
}

export const GIFTS: Record<string, Gift> = {
  hazel: {
    what: 'a bag of good coffee',
    cost: 14,
    line: 'Hazel smells the bag and says nothing for a while. The next pot’s stronger.',
  },
  sage: {
    what: 'a secondhand guidebook',
    cost: 18,
    line: 'Sage has read it by the evening. She’s added notes in the margins.',
  },
  dex: {
    what: 'a jar of the good chalk',
    cost: 12,
    line: '"What’s this for?" Dex says. He uses it every day after.',
  },
  mara: {
    what: 'finger tape, the good stuff',
    cost: 9,
    line: '"Practical," Mara says, which from her is high praise.',
  },
  rico: {
    what: 'a burrito the size of his forearm',
    cost: 8,
    line: 'Rico eats it in four bites and calls you a saint, loudly.',
  },
  tam: {
    what: 'a thermos that keeps tea hot all morning',
    cost: 22,
    line: 'Tam turns it over in his hands. "I had one like this, once." He keeps it.',
  },
  ray: {
    what: 'a box of new bolts',
    cost: 30,
    line: '"Now you’re talking," Ray says. He’s already looking at the wall.',
  },
  frank: {
    what: 'a spare fan belt',
    cost: 16,
    line: 'Frank holds it up to the light like a fish. "You listen," he says.',
  },
};

// A line named for someone: what you'd call it, and what they say when they hear.
export const NAMED_FOR: Record<string, { name: string; line: string }> = {
  hazel: { name: 'Coffee’s On', line: 'Hazel hears what you called it and laughs till she has to sit down.' },
  sage: {
    name: 'The Easy Way Down',
    line: 'Sage goes quiet when she hears. She climbs it the next week, slowly, reading every move.',
  },
  dex: { name: 'Spot Me', line: 'Dex pretends he hasn’t heard. He tells everyone at the gym.' },
  mara: { name: 'Don’t Celebrate', line: '"Don’t," Mara says. Then she’s caught smiling at the topo.' },
  rico: { name: 'Horrible, You’ll Love It', line: 'Rico hears and yells it across the crag, twice.' },
  tam: {
    name: 'Five Good Seasons',
    line: 'Tam reads the name on the topo and has to look at the view for a minute.',
  },
  ray: { name: 'Ray’s Last Bolt', line: 'Ray says it isn’t his last bolt. He’s pleased anyway.' },
  frank: {
    name: 'Passing Through',
    line: '"Ha," Frank says, which is the most he’s ever said about anything.',
  },
};

// Frank, asked to the fire.
export const FIRE_ASK = {
  label: 'Come and sit at the fire',
  line: 'Frank brings his own chair and a bag of something he won’t name. He stays till the coals go gray.',
};
