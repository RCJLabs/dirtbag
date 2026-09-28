import { useLayoutEffect, useRef } from 'react';
import { fill, goesToday, holds, PEOPLE, TALK } from '../sim';
import type { Game } from '../game/game';
import { useStore } from '../game/store';
import { HEAD_Y, OY, SPOTS, W, Z } from '../view/layout';

// A speech bubble with a tail, pinned over the speaker's head as the camera moves.
export function Bubble({ game, talk, node }: { game: Game; talk: string; node: string }) {
  const { cam } = useStore(game.fast);
  const ui = useStore(game.ui);
  const ref = useRef<HTMLDivElement>(null);
  const def = TALK[talk];
  const n = def?.nodes[node];
  const spot = SPOTS[ui.scene]?.find((p) => p.talk === talk);
  const anchor = spot && { wx: spot.x, wy: HEAD_Y };

  useLayoutEffect(() => {
    const b = ref.current;
    if (!b || !anchor) return;
    const sx = (anchor.wx - cam) * Z;
    const w = b.offsetWidth;
    const h = b.offsetHeight;
    const left = Math.min(Math.max(sx - w / 2, 8), W - 8 - w);
    b.style.left = `${left}px`;
    b.style.top = `${Math.max(66, anchor.wy * Z + OY - h - 16)}px`;
    b.style.setProperty('--tx', `${Math.min(Math.max(sx - left - 7, 16), w - 30)}px`);
  });

  // Focus the first choice when a conversation opens, so keyboard players can answer.
  useLayoutEffect(() => {
    ref.current?.querySelector('button')?.focus({ preventScroll: true });
  }, [node]);

  if (!def || !n) return null;
  const opts = n.opts.map((o, i) => ({ o, i })).filter(({ o }) => !o.when || holds(ui.state, o.when));
  return (
    <div className="bubble" id="bubble" role="dialog" aria-live="polite" ref={ref}>
      <p className="who">{PEOPLE[def.who]?.name}</p>
      <p>{fill(n.text, { goes: goesToday(ui.state), name: ui.state.climber.name })}</p>
      {opts.length > 0 && (
        <div className="acts">
          {opts.map(({ o, i }) => (
            <button
              type="button"
              key={i}
              className={o.primary ? 'pri' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                game.say(i);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
