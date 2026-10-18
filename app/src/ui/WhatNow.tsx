import { WHAT_NOW, whatNowLit } from '../sim';
import type { Game, Ui } from '../game/game';

// Phase 40: "What now?", over the goal chip: Hazel's three moves. Through Act I it's lit each
// morning till you ask; after that it waits to be asked.
export function WhatNow({ game, ui }: { game: Game; ui: Ui }) {
  if (
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
  const lit = whatNowLit(ui.state, ui.whatNowSeen);
  return (
    <button
      type="button"
      className={`whatnow${lit ? ' lit' : ''}`}
      id="whatnow"
      onClick={() => game.whatNow()}
    >
      {WHAT_NOW.title}
    </button>
  );
}
