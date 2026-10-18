// Phase 36.2: cards at the fire, drawn. A card face up (its rank and its suit, the red suits in
// the accent) or face down; and blackjack's table: the dealer's cards, the hole card down till
// the hand's played, yours (two hands once a pair's split), your bet, and the moves. The rules
// are the sim's (sim/cards.ts): this only stages them.
import { useLayoutEffect, useRef, useState } from 'react';
import type { Game } from '../game/game';
import {
  bjTotal,
  costLabel,
  fireOut,
  GAMES,
  isBlackjack,
  isPair,
  money,
  PEOPLE,
  rank,
  suit,
  type GameState,
} from '../sim';
import { MARKS } from './marks';

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_WORD = [
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'jack',
  'queen',
  'king',
  'ace',
];
const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_WORD = ['spades', 'hearts', 'diamonds', 'clubs'];

// A card, 0–51 as the sim deals them, face up; or its back.
export function PlayingCard({ c, down = false }: { c: number; down?: boolean }) {
  if (down)
    return (
      <svg className="pc down" viewBox="0 0 40 56" role="img" aria-label="face down">
        <rect x="1" y="1" width="38" height="54" rx="4" />
        <rect className="back" x="5" y="5" width="30" height="46" rx="2" />
      </svg>
    );
  const s = suit(c);
  const d = MARKS[SUITS[s]!]!.d;
  return (
    <svg
      className={s === 1 || s === 2 ? 'pc red' : 'pc'}
      viewBox="0 0 40 56"
      role="img"
      aria-label={`${RANK_WORD[rank(c)]} of ${SUIT_WORD[s]}`}
    >
      <rect x="1" y="1" width="38" height="54" rx="4" />
      <text x="5" y="15">
        {RANKS[rank(c)]}
      </text>
      <path className="pip" d={d} transform="translate(4.5 18) scale(0.5)" />
      <path className="pip" d={d} transform="translate(10.5 25) scale(1.2)" />
    </svg>
  );
}

// The dealer's upcard as you'd say it: "an ace", "a nine".
const upWords = (c: number): string => {
  const w = RANK_WORD[rank(c)]!;
  return `${w === 'ace' || w === 'eight' ? 'an' : 'a'} ${w}`;
};

// A hand's total as you'd say it: "soft 17", "bust", "blackjack".
function totalWords(cs: number[], natural: boolean): string {
  const t = bjTotal(cs);
  if (natural && isBlackjack(cs)) return 'blackjack';
  if (t.n > 21) return 'bust';
  return t.soft && t.n < 21 ? `soft ${t.n}` : String(t.n);
}

