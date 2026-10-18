// Phase 36.1: liar's dice at the fire, drawn. The others' cups round the fire, yours lifted;
// the round's bids in order; your bid, a count and a face; and every cup up on a call, the
// dice that count lit. The rules are the sim's (sim/perudo.ts): this only stages them.
import { useLayoutEffect, useRef, useState } from 'react';
import type { Game } from '../game/game';
import {
  bidWords,
  callLines,
  costLabel,
  FACES,
  fill,
  fireOut,
  gameBlocked,
  GAMES,
  inCup,
  inPlay,
  inWords,
  least,
  nextSeat,
  PEOPLE,
  PERUDO,
  PERUDO_STYLES,
  upper,
  YOU,
  type DiceTable,
  type GameState,
} from '../sim';

const PIPS: Record<number, [number, number][]> = {
  1: [[10, 10]],
  2: [
    [5.5, 5.5],
    [14.5, 14.5],
  ],
  3: [
    [5.5, 5.5],
    [10, 10],
    [14.5, 14.5],
  ],
  4: [
    [5.5, 5.5],
    [14.5, 5.5],
    [5.5, 14.5],
    [14.5, 14.5],
  ],
  5: [
    [5.5, 5.5],
    [14.5, 5.5],
    [10, 10],
    [5.5, 14.5],
    [14.5, 14.5],
  ],
  6: [
    [5.5, 5],
    [14.5, 5],
    [5.5, 10],
    [14.5, 10],
    [5.5, 15],
    [14.5, 15],
  ],
};

// A die, face up. A one is wild, so its pip is bigger and in the accent; `hit` lights a die
// that counts for the face in question.
export function Die({ face, hit = false }: { face: number; hit?: boolean }) {
  return (
    <svg className={hit ? 'die hit' : 'die'} viewBox="0 0 20 20" role="img" aria-label={String(face)}>
      <rect x="1" y="1" width="18" height="18" rx="4" />
      {PIPS[face]?.map(([x, y]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={face === 1 ? 3.4 : 1.9}
          className={face === 1 ? 'wild' : undefined}
        />
      ))}
    </svg>
  );
}

// A leather cup, mouth down over someone's dice.
function Cup() {
  return (
    <svg className="cup" viewBox="0 0 28 26" aria-hidden="true">
      <path d="M5 23 L8.5 4 Q14 1.5 19.5 4 L23 23 Z" />
      <path d="M3 23.5 H25" />
    </svg>
  );
}

// Your cup, lifted: your dice, the ones that count lit.
function YourCup({ dice, hit }: { dice: readonly number[]; hit: (d: number) => boolean }) {
  return (
    <div className="p-you">
      <span>Your cup</span>
      <span className="dice" aria-label="Your cup">
        {sorted(dice).map((d, k) => (
          <Die key={k} face={d} hit={hit(d)} />
        ))}
      </span>
    </div>
  );
}

const nameOf = (w: string) => (w === YOU ? 'You' : (PEOPLE[w]?.name ?? w));
const diceWords = (n: number) => `${inWords(n)} ${n === 1 ? 'die' : 'dice'}`;
// Ones first: they count for every face.
const sorted = (dice: readonly number[]) => [...dice].sort((a, b) => a - b);

