import { Fragment, useLayoutEffect, useRef } from 'react';
import {
  bodyNote,
  CLIMB,
  costLabel,
  goBlocked,
  knowsBeta,
  picks,
  ROUTES,
  type GameState,
  type Verb,
} from '../sim';
import type { Game, SheetId } from '../game/game';
import { buildSheet } from './sheets';

export const VERB_TEXT: Record<Verb, string> = {
  load: 'Hold to load, let go in the band',
  tension: 'Hold and release to stay in the band',
  timing: 'Tap when the marker crosses the band',
};

// How a window width reads on the beta card: one to three bars.
const winBars = (w: number) => (w >= 0.15 ? 3 : w >= 0.1 ? 2 : 1);

export function Sheet({ game, id, state }: { game: Game; id: SheetId; state: GameState }) {
  const ref = useRef<HTMLDivElement>(null);
  const kind = id.k === 'place' ? `place:${id.id}` : id.k;
  // A new sheet starts at the top with its first live button focused, for keyboards.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = 0;
    el.querySelector<HTMLButtonElement>(
      'button.opt:not(:disabled), button.beta[aria-checked="true"], button.go',
    )?.focus({
      preventScroll: true,
    });
  }, [kind]);
  if (id.k === 'beta')
    return (
      <div className="sheet" id="sheet" role="dialog" aria-labelledby="sheet-title" ref={ref}>
        <BetaBody game={game} route={id.route} s={state} />
      </div>
    );
  const spec = buildSheet(game, id, state);
  if (!spec) return null;
  return (
    <div className="sheet" id="sheet" role="dialog" aria-labelledby="sheet-title" ref={ref}>
      {spec.close && (
        <button type="button" className="x" aria-label="Close" onClick={() => game.closeSheet()}>
          ✕
        </button>
      )}
      <h3 id="sheet-title">{spec.title}</h3>
      {spec.sub && <p className="sub">{spec.sub}</p>}
      {spec.notes?.map((n) => (
        <p className="note" key={n}>
          {n}
        </p>
      ))}
      <ul>
        {spec.rows.map((r) => (
          <li key={r.label}>
            <button type="button" className="opt" disabled={r.off} onClick={r.run}>
              <span>{r.label}</span>
              <span className="c">{r.cost ?? ''}</span>
              {r.note && <small>{r.note}</small>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Pick your beta for each crux, then tie in. Beta you haven't earned shows as a locked card
// with a hint about where to find it.
function BetaBody({ game, route, s }: { game: Game; route: string; s: GameState }) {
  const r = ROUTES[route]!;
  const pick = picks(s, route);
  const goes = s.routes[route]?.goesToday ?? 0;
  const why = goBlocked(s);
  const grease = s.min >= CLIMB.greaseFrom;
  const cost =
    `${costLabel({ min: CLIMB.goMin })} · ${bodyNote({ energy: -CLIMB.goEnergy, skin: -CLIMB.goSkin })}` +
    (grease ? ' · sun on the wall, smaller windows' : '');
  return (
    <>
      <button type="button" className="x" aria-label="Close" onClick={() => game.closeSheet()}>
        ✕
      </button>
      <h3 id="sheet-title">
        {r.name} · {r.grade}
      </h3>
      <p className="sub">
        {r.line} {goes ? `Go ${goes + 1} today.` : 'First go today.'} Tap the wall to reopen this.
      </p>
      {r.cruxes.map((c, n) => (
        <Fragment key={c.id}>
          <p className="crux">
            Crux {n + 1} · moves {Math.floor(c.from) + 1}–{Math.floor(c.to) + 1} · {c.name}
          </p>
          <div role="radiogroup" aria-label={c.name}>
            {c.beta.map((id) => {
              const B = r.beta[id]!;
              const known = knowsBeta(s, route, c.id, id);
              const on = known && pick[c.id] === id;
              const bars = winBars(B.w);
              return (
                <button
                  type="button"
                  key={id}
                  className={`beta${known ? '' : ' locked'}`}
                  role="radio"
                  aria-checked={on}
                  disabled={!known}
                  onClick={() => game.pick(route, c.id, id)}
                >
                  <span className="dot" />
                  <span>{known ? B.name : 'Another way?'}</span>
                  <span className="win" aria-label={known ? `Window ${bars} of 3` : 'Window unknown'}>
                    {[0, 1, 2].map((i) => (
                      <i key={i} className={known && i < bars ? 'on' : undefined} />
                    ))}
                  </span>
                  <small>{known ? `${VERB_TEXT[B.verb]}. ${B.note}` : B.hint}</small>
                </button>
              );
            })}
          </div>
        </Fragment>
      ))}
      <button type="button" className="go" disabled={!!why} onClick={() => game.go()}>
        {why ?? 'Tie in and go'}
        <small>{cost}</small>
      </button>
    </>
  );
}
