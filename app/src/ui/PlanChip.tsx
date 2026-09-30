import { PLACES } from '../sim';
import type { Game, Ui } from '../game/game';
import { stepLabel } from '../game/plan';

// A plan being run, where you can see it: the step it's on, "Go on" once you've done
// climbing, or why the day stopped it. The ✕ stops it, or clears the stop. It sits under
// the HUD, so a place's card (which a card-only place always has open) never hides it.
export function PlanChip({ game, ui }: { game: Game; ui: Ui }) {
  const p = ui.plan;
  if (!p || ui.climbing || ui.speed || ui.busk || ui.view === 'wall') return null;
  const step = p.steps[p.i];
  const next = p.steps[p.i + 1];
  const say = p.stopped
    ? p.stopped
    : p.waiting
      ? next
        ? `Climb, then ${next.place === step?.place ? stepLabel(next) : PLACES[next.place]?.name}`
        : 'Climb as long as you like'
      : step
        ? `${PLACES[step.place]?.name}: ${stepLabel(step)}`
        : '';
  return (
    <div className="plan-chip" id="plan-chip" role="status">
      <b>{p.stopped ? 'Plan stopped' : 'Plan'}</b>
      <span>{say}</span>
      {p.waiting && (
        <button type="button" className="plan-go" id="plan-go" onClick={() => game.goOn()}>
          Go on
        </button>
      )}
      <button
        type="button"
        className="plan-x"
        aria-label={p.stopped ? 'Dismiss' : 'Stop the plan'}
        onClick={() => game.stopPlan()}
      >
        ✕
      </button>
    </div>
  );
}