export function PerudoBody({ game, s }: { game: Game; s: GameState }) {
  const t = s.table!;
  const ref = useRef<HTMLDivElement>(null);
  const sh = t.shown;
  // A move changes what's live: put focus on the table's first button again, for keys and pads.
  const moment = `${t.game}-${t.round}-${t.said.length}-${sh ? 1 : 0}-${t.over ?? ''}`;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el.contains(document.activeElement)) return;
    el.querySelector<HTMLButtonElement>('button.opt:not(:disabled)')?.focus({ preventScroll: true });
  }, [moment]);
  const all = inPlay(t);
  const cups = sh ? sh.cups : t.seats.map((p) => p.dice);
  const counts = (d: number) => !!sh && (d === sh.face || d === 1);
  const yourTurn = !sh && !t.over && t.turn === 0;
  // A game ends on a call, so once it's over the cups are up, and the call's lines say who took it.
  const status = sh
    ? 'The cups come up.'
    : t.bid
      ? `${nameOf(t.seats[t.bid.by]!.who)} bids ${bidWords(t.bid.n, t.bid.face)}. ${upper(inWords(all))} dice under the cups.`
      : `${upper(inWords(all))} dice under the cups, and it’s yours to open.`;
  const why = t.over ? gameBlocked(s, 'dice') : null;
  const opener = sh ? (t.seats[sh.loser]!.dice.length ? sh.loser : nextSeat(t, sh.loser)) : 0;
  return (
    <div className="perudo" id="perudo" ref={ref}>
      <h3 id="sheet-title">Liar’s dice</h3>
      <p className="sub">{status}</p>
      <ul className="p-others">
        {t.seats.map((p, i) =>
          i === 0 ? null : (
            <li
              key={p.who}
              className="p-seat"
              data-out={!p.dice.length && !(sh && sh.cups[i]!.length)}
              data-lost={!!sh && sh.loser === i}
            >
              <span>{nameOf(p.who)}</span>
              {sh ? (
                <span className="dice" aria-label={`${nameOf(p.who)}’s cup`}>
                  {sorted(cups[i]!).map((d, k) => (
                    <Die key={k} face={d} hit={counts(d)} />
                  ))}
                </span>
              ) : p.dice.length ? (
                <Cup />
              ) : null}
              <small>{p.dice.length ? diceWords(p.dice.length) : 'Out'}</small>
            </li>
          ),
        )}
      </ul>
      {t.said.length > 0 && (
        <ol className="p-said" aria-label="This round’s bids">
          {t.said.map((b, k) => (
            <li key={k}>
              {nameOf(t.seats[b.by]!.who)}: {bidWords(b.n, b.face)}
            </li>
          ))}
        </ol>
      )}
      {!yourTurn && <YourCup dice={cups[0]!} hit={counts} />}
      {sh &&
        callLines(t).map((l) => (
          <p className="note" key={l}>
            {l}
          </p>
        ))}
      {yourTurn ? (
        <YourBid key={moment} game={game} t={t} />
      ) : t.over ? (
        <ul>
          <li>
            <button
              type="button"
              className="opt"
              id="p-again"
              disabled={!!why}
              onClick={() => game.dice('again')}
            >
              <span>Another game</span>
              <span className="c">{costLabel({ min: GAMES.dice.min, energy: -GAMES.energy })}</span>
              <small>
                {why ? `${why}.` : `${upper(diceWords(GAMES.dice.n))} each again, everyone back in.`}
              </small>
            </button>
          </li>
        </ul>
      ) : sh ? (
        <ul>
          <li>
            <button type="button" className="opt" id="p-next" onClick={() => game.dice('next')}>
              <span>{fireOut(s) ? 'Put the cups away' : 'Next round'}</span>
              <span className="c">{fireOut(s) ? '' : costLabel({ min: GAMES.dice.min })}</span>
              <small>
                {fireOut(s)
                  ? PERUDO.late
                  : opener === 0
                    ? 'You open it.'
                    : `${nameOf(t.seats[opener]!.who)} opens it.`}
              </small>
            </button>
          </li>
        </ul>
      ) : null}
      <ul>
        <li>
          <button type="button" className="opt" id="p-up" onClick={() => game.dice('leave')}>
            <span>Get up</span>
            <small>
              {t.over || !t.seats[0]!.dice.length ? 'Back to the fire.' : 'They’ll play on without you.'}
            </small>
          </button>
        </li>
      </ul>
      {t.seats.slice(1).map((p) =>
        PERUDO_STYLES[p.who] ? (
          <p className="sub" key={p.who}>
            {PERUDO_STYLES[p.who]!.read}
          </p>
        ) : null,
      )}
      <p className="sub">{fill(PERUDO.rules, { dice: upper(inWords(GAMES.dice.n)) })}</p>
    </div>
  );
}

// Your turn: a count and a face, started on the face you hold most of (ones count), at what
// you can see to open or the least that beats the bid on the table; your dice that count for
// the face picked lit. Or call it.
function YourBid({ game, t }: { game: Game; t: DiceTable }) {
  const all = inPlay(t);
  const mine = t.seats[0]!.dice;
  const best = [...FACES].sort((a, b) => inCup(mine, b) - inCup(mine, a) || b - a)[0]!;
  const start = t.bid ? least(t.bid, best) : Math.max(1, inCup(mine, best));
  const [face, setFace] = useState(best);
  const [n, setN] = useState(Math.min(all, start));
  const lo = least(t.bid, face);
  const ok = n >= lo && n <= all;
  const own = inCup(mine, face);
  const pick = (f: number) => {
    setFace(f);
    setN((x) => Math.min(all, Math.max(x, least(t.bid, f))));
  };
  return (
    <>
      <YourCup dice={mine} hit={(d) => d === face || d === 1} />
      <div className="p-pick">
        <div className="p-n">
          <button
            type="button"
            className="step"
            id="p-less"
            aria-label="One fewer"
            disabled={n <= lo}
            onClick={() => setN(n - 1)}
          >
            −
          </button>
          <span className="p-count" aria-live="polite">
            {n}
          </span>
          <button
            type="button"
            className="step"
            id="p-more"
            aria-label="One more"
            disabled={n >= all}
            onClick={() => setN(n + 1)}
          >
            +
          </button>
        </div>
        <div className="p-faces" role="radiogroup" aria-label="Which face">
          {FACES.map((f) => (
            <button
              key={f}
              type="button"
              className="p-face"
              id={`p-face-${f}`}
              role="radio"
              aria-checked={f === face}
              disabled={least(t.bid, f) > all}
              onClick={() => pick(f)}
            >
              <Die face={f} hit={f === face} />
            </button>
          ))}
        </div>
      </div>
      <ul>
        <li>
          <button
            type="button"
            className="opt"
            id="p-bid"
            disabled={!ok}
            onClick={() => game.dice('bid', { n, face })}
          >
            <span>Bid {bidWords(n, face)}</span>
            <span className="c" />
            <small>
              {upper(inWords(own))} in your cup, and {diceWords(all - mine.length)} you can’t see.
            </small>
          </button>
        </li>
        <li>
          <button
            type="button"
            className="opt"
            id="p-call"
            disabled={!t.bid}
            onClick={() => game.dice('call')}
          >
            <span>Call it a lie</span>
            <small>
              {t.bid
                ? `You’re right if there are fewer than ${bidWords(t.bid.n, t.bid.face)} under all the cups.`
                : 'Nothing’s been bid yet.'}
            </small>
          </button>
        </li>
      </ul>
    </>
  );
}
