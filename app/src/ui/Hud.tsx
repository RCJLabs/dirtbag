import { clock, money } from '../sim';
import type { Game, Ui } from '../game/game';

// Day and time, money, energy and skin, and the one navigation button.
export function Hud({ game, ui }: { game: Game; ui: Ui }) {
  const { day, min, cash, energy, skin } = ui.hud;
  const nav = game.navLabel(ui);
  return (
    <div className="hud">
      <span className="pill" id="h-time">
        Day {day} · {clock(min)}
      </span>
      <span className={`pill${cash < 0 ? ' debt' : ''}`} id="h-cash">
        {money(cash)}
      </span>
      <span
        className="pill meters"
        role="group"
        aria-label={`Energy ${Math.round(energy)}, skin ${Math.round(skin)}`}
      >
        <Meter name="Energy" id="m-en" v={energy} />
        <Meter name="Skin" id="m-sk" v={skin} />
      </span>
      {nav && (
        <button
          type="button"
          className="navb"
          id="b-nav"
          aria-label={nav === 'Down' ? 'Back down to the base' : nav}
          onClick={() => game.nav()}
        >
          {nav}
        </button>
      )}
    </div>
  );
}

function Meter({ name, id, v }: { name: string; id: string; v: number }) {
  return (
    <span aria-hidden="true">
      {name}
      <i id={id} className={v < 25 ? 'low' : undefined} style={{ ['--v' as string]: (v / 100).toFixed(2) }} />
    </span>
  );
}
