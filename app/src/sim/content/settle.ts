// Phase 32.4: word of the repeats of a line you put up (settle.ts). The first repeat, and the
// one that settles the grade, by your call: {line} (its name), {grade} (what it is now),
// {called} (what you called it), {who}.

// Who repeated it, at a crag people know the way to.
export const REPEATERS = [
  'A pair from out of town',
  'Somebody from the gym crowd',
  'A kid on a summer road trip',
  'Somebody nobody at the Lot can put a name to',
];

export const REPEAT_FIRST =
  '{who} repeated {line}. You hear it third-hand at the Lot, which is how you hear everything. Nobody’s saying what they made of the grade yet.';

// In a wild place, where only you knew the way.
export const REPEAT_WILD =
  'Somebody found their way up the wash and repeated {line}. You never find out who. There’s fresh chalk on it, and it isn’t yours.';

// Settled, by your call: soft (−1), true (0), stout (+1).
export const SETTLED: Record<-1 | 0 | 1, string> = {
  [-1]: 'The repeaters have had their say on {line}: {grade}, harder than the {called} you gave it. The old guard approves of a humble call, and for once somebody says so out loud.',
  0: 'The repeaters have had their say on {line}: {grade}, as you called it. It goes in the book at that, and nobody argues.',
  1: 'The repeaters have had their say on {line}: {grade}, not the {called} you gave it. Somebody at the Lot says that’s the price of a first ascent. Somebody else says it’s the price of an ego.',
};

// The beta sheet's note on a line you put up.
export const FA_NOTE = {
  none: 'Your first ascent. Nobody’s repeated it yet: the grade’s your call till they have.',
  some: 'Your first ascent. Repeats so far: {n} of the {of} it takes to settle the grade. Till then it’s your call.',
  settled: 'Your first ascent, repeated and settled at {grade}.',
};
