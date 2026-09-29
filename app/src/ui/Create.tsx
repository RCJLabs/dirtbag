import { useState } from 'react';
import { CARRIED, carried, gradeOf, MONEY, NAME_MAX, SKILLS, STARTS, type Skills } from '../sim';
import type { Game } from '../game/game';
import { findLegacy, saveLegacyFile } from '../game/legacy';
import { SKILL_NAME } from './sheets';
import { vars } from './vars';

// The first screen of a new game: a name and one of v0.956's four starts. Someone who played
// v0.956, which R3 retired, is told so first: they can keep their old career as a file, and
// carry on here as they were, as far as the new game allows.
export function Create({ game }: { game: Game }) {
  const [old] = useState(() => findLegacy());
  const carry = old?.skills ? carried(old.skills) : null;
  const [name, setName] = useState((old?.name ?? '').slice(0, NAME_MAX));
  const [start, setStart] = useState(carry ? CARRIED : 'allrounder');
  const [kept, setKept] = useState(false);
  const ok = name.trim().length > 0;
  return (
    <form
      className="create"
      id="create"
      aria-labelledby="create-title"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) game.create(name, start, start === CARRIED ? (old?.skills ?? undefined) : undefined);
      }}
    >
      <h2 id="create-title">Who's in the van?</h2>
      {old && (
        <section className="legacy" id="legacy" aria-labelledby="legacy-title">
          <h3 id="legacy-title">v0.956 has retired</h3>
          <p>
            Dirtbag has been rebuilt. Your career in the old game is still in this browser, and you can keep
            it as a file. Or carry on here, as far as the new game lets you.
          </p>
          <button type="button" className="opt" id="c-export" onClick={() => setKept(saveLegacyFile())}>
            <span>{kept ? 'Saved. Keep it somewhere safe.' : 'Save your v0.956 career'}</span>
            <span className="c" />
            <small>A file of everything the old game kept here.</small>
          </button>
        </section>
      )}
      <label className="field">
        <span>Your name</span>
        <input
          id="c-name"
          value={name}
          maxLength={NAME_MAX}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <p className="crux">How you climb</p>
      <div role="radiogroup" aria-label="How you climb" className="starts">
        {carry && old?.grade != null && (
          <button
            type="button"
            id="c-carry"
            className="start"
            role="radio"
            aria-checked={start === CARRIED}
            onClick={() => setStart(CARRIED)}
          >
            <b>As you were</b>
            <small>{carryLine(old.grade, gradeOf(carry))}</small>
            <SkillBars skills={carry} />
          </button>
        )}
        {Object.entries(STARTS).map(([id, st]) => (
          <button
            type="button"
            key={id}
            id={`c-${id}`}
            className="start"
            role="radio"
            aria-checked={start === id}
            onClick={() => setStart(id)}
          >
            <b>{st.name}</b>
            <small>{st.blurb}</small>
            <SkillBars skills={st.skills} />
          </button>
        ))}
      </div>
      <button type="submit" className="go" id="c-go" disabled={!ok}>
        Start
        <small>${MONEY.start}, a van, and Hazel at the fire.</small>
      </button>
    </form>
  );
}

// What coming across does to a v0.956 climber, in the grades it's worked out from.
const carryLine = (was: number, now: number): string =>
  was > now
    ? `You were climbing V${was}. You come back at V${now}: the hands remember, the forearms don't.`
    : `You were climbing V${was}, and still are.`;

// Each skill against the strongest shown: the four starts top out at 14, and a climber
// carried over from v0.956 against their own best.
function SkillBars({ skills }: { skills: Skills }) {
  const top = Math.max(14, ...SKILLS.map((k) => skills[k]));
  return (
    <span className="bars" aria-hidden="true">
      {SKILLS.map((k) => (
        <span key={k}>
          <i style={vars({ '--v': (skills[k] / top).toFixed(3) })} />
          {SKILL_NAME[k].slice(0, 4)}
        </span>
      ))}
    </span>
  );
}
