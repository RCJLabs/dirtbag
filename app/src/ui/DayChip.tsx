import { DAY_SAYS, dayResult, lineName, routeOfId } from '../sim';
import type { Game, Ui } from '../game/game';

// Phase 45: over the scene on the problem of the day, in place of "What now?" and the goal:
// the day's line and how it's going. Tapped, the day's sheet.
export function DayChip({ game, ui }: { game: Game; ui: Ui }) {
  const r = game.dayLine ? routeOfId(ui.state, game.dayLine) : undefined;
  if (!r || ui.sheet || ui.talk || ui.climbing || ui.view === 'wall') return null;
  const res = dayResult(ui.state, r.id);
  const how = res.sent
    ? `sent, go ${res.goes}`
    : res.goes
      ? `${res.goes} go${res.goes === 1 ? '' : 'es'}, move ${res.hi} of ${res.moves}`
      : 'no goes yet';
  return (
    <button type="button" className="goal" id="day-chip" onClick={() => game.openSheet({ k: 'day' })}>
      <b>{DAY_SAYS.chip}</b>
      {lineName(ui.state, r)}: {how}
    </button>
  );
}
