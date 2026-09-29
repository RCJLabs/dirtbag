import { useState } from 'react';
import { MONEY, NAME_MAX, SKILLS, STARTS, type Skills } from '../sim';
import type { Game } from '../game/game';
import { SKILL_NAME } from './sheets';

// The first screen of a new game: a name and one of v0.956's four starts.
export function Create({ game }: { game: Game }) {
  const [name, setName] = useState('');
  const [start, setStart] = useState('allrounder');
  const ok = name.trim().length > 0;
  return (
    <form
      className="create"
      id="create"
      aria-labelledby="create-title"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) game.create(name, start);
      }}
    >
      <h2 id="create-title">Who's in the van?</h2>
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

function SkillBars({ skills }: { skills: Skills }) {
  return (
    <span className="bars" aria-hidden="true">
      {SKILLS.map((k) => (
        <span key={k}>
          <i style={{ ['--v' as string]: (skills[k] / 14).toFixed(3) }} />
          {SKILL_NAME[k].slice(0, 4)}
        </span>
      ))}
    </span>
  );
}