export function BlackjackBody({ game, s }: { game: Game; s: GameState }) {
  const c = s.cards!;
  const h = c.bj;
  const live = h && !h.paid ? h : null;
  const ref = useRef<HTMLDivElement>(null);
  const name = PEOPLE[c.who]?.name ?? c.who;
  const split = !!h && h.you.length > 1;
  // A move changes what's live: put focus on the table's first button again, for keys and pads.
  const moment = `${c.hands}-${h?.at ?? -1}-${h?.you.map((y) => y.cards.length).join('.') ?? ''}-${h?.paid ? 1 : 0}`;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el.contains(document.activeElement)) return;
    el.querySelector<HTMLButtonElement>('button.opt:not(:disabled)')?.focus({ preventScroll: true });
  }, [moment]);
  // The bet you pick stays picked from hand to hand.
  const [want, setWant] = useState(GAMES.bj.bets[0]!);
  const staked = h ? h.you.reduce((n, y) => n + y.bet, 0) : 0;
  const net = h?.paid ? h.paid.reduce((n, p) => n + p, 0) - staked : 0;
  return (
    <div className="bj" id="bj" ref={ref}>
      <h3 id="sheet-title">Blackjack</h3>
      <p className="sub">
        In front of you: {money(c.chips)}.{' '}
        {c.hands ? `${c.hands} ${c.hands === 1 ? 'hand' : 'hands'} tonight.` : `${name} deals.`}
      </p>
      {h && (
        <ul className="bj-hands">
          <li className="bj-hand">
            <span className="bj-who">{name}</span>
            <span className="cards">
              {h.dealer.map((d, i) => (
                <PlayingCard key={i} c={d} down={!!live && i === 1} />
              ))}
            </span>
            <span className="bj-total">
              {live ? `shows ${upWords(h.dealer[0]!)}` : totalWords(h.dealer, true)}
            </span>
          </li>
          {h.you.map((y, i) => (
            <li key={i} className="bj-hand" data-live={!!live && i === h.at}>
              <span className="bj-who">{split ? `Hand ${i + 1}` : 'You'}</span>
              <span className="cards">
                {y.cards.map((d, k) => (
                  <PlayingCard key={k} c={d} />
                ))}
              </span>
              <span className="bj-total">
                {totalWords(y.cards, !split)}
                <small>
                  {h.paid
                    ? h.paid[i]! > y.bet
                      ? `+${money(h.paid[i]! - y.bet)}`
                      : h.paid[i] === y.bet
                        ? 'push'
                        : `−${money(y.bet)}`
                    : `${money(y.bet)} on it`}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}
      {h?.paid && (
        <p className="note" id="bj-said">
          {net > 0 ? `Up ${money(net)}.` : net < 0 ? `Down ${money(-net)}.` : 'Even.'}
        </p>
      )}
      {live ? <Moves game={game} s={s} /> : <Between game={game} s={s} want={want} pick={setWant} />}
    </div>
  );
}

// The hand on the go: hit, stand, double on two cards, split a pair once.
function Moves({ game, s }: { game: Game; s: GameState }) {
  const c = s.cards!;
  const h = c.bj!;
  const y = h.you[h.at]!;
  const room = c.chips >= y.bet;
  const two = y.cards.length === 2;
  const pair = h.you.length === 1 && isPair(y.cards);
  return (
    <ul>
      <li>
        <button type="button" className="opt" id="bj-hit" onClick={() => game.bj('hit')}>
          <span>Hit</span>
          <small>Another card.</small>
        </button>
      </li>
      <li>
        <button type="button" className="opt" id="bj-stand" onClick={() => game.bj('stand')}>
          <span>Stand</span>
          <small>{h.at < h.you.length - 1 ? 'On to your next hand.' : 'The dealer plays.'}</small>
        </button>
      </li>
      <li>
        <button
          type="button"
          className="opt"
          id="bj-double"
          disabled={!two || !room}
          onClick={() => game.bj('double')}
        >
          <span>Double</span>
          <span className="c">{costLabel({ cash: -y.bet })}</span>
          <small>
            {!two
              ? 'Only on two cards.'
              : room
                ? 'One more card, then you stand.'
                : 'Not enough in front of you.'}
          </small>
        </button>
      </li>
      {pair && (
        <li>
          <button
            type="button"
            className="opt"
            id="bj-split"
            disabled={!room}
            onClick={() => game.bj('split')}
          >
            <span>Split</span>
            <span className="c">{costLabel({ cash: -y.bet })}</span>
            <small>
              {!room
                ? 'Not enough in front of you.'
                : rank(y.cards[0]!) === 12
                  ? 'Two hands, a card each, and that’s them.'
                  : 'Two hands, played one at a time.'}
            </small>
          </button>
        </li>
      )}
    </ul>
  );
}

// Between hands: your bet, the deal, or up from the table with what's in front of you.
function Between({
  game,
  s,
  want,
  pick,
}: {
  game: Game;
  s: GameState;
  want: number;
  pick: (b: number) => void;
}) {
  const c = s.cards!;
  const bets = GAMES.bj.bets;
  // The bet you picked, or the most you can cover under it.
  const bet = [...bets].reverse().find((b) => b <= want && b <= c.chips) ?? bets[0]!;
  const out = fireOut(s);
  const short = c.chips < bets[0]!;
  return (
    <>
      <div className="bj-bets" role="radiogroup" aria-label="Your bet">
        {bets.map((b) => (
          <button
            key={b}
            type="button"
            className="bj-bet"
            id={`bj-bet-${b}`}
            role="radio"
            aria-checked={b === bet}
            disabled={c.chips < b}
            onClick={() => pick(b)}
          >
            {money(b)}
          </button>
        ))}
      </div>
      <ul>
        <li>
          <button
            type="button"
            className="opt"
            id="bj-deal"
            disabled={out || short}
            onClick={() => game.bj('deal', bet)}
          >
            <span>Deal</span>
            <span className="c">{costLabel({ min: GAMES.bj.min, cash: -bet })}</span>
            <small>
              {out
                ? 'The fire’s down to coals.'
                : short
                  ? 'Not enough in front of you for a hand.'
                  : 'A fresh deck, and the dealer stands on every 17.'}
            </small>
          </button>
        </li>
        <li>
          <button type="button" className="opt" id="bj-up" onClick={() => game.bj('leave')}>
            <span>Get up</span>
            <small>{money(c.chips)} back in your pocket.</small>
          </button>
        </li>
      </ul>
    </>
  );
}
