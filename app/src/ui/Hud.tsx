import { clock, gradeOf, money } from '../sim';
import type { Game, Ui } from '../game/game';
import { vars } from './vars';

// Day and time (tap for the forecast), money, your body (tap for your journal), and the
// one navigation button. A screen with room for it gets the journal its own button too.
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
        aria-label={`V${gradeOf(ui.state.climber.skills)}. Energy ${Math.round(energy)}, skin ${Math.round(skin)}, food ${Math.round(fed)}. Your journal.`}
        onClick={() => game.openSheet({ k: 'journal', page: 'you' })}
      >
        <Meter name="Energy" id="m-en" v={energy} />
        <Meter name="Skin" id="m-sk" v={skin} />
        <Meter name="Food" id="m-fd" v={fed} />
      </button>
      {ui.w >= JOURNAL_BUTTON && (
        <button
          type="button"
          className="pill"
          id="h-journal"
          disabled={busy}
          onClick={() => game.openSheet({ k: 'journal', page: 'lately' })}
        >
          Journal
        </button>
      )}
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

// How wide the screen must be before the journal gets a button of its own. A portrait
// HUD has about 55 px to spare, and the word doesn't fit.
const JOURNAL_BUTTON = 480;

function Meter({ name, id, v }: { name: string; id: string; v: number }) {
  return (
    <span aria-hidden="true">
      {name}
      <i id={id} className={v < 25 ? 'low' : undefined} style={vars({ '--v': (v / 100).toFixed(2) })} />
    </span>
  );
}
