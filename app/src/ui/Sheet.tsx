import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  actOf,
  LINE_SCENE,
  ROMAN,
  stageOf,
  STORY,
  AGE,
  ageOf,
  daysLeft,
  retireBlocked,
  guitarRank,
  RANK_NAME,
  counted,
  average,
  indoor,
  revealed,
  roped,
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
  CLIMB,
  clock,
  clockShort,
  conditions,
  conditionsAt,
  costLabel,
  dayFactor,
  belayer,
  fallFt,
  landingChance,
  morePads,
  DOG,
  DOG_TIER_NAME,
  dogTier,
  FA_NAME_MAX,
  GEAR,
  KIT,
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
  skyAt,
  startName,
  sunOn,
  tierOf,
  TIER_NAME,
  type Conditions,
  type GameState,
  type LogLine,
  type PersonLog,
  type Tonight,
  type RouteDef,
  type Season,
  type Verb,
  canAsk,
  CROWD,
  crowdNow,
  queueMin,
  soloed,
  dayName,
  isPosted,
  JOBS,
  LIFESTYLE,
  rankName,
  signedUp,
  signupBlocked,
  benchedUntil,
  WORK,
  type Lifestyle,
  PARTS,
  PART_NAME,
  partWord,
  SPOT,
  SPOTS,
  SPOT_IDS,
  SPOT_NAME,
  spotBlocked,
  type SpotId,
  FOOD,
  weeklyBills,
  PLANS,
  INJURY,
  type Plan,
  MARK_NAME,
  STYLE_NAME,
  flaring,
  type Mark,
  type Style,
  SUPPLIES,
  WORDS,
  OPEN_RECORD,
  originOf,
  originTerms,
  callingOf,
  callingTerms,
  rungText,
  PATHS,
  OPEN_PATHS,
  masteryOf,
  QUIRKS,
  deedText,
  edgeText,
  pathBlocked,
  pathsTaken,
  tiersOn,
  PATH,
  BOARD_JOBS,
  WEEK_DAYS,
  boardWeek,
  jobProgress,
  jobText,
  ECHOES,
  FACTIONS,
  homeCrowd,
  homeReady,
  HOME,
  perksOf,
  stanceAnswer,
  standingWord,
  whereYouStand,
  type Faction,
  TALENTS,
  CAME_ACROSS,
  CAME_ACROSS_NAME,
  premiumOf,
  livingMult,
  WORD_GROUP,
  type WordGroup,
} from '../sim';
import type { Game, JournalPage, SheetId, Ui } from '../game/game';
import { legacyFile, saveLegacyFile } from '../game/legacy';
import type { Settings } from '../game/persist';
import { paintHeader } from '../view/header';
import { planLine, stepLabel, stepsAt, withStep, type PlanStep } from '../game/plan';
import { CARD, cardPng } from '../view/paint/card';
import { cardFile, cardOf, cardText } from './card';
import { buildSheet, SKILL_NAME, type ListSpec } from './sheets';
import { CREDITS } from './credits';
import { kitNote, kitState } from './kit';
import { vars } from './vars';

// "a, b and c".
const and = (xs: string[]): string =>
  xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : (xs[0] ?? '');

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

// When the last press went down, anywhere. A tap on the scene opens a sheet on pointerdown,
// and the same tap's click lands afterwards on whatever the sheet put under the finger: a row
// you never chose. A sheet ignores any click whose press went down before it opened.
let downAt = 0;
if (typeof window !== 'undefined')
  window.addEventListener('pointerdown', () => (downAt = performance.now()), true);

