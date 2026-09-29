import { clock, gradeOf, money } from '../sim';
import type { Game, Ui } from '../game/game';

// Day and time (tap for the forecast), money, your body (tap for you as a climber), and the
// one navigation button.
export function Hud({ game, ui }: { game: Game; ui: Ui }) {
  const { day, min, cash, energy, skin, fed } = ui.hud;
  // Nothing to navigate until you've made your climber.
  const made = !!ui.state.climber.name;
  const nav = made ? game.navLabel(ui) : null;
  const busy = ui.climbing || ui.driving || !made;
  return (
    <div className="hud">
      <button
        type="button"
        className="pill"
        id="h-time"
        disabled={busy}
        aria-label={`Day ${day}, ${clock(min)}. The forecast.`}
        onClick={() => game.openSheet({ k: 'week' })}
      >
        Day {day} · {clock(min)}
      </button>
      <span className={`pill${cash < 0 ? ' debt' : ''}`} id="h-cash">
        {money(cash)}
      </span>
      <button
        type="button"
        className="pill meters"
        id="h-you"
        disabled={busy}
        aria-label={`V${gradeOf(ui.state.climber.skills)}. Energy ${Math.round(energy)}, skin ${Math.round(skin)}, food ${Math.round(fed)}.`}
        onClick={() => game.openSheet({ k: 'you' })}
      >
        <Meter name="Energy" id="m-en" v={energy} />
        <Meter name="Skin" id="m-sk" v={skin} />
        <Meter name="Food" id="m-fd" v={fed} />
      </button>
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
