import { SPEED } from '../sim';
import type { Game } from '../game/game';
import { useStore } from '../game/store';
import { vars } from './vars';

// A run on the speed wall: three lights, then a hand at a time up the lane. Two buttons,
// or F and J: alternate them. The same hand twice and you slip; a grab before the green
// light is a false start.
export function SpeedPanel({ game }: { game: Game }) {
  const ui = useStore(game.ui);
  const u = ui.speed;
  if (!u) return null;
  const done = u.phase === 'done';
  const say = done
    ? u.time === null
      ? 'False start. The lights hadn’t gone green.'
      : u.newPb
        ? `${u.time.toFixed(2)} s. A PB.`
        : `${u.time.toFixed(2)} s. Your best is ${u.pb?.toFixed(2) ?? '—'}.`
    : u.phase === 'set'
      ? 'Wait for the green.'
      : u.slips
        ? `Go. ${u.slips} slip${u.slips > 1 ? 's' : ''}.`
        : 'Go.';
  return (
    <div className="climb speed" id="speed">
      <div className="c-route">
        <span>The speed wall</span>
        <span className="lights" aria-label={`${u.lights} of 3 lights`}>
          {[1, 2, 3].map((n) => (
            <i key={n} className={u.lights >= n ? (n === 3 ? 'green' : 'on') : undefined} />
          ))}
        </span>
      </div>
      <div className="c-meter">
        <span>Holds</span>
        <div className="c-bar">
          <i style={vars({ '--w': `${((100 * u.holds) / SPEED.holds).toFixed(1)}%` })} />
        </div>
        <span id="s-holds">
          {u.holds}/{SPEED.holds}
        </span>
      </div>
      <p className="c-status" id="s-status" aria-live="polite">
        {say}
      </p>
      {done ? (
        <div className="hands">
          <button type="button" className="opt" id="s-again" onClick={() => game.speedStart()}>
            <span>Again</span>
            <span className="c" />
          </button>
          <button type="button" className="opt" id="s-done" onClick={() => game.speedDone()}>
            <span>Done</span>
            <span className="c" />
          </button>
        </div>
      ) : (
        <div className="hands">
          {(['Left', 'Right'] as const).map((h, i) => (
            <button
              type="button"
              key={h}
              className="hold"
              id={`s-${h.toLowerCase()}`}
              onPointerDown={(e) => {
                e.preventDefault();
                game.speedGrab(i as 0 | 1);
              }}
            >
              {h}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