export function Sheet({ game, id, ui }: { game: Game; id: SheetId; ui: Ui }) {
  const ref = useRef<HTMLDivElement>(null);
  const opened = useRef(0);
  const ghost = (e: React.MouseEvent) => {
    // A keyboard's click has no press (detail 0); a real tap pressed after the sheet opened.
    if (e.detail > 0 && downAt < opened.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const state = ui.state;
  const kind = id.k === 'place' ? `place:${id.id}` : id.k === 'journal' ? `journal:${id.page}` : id.k;
  // A new sheet starts at the top with its first live button focused, for keyboards.
  useLayoutEffect(() => {
    opened.current = performance.now();
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
    ) : id.k === 'journal' ? (
      <JournalBody game={game} page={id.page} s={state} />
    ) : id.k === 'week' ? (
      <WeekBody game={game} s={state} />
    ) : id.k === 'settings' ? (
      <SettingsBody game={game} settings={ui.settings} />
    ) : id.k === 'credits' ? (
      <CreditsBody />
    ) : id.k === 'line' && id.step === 2 ? (
      <LineCredits game={game} />
    ) : id.k === 'card' ? (
      <CardBody game={game} id={id} s={state} />
    ) : id.k === 'plan' ? (
      <PlanBody game={game} ui={ui} />
    ) : null;
  if (body)
    return (
      <div
        className="sheet"
        id="sheet"
        role="dialog"
        aria-labelledby="sheet-title"
        ref={ref}
        onClickCapture={ghost}
      >
        {id.k !== 'fa' && id.k !== 'card' && id.k !== 'line' && <Close game={game} />}
        {body}
      </div>
    );
  const spec = buildSheet(game, id, state);
  if (!spec) return null;
  return (
    <div
      className="sheet"
      id="sheet"
      role="dialog"
      aria-labelledby="sheet-title"
      ref={ref}
      onClickCapture={ghost}
    >
      {spec.close && <Close game={game} />}
      <h3 id="sheet-title">{spec.title}</h3>
      {spec.head && <PlaceHead s={state} {...spec.head} />}
      {spec.reach && <Reach {...spec.reach} />}
      {spec.sub && <p className="sub">{spec.sub}</p>}
      {spec.lines?.map((l) => (
        <p className="sub" key={l}>
          {l}
        </p>
      ))}
      {spec.notes?.map((n) => (
        <p className="note" key={n}>
          {n}
        </p>
      ))}
      {spec.tonight && <TonightList t={spec.tonight} />}
      {spec.who && <WhoList {...spec.who} />}
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

// The day's plan: its steps, each one out with a tap, and more added by where, then what. A
// plan you haven't made yet starts from yesterday, as you played it.
function PlanBody({ game, ui }: { game: Game; ui: Ui }) {
  const { plan, yesterday } = ui.plans;
  const steps = plan.length ? plan : yesterday;
  const fromYesterday = !plan.length && yesterday.length > 0;
  // null: the steps; '': where the next one is; a place: what to do there.
  const [adding, setAdding] = useState<string | null>(null);
  const opt = (label: string, run: () => void, cost = '', idAttr?: string) => (
    <li key={label + cost}>
      <button type="button" className="opt" id={idAttr} onClick={run}>
        <span>{label}</span>
        <span className="c">{cost}</span>
      </button>
    </li>
  );
  if (adding === '')
    return (
      <>
        <h3 id="sheet-title">Where?</h3>
        <ul>
          {Object.entries(PLACES).map(([id, p]) => opt(p.name, () => setAdding(id)))}
          {opt('Back', () => setAdding(null))}
        </ul>
      </>
    );
  if (adding)
    return (
      <>
        <h3 id="sheet-title">{PLACES[adding]?.name}</h3>
        <ul>
          {stepsAt(ui.state, adding).map((st) =>
            opt(stepLabel(st), () => {
              game.setPlan(withStep(steps, st));
              setAdding(null);
            }),
          )}
          {opt('Back', () => setAdding(''))}
        </ul>
      </>
    );
  return (
    <>
      <h3 id="sheet-title">The plan</h3>
      <p className="sub">
        {fromYesterday
          ? 'Yesterday, as you played it. Change what you like.'
          : steps.length
            ? 'Run in one go. It waits while you climb, and stops at anything the day won’t allow.'
            : 'Nothing yet. Add a step, or play a day and it’s here tomorrow.'}
      </p>
      {steps.length > 0 && (
        <ol className="plan" id="plan">
          {steps.map((st: PlanStep, i) => (
            <li key={`${i}-${st.place}-${st.act ?? 'climb'}`}>
              <span>
                {PLACES[st.place]?.name} · {stepLabel(st)}
              </span>
              <button
                type="button"
                className="plan-x"
                aria-label={`Take out step ${i + 1}`}
                onClick={() => game.setPlan(steps.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}
      <ul>
        {steps.length > 0 &&
          opt(
            'Run it',
            () => {
              if (fromYesterday) game.setPlan(steps);
              game.runPlan(steps);
            },
            '',
            'plan-run',
          )}
        {opt('Add a step', () => setAdding(''))}
        {plan.length > 0 && opt('Clear it', () => game.setPlan([]))}
      </ul>
    </>
  );
}

// A place card's header: the place drawn as you'd find it, painted after the card is up so
// the card never waits on it. Repainted as the state moves; its back is kept.
function PlaceHead({ s, place, min, say }: { s: GameState } & NonNullable<ListSpec['head']>) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext('2d');
    if (!c || !g || !c.clientWidth) return;
    const px = Math.min(3, window.devicePixelRatio || 1);
    c.width = Math.round(c.clientWidth * px);
    c.height = Math.round(c.clientHeight * px);
    paintHeader(g, { ...s, min }, place, c.clientWidth, c.clientHeight, px);
  }, [s, place, min]);
  return <canvas ref={ref} className="place-head" id="place-head" role="img" aria-label={say} />;
}

// Who's around when you'd get there, and whether that means a belayer or a spotter.
function WhoList({ at, lines, cover }: NonNullable<ListSpec['who']>) {
  return (
    <div className="around" id="around">
      <p className="around-h">Who’s around at {clockShort(at)}</p>
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
      {cover && <p className="cover">{cover}</p>}
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
        <i className="r-go" style={vars({ '--w': pct(go) })} />
        {cruxes.map(([a, b]) => (
          <i key={a} className="r-cx" style={vars({ '--l': pct(a), '--w': pct(b - a) })} />
        ))}
        {!!best && <i className="r-best" style={vars({ '--l': pct(best) })} />}
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

// What the day's doing to a line outdoors: in the sun already, or in the shade and till
// when; and damp, the day after rain. Nothing on a day of rain: the rock's shut.
function rockNote(s: GameState, r: RouteDef): string {
  // Up on an expedition (Phase 24) the valley's sun and rain don't reach: its storms do.
  if (indoor(r.place) || r.exped) return '';
  const c = conditionsAt(s.seed, s.day, r.place);
  if (!c.open) return '';
  const sun = sunOn(s.seed, s.day, r.place, r.id);
  const light = dayFactor(s, r).grease
    ? ' · in the sun, smaller windows'
    : sun < CLIMB.darkFrom
      ? ` · in the shade till ${clockShort(sun)}`
      : '';
  return light + (c.seeping ? ' · damp from the rain' : '');
}

// A highball's landing, before you go: how far a fall from its crux is, what's under you,
// who's spotting, and the odds that come of it [proposed].
function landingNote(s: GameState, r: RouteDef): string {
  const c = r.cruxes[0];
  const at = c ? (c.from + c.to) / 2 : r.moves;
  const ft = Math.round(fallFt(r, at));
  const who = belayer(s);
  const pads = morePads(s) ? 'The haul’s pads' : 'One pad';
  const spot = who ? `${PEOPLE[who]?.name ?? 'a friend'} spotting` : 'nobody spotting';
  const p = landingChance(s, r, at);
  const odds = p > 0 ? `about 1 in ${Math.max(2, Math.round(1 / p))} lands badly` : 'you’ll land fine';
  return `Highball: a fall from the crux is ${ft} ft. ${pads}, ${spot}: ${odds}.`;
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
  const c = goCost(r, s);
  const cost = `${costLabel({ min: c.min })} · ${bodyNote({ energy: c.energy, skin: c.skin })}${rockNote(s, r)}`;
  const log = s.routes[route];
  const unnamed = r.open && log?.sent && !s.firsts[route];
  // Who else is at the base: a queue for the line, and beta to be had for the asking.
  const crowd = r.wall || r.exped || indoor(r.place) ? 'empty' : crowdNow(s, r.place);
  // A myth you can't read yet: no name, no grade, no beta. Just what it'll take.
  if (!revealed(s, r))
    return (
      <>
        <h3 id="sheet-title">A line you can’t read</h3>
        <p className="sub">
          There’s something here. You can’t see where it goes, or whether it goes at all. {why}.
        </p>
      </>
    );
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
      {r.highball && <p className="note">{landingNote(s, r)}</p>}
      {s.fear.includes(r.type) && (
        <p className="note" id="fear-note">
          {STYLE_NAME[r.type]} lines have had your nerve since the fall: every window tighter until you send
          one.
        </p>
      )}
      {flaring(s, r.type) && (
        <p className="note">
          Your old {MARK_NAME[s.flare!.area as Mark]} injury is flaring: tighter here. Physio settles it.
        </p>
      )}
      {soloed(s, r) && (
        <p className="note" id="solo-note">
          Free Solo: no rope. Come off and that’s the end of {s.climber.name}.
        </p>
      )}
      {(crowd === 'busy' || crowd === 'packed') && (
        <p className="note">
          {crowd === 'packed' ? 'Packed' : 'Busy'}:{' '}
          {queueMin(s, r) ? `${queueMin(s, r)} min in line for it` : 'no line for it'}
          {crowd === 'packed'
            ? ', and beta whether you want it or not.'
            : ', and people at the base who know the beta.'}
        </p>
      )}
      {canAsk(s, r) && (
        <button type="button" className="opt" onClick={() => game.ask(route)}>
          <span>Ask around for the beta</span>
          <span className="c">{CROWD.ask} min</span>
          <small>
            {log?.goes
              ? 'Somebody here has done it.'
              : 'Somebody here has done it. It’ll cost you the onsight.'}
          </small>
        </button>
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
      {!why && kitNote(s, r) && (
        <p className="note" id="kit-note">
          {kitNote(s, r)}
        </p>
      )}
      <button type="button" className="go" disabled={!!why} onClick={() => game.go()}>
        {why ?? (r.disc === 'trad' ? 'Rack up and go' : r.disc === 'sport' ? 'Tie in and go' : 'Pull on')}
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
        Nobody’s climbed this {roped(r) ? 'route' : 'line'} before you. It’s yours to name, and to grade.
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
// Tonight, from the van: what bed costs, what's left in the morning, how you'll feel and
// what the sky will do. Every number is the one sleep will use (sim/tonight.ts).
function TonightList({ t }: { t: Tonight }) {
  const nights = (n: number) => (n === 0 ? 'Tonight' : n === 1 ? 'Tomorrow night' : `In ${n} nights`);
  const [word, what] = LOAD_WORD[t.zone];
  return (
    <>
      <p className="crux">Tonight</p>
      <ul className="days" id="tonight">
        <li>
          <b>The spot</b>
          <span className="sky">{t.rough ? 'The pullout' : money(t.spot)}</span>
          <small>
            {t.rough
              ? `The card won't take the spot. A cold night: +${t.energy} energy by morning.`
              : `${SPOT_NAME[t.night.spot]}${t.night.wanted ? ` (${SPOT_NAME[t.night.wanted].replace(/^The /, 'the ').replace(/^A /, 'a ')} won’t work tonight)` : ''}. +${t.energy} energy by morning.`}
            {t.night.ticket > 0
              ? ` A ${Math.round(t.night.ticket * 100)}% chance of a ${money(SPOT.tickets.fine)} ticket.`
              : ''}
            {t.night.heat
              ? ' The heater’s on: a tank of propane.'
              : t.night.cold < 0
                ? ` Winter: ${t.night.cold} energy of that is the cold.`
                : ''}
            {t.hungry ? ` You'd go to bed hungry, and it costs you ${BODY.hungryNight} of that.` : ''}
          </small>
        </li>
        <li id="supplies">
          <b>Supplies</b>
          <span className="sky">{Math.round(t.supplies)}</span>
          <small>
            {t.sick
              ? `You have ${t.sick}. `
              : t.sickOdds >= 0.05
                ? `A ${Math.round(t.sickOdds * 100)}% chance of waking sick. `
                : ''}
            {t.supplies < SUPPLIES.low
              ? 'Water and washing by morning: low. The lake, the market or the gym.'
              : 'Water and washing by morning.'}
          </small>
        </li>
        <li id="psyche">
          <b>Psyche</b>
          <span className="sky">{`${t.psyche.word[0]!.toUpperCase()}${t.psyche.word.slice(1)}`}</span>
          <small>
            {t.psyche.up.length ? `Up for ${and(t.psyche.up)}. ` : ''}
            {t.psyche.down.length ? `Down for ${and(t.psyche.down)}. ` : ''}
            {!t.psyche.up.length && !t.psyche.down.length ? 'A day like any other. ' : ''}
            {t.psyche.word === 'low'
              ? 'Every window’s a little tighter for it.'
              : t.psyche.word === 'psyched'
                ? 'Every window’s a little wider for it.'
                : ''}
          </small>
        </li>
        {t.same && (
          <li>
            <b>Meals</b>
            <span className="sky">The same</span>
            <small>
              {`${t.same[0]!.toUpperCase()}${t.same.slice(1)}, ${FOOD.same} meals running. Your body is starting to notice.`}
            </small>
          </li>
        )}
        {(t.living.cost > 0 || t.living.skimped) && (
          <li>
            <b>Living</b>
            <span className="sky">{t.living.skimped ? 'Dirtbag' : money(t.living.cost)}</span>
            <small>
              {t.living.skimped
                ? `The card won't stretch to ${LIVING[t.living.tier][0].toLowerCase()} tonight.`
                : `${LIVING[t.living.tier][0]}: +${t.living.energy} of that energy, and +${t.living.skin} skin.`}
            </small>
          </li>
        )}
        <li>
          <b>Bills</b>
          <span className="sky">{money(t.bills)}</span>
          <small>{nights(t.billsIn)}: registration and insurance.</small>
        </li>
        <li>
          <b>Morning</b>
          <span className="sky">{money(t.cash)}</span>
          <small>
            {t.cash > 0
              ? t.runway > 0
                ? `About ${t.runway} day${t.runway === 1 ? '' : 's'} without a shift.`
                : 'Not a full day without a shift.'
              : t.card > 0
                ? `On the card. It takes ${money(t.card)} more.`
                : "The card's maxed."}
          </small>
        </li>
        <li>
          <b>Body</b>
          <span className="sky">{word}</span>
          <small>
            {t.off > 0 ? `${t.off} more day${t.off === 1 ? '' : 's'} off the rock. ` : ''}
            {what}
          </small>
        </li>
        <li data-sky={t.sky}>
          <b>Tomorrow</b>
          <span className="sky">{SKY_NAME[t.sky]}</span>
        </li>
      </ul>
    </>
  );
}

function billsWhen(day: number): string {
  const n = Math.ceil(day / 7) * 7 - day + 1;
  return n === 1 ? 'tonight' : `in ${n} nights`;
}

// Your journal: you as a climber, and what's happened lately. The log is the sim's own,
// kept in the save, newest first.
function JournalBody({ game, page, s }: { game: Game; page: JournalPage; s: GameState }) {
  return (
    <>
      <h3 id="sheet-title">{s.climber.name || 'You'}</h3>
      <div className="chips pages">
        {JOURNAL_PAGES.map(([p, label]) => (
          <button
            type="button"
            key={p}
            className="chip"
            id={`j-${p}`}
            aria-pressed={page === p}
            onClick={() => game.openSheet({ k: 'journal', page: p })}
          >
            {label}
          </button>
        ))}
      </div>
      {page === 'you' ? (
        <YouBody game={game} s={s} />
      ) : page === 'words' ? (
        <WordsBody />
      ) : page === 'book' ? (
        <BookBody s={s} />
      ) : page === 'board' ? (
        <BoardBody s={s} />
      ) : (
        <LatelyBody s={s} />
      )}
    </>
  );
}

const JOURNAL_PAGES: [JournalPage, string][] = [
  ['you', 'You'],
  ['lately', 'Lately'],
  ['board', 'Board'],
  ['book', 'Record'],
  ['words', 'Words'],
];

// Phase 23.6: this week's board, each job's progress and pay. It pays itself.
function BoardBody({ s }: { s: GameState }) {
  const left = boardWeek(s.day) * WEEK_DAYS - s.day + 1;
  const now = s.board.week === boardWeek(s.day);
  return (
    <div id="board">
      <p className="sub">
        {now
          ? `This week’s, up at the café: ${left} day${left > 1 ? 's' : ''} left. Each pays the moment it’s done.`
          : 'This week’s goes up the next thing you do.'}
      </p>
      {now &&
        s.board.jobs.map((job) => {
          const j = BOARD_JOBS[job.id];
          if (!j) return null;
          const n = Math.min(j.n, jobProgress(s, job));
          return (
            <Fragment key={job.id}>
              <p className="crux">
                {job.paid ? '✓ ' : ''}
                {j.title} · {money(j.cash)}
              </p>
              <p className="sub">
                {jobText(j, job.grade)} {job.paid ? 'Paid.' : `${n} of ${j.n}.`}
              </p>
            </Fragment>
          );
        })}
    </div>
  );
}

// Phase 23.1: the Record Book, newest first, each entry with its story.
function BookBody({ s }: { s: GameState }) {
  const got = OPEN_RECORD.filter((r) => s.record[r.id] !== undefined).sort(
    (a, b) => s.record[b.id]! - s.record[a.id]!,
  );
  const left = OPEN_RECORD.length - got.length;
  return (
    <div id="book">
      <p className="sub">
        {got.length
          ? `${got.length} of ${OPEN_RECORD.length} in the book.${left ? ` ${left} still to come.` : ''}`
          : 'Nothing in it yet. It fills up.'}
      </p>
      {got.map((r) => (
        <Fragment key={r.id}>
          <p className="crux">
            {r.title} · day {s.record[r.id]}
          </p>
          <p className="sub">{r.story}</p>
        </Fragment>
      ))}
    </div>
  );
}

// Phase 22.9c: the glossary, by group.
function WordsBody() {
  return (
    <div id="words">
      {(Object.keys(WORD_GROUP) as WordGroup[]).map((g) => (
        <Fragment key={g}>
          <p className="crux">{WORD_GROUP[g]}</p>
          <dl className="words">
            {WORDS.filter((w) => w.group === g).map((w) => (
              <Fragment key={w.term}>
                <dt>{w.term}</dt>
                <dd>{w.says}</dd>
              </Fragment>
            ))}
          </dl>
        </Fragment>
      ))}
    </div>
  );
}

function LatelyBody({ s }: { s: GameState }) {
  if (!s.log.length) return <p className="sub">Nothing yet. Give it a day.</p>;
  const byDay: [number, LogLine[]][] = [];
  for (let i = s.log.length - 1; i >= 0; i--) {
    const l = s.log[i]!;
    const last = byDay[byDay.length - 1];
    if (last?.[0] === l.day) last[1].push(l);
    else byDay.push([l.day, [l]]);
  }
  return (
    <div id="log">
      {byDay.map(([day, lines]) => (
        <Fragment key={day}>
          <p className="crux">Day {day}</p>
          <ul className="log">
            {lines.map((l, i) => (
              <li key={i}>
                <b>{clock(l.min)}</b>
                <span>{l.text}</span>
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </div>
  );
}

// Phase 23.2: where you came from, what it gives and costs, and the talents you've found.
// Phase 16.1: how old you are, when hanging it up is yours, and the countdown at the end.
function AgeRow({ game, s }: { game: Game; s: GameState }) {
  const age = ageOf(s);
  const left = daysLeft(s);
  const can = !retireBlocked(s);
  return (
    <>
      <p className="crux">Age</p>
      <p className="sub" id="age">
        {age}.{' '}
        {left !== null
          ? `Your body calls it at ${AGE.forced}: ${left} day${left === 1 ? '' : 's'} left.`
          : age >= AGE.from
            ? `Hanging it up is yours whenever you want it; your body calls it at ${AGE.forced}.`
            : `Hanging it up is yours from ${AGE.from}; your body calls it at ${AGE.forced}.`}
      </p>
      {can && (
        <button type="button" className="opt" id="hangup" onClick={() => game.openSheet({ k: 'hangup' })}>
          <span>Hang it up</span>
          <small>For good. The tally’s all that’s left.</small>
        </button>
      )}
    </>
  );
}

function OriginRow({ s }: { s: GameState }) {
  const o = originOf(s);
  const found = s.talents.known.map((id) => TALENTS[id]).filter((t) => !!t);
  if (!o && s.origin !== CAME_ACROSS && !found.length) return null;
  const t = o ? originTerms(o) : null;
  return (
    <>
      <p className="crux">{o ? o.name : s.origin === CAME_ACROSS ? CAME_ACROSS_NAME : 'What’s in you'}</p>
      {t && (
        <p className="sub" id="origin">
          {[...t.perks, ...t.costs].join(' ')}
        </p>
      )}
      {s.origin === CAME_ACROSS && <p className="sub">From the old game, as you were.</p>}
      {found.map((x) => (
        <p className="sub" key={x!.name}>
          {x!.name}: {x!.desc}
        </p>
      ))}
    </>
  );
}

// Phase 23.3: what you're climbing for, its perk and how far up its ambition you are; or,
// once asked and put off, the way back to the asking.
function CallingRow({ game, s }: { game: Game; s: GameState }) {
  const c = callingOf(s);
  if (!c) {
    if (!s.calling.offered) return null;
    return (
      <>
        <p className="crux">Calling</p>
        <button
          type="button"
          className="opt"
          id="calling-open"
          onClick={() => game.openSheet({ k: 'calling' })}
        >
          <span>What are you climbing for?</span>
        </button>
      </>
    );
  }
  const t = callingTerms(c);
  return (
    <>
      <p className="crux">{c.name}</p>
      <p className="sub" id="calling">
        {[...t.perks, ...t.costs].join(' ')}
      </p>
      {c.rungs.map((aim, i) => (
        <p className="sub" key={i}>
          {s.calling.rungs[i] !== undefined
            ? `✓ ${rungText(aim)}, day ${s.calling.rungs[i]}.`
            : `○ ${rungText(aim)}.`}
        </p>
      ))}
    </>
  );
}

// Phase 23.4: your paths, a tier at a time, what you've mastered and the quirk you've got.
function PathsRow({ game, s }: { game: Game; s: GameState }) {
  const taken = pathsTaken(s);
  const full = taken.length >= PATH.max;
  return (
    <>
      <p className="crux">Paths</p>
      <p className="sub">
        {taken.length ? `On ${taken.map((id) => PATHS[id]!.name).join(' and ')}.` : 'None claimed yet.'}{' '}
        {full ? `${PATH.max} is all you get.` : `You can be on ${PATH.max}.`}
      </p>
      {OPEN_PATHS.filter((id) => !full || taken.includes(id)).map((id) => {
        const p = PATHS[id]!;
        const n = tiersOn(s, id);
        const why = pathBlocked(s, id);
        const next = p.tiers[n];
        return (
          <div key={id} id={`path-${id}`}>
            <p className="sub">
              <b>{p.name}</b>. {p.blurb}
              {n === p.tiers.length ? ` ${p.title}.` : ''}
            </p>
            {p.tiers.slice(0, n).map((t) => (
              <p className="sub" key={t.name}>
                ✓ {t.name}: {edgeText(t.edge)}
              </p>
            ))}
            {next &&
              (why ? (
                <p className="sub">
                  ○ {next.name}: V{PATH.gates[n]} and {deedText(next.deed)}. {edgeText(next.edge)}
                </p>
              ) : (
                <button
                  type="button"
                  className="opt"
                  id={`claim-${id}`}
                  onClick={() => game.dispatch({ t: 'path', id })}
                >
                  <span>Claim {next.name}</span>
                  <small>{edgeText(next.edge)}</small>
                </button>
              ))}
          </div>
        );
      })}
      {s.mastery.length > 0 && (
        <>
          <p className="crux">Mastery</p>
          {s.mastery.map((k) => {
            const m = masteryOf(k);
            if (!m) return null;
            return (
              <p className="sub" key={k}>
                {m.name}: {edgeText(m.edge)}
              </p>
            );
          })}
        </>
      )}
      {s.quirk && (
        <>
          <p className="crux">{QUIRKS[s.quirk]!.name}</p>
          <p className="sub" id="quirk">
            {edgeText(QUIRKS[s.quirk]!.edge)}
          </p>
        </>
      )}
    </>
  );
}

// Phase 23.7: the Homecoming, once you've people enough to come; armed, or had.
function HomeRow({ game, s }: { game: Game; s: GameState }) {
  const h = s.year.home;
  if (typeof h === 'number')
    return (
      <>
        <p className="crux">The Homecoming</p>
        <p className="sub">Day {h}. Everyone came.</p>
      </>
    );
  const crowd = homeCrowd(s);
  if (h === 'none' && !homeReady(s)) return null;
  return (
    <>
      <p className="crux">The Homecoming</p>
      <p className="sub">
        {crowd.join(', ')}: close enough now to come out for it. One send outside, whenever you’re ready, and
        they’ll all be there. Once.
      </p>
      <button
        type="button"
        className="opt"
        id="home"
        onClick={() => game.dispatch({ t: 'home', arm: h !== 'armed' })}
      >
        <span>{h === 'armed' ? 'Not yet' : 'Tell them'}</span>
        <small>
          {h === 'armed'
            ? 'Your next send outside. Or put it off.'
            : `${money(HOME.cash)} and a lift, for the next send outside.`}
        </small>
      </button>
    </>
  );
}

const upFirst = (w: string) => w[0]!.toUpperCase() + w.slice(1);

// Phase 23.5: where you stand with each crowd, what it's got you, and the calls you've made.
function SceneRow({ s }: { s: GameState }) {
  const perks = perksOf(s);
  const made = [
    ...s.scene.stances.map((x) => ({ day: x.day, line: stanceAnswer(x.id, x.opt)?.stance })),
    ...s.scene.echoes.map((x) => {
      const e = ECHOES[x.id];
      return { day: x.day, line: e ? (x.turned ? e.turn : e.hold).stance : undefined };
    }),
  ]
    .filter((x) => !!x.line)
    .sort((a, b) => a.day - b.day);
  return (
    <>
      <p className="crux">The scene</p>
      <p className="sub" id="scene">
        {whereYouStand(s)}{' '}
        {(Object.keys(FACTIONS) as Faction[])
          .map((f) => `${upFirst(FACTIONS[f].name)}: ${standingWord(s.scene[f])}.`)
          .join(' ')}
      </p>
      {perks.map((p) => (
        <p className="sub" key={p.name}>
          {p.name}:{' '}
          {[edgeText(p.edge), p.permits ? 'Permits cost you nothing.' : ''].filter(Boolean).join(' ')}
        </p>
      ))}
      {made.map((x, i) => (
        <p className="sub" key={i}>
          Day {x.day}. {x.line}
        </p>
      ))}
    </>
  );
}

function YouBody({ game, s }: { game: Game; s: GameState }) {
  const c = s.climber;
  const g = gradeOf(c.skills);
  const scale = needFor(g + 2);
  const room = headroom(s);
  const bills = weeklyBills(s);
  return (
    <>
      <p className="sub">
        {startName(c.start)}, climbing V{g}. V{g + 1} comes at an average of {needFor(g + 1).toFixed(1)}{' '}
        across the five; you're at {average(c.skills).toFixed(1)}.
      </p>
      <ul className="skills">
        {SKILLS.map((k) => (
          <li key={k}>
            <span>{SKILL_NAME[k]}</span>
            <i style={vars({ '--v': Math.min(1, c.skills[k] / scale).toFixed(3) })} />
            <b>{c.skills[k].toFixed(1)}</b>
          </li>
        ))}
      </ul>
      <ActRow s={s} />
      <OriginRow s={s} />
      <AgeRow game={game} s={s} />
      <CallingRow game={game} s={s} />
      <PathsRow game={game} s={s} />
      <SceneRow s={s} />
      <HomeRow game={game} s={s} />
      <p className="crux">Body</p>
      <p className="sub">
        Energy {Math.round(s.energy)}, skin {Math.round(s.skin)}, food {Math.round(s.fed)}.
        {s.fed < BODY.weakBelow ? ` Under ${BODY.weakBelow} food, every window shrinks.` : ''}
      </p>
      <p className="crux">Load</p>
      <LoadRow s={s} />
      {(s.scars.length > 0 || s.fear.length > 0) && (
        <p className="sub" id="history">
          {s.scars.length > 0 &&
            `Old injuries: your ${s.scars.map((m) => MARK_NAME[m as Mark]).join(', ')}. Lines that load them are riskier. `}
          {s.fear.length > 0 &&
            `Afraid of ${s.fear.map((f) => STYLE_NAME[f as Style].toLowerCase()).join(' and ')} lines until you send one.`}
        </p>
      )}
      {s.guitar > 0 && (
        <p className="sub" id="guitar">
          {`Guitar: ${RANK_NAME[guitarRank(s.guitar)].toLowerCase()}, from your sets outside the café.`}
        </p>
      )}
      <KitRows s={s} />
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

// Your kit: what you've got and how it's holding up. Shoes show their rubber as a bar.
function KitRows({ s }: { s: GameState }) {
  const owned = Object.entries(s.gear).filter(([id, n]) => GEAR[id] && (n > 0 || GEAR[id]!.kind !== 'owned'));
  return (
    <>
      <p className="crux">Kit</p>
      <ul className="skills" id="kit">
        {owned.map(([id, n]) => (
          <li key={id} title={GEAR[id]!.what}>
            <span>{GEAR[id]!.name}</span>
            {GEAR[id]!.kind === 'wears' ? (
              <i
                className={n < KIT.shoes.worn ? 'hot' : undefined}
                style={vars({ '--v': (n / 100).toFixed(3) })}
              />
            ) : (
              <i className="none" />
            )}
            <b>{kitState(id, n)}</b>
          </li>
        ))}
      </ul>
      <p className="crux">The van</p>
      <ul className="skills" id="van">
        {PARTS.map((p) => (
          <li key={p}>
            <span>{PART_NAME[p]}</span>
            <i
              className={s.van[p] < 40 ? 'hot' : undefined}
              style={vars({ '--v': (s.van[p] / 100).toFixed(3) })}
            />
            <b>{partWord(s.van[p])}</b>
          </li>
        ))}
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
            style={vars({ '--v': Math.min(1, r / LOAD.fried).toFixed(3) })}
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

// The story (Phase 16.2): the act and the stage you're on, why, and how far along it is; or
// that it's all done.
function ActRow({ s }: { s: GameState }) {
  const g = currentGoal(s);
  const n = actOf(s);
  if (!g) {
    const last = STORY[STORY.length - 1]!;
    return (
      <>
        <p className="crux">{last.title} · done</p>
        <p className="sub">{last.end.text}</p>
      </>
    );
  }
  const p = progress(s, g.aim);
  const st = stageOf(s)!;
  return (
    <>
      <p className="crux" id="act">
        Act {ROMAN[n - 1]}, {STORY[n - 1]!.title} · {st.n} of {st.of} · {g.title}
      </p>
      <p className="sub">
        {g.text} <b>{goalDesc(g)}</b>
        {p.need > 1 && counted(g.aim) ? ` (${Math.min(p.have, p.need)} of ${p.need})` : ''}.
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

// The day at Roadside: the sun crosses its wall from the first line to the last.
function skyLine(c: Conditions): string {
  const t = clockShort(c.greaseFrom);
  const all = clockShort(c.greaseFrom + CLIMB.sunSweep);
  const wet = c.seeping ? ' Still seeping from the rain.' : '';
  switch (c.sky) {
    case 'rain':
      return "The crag's shut. The gym isn't.";
    case 'prime':
      return `Cold and dry: the best friction. The sun crosses the wall from ${t} to ${all}.${wet}`;
    case 'hot':
      return `Greasy from ${t}, and the whole wall by ${all}.${wet}`;
    default:
      return `The sun crosses the wall from ${t} to ${all}.${wet}`;
  }
}

function WeekBody({ game, s }: { game: Game; s: GameState }) {
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
          // A trip you've paid for out of the valley has its own sky: worth knowing before
          // three hours of gas.
          const away = s.unlocked
            .filter((id) => PLACES[id]?.ownSky)
            .map((id) => `${PLACES[id]!.name}: ${SKY_NAME[skyAt(s.seed, s.day + i, id)].toLowerCase()}.`);
          return (
            <li key={i} data-sky={c.sky}>
              <b>{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `Day ${s.day + i}`}</b>
              <span className="sky">{SKY_NAME[c.sky]}</span>
              <small>{[skyLine(c), ...away].join(' ')}</small>
            </li>
          );
        })}
      </ul>
      <p className="sub">
        Registration and insurance, {money(weeklyBills(s))}, {billsWhen(s.day)}.
      </p>
      <ShiftRows game={game} s={s} />
      <SpotRows game={game} s={s} />
      <PlanRows game={game} s={s} />
      <LivingRows game={game} s={s} />
    </>
  );
}

// The week's shifts (Phase 22.1): what each job has posted, today's to walk in to and the
// rest to sign up for, with where you stand at every job you've worked.
function ShiftRows({ game, s }: { game: Game; s: GameState }) {
  const days = Array.from({ length: WORK.ahead + 1 }, (_, i) => s.day + i);
  const known = Object.keys(JOBS).filter((j) => s.jobs[j] || s.strikes[j] || benchedUntil(s, j) !== null);
  return (
    <>
      <p className="crux">Shifts</p>
      <p className="sub">
        Sign up to {WORK.ahead} days ahead. Only those count toward a raise: today&rsquo;s are walk-ins. Skip
        one you signed up for and it&rsquo;s a warning; {WORK.strikes} cost the job.
      </p>
      <ul className="days shifts" id="shifts">
        {days.map((d) => (
          <li key={d}>
            <b>{d === s.day ? 'Today' : dayName(d)}</b>
            <span className="posts">
              {Object.keys(JOBS)
                .filter((j) => isPosted(s.seed, j, d))
                .map((j) => {
                  const on = signedUp(s, j, d);
                  const why = d === s.day ? null : signupBlocked(s, j, d, !on);
                  return (
                    <button
                      type="button"
                      key={j}
                      id={`sh-${j}-${d - s.day}`}
                      className="post"
                      aria-pressed={on}
                      disabled={d === s.day || !!why}
                      title={why ?? undefined}
                      onClick={() => game.signup(j, d, !on)}
                    >
                      {JOBS[j]!.name}
                    </button>
                  );
                })}
            </span>
          </li>
        ))}
      </ul>
      {known.length > 0 && (
        <p className="sub" id="ranks">
          {known.map((j) => workLine(s, j)).join(' ')}
        </p>
      )}
    </>
  );
}

function workLine(s: GameState, job: string): string {
  const n = s.strikes[job] ?? 0;
  const back = benchedUntil(s, job);
  if (back !== null) return `${JOBS[job]!.name}: let go, back from day ${back}.`;
  return `${JOBS[job]!.name}: ${rankName(s, job)}${n ? `, ${n} warning${n > 1 ? 's' : ''}` : ''}.`;
}

// Where you park (Phase 22.2b): chosen here, and it stays until you change it.
const SPOT_WHAT: Record<SpotId, string> = {
  lot: 'Home. Stay too many nights running and the parking people notice.',
  trailhead: 'Free, up the road. Cold, and colder in winter.',
  truckstop: 'Cheap, lit all night, and loud.',
  driveway: 'A friend’s place. A good night, now and then.',
  ridge: 'The locals’ spot above the valley. Stars, and wind.',
};

function SpotRows({ game, s }: { game: Game; s: GameState }) {
  return (
    <>
      <p className="crux">Where you park</p>
      <div role="radiogroup" aria-label="Where you park" id="spots">
        {SPOT_IDS.map((k) => {
          const d = SPOTS[k];
          const why = spotBlocked(s, k);
          const cost = d.cost + d.gas;
          const bits = [
            cost ? `${money(cost)} a night${d.gas ? ' with gas' : ''}` : 'free',
            d.drive ? `${d.drive} min back in the morning` : '',
            d.energy ? `${d.energy > 0 ? '+' : ''}${d.energy} energy` : '',
          ].filter(Boolean);
          return (
            <button
              type="button"
              key={k}
              id={`spot-${k}`}
              className={`beta choice${why ? ' locked' : ''}`}
              role="radio"
              aria-checked={s.spot === k}
              aria-disabled={!!why}
              onClick={() => !why && game.park(k)}
            >
              <span className="dot" />
              <span>
                {SPOT_NAME[k]} · {bits.join(', ')}
              </span>
              <small>{why ?? SPOT_WHAT[k]}</small>
            </button>
          );
        })}
      </div>
    </>
  );
}

// Insurance (Phase 22.4a): chosen here, paid with the week's bills.
const PLAN_NAME: Record<Plan, string> = {
  none: 'No insurance',
  catastrophic: 'Catastrophic',
  full: 'Full cover',
};

function planNote(p: Plan): string {
  const d = PLANS[p];
  const [, t2, t3] = INJURY.clinic;
  if (d.copay !== undefined)
    return `Every clinic bill is ${money(d.copay)}. Physio and cortisone for a quarter.`;
  return `A bad injury's bill: ${money(t2! * d.bill)}, or ${money(t3! * d.bill)} for the worst.`;
}

function PlanRows({ game, s }: { game: Game; s: GameState }) {
  return (
    <>
      <p className="crux">Insurance</p>
      <div role="radiogroup" aria-label="Insurance" id="plans">
        {(Object.keys(PLANS) as Plan[]).map((k) => (
          <button
            type="button"
            key={k}
            id={`plan-${k}`}
            className="beta choice"
            role="radio"
            aria-checked={s.insurance === k}
            onClick={() => game.insure(k)}
          >
            <span className="dot" />
            <span>
              {PLAN_NAME[k]} · {premiumOf(s, k) ? `${money(premiumOf(s, k))} a week` : 'free'}
            </span>
            <small>{planNote(k)}</small>
          </button>
        ))}
      </div>
    </>
  );
}

const LIVING: Record<Lifestyle, [string, string]> = {
  dirtbag: ['Dirtbag', 'The van, a foam pad, and whatever’s in the cooler.'],
  comfortable: ['Comfortable', 'A proper pad, a gym shower, salve for your tips.'],
  plush: ['Plush', 'The good bag, clean clothes, a hot shower every night.'],
};

// How you live: chosen here, paid at the van every night, and on Tonight's list.
function LivingRows({ game, s }: { game: Game; s: GameState }) {
  return (
    <>
      <p className="crux">How you live</p>
      <div role="radiogroup" aria-label="How you live" id="living">
        {(Object.keys(LIFESTYLE) as Lifestyle[]).map((k) => {
          const l = LIFESTYLE[k];
          return (
            <button
              type="button"
              key={k}
              id={`live-${k}`}
              className="beta choice"
              role="radio"
              aria-checked={s.lifestyle === k}
              onClick={() => game.live(k)}
            >
              <span className="dot" />
              <span>
                {LIVING[k][0]} · {l.cost ? `${money(Math.round(l.cost * livingMult(s)))} a night` : 'free'}
              </span>
              <small>
                {LIVING[k][1]}
                {l.cost ? ` +${l.energy} energy and +${l.skin} skin by morning.` : ''}
              </small>
            </button>
          );
        })}
      </div>
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
      <p className="crux">Sound</p>
      <div role="radiogroup" aria-label="Sound">
        {choice('sound', 'on', 'On')}
        {choice('sound', 'quiet', 'Quiet')}
        {choice('sound', 'off', 'Off')}
      </div>
      <p className="crux">Vibration</p>
      <div role="radiogroup" aria-label="Vibration">
        {choice('buzz', 'on', 'On, where the phone can')}
        {choice('buzz', 'off', 'Off')}
      </div>
      <OldCareer />
      <ul>
        <li>
          <button
            type="button"
            className="opt"
            id="b-credits"
            onClick={() => game.openSheet({ k: 'credits' })}
          >
            <span>Credits</span>
            <span className="c" />
          </button>
        </li>
      </ul>
    </>
  );
}

// The Line's credits (Phase 16.3): the same roll, under the story's last title, then on.
function LineCredits({ game }: { game: Game }) {
  return (
    <>
      <h3 id="sheet-title">{LINE_SCENE.credits.title}</h3>
      <p className="sub">{LINE_SCENE.credits.sub}</p>
      <CreditsBody titled={false} />
      <ul>
        <li>
          <button type="button" className="opt" onClick={() => game.openSheet({ k: 'line', step: 3 })}>
            <span>Go on</span>
            <span className="c" />
          </button>
        </li>
      </ul>
    </>
  );
}

// Who made what, from ui/credits.ts; sound from the licence ledger.
function CreditsBody({ titled = true }: { titled?: boolean }) {
  return (
    <>
      {titled && <h3 id="sheet-title">Credits</h3>}
      {CREDITS.map((c) => (
        <Fragment key={c.head}>
          <p className="crux">{c.head}</p>
          <ul className="days credits" id={`credits-${c.head.toLowerCase().replace(/\s+/g, '-')}`}>
            {c.lines.map((l) => (
              <li key={l.what}>
                <b>{l.what}</b>
                <small>{l.who}</small>
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </>
  );
}

// v0.956's saves, still in this browser after the old game retired: kept as a file on request.
function OldCareer() {
  const [there] = useState(() => legacyFile() !== null);
  const [kept, setKept] = useState(false);
  if (!there) return null;
  return (
    <>
      <p className="crux">v0.956</p>
      <button type="button" className="opt" id="s-export" onClick={() => setKept(saveLegacyFile())}>
        <span>{kept ? 'Saved. Keep it somewhere safe.' : 'Save your v0.956 career'}</span>
        <span className="c" />
        <small>
          The old game is retired, but its saves are still in this browser. This keeps them as a file.
        </small>
      </button>
    </>
  );
}
