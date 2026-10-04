// Phase 25.2: guiding, as data. Who books a day with the gear shop's guide service, and what
// the day says of how it went.

// The clients: named, so a day is somebody's. None share a name with the coaching roster or
// the cast.
export const GUIDE_CLIENTS = [
  'Gwen',
  'Arturo',
  'The Okafors',
  'Delia',
  'Hank',
  'Mei',
  'A bachelorette party',
  'Pradeep',
  'Lottie',
  'Two brothers from Ohio',
  'Yusuf',
  'Corinne',
];

// What the day says, by how near the best it came.
export const GUIDE_SAYS: [number, string][] = [
  [0, 'Somebody spends the afternoon in the shade with their shoes off. They tip anyway, a little.'],
  [0.75, 'A good day out. Everybody gets a photo of themselves halfway up something.'],
  [
    0.9,
    'Every one of them tops out on the thing they came for, and one of them cries a little at the anchor. Five stars, they say, before you’ve even coiled the rope.',
  ],
];
