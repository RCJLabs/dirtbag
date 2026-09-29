import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ACT_I,
  ACT_I_END,
  average,
  betaScale,
  currentGoal,
  goalDesc,
  progress,
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
  DOG,
  DOG_TIER_NAME,
  dogTier,
  FA_NAME_MAX,
  faSuggestions,
  goBlocked,
  goCost,
  gradeName,
  gradeOf,
  gradeOfPerson,
  headroom,
  knowsBeta,
  lineGrade,
  lineName,
  MIX,
  MONEY,
  money,
  needFor,
  PEOPLE,
  picks,
  PLACES,
  routeOfId,
  seasonOf,
  SKILLS,
  SKY_NAME,
  STARTS,
  tierOf,
  TIER_NAME,
  type Conditions,
  type GameState,
  type PersonLog,
  type Season,
  type Verb,
} from '../sim';
import type { Game, SheetId, Ui } from '../game/game';
import type { Settings } from '../game/persist';
import { CARD, cardPng } from '../view/paint/card';
import { cardFile, cardOf, cardText } from './card';
import { buildSheet, SKILL_NAME, type ListSpec } from './sheets';

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
    ) : id.k === 'fa' ? (
      <FaBody game={game} route={id.route} s={state} />
    ) : id.k === 'you' ? (
      <YouBody game={game} s={state} />
    ) : id.k === 'week' ? (
      <WeekBody game={game} s={state} />
    ) : id.k === 'settings' ? (
      <SettingsBody game={game} settings={ui.settings} />
    ) : id.k === 'card' ? (
      <CardBody game={game} id={id} s={state} />
    ) : null;
  if (body)
    return (
      <div className="sheet" id="sheet" role="dialog" aria-labelledby="sheet-title" ref={ref}>
        {id.k !== 'fa' && id.k !== 'card' && <Close game={game} />}
        {body}
      </div>
    );
  const spec = buildSheet(game, id, state);
  if (!spec) return null;
  return (
    <div className="sheet" id="sheet" role="dialog" aria-labelledby="sheet-title" ref={ref}>
      {spec.close && <Close game={game} />}
      <h3 id="sheet-title">{spec.title}</h3>
      {spec.reach && <Reach {...spec.reach} />}
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

// How far a go got, drawn: the line from the ground to the top, its cruxes shaded, this go
// filled in and your best before it marked. A watcher reads it without the numbers.
function Reach({ moves, cruxes, go, best }: NonNullable<ListSpec['reach']>) {
  const pct = (m: number) => `${Math.max(0, Math.min(100, (m / moves) * 100)).toFixed(1)}%`;
  const say =
    best === null
      ? 'Your first go on it.'
      : go > best
        ? 'Your highest yet.'
        : go === best
          ? 'Level with your best.'
          : 'Short of your best.';
  return (
    <>
      <div className="reach" id="reach" role="img" aria-label={`${say} This go against your best.`}>
        <i className="r-go" style={{ width: pct(go) }} />
        {cruxes.map(([a, b]) => (
          <i key={a} className="r-cx" style={{ left: pct(a), width: pct(b - a) }} />
        ))}
        {!!best && <i className="r-best" style={{ left: pct(best) }} />}
      </div>
      <p className="reach-say">{say}</p>
    </>
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
  const log = s.routes[route];
  const unnamed = r.open && log?.sent && !s.firsts[route];
  return (
    <>
      <h3 id="sheet-title">
        {lineName(s, r)} · {lineGrade(s, r)}
      </h3>
      <p className="sub">
        {r.line} {goes ? `Go ${goes + 1} today.` : 'First go today.'} Tap the wall to reopen this.
      </p>
      {r.open && !log?.sent && !s.firsts[route] && (
        <p className="note">Open project: nobody’s sent it. Send it and it’s yours to name.</p>
      )}
      {s.race?.route === route && (
        <p className="note">
          Dex is racing you for it: {s.race.until - s.day + 1} day{s.race.until === s.day ? '' : 's'} left.
        </p>
      )}
      {s.firsts[route]?.by && (
        <p className="sub">
          First ascent: {PEOPLE[s.firsts[route]!.by!]?.full ?? 'somebody else'}. The second’s still going.
        </p>
      )}
      {unnamed && log.sent && (
        <button
          type="button"
          className="opt"
          onClick={() =>
            game.openSheet({
              k: 'fa',
              route,
              style: log.sent!.style,
              go: log.sent!.go,
              gains: {},
              notes: [],
              from: 'wall',
            })
          }
        >
          <span>Name your first ascent</span>
          <span className="c" />
        </button>
      )}
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
      {log?.sent && !unnamed && (
        <button
          type="button"
          className="opt after"
          onClick={() => game.openSheet({ k: 'card', route, back: { k: 'beta', route } })}
        >
          <span>Keep a card of it</span>
          <span className="c" />
        </button>
      )}
    </>
  );
}

// The send card: painted here from the save, shown as an image (so a long press saves it
// too), with a share button where the phone can share files, and a plain download.
function CardBody({ game, id, s }: { game: Game; id: Extract<SheetId, { k: 'card' }>; s: GameState }) {
  const [card] = useState(() => cardOf(s, id.route));
  const [png, setPng] = useState<{ file: File; url: string } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!card) return;
    let live = true;
    let url = '';
    cardPng(card).then(
      (blob) => {
        if (!live) return;
        url = URL.createObjectURL(blob);
        setPng({ file: new File([blob], cardFile(card), { type: 'image/png' }), url });
      },
      () => live && setFailed(true),
    );
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [card]);
  if (!card) return null;
  const shareable =
    !!png && typeof navigator.canShare === 'function' && navigator.canShare({ files: [png.file] });
  const save = () => {
    if (!png) return;
    const a = document.createElement('a');
    a.href = png.url;
    a.download = png.file.name;
    a.click();
  };
  return (
    <>
      <h3 id="sheet-title">A card of it</h3>
      {png ? (
        <img
          id="card"
          className="card-img"
          src={png.url}
          alt={cardText(card)}
          width={CARD.w * CARD.k}
          height={CARD.h * CARD.k}
        />
      ) : (
        <p className="sub">{failed ? 'It wouldn’t draw. The send still counts.' : 'Drawing it…'}</p>
      )}
      <ul>
        {shareable && (
          <li>
            <button
              type="button"
              className="opt"
              onClick={() =>
                navigator.share({ files: [png.file], title: card.name, text: cardText(card) }).catch(() => {})
              }
            >
              <span>Send it on</span>
              <span className="c" />
            </button>
          </li>
        )}
        <li>
          <button type="button" className="opt" disabled={!png} onClick={save}>
            <span>Save the image</span>
            <span className="c" />
          </button>
        </li>
        <li>
          <button type="button" className="opt" onClick={() => game.openSheet(id.back)}>
            <span>Back</span>
            <span className="c" />
          </button>
        </li>
      </ul>
    </>
  );
}

