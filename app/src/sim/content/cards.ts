// How the people at the fire play hold'em (Phase 22.9b), as built by Evan's call; Frank and the
// tells, Phase 36.3. Each calls a bet with a hand that wins `call` of the time against a random
// one, bets one that wins `bet`, and bluffs `bluff` of the hands they'd otherwise check (against
// more of the field, a fair share's worth: holdem.ts). Your first read is how they bet; the
// second, how often they bluff, and what to do about it.
export interface Style {
  call: number;
  bet: number;
  bluff: number;
  read: string;
  tell: string;
  // Phase 36.3: what you see when they bet, once you've the second read on them: with a hand,
  // or without one. Right `GAMES.holdem.tell` of the time.
  signs?: { strong: string; bluff: string };
}

export const STYLES: Record<string, Style> = {
  hazel: {
    call: 0.5,
    bet: 0.68,
    bluff: 0.05,
    read: 'Hazel bets when she has it, and checks when she doesn’t. She folds a lot.',
    tell: 'When she bets, believe her.',
    signs: {
      strong: 'Hazel squares her chips into a neat stack first.',
      bluff: 'Hazel bets, and goes back to her tea.',
    },
  },
  sage: {
    call: 0.4,
    bet: 0.56,
    bluff: 0.3,
    read: 'Sage bets often, and calls more than she should.',
    tell: 'Call her down lighter than feels right.',
    signs: {
      strong: 'Sage stops talking.',
      bluff: 'Sage keeps talking, a little faster than before.',
    },
  },
  // Phase 36.3 [proposed]: Frank at the fire, as he plays liar's dice: straight, and hard to
  // bluff.
  frank: {
    call: 0.45,
    bet: 0.72,
    bluff: 0.03,
    read: 'Frank bets only the goods, and calls when he doesn’t believe you.',
    tell: 'Don’t fight his bets without a real hand.',
    signs: {
      strong: 'Frank looks at his cards a second time.',
      bluff: 'Frank doesn’t look at his cards at all.',
    },
  },
};
