import { useEffect } from 'react';
import { BELAY, PEOPLE, ROUTES } from '../sim';
import type { Game } from '../game/game';
import { useStore } from '../game/store';
import { PadHint } from './PadHint';
import { vars } from './vars';

// Phase 42: on belay. Their height up the line; the rope's slack on a meter, with the band to
// keep it in; what they're doing; and your hand: hold to take in, let go to pay out, and on the
// fall, brake, then give as it comes tight. Space, Enter or A is the hand too.
const SAY = {
  climb: 'Climbing. Keep the slack in the band: hold to take in, let go to pay out.',
  clip: 'Clipping. Let the rope run.',
  fall: 'Falling! Brake, then give as it comes tight.',
};

const pc = (x: number) => `${(100 * x).toFixed(1)}%`;

export function BelayPanel({ game }: { game: Game }) {
  const ui = useStore(game.ui);
  const u = ui.belay;
  const done = u?.rope.phase === 'caught';
  // When it's over, focus lands on the way out, so A or Enter takes it.
  useEffect(() => {
    if (done) document.getElementById('belay-done')?.focus({ preventScroll: true });
  }, [done]);
  if (!u) return null;
  const r = u.rope;
  const name = PEOPLE[r.who]?.name ?? r.who;
  const [lo, hi] = BELAY.band;
  const press = (on: boolean) => game.belayPress(on);
  return (
    <div className="climb busk belay" id="belay">
      <div className="c-route">
        <span>On belay: {name}</span>
        <span className="t">{ROUTES[r.route]?.name}</span>
      </div>
      <div className="c-meter">
        <span>Up</span>
        <div className="c-bar">
          <i style={vars({ '--w': pc(Math.min(1, r.pos)) })} />
        </div>
        <span />
      </div>
      <div className="c-meter">
        <span>Slack</span>
        <div className="c-bar rope" id="rope" data-phase={r.phase} data-slack={r.slack.toFixed(3)}>
          <b className="band" style={vars({ '--l': pc(lo), '--w': pc(hi - lo) })} />
          <i className="mark" style={vars({ '--x': pc(r.slack) })} />
        </div>
        <span />
      </div>
      <p className="c-status" id="belay-status" aria-live="polite">
        {done ? (u.said ?? (r.soft ? 'A soft catch.' : 'A hard catch.')) : SAY[r.phase as keyof typeof SAY]}
      </p>
      <div className="hands">
        {done ? (
          <button type="button" className="opt" id="belay-done" onClick={() => game.belayDone()}>
            <span>Done</span>
            <span className="c" />
          </button>
        ) : (
          <button
            type="button"
            className="hold"
            id="belay-hold"
            data-on={r.hold ? '1' : '0'}
            onPointerDown={(e) => {
              e.preventDefault();
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Some pointers can't be captured; the up event still arrives on the button.
              }
              press(true);
            }}
            onPointerUp={() => press(false)}
            onPointerCancel={() => press(false)}
            onLostPointerCapture={() => press(false)}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                e.preventDefault();
                e.stopPropagation();
                press(true);
              }
            }}
            onKeyUp={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                press(false);
              }
            }}
          >
            {r.phase === 'fall' ? 'Brake' : 'Take in'}
            <PadHint b="a" binds={ui.settings.binds.pad} />
          </button>
        )}
      </div>
    </div>
  );
}
