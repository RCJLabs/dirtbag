// Phase 18.5: the media ladder, as data (Evan's call: followers back, against Phase 23's).
// Posting what you did, sponsors who pay and want things for it, a rival for the headline
// deal, a thread about you now and then, and a film at the top. v0.956 paid cash for every
// first send by followers, gym problems included, and ran to $2,300 a day by day 200
// (docs/audit/economy.md §1.2); here followers pay nothing on their own. Sponsors pay, and
// cost days. Every number is [proposed].

export type PostStyle = 'straight' | 'story' | 'bait' | 'ad';

export const POSTS: Record<PostStyle, { name: string; says: string; note: string }> = {
  straight: {
    name: 'Post the send',
    says: 'You post it as it was: the line, the grade, the fall before.',
    note: 'What you did today, as it was',
  },
  story: {
    name: 'Tell the story',
    says: 'You write the day long: the walk in, the conditions, the bit where you nearly bailed.',
    note: 'Fewer follow, the ones who do stay. Psyche up',
  },
  bait: {
    name: 'Bait the algorithm',
    says: 'A clip slowed down, a caption that starts an argument. It goes everywhere.',
    note: 'More follow. The old crowd notices, and so do the threads',
  },
  ad: {
    name: 'Post the ad',
    says: 'A discount code and a smile you practiced. It pays.',
    note: 'The sponsor’s ad: it pays, few follow it',
  },
};

export interface Sponsor {
  name: string;
  // Followers it takes to be offered it.
  followers: number;
  // Paid each cycle you deliver, on keep-it-real terms (brand terms pay more).
  stipend: number;
  // What a cycle asks: a send posted at your grade less one; a shoot day at a crag; a comp.
  shoot: boolean;
  comp: boolean;
  // An ad's pay, when the terms want one.
  ad: number;
}

export const SPONSORS: Sponsor[] = [
  { name: 'Chalkbag Co.', followers: 2000, stipend: 60, shoot: false, comp: false, ad: 15 },
  { name: 'Apex Climbing', followers: 8000, stipend: 160, shoot: true, comp: false, ad: 35 },
  { name: 'Meridian', followers: 30000, stipend: 420, shoot: true, comp: true, ad: 90 },
];

export const TERMS = {
  real: { name: 'Keep it real', says: 'Your words, your photos, less money.' },
  brand: { name: 'Full brand', says: 'Their words, their photos, an ad each cycle, more money.' },
};

// The rival for the headline deal: a name people know, and getting more known.
export const MEDIA_RIVAL = {
  name: 'Skye Maddox',
  who: 'a comp climber with a camera crew and a good jawline',
};

// What a thread about you says, before the grade.
export const HEAT_SAYS = [
  'A thread’s going round: somebody thinks your last send was soft, and the grade was a gift.',
  'Somebody’s posted a video of you, slowed down, asking whether that foot was on.',
  'A forum’s decided you were spotted, or sprayed, or lucky. It has a lot of pages.',
];

export const DOC = {
  who: 'A filmmaker called Ines Ruhl',
  offer:
    'wants to make a film about you: a season, the van, the people, and a line harder than anything you’ve done, climbed on camera.',
  aired: 'The film goes out. People you’ve never met know what your van smells like. You don’t mind.',
  shelved:
    'The season runs out before the line goes. Ines shelves the film, kindly. The footage is beautiful.',
};
