// Phase 14.1 (Evan's call): the arrows and a controller move focus between the buttons on
// top, the nearest in the direction pressed. Nearly everything is already a button: the
// sheets' rows, a conversation's answers, and the scene's things and the map's pins as
// invisible ones over the canvas (Hots).
import { nearest, type Box, type Dir } from './spatial';

// What the moves go between: a sheet if one's open, then a conversation, then the first
// screen's form, then everything on the screen.
export function layer(): HTMLElement | null {
  return (
    document.getElementById('sheet') ??
    document.getElementById('bubble') ??
    document.getElementById('create') ??
    document.querySelector<HTMLElement>('#scr .ui')
  );
}

// What can take focus: a button or a field that's live and drawn. One scrolled out of a
// sheet still counts: moving onto it scrolls it into view.
export function stops(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')].filter(
    (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    },
  );
}

const box = (el: HTMLElement): Box => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};

const put = (el: HTMLElement) => {
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
};

// Where focus starts when nothing on top has it: a sheet's or a form's first button, as
// Tab would; on the screen, whatever's nearest its middle, so the first press lands in the
// scene rather than on the HUD's clock.
function start(root: HTMLElement, all: HTMLElement[]): HTMLElement {
  if (root.id) return all[0]!;
  const r = root.getBoundingClientRect();
  const mid = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  const d = (el: HTMLElement) => {
    const b = box(el);
    return Math.hypot(b.x + b.w / 2 - mid.x, b.y + b.h / 2 - mid.y);
  };
  return all.reduce((a, b) => (d(b) < d(a) ? b : a));
}

// One move. False when there was nowhere to go.
export function move(dir: Dir): boolean {
  const root = layer();
  if (!root) return false;
  const all = stops(root);
  if (!all.length) return false;
  const at = all.indexOf(document.activeElement as HTMLElement);
  if (at < 0) {
    put(start(root, all));
    return true;
  }
  const i = nearest(box(all[at]!), all.map(box), dir);
  if (i < 0) return false;
  put(all[i]!);
  return true;
}

// The button with focus, if it's one on top a press would take.
export function focused(): HTMLElement | null {
  const root = layer();
  const a = document.activeElement as HTMLElement | null;
  return root && a && a !== document.body && root.contains(a) && a.matches('button:not(:disabled)')
    ? a
    : null;
}
