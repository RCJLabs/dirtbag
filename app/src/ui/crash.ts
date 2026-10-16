// Phase 15.2 (Evan's call): when the game breaks, it says so, where before a render crash left
// a blank page. Plain DOM, outside React: React may be what broke. The screen says the save is
// safe (it's written after every move, never mid-way), offers a reload and the save as a file,
// and shows exactly what went wrong, to copy or to email from the player's own mail app. The
// game sends nothing itself.
import { rawSave } from '../game/persist';
import { DEMO } from '../sim';

// Where a report goes, when the player sends one: RCJ Labs' support address. Until there is
// one, the report is copied, not mailed, and the button that would mail it isn't shown. The
// desktop build can't follow a mailto: link (its window goes nowhere but the game), so there
// it's copied either way until the bridge can hand one to the system.
export const REPORT_TO = '';

// What a report says: the build, where it's running, and the error with its stack, trimmed.
// Nothing from the save: who you are and what you've done stay on the device.
export function crashReport(
  e: unknown,
  where: { version: string; demo: boolean; desktop: boolean; agent: string },
): string {
  const err = e instanceof Error ? e : new Error(String(e));
  const stack = (err.stack ?? '')
    .split('\n')
    .filter((l) => l.trim() && !l.includes(err.message))
    .slice(0, 12)
    .map((l) => l.trim());
  return [
    `Dirtbag ${where.version}${where.demo ? ' (demo)' : ''}, ${where.desktop ? 'desktop' : 'web'}`,
    where.agent,
    '',
    `${err.name}: ${err.message}`,
    ...stack,
  ].join('\n');
}

// Errors that aren't the game breaking: the browser's resize-observer notice, and another
// site's script (an extension's), which reaches the page as a bare "Script error.".
export function notACrash(message: string, error: unknown): boolean {
  return /ResizeObserver loop/.test(message) || (!error && /^Script error\.?$/.test(message));
}

let shown = false;

// The screen. `carryOn` for an error the page may live through (one thrown outside React);
// a render crash has torn the page down, and only a reload brings it back.
export function crashed(e: unknown, carryOn: boolean): void {
  if (shown) return;
  shown = true;
  const report = crashReport(e, {
    version: __APP_VERSION__,
    demo: DEMO,
    desktop: !!window.dirtbagDesktop,
    agent: navigator.userAgent,
  });
  const el = (tag: string, cls?: string, text?: string): HTMLElement => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };
  const button = (id: string, label: string, small: string, go: () => void): HTMLElement => {
    const b = el('button', 'opt') as HTMLButtonElement;
    b.type = 'button';
    b.id = id;
    b.append(el('span', '', label), el('span', 'c'), el('small', '', small));
    b.addEventListener('click', go);
    return b;
  };

  const box = el('div', 'crash');
  box.id = 'crash';
  box.setAttribute('role', 'alertdialog');
  box.setAttribute('aria-labelledby', 'crash-title');
  const card = el('div', 'card');
  const title = el('h3', '', 'Something broke');
  title.id = 'crash-title';
  card.append(
    title,
    el(
      'p',
      'sub',
      'The game ran into something it didn’t expect, and stopped. Your save is as it was after your last move.',
    ),
  );
  card.append(
    button('crash-reload', 'Reload', 'Start the game again from your save.', () => location.reload()),
  );
  if (carryOn)
    card.append(
      button('crash-on', 'Carry on', 'Back to where you were. If it breaks again, reload.', () => {
        box.remove();
        shown = false;
      }),
    );
  const raw = rawSave();
  if (raw)
    card.append(
      button('crash-save', 'Export your save', 'Your climber as a file, to keep whatever happens.', () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
        a.download = 'dirtbag-save.json';
        a.click();
      }),
    );
  const said = el('textarea', 'said') as HTMLTextAreaElement;
  said.id = 'crash-said';
  said.readOnly = true;
  said.value = report;
  said.rows = 6;
  said.setAttribute('aria-label', 'What went wrong');
  card.append(
    el(
      'p',
      'note',
      'What went wrong, all of it. It holds nothing from your save, and goes nowhere unless you send it.',
    ),
    said,
    button('crash-copy', 'Copy it', 'To paste wherever you tell RCJ Labs about it.', () => {
      said.select();
      void navigator.clipboard?.writeText(report).catch(() => document.execCommand('copy'));
    }),
  );
  if (REPORT_TO && !window.dirtbagDesktop)
    card.append(
      button('crash-mail', 'Email it', `From your own mail, to ${REPORT_TO}.`, () => {
        location.href = `mailto:${REPORT_TO}?subject=${encodeURIComponent(report.split('\n')[0]!)}&body=${encodeURIComponent(report)}`;
      }),
    );
  box.append(card);
  document.body.append(box);
  (box.querySelector('button') as HTMLButtonElement | null)?.focus();
}
