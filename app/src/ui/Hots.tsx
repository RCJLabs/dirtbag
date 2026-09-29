import { PLACES } from '../sim';
import type { Game, Ui } from '../game/game';
import { useStore } from '../game/store';
import { MAP_PINS, OY, Z } from '../view/layout';
import { mapLeft } from '../view/render';
import { hotLabel } from './hots';

// Pins are this wide on the map, in logical pixels, with room for a finger round them.
const PIN = 32;

// The things in the scene and the pins on the map, as buttons: invisible, and passed
// through by a pointer (the canvas takes taps), but a keyboard can Tab to each one and see
// the ring, and a screen reader can say what it is. Only what's on screen gets one; walk
// with the arrow keys to bring more into view.
export function Hots({ game, ui }: { game: Game; ui: Ui }) {
  const { cam } = useStore(game.fast);
  if (!ui.state.climber.name || ui.sheet || ui.talk || ui.climbing || ui.driving) return null;
  if (ui.view === 'scene')
    return (
      <>
        {game.hotsHere().map((h) => {
          const x0 = Math.max(0, (h.x0 - cam) * Z);
          const x1 = Math.min(ui.w, (h.x1 - cam) * Z);
          if (x1 - x0 < 8) return null;
          return (
            <button
              type="button"
              key={JSON.stringify(h.use)}
              className="hot"
              aria-label={hotLabel(ui.state, h)}
              style={box(x0, h.y0 * Z + OY, x1 - x0, (h.y1 - h.y0) * Z)}
              onClick={() => game.useHot(h)}
            />
          );
        })}
      </>
    );
  if (ui.view === 'map') {
    const left = mapLeft(ui.w);
    return (
      <>
        {Object.entries(MAP_PINS).map(([id, p]) => (
          <button
            type="button"
            key={id}
            className="hot pin"
            id={`pin-${id}`}
            aria-label={`${PLACES[id]?.name ?? id}${ui.state.at === id ? ', where you are' : ''}`}
            style={box(left + p.x - PIN / 2, p.y - PIN / 2, PIN, PIN)}
            onClick={() => game.openPin(id)}
          />
        ))}
      </>
    );
  }
  return null;
}

// Where a button sits, as the layout's variables: geometry from the canvas, not styling.
const box = (x: number, y: number, w: number, h: number) =>
  ({
    '--x': `${x.toFixed(1)}px`,
    '--y': `${y.toFixed(1)}px`,
    '--bw': `${w.toFixed(1)}px`,
    '--bh': `${h.toFixed(1)}px`,
  }) as React.CSSProperties;
