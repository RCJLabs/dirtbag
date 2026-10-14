import { BUSK, COOK, GAMES, RECIPES } from '../sim';
import type { Game } from '../game/game';
import { useStore } from '../game/store';
import { vars } from './vars';

// A set outside the café (Phase 22.5b): a marker crosses the bar, and you strum as it
// crosses the band in the middle. Eight chords. The button, Space or Enter strums. The same
// beat throws horseshoes at the fire (Phase 22.9a), four throws, a ringer in the band; and
// (Phase 29.4) stirs a recipe at the van's stove, or skips it for a plain meal.
const WORDS = {
  busk: {
    title: () => 'Outside the Coffee Shop',
    beat: 'Chord',
    hit: (n: number) => `${n} clean`,
    how: 'Strum as it crosses the middle.',
    done: 'That’s the set.',
    tap: 'Strum',
    back: 'Pack up',
  },
  shoes: {
    title: () => 'Horseshoes at the fire',
    beat: 'Throw',
    hit: (n: number) => `${n} ${n === 1 ? 'ringer' : 'ringers'}`,
    how: 'Throw as it crosses the middle.',
    done: 'That’s the game.',
    tap: 'Throw',
    back: 'Back to the fire',
  },
  cook: {
    title: (recipe?: string) => `At the stove: ${RECIPES[recipe?.split('.')[1] ?? '']?.name ?? 'dinner'}`,
    beat: 'Stir',
    hit: (n: number) => `${n} on time`,
    how: 'Stir as it crosses the middle.',
    done: 'That’s dinner.',
    tap: 'Stir',
    back: 'Eat',
  },
};

export function BuskPanel({ game }: { game: Game }) {
  const ui = useStore(game.ui);
  const u = ui.busk;
  if (!u) return null;
  const done = u.phase === 'done';
  const hits = u.scores.filter((x) => x === 1).length;
  const w = WORDS[u.kind];
  const of = u.kind === 'shoes' ? GAMES.shoes.throws : u.kind === 'cook' ? COOK.beats : BUSK.notes;
  return (
    <div className="climb busk" id="busk">
      <div className="c-route">
        <span>{w.title(u.recipe)}</span>
        <span id="b-count">
          {Math.min(u.scores.length + (done ? 0 : 1), of)}/{of}
        </span>
      </div>
      <div className="c-meter">
        <span>{w.beat}</span>
        <div className="c-bar beat">
          <b className="band" />
          {!done && <i className="mark" style={vars({ '--x': `${(100 * u.pos).toFixed(1)}%` })} />}
        </div>
        <span id="b-hits">{w.hit(hits)}</span>
      </div>
      <p className="c-status" id="b-status" aria-live="polite">
        {done ? (u.said ?? w.done) : w.how}
      </p>
      <div className="hands">
        {done ? (
          <button type="button" className="opt" id="b-done" onClick={() => game.buskDone()}>
            <span>{w.back}</span>
            <span className="c" />
          </button>
        ) : (
          <>
            <button
              type="button"
              className="hold"
              id="b-strum"
              onPointerDown={(e) => {
                e.preventDefault();
                game.buskTap();
              }}
            >
              {w.tap}
            </button>
            {u.kind === 'cook' && u.scores.length === 0 && (
              <button type="button" className="opt" id="b-skip" onClick={() => game.cookSkip()}>
                <span>Just eat it</span>
                <span className="c" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
