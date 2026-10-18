// Phase 36.4: the glovebox deck. The fire's three games for matchsticks against the cast, as
// long as you like: they're played on a copy of the climber (game.ts, `glove`) that goes back
// in the glovebox with the deck, so no time passes and nothing carries over. The tables are
// the fire's own, counting matchsticks.
import { useLayoutEffect, useRef } from 'react';
import type { Game } from '../game/game';
import { cardsBlocked, GAMES, GLOVE_CAST, gloveShort, listOf, PEOPLE, type GameState } from '../sim';
import { BlackjackBody, HoldemBody, sticks } from './Cards';
import { PerudoBody } from './Perudo';

export function GloveboxBody({ game, g }: { game: Game; g: GameState }) {
  const ref = useRef<HTMLDivElement>(null);
  const at = g.table ? 'dice' : (g.cards?.game ?? 'box');
  // Up from a table, back to the first game, so the keys and a pad have somewhere to start.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el.contains(document.activeElement)) return;
    el.querySelector<HTMLButtonElement>('button.opt:not(:disabled)')?.focus({ preventScroll: true });
  }, [at]);
  if (g.table) return <PerudoBody game={game.glovebox} s={g} glove />;
  if (g.cards?.game === 'bj') return <BlackjackBody game={game.glovebox} s={g} glove />;
  if (g.cards?.game === 'holdem') return <HoldemBody game={game.glovebox} s={g} glove />;
  const names = GLOVE_CAST.map((w) => PEOPLE[w]?.name ?? w);
  const bj = cardsBlocked(g, 'bj');
  const he = cardsBlocked(g, 'holdem');
  return (
    <div className="glove" id="glovebox" ref={ref}>
      <h3 id="sheet-title">The glovebox deck</h3>
      <p className="sub">
        A deck of cards, a cup of dice and a box of matches. {listOf(names)} are in. No time passes here, and
        nothing carries over.
      </p>
      <p className="note" id="g-box-left">
        {sticks(g.cash)} in the box.
      </p>
      <ul>
        <li>
          <button type="button" className="opt" id="g-dice" onClick={() => game.glovebox.dice('deal')}>
            <span>Liar’s dice</span>
            <small>Everyone in, ones wild, the last cup with dice takes it.</small>
          </button>
        </li>
        <li>
          <button
            type="button"
            className="opt"
            id="g-bj"
            disabled={!!bj}
            onClick={() => game.glovebox.bj('sit')}
          >
            <span>Blackjack</span>
            <small>
              {bj ? `${bj}.` : `${names[0]} deals: ${GAMES.bj.bets.join(' or ')} matchsticks a hand.`}
            </small>
          </button>
        </li>
        <li>
          <button
            type="button"
            className="opt"
            id="g-holdem"
            disabled={!!he}
            onClick={() => game.glovebox.holdem('sit')}
          >
            <span>Hold’em</span>
            <small>{he ? `${he}.` : 'Limit, everyone in, the button going round.'}</small>
          </button>
        </li>
        {gloveShort(g) && (
          <li>
            <button type="button" className="opt" id="g-box" onClick={() => game.gloveBox()}>
              <span>A new box of matches</span>
              <small>{sticks(GAMES.glove.sticks)}.</small>
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
