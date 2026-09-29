import { CLIMB, gradeLabel, moveAt, resting, type Attempt, type RouteDef } from '../sim';
import type { Game } from '../game/game';
import { useStore } from '../game/store';
import { VERB_TEXT } from './Sheet';
import { vars } from './vars';

// What the panel says under the pump bar, most urgent first.
function status(a: Attempt, r: RouteDef): string {
  if (a.msg) return a.msg.text;
  const v = a.crux;
  if (a.phase === 'crux' && v) {
    const crux = r.cruxes.find((c) => c.id === v.id)!;
    const how = v.verb === 'load' && v.m === 0 && !a.hold ? 'Let go, then hold to load' : VERB_TEXT[v.verb];
    const count = v.verb === 'timing' ? ` ${v.hits}/${CLIMB.timing.hits}` : '';
    return `${crux.name}, ${r.beta[v.beta]!.short}. ${how}.${count}`;
  }
  if (a.phase === 'sent') return r.disc === 'sport' ? 'Chains clipped.' : 'Topped out.';
  if (a.pump > 80) return 'Forearms are going.';
  if (!a.hold && resting(a, r) && a.pos > 0) return 'Good rest on the ledge. Shake out.';
  if (r.disc === 'boulder' && a.pos === 0 && !a.hold) return 'Hold to pull on. Let go to shake out.';
  if (a.hold) return 'Climbing.';
  if (a.pos > 0) return 'Hanging on. Hold to keep moving.';
  return 'Hold to climb. Let go to shake out.';
}

// The go in progress: pump, where you are, and the verb meter at a crux. The hold button
// is the only control; the beta you picked decides what it does at each crux.
export function ClimbPanel({ game }: { game: Game }) {
  const { att } = useStore(game.fast);
  const ui = useStore(game.ui);
  if (!att) return null;
  const r = att.def;
  const v = att.crux;
  const center = v
    ? v.verb === 'load'
      ? CLIMB.load.target
      : v.verb === 'timing'
        ? CLIMB.timing.center
        : v.c
    : 0;
  const label = !v
    ? 'Hold to climb'
    : v.verb === 'load'
      ? 'Hold to load'
      : v.verb === 'tension'
        ? 'Hold · release'
        : 'Tap';
  return (
    <div className="climb" id="climb">
      <div className="c-route">
        <span>{r.name}</span>
        <span className="g">{gradeLabel(r)}</span>
        <span className="t" id="c-go">
          Go {ui.state.routes[att.route]?.goesToday ?? 1}
        </span>
      </div>
      <div className="c-meter">
        <span>Pump</span>
        <div className="c-bar">
          <i
            id="c-pump"
            className={att.pump > 75 ? 'hot' : undefined}
            style={vars({ '--w': `${att.pump.toFixed(1)}%` })}
          />
        </div>
        <span id="c-move">
          Move {moveAt(att, r)}/{r.moves}
        </span>
      </div>
      <p className="c-status" id="c-status" aria-live="polite">
        {status(att, r)}
      </p>
      {v && (
        <div
          className="verb"
          id="verb"
          data-verb={v.verb}
          data-m={v.m.toFixed(3)}
          data-c={center.toFixed(3)}
          data-w={v.w.toFixed(3)}
        >
          <div
            className="fill"
            id="v-fill"
            style={vars({ '--w': v.verb === 'load' ? `${(v.m * 100).toFixed(1)}%` : '0%' })}
          />
          <div
            className="band"
            id="v-band"
            style={vars({
              '--l': `${((center - v.w) * 100).toFixed(1)}%`,
              '--w': `${(v.w * 200).toFixed(1)}%`,
            })}
          />
          <div className="mk" id="v-mk" style={vars({ '--l': `${(v.m * 100).toFixed(1)}%` })} />
        </div>
      )}
      <button
        type="button"
        className="hold"
        id="hold"
        data-on={att.hold ? '1' : '0'}
        onPointerDown={(e) => {
          e.preventDefault();
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Some pointers can't be captured; the up event still arrives on the button.
          }
          game.press(true);
        }}
        onPointerUp={() => game.press(false)}
        onPointerCancel={() => game.press(false)}
        onLostPointerCapture={() => game.press(false)}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault();
            e.stopPropagation();
            game.press(true);
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            game.press(false);
          }
        }}
      >
        {label}
      </button>
    </div>
  );
}
