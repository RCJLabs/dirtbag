import { BUSK } from '../sim';
import type { Game } from '../game/game';
import { useStore } from '../game/store';
import { vars } from './vars';

// A set outside the café (Phase 22.5b): a marker crosses the bar, and you strum as it
// crosses the band in the middle. Eight chords. The button, Space or Enter strums.
export function BuskPanel({ game }: { game: Game }) {
  const ui = useStore(game.ui);
  const u = ui.busk;
  if (!u) return null;
  const done = u.phase === 'done';
  const hits = u.scores.filter((x) => x === 1).length;
  return (
    <div className="climb busk" id="busk">
      <div className="c-route">
        <span>Outside the Coffee Shop</span>
        <span id="b-count">
          {Math.min(u.scores.length + (done ? 0 : 1), BUSK.notes)}/{BUSK.notes}
        </span>
      </div>
      <div className="c-meter">
        <span>Chord</span>
        <div className="c-bar beat">
          <b className="band" />
          {!done && <i className="mark" style={vars({ '--x': `${(100 * u.pos).toFixed(1)}%` })} />}
        </div>
        <span id="b-hits">{hits} clean</span>
      </div>
      <p className="c-status" id="b-status" aria-live="polite">
        {done ? (u.said ?? 'That’s the set.') : 'Strum as it crosses the middle.'}
      </p>
      <div className="hands">
        {done ? (
          <button type="button" className="opt" id="b-done" onClick={() => game.buskDone()}>
            <span>Pack up</span>
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
            Strum
          </button>
        )}
      </div>
    </div>
  );
}
