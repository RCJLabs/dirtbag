import { currentGoal, goalDesc, progress } from '../sim';
import type { Game, Ui } from '../game/game';

// The act's next goal, where you can always see it (Phase 7: a new player can say what they
// want to do next). Tap it for the whole of it on the You sheet.
export function Goal({ game, ui }: { game: Game; ui: Ui }) {
  const g = currentGoal(ui.state);
  if (
    !g ||
    !ui.state.climber.name ||
    ui.sheet ||
    ui.talk ||
    ui.climbing ||
    ui.speed ||
    ui.busk ||
    ui.driving ||
    ui.view === 'wall'
  )
    return null;
  const p = progress(ui.state, g.aim);
  const counted = p.need > 1 && !('cash' in g.aim) && !('grade' in g.aim) && !('regular' in g.aim);
  return (
    <button
      type="button"
      className="goal"
      id="goal"
      onClick={() => game.openSheet({ k: 'journal', page: 'you' })}
    >
      <b>Next</b>
      {goalDesc(g)}
      {counted && (
        <span>
          {Math.min(p.have, p.need)}/{p.need}
        </span>
      )}
    </button>
  );
}