// v0.956's grade calls for a first ascent: a number under, at, or over what it felt like.
const CALLS: [-1 | 0 | 1, string][] = [
  [-1, 'Call it soft'],
  [0, 'Call it true'],
  [1, 'Call it stout'],
];

// A first ascent: call the grade and give it a name. The names on offer come from your
// record; any of them, or your own, goes on the map.
function FaBody({ game, route, s }: { game: Game; route: string; s: GameState }) {
  const r = routeOfId(s, route);
  const [names] = useState(() => (r ? faSuggestions(s, r) : []));
  const [name, setName] = useState(names[0] ?? '');
  const [call, setCall] = useState<-1 | 0 | 1>(0);
  if (!r) return null;
  const ok = name.trim().length >= 2;
  const grade = gradeName(r.disc, r.grade + call);
  return (
    <form
      className="fa"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) game.nameLine(name, call);
      }}
    >
      <h3 id="sheet-title">First ascent</h3>
      <p className="sub">
        Nobody’s climbed this {r.disc === 'sport' ? 'route' : 'line'} before you. It’s yours to name, and to
        grade.
      </p>
      <p className="crux">The grade</p>
      <div role="radiogroup" aria-label="The grade" className="calls">
        {CALLS.map(([c, word]) => (
          <button
            type="button"
            key={c}
            className="beta choice"
            role="radio"
            aria-checked={call === c}
            onClick={() => setCall(c)}
          >
            <span className="dot" />
            <span>{gradeName(r.disc, r.grade + c)}</span>
            <small>{word}</small>
          </button>
        ))}
      </div>
      <label className="field">
        <span>The name</span>
        <input
          id="fa-name"
          value={name}
          maxLength={FA_NAME_MAX}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="chips">
        {names.map((n) => (
          <button type="button" key={n} className="chip" aria-pressed={name === n} onClick={() => setName(n)}>
            {n}
          </button>
        ))}
      </div>
      <button type="submit" className="go" disabled={!ok}>
        Put it on the map
        <small>
          {name.trim() || 'No name yet'}, {grade}
        </small>
      </button>
    </form>
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
      <ActRow s={s} />
      <p className="crux">Body</p>
      <p className="sub">
        Energy {Math.round(s.energy)}, skin {Math.round(s.skin)}, food {Math.round(s.fed)}.
        {s.fed < BODY.weakBelow ? ` Under ${BODY.weakBelow} food, every window shrinks.` : ''}
      </p>
      <p className="crux">Load</p>
      <LoadRow s={s} />
      <PeopleRows s={s} />
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

