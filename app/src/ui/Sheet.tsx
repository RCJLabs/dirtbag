import { Fragment, useLayoutEffect, useRef } from 'react';
import {
  average,
  betaScale,
  cold,
  daysOff,
  LOAD,
  ratio,
  zone,
  type Zone,
  bodyNote,
  BODY,
  clockShort,
  conditions,
  costLabel,
  dayFactor,
  goBlocked,
  goCost,
  gradeLabel,
  gradeOf,
  headroom,
  knowsBeta,
  MIX,
  MONEY,
  money,
  needFor,
  picks,
  routeOfId,
  seasonOf,
  SKILLS,
  SKY_NAME,
  STARTS,
  type Conditions,
  type GameState,
  type Season,
  type Verb,
} from '../sim';
import type { Game, SheetId, Ui } from '../game/game';
import type { Settings } from '../game/persist';
import { buildSheet, SKILL_NAME } from './sheets';

export const VERB_TEXT: Record<Verb, string> = {
  load: 'Hold to load, let go in the band',
  tension: 'Hold and release to stay in the band',
  timing: 'Tap when the marker crosses the band',
};

// Your load, in your body's words.
const LOAD_WORD: Record<Zone, [string, string]> = {
  easy: ['Fresh', 'You could give your body more than you are.'],
  steady: ['Steady', 'About what your body’s used to.'],
  talking: ['Talking', 'Every hard go now risks a tweak. A rest day brings it down.'],
  slow: ['Overreached', 'You’re keeping less of what you learn, and the tweak risk is high.'],
  fried: ['Fried', 'Nothing more until you’ve rested.'],
};

// How a window reads on the beta card, from its real width for you today: one to three
// bars, or a dashed one when it's a sliver.
const winBars = (w: number) => (w >= 0.14 ? 3 : w >= 0.09 ? 2 : w >= 0.055 ? 1 : 0);

