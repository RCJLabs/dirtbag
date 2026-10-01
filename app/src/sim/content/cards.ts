// How the people at the fire play hold'em (Phase 22.9b) [proposed]. Each calls a bet with a
// hand that wins `call` of the time against a random one, bets one that wins `bet`, and bluffs
// `bluff` of the hands they'd otherwise check. Your first read is how they bet; the second,
// how often they bluff, and what to do about it.
export interface Style {
  call: number;
  bet: number;
  bluff: number;
  read: string;
  tell: string;
}

export const STYLES: Record<string, Style> = {
  hazel: {
    call: 0.5,
    bet: 0.68,
    bluff: 0.05,
    read: 'Hazel bets when she has it, and checks when she doesn’t. She folds a lot.',
    tell: 'When she bets, believe her.',
  },
  sage: {
    call: 0.4,
    bet: 0.56,
    bluff: 0.3,
    read: 'Sage bets often, and calls more than she should.',
    tell: 'Call her down lighter than feels right.',
  },
};
