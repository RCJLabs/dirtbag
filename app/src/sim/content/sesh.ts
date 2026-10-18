// Phase 37: the session's words. The locals with no names, who stand in for the old guard's
// people at a crag; what's said as the goes go round; and what the cast who boulder do with a
// move they find, and say when they send it first. Blanks: {who} a name or a local, {crux} a
// crux's name ("the lip"), {beta} a move's name ("drop knee").

// The nameless locals, as you'd point them out.
export const LOCALS = [
  'the kid in the beanie',
  'the woman with a pad the size of a mattress',
  'the old-timer with a toothbrush for the holds',
  'the quiet one with tape on every finger',
  'the guy in the cut-off hoodie',
  'the student on a borrowed pad',
  'the one who drove up from the city this morning',
  'the woman who warms up on your project',
];

export const SESH_SAYS = {
  join: '{who} make room on the pads. You’ve got next go.',
  fell: '{who} comes off at {crux}.',
  sent: '{who} sends it.',
  theyFirst: '{who} sends it, first of anyone today.',
  youFirst: 'First to the top today, with the locals watching.',
  shared: '{who} works out {crux}, and says so: {beta}.',
  kept: '{who} works something out at {crux}, and keeps it.',
  // Yours, turned up by your fall, or brought from another day.
  found: 'You’ve worked out {crux}: {beta}. Tell them, or keep it?',
  brought: 'You already know {crux}: {beta}. Tell them, or keep it?',
  share: 'You tell them: {beta}. Nods all round on the pads.',
  keep: 'You keep {beta} to yourself.',
  // A round sat out before your first go: you've watched, so it can't be an onsight.
  watch: 'You sit a round out and watch. No onsight now; a flash is still on.',
  wait: 'You sit a round out.',
  leave: 'You leave them to it.',
  allSent: 'That’s everyone else up it. The session breaks up.',
  youSent: 'They keep at it without you.',
};

// The cast who boulder: whether they share a move they find, and what they do when they find
// one or send it first.
export const SESH_CAST: Record<string, { shares: boolean; found: string; first: string }> = {
  dex: {
    shares: false,
    found: 'Dex works something out at {crux}. He chalks up and doesn’t say what.',
    first: 'Dex sends it first, and makes sure you saw.',
  },
  sage: {
    shares: true,
    found: 'Sage tries {crux} twice, then tells the whole pad: {beta}.',
    first: 'Sage sends it first, and spots whoever’s next.',
  },
  rico: {
    shares: true,
    found: 'Rico gets {crux} and can’t keep it in: {beta}.',
    first: 'Rico sends it first. “You want next go?”',
  },
  mara: {
    shares: true,
    found: 'Mara comes off {crux}, thinks about it, and tells you: {beta}.',
    first: 'Mara sends it first, and goes back to her book.',
  },
  tam: {
    shares: false,
    found: 'Tam works something out at {crux}. He keeps it, for now.',
    first: 'Tam sends it first, and pours tea for the pads.',
  },
};
