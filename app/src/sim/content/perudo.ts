// Phase 36.1 (Evan's calls, 18 Oct 2026): how each person at the fire plays liar's dice, and
// the table's words. A style is three numbers [proposed]: `doubt`, how unlikely a bid has to
// look from their own cup before they call it; `bluff`, how often a raise is on a face they
// haven't got; `caution`, how far under what they expect they open. `read` is what you learn
// watching them, shown at the table.

export interface DiceStyle {
  doubt: number;
  bluff: number;
  caution: number;
  read: string;
}

// As they play hold'em (content/cards.ts): Hazel straight, Sage loose, Frank somewhere he's
// been for forty years.
export const PERUDO_STYLES: Record<string, DiceStyle> = {
  hazel: {
    doubt: 0.35,
    bluff: 0.05,
    caution: 0.5,
    read: 'Hazel bids what’s in her cup, and lets a lot go.',
  },
  sage: {
    doubt: 0.5,
    bluff: 0.3,
    caution: 0,
    read: 'Sage pushes faces she hasn’t got, and calls early.',
  },
  frank: {
    doubt: 0.45,
    bluff: 0.1,
    caution: 0.3,
    read: 'Frank doesn’t bluff, and doesn’t believe you either.',
  },
};
export const DICE_STYLE: DiceStyle = { doubt: 0.4, bluff: 0.15, caution: 0.3, read: '' };

export const PERUDO = {
  // {dice}: how many each, in words (GAMES.dice.n).
  rules:
    '{dice} dice each, under a cup. Bid how many of a face are under all the cups together, ones counting for every face: more than the last bid, or as many of a higher face. Or call the last bid a lie. Whoever’s wrong loses a die, and the last cup with dice takes the game.',
  // A call, and what the cups showed: {caller} calls {bid}, and there are {count}.
  call: '{caller} {calls} it on {bid}. The cups come up: {count}.',
  loses: '{who} {loses} a die.',
  out: '{who} {is} out of dice.',
  won: '{who} {takes} it, last cup standing.',
  youWon: 'Last cup standing: yours.',
  late: 'The fire’s down to coals, and the cups go back in the crate.',
};