// Act I: the stage you're on, why, and how far along it is; or that the season's done.
function ActRow({ s }: { s: GameState }) {
  const g = currentGoal(s);
  if (!g)
    return (
      <>
        <p className="crux">Act I · done</p>
        <p className="sub">{ACT_I_END.text}</p>
      </>
    );
  const p = progress(s, g.aim);
  return (
    <>
      <p className="crux">
        Act I · {s.goals + 1} of {ACT_I.length} · {g.title}
      </p>
      <p className="sub">
        {g.text} <b>{goalDesc(g)}</b>
        {p.need > 1 && !('cash' in g.aim) && !('grade' in g.aim) && !('regular' in g.aim)
          ? ` (${Math.min(p.have, p.need)} of ${p.need})`
          : ''}
        .
      </p>
    </>
  );
}

// The people you've met: how close you are, in v0.956's tiers, and where things stand.
function PeopleRows({ s }: { s: GameState }) {
  const met = Object.entries(s.people).filter(([id]) => PEOPLE[id]);
  if (!met.length && !s.dog) return null;
  return (
    <>
      <p className="crux">People</p>
      <ul className="days people">
        {met.map(([id, p]) => (
          <li key={id}>
            <b>{PEOPLE[id]!.name}</b>
            <span className="sky">{PEOPLE[id]!.rival ? 'Rival' : TIER_NAME[tierOf(p.bond)]}</span>
            <small>{personNote(s, id, p)}</small>
          </li>
        ))}
        {s.dog && (
          <li>
            <b>{s.dog.name}</b>
            <span className="sky">{DOG_TIER_NAME[dogTier(s.dog.bond)]}</span>
            <small>
              {s.dog.fed < DOG.hungryBelow ? 'Hungry, and too polite to say.' : 'Rides shotgun. Fed.'}
            </small>
          </li>
        )}
      </ul>
    </>
  );
}

const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

function personNote(s: GameState, id: string, p: PersonLog): string {
  const g = gradeOfPerson(s.seed, id, s.day);
  const climbs = g === null ? '' : `Climbs V${g}. `;
  const def = PEOPLE[id]!;
  if (def.rival) {
    const race = s.race && routeOfId(s, s.race.route);
    if (race)
      return `${climbs}Racing you for ${race.name.replace(/^The /, 'the ')}: ${days(s.race!.until - s.day + 1)} left.`;
    return `${climbs}${def.rival}`;
  }
  if (p.away !== undefined && s.day < p.away) return `Away, back in ${days(p.away - s.day)}.`;
  if (p.invite?.day === s.day)
    return `${climbs}Meeting you at ${PLACES[p.invite.place]?.name ?? 'the crag'} today.`;
  if (p.last === s.day) return `${climbs}Climbed together today.`;
  if (p.last > 0) return `${climbs}Last climbed together on day ${p.last}.`;
  return `${climbs}You haven’t climbed together yet.`;
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
