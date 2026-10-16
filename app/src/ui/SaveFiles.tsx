import { useRef, useState } from 'react';
import { gradeOf, type GameState } from '../sim';
import type { Game } from '../game/game';
import { readSave } from '../game/savefile';

// Phase 14.2 (Evan's call): your save as a file, out to keep or carry to another device, and
// back in. A file that won't load is refused, with why, and nothing here changes; one that
// will asks first, since it takes the place of the climber here. The first screen has only
// the way in: there's nobody to export yet.
export function SaveFiles({ game, out = true }: { game: Game; out?: boolean }) {
  const pick = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [got, setGot] = useState<GameState | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const here = game.state;
  return (
    <>
      <p className="crux">{out ? 'Your save' : 'Already climbing?'}</p>
      {out && (
        <button type="button" className="opt" id="s-save-out" onClick={() => setSaved(game.exportSave())}>
          <span>{saved ? `Saved as ${saved}` : 'Export your save'}</span>
          <span className="c" />
          <small>Your climber as a file, to keep or to carry to another device.</small>
        </button>
      )}
      <button type="button" className="opt" id="s-save-in" onClick={() => pick.current?.click()}>
        <span>Import a save</span>
        <span className="c" />
        <small>A file exported here or on another device.</small>
      </button>
      <input
        ref={pick}
        id="save-file"
        type="file"
        accept=".json,application/json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          const r = await readSave(f);
          setGot(r.ok ? r.state : null);
          setWhy(r.ok ? null : r.why);
        }}
      />
      {why && (
        <p className="sub" id="save-why" role="status">
          That file won’t load: {why}. Nothing here has changed.
        </p>
      )}
      {got && (
        <div id="save-confirm" role="group" aria-label="Load this save?">
          <p className="sub">
            {who(got)}.
            {here.climber.name &&
              ` Load it, and it takes the place of ${who(here)} here. Export yours first to keep a copy.`}
          </p>
          <button
            type="button"
            className="opt"
            id="s-save-load"
            onClick={() => {
              if (!game.importSave(got)) setWhy('this browser won’t keep it');
            }}
          >
            <span>Load {got.climber.name || 'it'}</span>
            <span className="c" />
          </button>
          <button type="button" className="opt" id="s-save-keep" onClick={() => setGot(null)}>
            <span>{here.climber.name ? `Keep ${here.climber.name}` : 'Not now'}</span>
            <span className="c" />
          </button>
        </div>
      )}
    </>
  );
}

// Who a save holds, from the save itself: "Robin, day 12, V3".
const who = (s: GameState) =>
  s.climber.name
    ? `${s.climber.name}, day ${s.day}, V${gradeOf(s.climber.skills)}`
    : 'A climber not yet made';