export function Sheet({ game, id, ui }: { game: Game; id: SheetId; ui: Ui }) {
  const ref = useRef<HTMLDivElement>(null);
  const state = ui.state;
  const kind = id.k === 'place' ? `place:${id.id}` : id.k;
  // A new sheet starts at the top with its first live button focused, for keyboards.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = 0;
    el.querySelector<HTMLButtonElement>(
      'button.opt:not(:disabled), button.beta[aria-checked="true"], button.go',
    )?.focus({
      preventScroll: true,
    });
  }, [kind]);
  const body =
    id.k === 'beta' ? (
      <BetaBody game={game} route={id.route} s={state} />
    ) : id.k === 'you' ? (
      <YouBody game={game} s={state} />
    ) : id.k === 'week' ? (
      <WeekBody game={game} s={state} />
    ) : id.k === 'settings' ? (
      <SettingsBody game={game} settings={ui.settings} />
    ) : null;
  if (body)
    return (
      <div className="sheet" id="sheet" role="dialog" aria-labelledby="sheet-title" ref={ref}>
        <Close game={game} />
        {body}
      </div>
    );
  const spec = buildSheet(game, id, state);
  if (!spec) return null;
  return (
    <div className="sheet" id="sheet" role="dialog" aria-labelledby="sheet-title" ref={ref}>
      {spec.close && <Close game={game} />}
      <h3 id="sheet-title">{spec.title}</h3>
      {spec.sub && <p className="sub">{spec.sub}</p>}
      {spec.notes?.map((n) => (
        <p className="note" key={n}>
          {n}
        </p>
      ))}
      <ul>
        {spec.rows.map((r) => (
          <li key={r.label}>
            <button type="button" className="opt" disabled={r.off} onClick={r.run}>
              <span>{r.label}</span>
              <span className="c">{r.cost ?? ''}</span>
              {r.note && <small>{r.note}</small>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Close({ game }: { game: Game }) {
  return (
    <button type="button" className="x" aria-label="Close" onClick={() => game.closeSheet()}>
      ✕
    </button>
  );
}

// Pick your beta for each crux, then tie in. Beta you haven't earned shows as a locked card
// with a hint about where to find it. Each card's window is its real width for you today:
// your skills in its style against the grade, the rock and your hunger.
function BetaBody({ game, route, s }: { game: Game; route: string; s: GameState }) {
  const r = routeOfId(s, route);
  if (!r) return null;
  const pick = picks(s, r);
  const goes = s.routes[route]?.goesToday ?? 0;
  const why = goBlocked(s, r);
  const c = goCost(r);
  const cost =
    `${costLabel({ min: c.min })} · ${bodyNote({ energy: c.energy, skin: c.skin })}` +
    (dayFactor(s, r).grease ? ' · sun on the wall, smaller windows' : '');
  return (
    <>
      <h3 id="sheet-title">
        {r.name} · {gradeLabel(r)}
      </h3>
      <p className="sub">
        {r.line} {goes ? `Go ${goes + 1} today.` : 'First go today.'} Tap the wall to reopen this.
      </p>
      {r.cruxes.map((cx, n) => (
        <Fragment key={cx.id}>
          <p className="crux">
            {r.cruxes.length > 1 ? `Crux ${n + 1} · ` : 'The crux · '}moves {Math.floor(cx.from) + 1}–
            {Math.floor(cx.to) + 1} · {cx.name}
          </p>
          <div role="radiogroup" aria-label={cx.name}>
            {cx.beta.map((id) => {
              const B = r.beta[id]!;
              const known = knowsBeta(s, route, cx.id, id);
              const on = known && pick[cx.id] === id;
              const bars = winBars(B.w * betaScale(s, r, id));
              const [a, b] = MIX[B.style];
              return (
                <button
                  type="button"
                  key={id}
                  className={`beta${known ? '' : ' locked'}`}
                  role="radio"
                  aria-checked={on}
                  disabled={!known}
                  onClick={() => game.pick(route, cx.id, id)}
                >
                  <span className="dot" />
                  <span>{known ? B.name : 'Another way?'}</span>
                  <span
                    className={`win${bars === 0 ? ' thin' : ''}`}
                    aria-label={known ? `Window ${bars} of 3` : 'Window unknown'}
                  >
                    {[0, 1, 2].map((i) => (
                      <i key={i} className={known && i < bars ? 'on' : undefined} />
                    ))}
                  </span>
                  <small>
                    {known ? `${VERB_TEXT[B.verb]}. ${B.note} Leans on ${a}, then ${b}.` : B.hint}
                  </small>
                </button>
              );
            })}
          </div>
        </Fragment>
      ))}
      {!why && cold(s, r) && (
        <p className="note">Cold: you haven’t warmed up, so every window’s narrower. Something easy first.</p>
      )}
      {!why && ratio(s.load) > LOAD.risk && (
        <p className="note">Your body’s talking: a go now could tweak something.</p>
      )}
      <button type="button" className="go" disabled={!!why} onClick={() => game.go()}>
        {why ?? (r.disc === 'sport' ? 'Tie in and go' : 'Pull on')}
        <small>{cost}</small>
      </button>
    </>
  );
}

// Bills land on the night of every seventh day.
function billsWhen(day: number): string {
  const n = Math.ceil(day / 7) * 7 - day + 1;
  return n === 1 ? 'tonight' : `in ${n} nights`;
}

function YouBody({ game, s }: { game: Game; s: GameState }) {
  const c = s.climber;
  const g = gradeOf(c.skills);
  const scale = needFor(g + 2);
  const room = headroom(s);
  const bills = MONEY.registration + MONEY.insurance;
  return (
    <>
      <h3 id="sheet-title">{c.name || 'You'}</h3>
      <p className="sub">
        {STARTS[c.start]?.name ?? 'A climber'}, climbing V{g}. V{g + 1} comes at an average of{' '}
        {needFor(g + 1).toFixed(1)} across the five; you're at {average(c.skills).toFixed(1)}.
      </p>
      <ul className="skills">
        {SKILLS.map((k) => (
          <li key={k}>
            <span>{SKILL_NAME[k]}</span>
            <i style={{ ['--v' as string]: Math.min(1, c.skills[k] / scale).toFixed(3) }} />
            <b>{c.skills[k].toFixed(1)}</b>
          </li>
        ))}
      </ul>
      <p className="crux">Body</p>
      <p className="sub">
        Energy {Math.round(s.energy)}, skin {Math.round(s.skin)}, food {Math.round(s.fed)}.
        {s.fed < BODY.weakBelow ? ` Under ${BODY.weakBelow} food, every window shrinks.` : ''}
      </p>
      <p className="crux">Load</p>
      <LoadRow s={s} />
      <p className="crux">Money</p>
      <p className="sub">
        {s.cash >= 0 ? `${money(s.cash)} cash.` : `${money(-s.cash)} on the card.`}{' '}
        {room > 0 ? `The card takes ${money(room)} more.` : "The card's maxed."} Registration and insurance,{' '}
        {money(bills)}, {billsWhen(s.day)}.
      </p>
      <ul>
        <li>
          <button type="button" className="opt" onClick={() => game.openSheet({ k: 'settings' })}>
            <span>Settings</span>
            <span className="c" />
          </button>
        </li>
      </ul>
    </>
  );
}

function LoadRow({ s }: { s: GameState }) {
  const r = ratio(s.load);
  const z = zone(r);
  const [word, what] = LOAD_WORD[z];
  const off = daysOff(s);
  return (
    <>
      <ul className="skills">
        <li>
          <span>This week</span>
          <i
            className={r > LOAD.risk ? 'hot' : undefined}
            style={{ ['--v' as string]: Math.min(1, r / LOAD.fried).toFixed(3) }}
          />
          <b>{word}</b>
        </li>
      </ul>
      <p className="sub">
        {what}
        {s.injury && off > 0
          ? ` Your ${s.injury.kind} needs ${off} more day${off > 1 ? 's' : ''} off the rock.`
          : ''}
      </p>
    </>
  );
}

const SEASON: Record<Season, [string, string]> = {
  fall: ['Fall', 'Send season: cold mornings and good friction.'],
  winter: ['Winter', 'Short days and a lot of rain. The gym earns its keep.'],
  spring: ['Spring', 'Mild, and it changes its mind.'],
  summer: ['Summer', 'Hot. Climb early, or climb plastic.'],
};

function skyLine(c: Conditions): string {
  const t = clockShort(c.greaseFrom);
  const wet = c.seeping ? ' Still seeping from the rain.' : '';
  switch (c.sky) {
    case 'rain':
      return "The crag's shut. The gym isn't.";
    case 'prime':
      return `Cold and dry: the best friction. Sun on the wall from ${t}.${wet}`;
    case 'hot':
      return `Greasy from ${t}.${wet}`;
    default:
      return `Sun on the wall from ${t}.${wet}`;
  }
}

function WeekBody({ s }: { game: Game; s: GameState }) {
  const [name, blurb] = SEASON[seasonOf(s.day)];
  return (
    <>
      <h3 id="sheet-title">
        Day {s.day} · {name}
      </h3>
      <p className="sub">{blurb}</p>
      <ul className="days">
        {[0, 1, 2].map((i) => {
          const c = conditions(s.seed, s.day + i);
          return (
            <li key={i} data-sky={c.sky}>
              <b>{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `Day ${s.day + i}`}</b>
              <span className="sky">{SKY_NAME[c.sky]}</span>
              <small>{skyLine(c)}</small>
            </li>
          );
        })}
      </ul>
      <p className="sub">
        Registration and insurance, {money(MONEY.registration + MONEY.insurance)}, {billsWhen(s.day)}.
      </p>
    </>
  );
}

function SettingsBody({ game, settings }: { game: Game; settings: Settings }) {
  const choice = <K extends keyof Settings>(key: K, value: Settings[K], label: string) => (
    <button
      type="button"
      key={value}
      className="beta choice"
      role="radio"
      aria-checked={settings[key] === value}
      onClick={() => game.setSettings({ [key]: value } as Partial<Settings>)}
    >
      <span className="dot" />
      <span>{label}</span>
    </button>
  );
  return (
    <>
      <h3 id="sheet-title">Settings</h3>
      <p className="sub">Kept in this browser, apart from your game. Starting over doesn't touch them.</p>
      <p className="crux">Motion</p>
      <div role="radiogroup" aria-label="Motion">
        {choice('motion', 'system', 'Match this device')}
        {choice('motion', 'reduce', 'Less motion')}
        {choice('motion', 'full', 'Full motion')}
      </div>
      <p className="crux">Text</p>
      <div role="radiogroup" aria-label="Text size">
        {choice('text', 'normal', 'Normal')}
        {choice('text', 'large', 'Large')}
      </div>
    </>
  );
}
