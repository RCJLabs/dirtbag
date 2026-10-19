// Phase 14.1: what the keyboard and a controller share. Each turns its own presses into
// these, so a key and a pad's button always do the same thing.
import type { Game, Ui } from '../game/game';
import { focused, move } from './nav';
import type { PadEvent } from './pad';

// Escape, or the pad's B: put down whatever's open, the most recent first: a conversation,
// a sheet that has a close button, then the map, back to where you are.
export function back(game: Game): void {
  const u = game.ui.get();
  // Phase 42: nobody lets go of a rope mid-climb; once they're down, back unties.
  if (u.belay) {
    game.belayDone();
    return;
  }
  const x = document.querySelector<HTMLButtonElement>('#sheet .x');
  if (u.talk) game.hush();
  else if (x) x.click();
  else if (!u.sheet && u.view === 'map' && game.navLabel(u) === 'Close') game.nav();
}

export type Hub = 'plan' | 'journal' | 'map';

// The HUD's buttons from a key or the pad. Each presses the button itself, so it's shut
// whenever the button is (driving, mid-go). The map opens from a scene even over a sheet,
// as M always has, and closes again from the map.
export function hub(game: Game, h: Hub): void {
  const u = game.ui.get();
  if (u.talk && h !== 'map') return;
  if (h === 'map') {
    if (u.view === 'scene' && !u.talk) game.openMap();
    else if (u.view === 'map' && !u.sheet && game.navLabel(u) === 'Close') game.nav();
    return;
  }
  if (u.sheet) return;
  // A narrow HUD has no journal button of its own: your body opens it.
  const id = h === 'plan' ? 'h-time' : document.getElementById('h-journal') ? 'h-journal' : 'h-you';
  document.getElementById(id)?.click();
}

// Space, Enter or A with nothing focused: use what's nearest in a scene, or at a wall, its
// beta sheet, as a tap on it does.
export function act(game: Game): void {
  const u = game.ui.get();
  if (u.busk || u.speed || u.belay) return;
  if (u.view === 'scene' && !u.talk && !u.sheet) game.useNearest();
  else if (u.view === 'wall' && !u.climbing && !u.sheet) game.tap(0, 0);
}

// Phase 14.6: B or Escape before the first stir is "Just eat it", as the panel's button is.
export const canSkip = (u: Ui): boolean => u.busk?.kind === 'cook' && u.busk.scores.length === 0;

// Whether the stick walks: in a scene with nothing open.
const walks = (game: Game, u: Ui) => u.view === 'scene' && !u.sheet && !u.talk && !!game.state.climber.name;

// One thing the pad did. A and the right trigger are the hold, the strum and the press; B is
// back; the bumpers (or the D-pad) are the speed wall's hands; Start the journal, Select the
// map, Y the plan.
export function onPad(game: Game, e: PadEvent): void {
  const u = game.ui.get();
  const hold = e.k !== 'move' && e.k !== 'lean' && (e.b === 'a' || e.b === 'rt');
  if (u.speed && u.speed.phase !== 'done') {
    if (e.k !== 'down') return;
    if (e.b === 'lb' || e.b === 'left') game.speedGrab(0);
    else if (e.b === 'rb' || e.b === 'right') game.speedGrab(1);
    return;
  }
  // Phase 42: on belay, A and the right trigger are your hand on the rope.
  if (u.belay && u.belay.rope.phase !== 'caught') {
    if (hold) game.belayPress(e.k === 'down');
    return;
  }
  if (u.busk && u.busk.phase === 'play') {
    if (hold && e.k === 'down') game.buskTap();
    else if (e.k === 'down' && e.b === 'b' && canSkip(u)) game.cookSkip();
    return;
  }
  if (u.climbing) {
    if (hold) game.press(e.k === 'down');
    return;
  }
  if (e.k === 'lean') {
    if (e.x === 0 || walks(game, u)) game.walkKey(e.x);
    return;
  }
  if (e.k === 'move') {
    if (e.stick && (e.dir === 'left' || e.dir === 'right') && walks(game, u)) return;
    move(e.dir);
    return;
  }
  if (e.k !== 'down') return;
  if (e.b === 'a') {
    const f = focused();
    if (f) f.click();
    else act(game);
  } else if (e.b === 'b') back(game);
  else if (e.b === 'start') hub(game, 'journal');
  else if (e.b === 'select') hub(game, 'map');
  else if (e.b === 'y') hub(game, 'plan');
}
