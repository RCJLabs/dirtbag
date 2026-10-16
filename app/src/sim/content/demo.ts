// Phase 14.5 (Evan's calls): the demo. Act I, then the week of Dex's race after it: the Lot, the
// town (its gym and its jobs), Roadside, and the Gorge once you climb hard enough for it. It
// ends the morning after the race is decided, on a last card, with your save to carry into the
// full game.

// Where the demo goes. Everywhere else isn't in it.
export const DEMO_PLACES = [
  'lot',
  'road',
  'gorge',
  'gym',
  'diner',
  'shop',
  'cafe',
  'warehouse',
  'clinic',
  'lake',
  'market',
  'garage',
];

export const DEMO_START = 'The demo: your first season in the valley, and the week after it.';

export const DEMO_END = {
  title: 'That’s the season',
  text: 'The first season’s done, Dex’s race is run, and the valley keeps going past where the demo stops: more crags, more people, years of it.',
  dex: 'Dex got there first. The open line at Roadside has his name on it.',
  you: 'You got there first. The open line at Roadside has your name on it, and Dex has to look at it every weekend.',
  carry: 'The full game picks up from this morning, with this climber. Export your save and bring it.',
  // Phase 15.3: the last card's way to the full game, on Steam.
  store: 'The full game on Steam',
  storeNote: 'Its page, in Steam’s overlay.',
  noSteam: 'Steam isn’t running, so there’s no page to show. The full game is on Steam, as Dirtbag.',
  refused: 'That’s the end of the demo.',
  retire: 'Hanging it up comes later, in the full game.',
  // Why a full game's save won't load in the demo, after "That file won’t load:".
  fullSave: 'it’s from the full game, past where the demo goes',
  // Phase 19.2: the full game's own build, locked till it's unlocked. In the Android app, its
  // unlock through Google Play ({price} is Play's, in the player's currency); elsewhere, its
  // store pages.
  unlockCarry: 'Unlock the full game and this climber carries on from this morning.',
  unlock: 'Unlock the full game',
  unlockNote: 'Once, through Google Play: {price}.',
  unlockNoPrice: 'Once, through Google Play.',
  restore: 'You’ve bought it already',
  restoreNote: 'Play looks for it on this account.',
  notBought: 'Play has no purchase of the full game on this account.',
  noPlay: 'Google Play didn’t answer. Try again with a signal.',
  buyFailed: 'That didn’t go through. If Play charged you, “You’ve bought it already” finds it.',
  page: 'The full game on {store}',
  pageNote: 'Its page, in your browser.',
};
