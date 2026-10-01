import { BUSK, GAMES } from '../sim';
import type { Game } from '../game/game';
import { useStore } from '../game/store';
import { vars } from './vars';

// A set outside the café (Phase 22.5b): a marker crosses the bar, and you strum as it
// crosses the band in the middle. Eight chords. The button, Space or Enter strums. The same
// beat throws horseshoes at the fire (Phase 22.9a): four throws, a ringer in the band.
export function BuskPanel({ game }: { game: Game }) {
  const ui = useStore(game.ui);
  const u = ui.busk;
  if (!u) return null;
  const done = u.phase === 'done';
  const hits = u.scores.filter((x) => x === 1).length;
  const shoes = u.kind === 'shoes';
  const of = shoes ? GAMES.shoes.throws : BUSK.notes;
  return (
    <div className="climb busk" id="busk">
      <div className="c-route">
        <span>{shoes ? 'Horseshoes at the fire' : 'Outside the Coffee Shop'}</span>
        <span id="b-count">
          {Math.min(u.scores.length + (done ? 0 : 1), of)}/{of}
        </span>
      </div>
      <div className="c-meter">
        <span>{shoes ? 'Throw' : 'Chord'}</span>
        <div className="c-bar beat">
          <b className="band" />
          {!done && <i className="mark" style={vars({ '--x': `${(100 * u.pos).toFixed(1)}%` })} />}
        </div>
        <span id="b-hits">
          {hits} {shoes ? (hits === 1 ? 'ringer' : 'ringers') : 'clean'}
        </span>
      </div>
      <p className="c-status" id="b-status" aria-live="polite">
        {done
          ? (u.said ?? (shoes ? 'That’s the game.' : 'That’s the set.'))
          : shoes
            ? 'Throw as it crosses the middle.'
            : 'Strum as it crosses the middle.'}
      </p>
      <div className="hands">
        {done ? (
          <button type="button" className="opt" id="b-done" onClick={() => game.buskDone()}>
            <span>{shoes ? 'Back to the fire' : 'Pack up'}</span>
            <span className="c" />
          </button>
        ) : (
          <button
            type="button"
            className="hold"
            id="b-strum"
            onPointerDown={(e) => {
              e.preventDefault();
              game.buskTap();
            }}
          >
            {shoes ? 'Throw' : 'Strum'}
          </button>
        )}
      </div>
    </div>
  );
}
