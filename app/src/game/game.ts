// The game as the player drives it: the sim's state, what's on screen, and the loop that
// moves between them. Every change to the state goes through dispatch() into the sim; this
// class only decides what to show and when, and animates walking, driving and the wall.

import {
  act,
  ACTS,
  attemptInput,
  CLIMB,
  dogOffered,
  goResult,
  gradeLabel,
  isNight,
  lineName,
  newGame,
  PEOPLE,
  PLACES,
  routeOfId,
  indoor,
  routesAt,
  startAttempt,
  STEP,
  stepAttempt,
  talkStart,
  THINGS,
  whereIs,
  whereNow,
  type Action,
  type Attempt,
  type AttemptEvent,
  type FallRun,
  type GameEvent,
  type GameState,
  type GoStyle,
  type PhaseId,
  type SendStyle,
  type Skills,
  unfinishedSolo,
  SPEED,
  speedBlocked,
  speedTime,
} from '../sim';
import { bedFor, ON_THE_MAP } from '../audio/beds';
import { actCue, VERB_CUES } from '../audio/cues';
import { Sound } from '../audio/sound';
import { arcTable, atLen, clamp, type Pt } from '../view/kit/geom';
import {
  DIM_PINS,
  MAP_PINS,
  OY,
  presentIn,
  SCENES,
  spotHot,
  W,
  WAKE_X,
  widthOf,
  Z,
  type Hot,
  type Use,
} from '../view/layout';
import { mapArt } from '../view/paint/map';
import { mapLeft, render, type Frame } from '../view/render';
import { drivePath } from '../view/valley';
import * as persist from './persist';
import { loadPlans, noted, savePlans, SLEEP, wipePlans, type PlanStep, type Plans } from './plan';
import { createStore, type Store } from './store';

export type View = 'scene' | 'map' | 'wall';

export type JournalPage = 'you' | 'lately';

// Past this many words a line goes on a card, not a toast: nobody reads 40 words in the
// few seconds a toast stays up.
export const TOAST_WORDS = 30;

export type SheetId =
  | { k: 'van' }
  | { k: 'cragVan' }
  | { k: 'desk' }
  | { k: 'board' }
  | { k: 'place'; id: string }
  | { k: 'beta'; route: string }
  | { k: 'fall'; route: string; fall: FallRun; notes: string[]; gains: Partial<Skills>; best: number | null }
  // `first`: the line's first send, which gets a card.
  | {
      k: 'sent';
      route: string;
      style: GoStyle;
      go: number;
      gains: Partial<Skills>;
      notes: string[];
      first: boolean;
    }
  // The send card, and the sheet to go back to.
  | { k: 'card'; route: string; back: SheetId }
  // A first ascent to name: straight after the send (then the send card), or later from
  // the wall if you walked off without naming it.
  | {
      k: 'fa';
      route: string;
      style: SendStyle;
      go: number;
      gains: Partial<Skills>;
      notes: string[];
      from: 'send' | 'wall';
    }
  | { k: 'dog' }
  | { k: 'act' }
  // Your journal: you as a climber, or the log of what's happened lately.
  | { k: 'journal'; page: JournalPage }
  // A line too long for a toast, on a card you put down yourself.
  | { k: 'note'; text: string; day: number; min: number }
  | { k: 'week' }
  | { k: 'settings' }
  | { k: 'credits' }
  | { k: 'restart' }
  | { k: 'plan' }
  // Phase 21.3: sessions where you are, and the phases.
  | { k: 'train' }
  | { k: 'phases' }
  // Phase 21.5: a wall and its pitches; the expeditions, and one of them.
  | { k: 'wall'; id: string }
  | { k: 'expeds' }
  | { k: 'exped'; id: string }
  // Phase 21.6: the speed wall, and how a Free Solo run ended.
  | { k: 'speed' }
  | { k: 'dead' };

export interface Hud {
  day: number;
  min: number;
  cash: number;
  energy: number;
  skin: number;
  fed: number;
}

export interface Ui {
  state: GameState;
  view: View;
  scene: string;
  sheet: SheetId | null;
  talk: { talk: string; node: string } | null;
  toast: { text: string; n: number } | null;
  stamp: string | null;
  fading: boolean;
  hint: string | null;
  hud: Hud;
  climbing: boolean;
  driving: boolean;
  wallRoute: string;
  settings: persist.Settings;
  still: boolean;
  // The screen's width in logical pixels: W in portrait, wider on a wider window.
  w: number;
  // The plan you've made, and yesterday as you played it.
  plans: Plans;
  // A plan being run: its steps, the one it's on, whether it's waiting while you climb, and
  // why it stopped, if the day refused it.
  plan: { steps: PlanStep[]; i: number; waiting: boolean; stopped: string | null } | null;
  // A run on the speed wall: the lights, how many holds you've taken, and how it ended.
  speed: SpeedUi | null;
}

export interface SpeedUi {
  phase: 'set' | 'climb' | 'done';
  lights: number;
  holds: number;
  slips: number;
  // The clock's time, or null for a false start; and your best after it.
  time: number | null;
  pb: number | null;
  newPb: boolean;
}

// The speed wall's start: a light a second, and go on the third.
const SPEED_LIGHT = 1;
const SPEED_GO = 3;
// A same-hand grab: you slip and lose this long.
const SPEED_SLIP = 0.35;

export interface Fast {
  cam: number;
  att: Attempt | null;
}

interface Trip {
  to: string;
  pts: Pt[];
  L: number[];
  t: number;
  dur: number;
}

const FADE_MS = 230;
// A plan's pause between steps: long enough to read what the last one said.
const PLAN_BEAT = 700;
const WALK_SPEED = 118;
const hudOf = (s: GameState): Hud => ({
  day: s.day,
  min: s.min,
  cash: s.cash,
  energy: s.energy,
  skin: s.skin,
  fed: s.fed,
});

function freshSeed(): string {
  const b = new Uint32Array(2);
  crypto.getRandomValues(b);
  return `dirtbag-${b[0]!.toString(36)}${b[1]!.toString(36)}`;
}

const stillFor = (s: persist.Settings, system: boolean) =>
  s.motion === 'reduce' || (s.motion === 'system' && system);

export class Game {
  state: GameState;
  readonly ui: Store<Ui>;
  readonly fast: Store<Fast>;
  // Whether the device asks for reduced motion; the settings can override it.
  private readonly systemStill: boolean;

  // The run on the speed wall: seconds since the lights started, when the last grab was.
  private speedRun: { t: number; last: number; slipUntil: number } | null = null;
  private player = { x: 300, tx: 300, dir: 1, phase: 0, speed: 0, onArrive: null as (() => void) | null };
  private scout = { x: 436, wag: 0 };
  // The sound, and when on the wall the next breath is due, in the go's own seconds.
  readonly sound = new Sound();
  private breathAt = 0;
  private cam = 0;
  // How much of a scene the screen sees across, in world pixels.
  private vw = W / Z;
  private att: Attempt | null = null;
  private acc = 0;
  private trip: Trip | null = null;
  private busy = false;
  // While a drive plays out, the HUD and the toasts show what you knew before you left.
  private held: { hud: Hud; lines: string[] } | null = null;
  private toasts: string[] = [];
  private toastTimer = 0;
  private toastN = 0;
  private toastShown = 0;
  private keysWalking = false;
  // Cards wait until nothing else is open, so one never lands on top of the send that
  // caused it. The end of an act also waits until you're back in a scene.
  private cards: SheetId[] = [];
  // Today as you've played it, to offer as tomorrow's plan; and a plan being run.
  private today: PlanStep[] = [];
  private run: { steps: PlanStep[]; i: number } | null = null;

  constructor(opts: { still?: boolean } = {}) {
    this.systemStill = !!opts.still;
    const settings = persist.loadSettings();
    const b = persist.boot(freshSeed);
    // A game closed halfway up a solo comes back to the fall.
    this.state = unfinishedSolo(b.state);
    if (this.state !== b.state) persist.save(this.state);
    const home = PLACES[this.state.at];
    this.ui = createStore<Ui>({
      state: this.state,
      view: home?.scene ? 'scene' : 'map',
      scene: home?.scene ?? 'lot',
      sheet: this.state.dead
        ? { k: 'dead' }
        : this.state.expedition
          ? { k: 'exped', id: this.state.expedition.id }
          : home?.scene
            ? null
            : { k: 'place', id: this.state.at },
      talk: null,
      toast: null,
      stamp: null,
      fading: false,
      hint: null,
      hud: hudOf(this.state),
      climbing: false,
      driving: false,
      wallRoute: 'pump',
      settings,
      still: stillFor(settings, this.systemStill),
      w: W,
      plans: loadPlans(),
      plan: null,
      speed: null,
    });
    this.fast = createStore<Fast>({ cam: 0, att: null });
    this.sound.configure(settings);
    // The ambience drops while someone's talking to you, and follows you about: the place
    // you're at, or the map while you're on it or driving.
    let talking = false;
    const listen = () => {
      const u = this.ui.get();
      const t = !!u.talk;
      if (t !== talking) this.sound.duck((talking = t));
      const s = this.state;
      const map = u.view === 'map' && (u.driving || !!PLACES[s.at]?.scene);
      const key = map ? 'map' : `${s.at}:${isNight(s.min) ? 'night' : 'day'}:${s.day}`;
      this.sound.setBed(key, map ? ON_THE_MAP : bedFor(s, s.at));
    };
    this.ui.subscribe(listen);
    listen();
    if (home?.scene) this.enter(home.scene, this.state.x ?? undefined);
    if (b.note) this.toast(b.note);
  }

  // The window changed shape: the screen is `w` logical pixels wide now. The camera keeps
  // you where you were, inside the scene.
  resize(w: number): void {
    if (w === this.ui.get().w) return;
    this.vw = w / Z;
    this.set({ w });
    const u = this.ui.get();
    if (u.view === 'scene') this.cam = clamp(this.player.x - this.vw / 2, 0, this.sceneW() - this.vw);
    this.fast.set({ ...this.fast.get(), cam: this.cam });
  }

  get still(): boolean {
    return this.ui.get().still;
  }

  // ---- the sim ----

  dispatch(a: Action): GameEvent[] {
    const before = this.state;
    const r = act(before, a);
    const changed = r.state !== before;
    this.state = r.state;
    // What an act does to you, heard: the till, the stove, the coins.
    const def = a.t === 'act' ? ACTS[a.act] : undefined;
    if (def && !r.events.some((e) => e.k === 'refused')) this.sound.play(actCue(def));
    if (a.t === 'train' && !r.events.some((e) => e.k === 'refused')) this.sound.play('train');
    for (const e of r.events) {
      if (e.k === 'line') this.toast(e.text);
      else if (e.k === 'refused') this.toast(e.why);
      else if (e.k === 'act') this.cards.push({ k: 'act' });
    }
    if (changed) this.noteComings(before);
    if (changed && !persist.save(this.state)) this.toast("Couldn't save. The browser's storage may be full.");
    this.sync();
    // Off a solo: the go's over, and so is everything else.
    if (this.state.dead && !before.dead) {
      this.att = null;
      this.set({ sheet: { k: 'dead' }, climbing: false });
    }
    this.maybeCard();
    return r.events;
  }

  // People keep their own hours. When the clock takes someone away from where you are, or
  // brings them, say so: otherwise they just blink out of the scene.
  private noteComings(before: GameState): void {
    const s = this.state;
    if (before.at !== s.at || before.day !== s.day) return;
    for (const who of Object.keys(PEOPLE)) {
      const was = whereIs(before.seed, who, before.day, before.min, before.people[who]) === s.at;
      const is = whereNow(s, who) === s.at;
      const name = PEOPLE[who]!.name;
      if (was && !is) this.toast(`${name} heads out.`);
      else if (!was && is) this.toast(`${name} turns up.`);
    }
  }

  private sync(): void {
    this.ui.update((u) => ({ ...u, state: this.state, hud: this.held?.hud ?? hudOf(this.state) }));
  }

  private set(p: Partial<Ui>): void {
    // Away on an expedition, the day's call is the only sheet there is, whatever else
    // tries to clear or replace it.
    const x = this.state.expedition;
    if (x && 'sheet' in p && p.sheet?.k !== 'exped') p = { ...p, sheet: { k: 'exped', id: x.id } };
    // A Free Solo climber who fell: that's all there is, until a new one.
    if (this.state.dead && 'sheet' in p && p.sheet?.k !== 'dead') p = { ...p, sheet: { k: 'dead' } };
    this.ui.update((u) => ({ ...u, ...p }));
  }

  // ---- toasts: one at a time, in order, never over the controls ----

  // A line gets its full time on screen when nothing's waiting behind it, and just enough
  // to read when something is, so a quick player never reads news from two actions ago.
  toast(text: string): void {
    if (words(text) > TOAST_WORDS) {
      this.cards.push({ k: 'note', text, day: this.state.day, min: this.state.min });
      this.maybeCard();
      return;
    }
    if (this.held) {
      this.held.lines.push(text);
      return;
    }
    this.toasts.push(text);
    if (!this.ui.get().toast) this.nextToast();
    else this.scheduleToast();
  }

  private nextToast(): void {
    const text = this.toasts.shift();
    if (text === undefined) {
      clearTimeout(this.toastTimer);
      this.set({ toast: null });
      return;
    }
    this.toastShown = performance.now();
    this.set({ toast: { text, n: ++this.toastN } });
    this.scheduleToast();
  }

  private scheduleToast(): void {
    const cur = this.ui.get().toast;
    if (!cur) return;
    const full = Math.max(2600, cur.text.length * 45);
    const ms = this.toasts.length ? Math.min(full, 1400) : full;
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(
      () => this.nextToast(),
      Math.max(0, ms - (performance.now() - this.toastShown)),
    );
  }

  // ---- settings and your climber ----

  setSettings(p: Partial<persist.Settings>): void {
    const settings = { ...this.ui.get().settings, ...p };
    this.sound.configure(settings);
    if (!persist.saveSettings(settings)) this.toast("Couldn't keep that setting in this browser.");
    this.set({ settings, still: stillFor(settings, this.systemStill) });
  }

  // `carry`: a v0.956 climber's skills, to come across as they were (the sim caps them).
  create(name: string, start: string, carry?: Skills, solo = false): void {
    const ev = this.dispatch({
      t: 'create',
      name,
      start,
      ...(carry ? { carry } : {}),
      ...(solo ? { solo: true as const } : {}),
    });
    if (ev.some((e) => e.k === 'refused')) return;
    this.set({ hint: SCENES[this.ui.get().scene]?.hint ?? null });
  }

  // ---- moving between views ----

  // Input is locked only while the old view fades out. Once the new one is in place, taps
  // land on it, even while it's still fading in; a lock there just eats a quick player's tap.
  private fadeTo(fn: () => void): void {
    if (this.busy) return;
    this.busy = true;
    this.set({ fading: true });
    window.setTimeout(
      () => {
        fn();
        this.busy = false;
        requestAnimationFrame(() => this.set({ fading: false }));
      },
      this.still ? 0 : FADE_MS,
    );
  }

  private enter(scene: string, x?: number): void {
    const layout = SCENES[scene]!;
    const px = x ?? layout.spawn;
    Object.assign(this.player, { x: px, tx: px, dir: 1, speed: 0, onArrive: null });
    this.cam = clamp(px - this.vw / 2, 0, widthOf(scene) - this.vw);
    this.att = null;
    this.set({
      view: 'scene',
      scene,
      sheet: null,
      talk: null,
      stamp: null,
      climbing: false,
      hint: this.state.climber.name ? layout.hint : null,
    });
    this.fast.set({ cam: this.cam, att: null });
    if (x !== undefined && x !== this.state.x) this.dispatch({ t: 'stand', x });
    this.maybeCard();
  }

  enterScene(scene: string, x?: number): void {
    this.fadeTo(() => this.enter(scene, x));
  }

  openMap(): void {
    this.hush();
    this.speedDone();
    this.sound.play('paper');
    this.fadeTo(() => this.set({ view: 'map', sheet: null, hint: null }));
  }

  // The HUD's one button: Map in a scene, Close on the map, Down on the wall.
  nav(): void {
    if (this.busy) return;
    // Off the speed wall first: a run doesn't follow you out.
    if (this.ui.get().speed) return this.speedDone();
    const u = this.ui.get();
    if (u.view === 'map') {
      const scene = PLACES[this.state.at]?.scene;
      if (scene && !this.trip) this.enterScene(scene, this.state.x ?? undefined);
    } else if (u.view === 'wall') {
      if (!u.climbing) this.walkOff();
    } else this.openMap();
  }

  navLabel(u: Ui): string | null {
    if (u.speed) return u.speed.phase === 'done' ? 'Off' : null;
    if (u.view === 'wall') return u.climbing ? null : 'Down';
    if (u.view === 'map') return u.driving || !PLACES[this.state.at]?.scene ? null : 'Close';
    return 'Map';
  }

  openSheet(sheet: SheetId | null): void {
    this.set({ sheet, talk: null });
  }

  closeSheet(): void {
    this.set({ sheet: null });
    this.maybeCard();
  }

  private maybeCard(): void {
    const u = this.ui.get();
    const next = this.cards[0];
    if (!next || u.sheet || u.talk || u.climbing || u.driving) return;
    if (u.view !== 'scene' && (next.k === 'act' || u.view !== 'map')) return;
    this.cards.shift();
    this.set({ sheet: next });
  }

  hush(): void {
    if (this.ui.get().talk) this.set({ talk: null });
  }

  // ---- scenes: walking and using things ----

  private sceneW(): number {
    return widthOf(this.ui.get().scene);
  }

  // A scene's hotspots: its fixed things, plus whoever's there right now.
  // What you can walk up to and use in the scene you're in.
  hotsHere(): Hot[] {
    const u = this.ui.get();
    return u.view === 'scene' ? this.hots(u.scene) : [];
  }

  // Walk up to a thing and use it, as a tap on it does.
  useHot(h: Hot): void {
    if (this.busy || this.ui.get().view !== 'scene') return;
    this.hush();
    this.walkTo(h.stand, () => {
      this.player.dir = h.face;
      this.use(h.use);
    });
  }

  // A pin on the map, pressed: its card, as a tap on it does.
  openPin(id: string): void {
    if (this.busy || this.trip || this.ui.get().view !== 'map') return;
    this.openSheet({ k: 'place', id });
  }

  private hots(scene: string): Hot[] {
    return [...SCENES[scene]!.hots, ...presentIn(this.state, scene).map(spotHot)];
  }

  private walkTo(x: number, then: (() => void) | null): void {
    this.player.tx = clamp(x, 24, this.sceneW() - 24);
    this.player.onArrive = then;
    if (this.ui.get().hint) this.set({ hint: null });
  }

  private use(u: Use): void {
    if ('sheet' in u) this.openSheet({ k: u.sheet });
    else if ('talk' in u) {
      const node = talkStart(this.state, u.talk);
      if (node) {
        this.sound.play('talk');
        this.set({ talk: { talk: u.talk, node }, sheet: null });
      }
    } else if ('thing' in u) {
      const th = THINGS[u.thing];
      if (u.wag) this.scout.wag = 1.4;
      // Scout's your dog, or about to be: his sheet, not a line.
      if (u.thing === 'scout' && (this.state.dog || dogOffered(this.state))) {
        this.openSheet({ k: 'dog' });
        return;
      }
      if (!th) return;
      const s = this.state;
      const night = isNight(s.min);
      if (th.away && whereNow(s, th.away.who) !== s.at) this.toast(th.away.text);
      else if (night && th.nightAct) this.dispatch({ t: 'act', act: th.nightAct });
      else this.toast(night ? (th.night ?? th.day) : th.day);
    } else if ('route' in u) this.lookUp(u.route);
    else if ('wall' in u) this.openSheet({ k: 'wall', id: u.wall });
    else {
      const r = routesAt(this.state.seed, this.state.at, this.state.day)[u.problem];
      if (r) this.lookUp(r.id);
    }
  }

  // A tap on the screen, in logical pixels.
  tap(sx: number, sy: number): void {
    if (this.busy || !this.state.climber.name || this.ui.get().speed) return;
    const u = this.ui.get();
    if (u.view === 'scene') {
      if (u.sheet) {
        this.closeSheet();
        return;
      }
      this.hush();
      const wx = sx / Z + this.cam;
      const wy = (sy - OY) / Z;
      const h = this.hots(u.scene).find((o) => wx >= o.x0 && wx <= o.x1 && wy >= o.y0 && wy <= o.y1);
      if (h)
        this.walkTo(h.stand, () => {
          this.player.dir = h.face;
          this.use(h.use);
        });
      else this.walkTo(wx, null);
    } else if (u.view === 'map') this.tapMap(sx, sy);
    else if (u.view === 'wall' && !u.climbing && !u.sheet) this.openSheet({ k: 'beta', route: u.wallRoute });
  }

  private tapMap(x: number, sy: number): void {
    if (this.trip) return;
    // The valley sits in the middle of a wide screen.
    const sx = x - mapLeft(this.ui.get().w);
    const near = Object.entries(MAP_PINS)
      .map(([id, p]) => ({ id, d: Math.hypot(p.x - sx, p.y - sy) }))
      .sort((a, b) => a.d - b.d)[0];
    if (near && near.d < 30) {
      this.openSheet({ k: 'place', id: near.id });
      return;
    }
    if (DIM_PINS.some(([x, y]) => Math.hypot(x - sx, y - sy) < 22)) {
      this.toast('Not in this build yet.');
      return;
    }
    if (PLACES[this.state.at]?.scene) this.closeSheet();
  }

  // Keyboard: arrows walk, Enter uses what's nearest, M opens the map.
  walkKey(dir: -1 | 1 | 0): void {
    if (this.ui.get().view !== 'scene' || !this.state.climber.name) return;
    if (dir === 0) {
      if (this.keysWalking) this.player.tx = this.player.x;
      this.keysWalking = false;
      return;
    }
    this.hush();
    this.keysWalking = true;
    this.walkTo(dir < 0 ? 24 : this.sceneW() - 24, null);
  }

  useNearest(): void {
    const u = this.ui.get();
    if (u.view !== 'scene' || u.talk || u.sheet || !this.state.climber.name) return;
    const near = this.hots(u.scene)
      .map((o) => ({ o, d: Math.abs(o.stand - this.player.x) }))
      .sort((a, b) => a.d - b.d)[0];
    if (near && near.d < 110)
      this.walkTo(near.o.stand, () => {
        this.player.dir = near.o.face;
        this.use(near.o.use);
      });
  }

  // ---- talk ----

  say(opt: number): void {
    const t = this.ui.get().talk;
    if (!t) return;
    const ev = this.dispatch({ t: 'say', talk: t.talk, node: t.node, opt });
    if (ev.some((e) => e.k === 'refused')) {
      this.set({ talk: null });
      return;
    }
    const next = ev.find((e): e is Extract<GameEvent, { k: 'talk' }> => e.k === 'talk');
    if (next?.node) this.sound.play('talk');
    this.set({ talk: next?.node ? { talk: t.talk, node: next.node } : null });
    this.maybeCard();
  }

  // ---- places and the map ----

  // Returns why the day refused it, if it did. Sleep plays out after a fade.
  doAct(id: string): string | null {
    if (id === SLEEP) {
      this.closeSheet();
      this.fadeTo(() => {
        const ev = this.dispatch({ t: 'act', act: id });
        if (ev.some((e) => e.k === 'refused')) return;
        this.dayDone();
        this.enter('lot', WAKE_X);
      });
      return null;
    }
    const ev = this.dispatch({ t: 'act', act: id });
    const no = ev.find((e) => e.k === 'refused');
    if (no?.k === 'refused') return no.why;
    this.today = noted(this.today, { place: this.state.at, act: id });
    return null;
  }

  // A training session, a phase, a taper. Each returns why the rules refused it, if they did.
  train(protocol: string): string | null {
    return refusal(this.dispatch({ t: 'train', protocol }));
  }

  setPhase(phase: PhaseId): string | null {
    return refusal(this.dispatch({ t: 'phase', phase }));
  }

  taper(): string | null {
    return refusal(this.dispatch({ t: 'taper' }));
  }

  // A wall: start up it, bivy on it, or come down.
  wall(wall: string, what: 'start' | 'bivy' | 'retreat'): string | null {
    return refusal(this.dispatch({ t: 'wall', wall, do: what }));
  }

  // An expedition: go, then a day at a time.
  exped(id: string, what: 'go' | 'lead' | 'dig' | 'rest' | 'bail'): string | null {
    const why = refusal(this.dispatch({ t: 'exped', id, do: what }));
    // Home again, summit or not: the lines already said how it went.
    if (!why && !this.state.expedition) this.closeSheet();
    return why;
  }

  // Pay for a trip once (Moonstone's haul): the place card rebuilds with the drive on it.
  unlock(place: string): void {
    this.dispatch({ t: 'unlock', place });
  }

  // Returns why the drive was refused, if it was.
  travel(to: string): string | null {
    if (this.trip) return null;
    const from = this.state.at;
    const hud = hudOf(this.state);
    this.held = { hud, lines: [] };
    const ev = this.dispatch({ t: 'travel', to });
    const no = ev.find((e) => e.k === 'refused');
    if (no?.k === 'refused') {
      const lines = this.held.lines;
      this.held = null;
      this.sync();
      for (const l of lines) this.toast(l);
      return no.why;
    }
    this.hush();
    const pts = drivePath(from, to, MAP_PINS);
    const trip: Trip = { to, pts, L: arcTable(pts), t: 0, dur: this.still ? 0.01 : 1.8 };
    this.sound.play('drive', trip.dur / 1.8);
    const start = () => {
      this.trip = trip;
      this.set({ view: 'map', sheet: null, driving: true, hint: null });
    };
    if (this.ui.get().view !== 'map') this.fadeTo(start);
    else start();
    return null;
  }

  private arrive(): void {
    const trip = this.trip!;
    this.trip = null;
    const lines = this.held?.lines ?? [];
    this.held = null;
    this.set({ driving: false });
    this.sync();
    // What you learned on the way is said where you get to, not over the map's pins.
    const say = () => lines.forEach((l) => this.toast(l));
    const scene = PLACES[trip.to]?.scene;
    if (scene) this.fadeTo(() => (this.enter(scene), say()));
    else {
      this.openSheet({ k: 'place', id: trip.to });
      say();
    }
    if (this.run) this.later(() => this.planStep(), FADE_MS + PLAN_BEAT);
  }

  // ---- the wall ----

  lookUp(route: string): void {
    this.hush();
    this.fadeTo(() => {
      this.att = null;
      this.fast.set({ cam: this.cam, att: null });
      this.set({ view: 'wall', wallRoute: route, sheet: { k: 'beta', route }, hint: null });
    });
  }

  // ---- the speed wall (Phase 21.6) ----

  speedStart(): void {
    const why = speedBlocked(this.state);
    if (why) {
      this.toast(`${why}.`);
      return;
    }
    this.speedRun = { t: 0, last: -1, slipUntil: 0 };
    this.set({
      sheet: null,
      speed: {
        phase: 'set',
        lights: 0,
        holds: 0,
        slips: 0,
        time: null,
        pb: this.state.speed.pb,
        newPb: false,
      },
    });
  }

  private stepSpeed(dt: number): void {
    const run = this.speedRun;
    const u = this.ui.get().speed;
    if (!run || !u || u.phase === 'done') return;
    run.t += dt;
    const lights = Math.min(3, Math.floor(run.t / SPEED_LIGHT));
    if (lights !== u.lights) {
      this.sound.play(lights === 3 ? 'send' : 'tap');
      this.set({ speed: { ...u, lights, phase: run.t >= SPEED_GO ? 'climb' : 'set' } });
    }
  }

  // A grab with one hand (0) or the other (1). Before the green light it's a false start;
  // the same hand twice is a slip.
  speedGrab(hand: 0 | 1): void {
    const run = this.speedRun;
    const u = this.ui.get().speed;
    if (!run || !u || u.phase === 'done') return;
    if (u.phase === 'set') return this.speedEnd(null);
    if (run.t < run.slipUntil) return;
    if (hand === run.last) {
      run.slipUntil = run.t + SPEED_SLIP;
      this.sound.play('fell');
      this.set({ speed: { ...u, slips: u.slips + 1 } });
      return;
    }
    run.last = hand;
    const holds = u.holds + 1;
    this.sound.play('move');
    if (holds >= SPEED.holds) {
      this.set({ speed: { ...u, holds } });
      this.speedEnd(run.t - SPEED_GO);
    } else this.set({ speed: { ...u, holds } });
  }

  private speedEnd(real: number | null): void {
    const u = this.ui.get().speed!;
    const was = this.state.speed.pb;
    const skills = this.state.climber.skills;
    const ev = this.dispatch({ t: 'speed', real });
    const ok = !ev.some((e) => e.k === 'refused');
    const time = ok && real !== null ? speedTime(skills, real) : null;
    const pb = this.state.speed.pb;
    this.speedRun = null;
    this.set({ speed: { ...u, phase: 'done', time, pb, newPb: time !== null && pb !== was } });
  }

  speedDone(): void {
    this.speedRun = null;
    this.set({ speed: null });
  }

  // The climber on the speed wall, for the renderer: how far up, and slipping or not.
  private speedView(): Frame['speed'] {
    const u = this.ui.get().speed;
    if (!u) return null;
    return { holds: u.holds, slip: !!this.speedRun && this.speedRun.t < this.speedRun.slipUntil };
  }

  // Ask the crowd at the base for a line's beta.
  ask(route: string): void {
    this.dispatch({ t: 'ask', route });
  }

  pick(route: string, crux: string, beta: string): void {
    this.dispatch({ t: 'pick', route, crux, beta });
  }

  go(): void {
    const route = this.ui.get().wallRoute;
    const r = routeOfId(this.state, route);
    if (!r) return;
    const ev = this.dispatch({ t: 'go', route });
    if (ev.some((e) => e.k === 'refused')) return;
    this.today = noted(this.today, { place: this.state.at, climb: true });
    this.att = startAttempt(this.state, r);
    this.acc = 0;
    this.breathAt = 0;
    this.fast.set({ cam: this.cam, att: this.att });
    this.set({ sheet: null, climbing: true });
  }

  // The hold button: finger down (true) or up (false).
  press(on: boolean): void {
    const a = this.att;
    if (!a || !this.ui.get().climbing) return;
    if (!on && !a.hold) return;
    // Your hands, heard: chalk off and onto the first hold, or the crux's verb.
    const c = a.crux ? VERB_CUES[a.crux.verb] : null;
    if (on && !c && a.pos === 0) this.sound.play('pullon');
    else if (on && c && c.down !== 'charge') this.sound.play(c.down);
    else if (!on && c?.up) this.sound.play(c.up);
    this.applyAttempt(attemptInput(a, on));
  }

  rest(): void {
    this.dispatch({ t: 'rest', route: this.ui.get().wallRoute });
    this.att = null;
    this.fast.set({ cam: this.cam, att: null });
    this.openSheet({ k: 'beta', route: this.ui.get().wallRoute });
  }

  // Back to the scene the route is in, standing at its foot.
  walkOff(): void {
    const route = this.ui.get().wallRoute;
    const r = routeOfId(this.state, route);
    const scene = (r && PLACES[r.place]?.scene) ?? 'crag';
    const slot =
      r && indoor(r.place)
        ? routesAt(this.state.seed, r.place, this.state.day).findIndex((p) => p.id === route)
        : -1;
    // The board's problems all start under the board.
    const hot = SCENES[scene]!.hots.find((h) =>
      r?.wall
        ? 'wall' in h.use && h.use.wall === r.wall
        : r?.board
          ? 'sheet' in h.use && h.use.sheet === 'board'
          : 'route' in h.use
            ? h.use.route === route
            : 'problem' in h.use && h.use.problem === slot,
    );
    this.enterScene(scene, hot?.stand);
  }

  private applyAttempt(r: { att: Attempt; events: AttemptEvent[] }): void {
    const was = this.att;
    this.att = r.att;
    this.hear(was, r.att, r.events);
    for (const e of r.events) {
      if (e.k === 'lowered') this.finishFall();
      else if (e.k === 'sent') this.finishSend();
    }
  }

  // A go, heard: each move, each bolt clipped, the charge of a throw, breath as the pump
  // builds, and the crux, the fall, the landing and the top. The big ones buzz too.
  private hear(was: Attempt | null, a: Attempt, events: AttemptEvent[]): void {
    const s = this.sound;
    if (was && Math.floor(a.pos) > Math.floor(was.pos)) s.play('move');
    if (was && a.def.disc !== 'boulder')
      for (const b of a.def.bolts)
        if (was.pos < b + CLIMB.clipPast && a.pos >= b + CLIMB.clipPast) s.play('clip');
    s.charge(a.crux?.verb === 'load' && a.hold ? a.crux.m : null);
    if (a.pump > 45 && a.t >= this.breathAt && (a.phase === 'climb' || a.phase === 'crux')) {
      s.play('breath', a.pump / 100);
      this.breathAt = a.t + 1.8 - (a.pump - 45) / 55;
    }
    for (const e of events) {
      if (e.k === 'crux') (s.play('crux'), s.vibrate(12));
      else if (e.k === 'cleared') (s.play('cleared'), s.vibrate(20));
      else if (e.k === 'fell') (s.play('fell'), s.vibrate(70));
      else if (e.k === 'lowered') s.play('land');
      else if (e.k === 'placed') (s.play('place'), s.vibrate(10));
      else if (e.k === 'sent') (s.play('send'), s.vibrate([30, 60, 40]));
    }
  }

  private finishFall(): void {
    const a = this.att!;
    const route = a.route;
    // Your best before this go, to show this one against; none if this was your first.
    const log = this.state.routes[route];
    const best = log && log.goes > 1 ? log.hi : null;
    const ev = this.dispatch({ t: 'done', route, result: goResult(a) });
    const notes = ev.flatMap((e) =>
      (e.k === 'learned' && e.how === 'fall') || e.k === 'injured' ? [e.text] : [],
    );
    this.set({
      climbing: false,
      sheet: { k: 'fall', route, fall: a.fall!, notes, gains: gainsIn(ev), best },
    });
  }

  private finishSend(): void {
    const a = this.att!;
    const route = a.route;
    const r = a.def;
    const ev = this.dispatch({ t: 'done', route, result: goResult(a) });
    const sent = ev.find((e): e is Extract<GameEvent, { k: 'sent' }> => e.k === 'sent');
    const go = sent?.go ?? this.state.routes[route]?.goes ?? 1;
    this.set({ stamp: `${lineName(this.state, r)} · ${gradeLabel(r)} · go ${go}` });
    const gains = gainsIn(ev);
    const notes = ev.flatMap((e) => (e.k === 'injured' ? [e.text] : []));
    const style = sent?.style ?? 'redpoint';
    const fa = ev.some((e) => e.k === 'fa');
    const log = this.state.routes[route];
    const first = !!log?.sent && log.sent.go === log.goes;
    window.setTimeout(
      () => {
        this.set({
          stamp: null,
          climbing: false,
          // A first ascent is a first send, so never a repeat.
          sheet:
            fa && style !== 'repeat'
              ? { k: 'fa', route, style, go, gains, notes, from: 'send' }
              : { k: 'sent', route, style, go, gains, notes, first },
        });
      },
      this.still ? 1200 : 2600,
    );
  }

  // Name a first ascent and call its grade. Named straight after the send, the send card
  // follows; named later, you're back at the wall.
  nameLine(name: string, call: -1 | 0 | 1): void {
    const sh = this.ui.get().sheet;
    if (sh?.k !== 'fa') return;
    const ev = this.dispatch({ t: 'name', route: sh.route, name, call });
    if (ev.some((e) => e.k === 'refused')) return;
    const { route, style, go, gains, notes } = sh;
    this.set({
      sheet:
        sh.from === 'send'
          ? { k: 'sent', route, style, go, gains, notes, first: true }
          : { k: 'beta', route },
    });
  }

  // ---- starting over ----

  restart(): void {
    this.closeSheet();
    this.fadeTo(() => {
      persist.wipe();
      wipePlans();
      this.today = [];
      this.run = null;
      this.set({ plans: { plan: [], yesterday: [] }, plan: null });
      this.state = newGame(freshSeed());
      persist.save(this.state);
      this.toasts = [];
      this.sync();
      this.enter('lot');
    });
  }

  // ---- the plan (Phase 11.4): a day's drives and errands, run in one go ----

  setPlan(plan: PlanStep[]): void {
    const plans = { ...this.ui.get().plans, plan };
    if (!savePlans(plans)) this.toast("Couldn't keep the plan in this browser.");
    this.set({ plans });
  }

  runPlan(steps: PlanStep[]): void {
    if (this.run || !steps.length) return;
    this.run = { steps, i: 0 };
    this.closeSheet();
    this.showPlan(false);
    this.later(() => this.planStep(), 0);
  }

  // On from a climb, to the rest of the plan.
  goOn(): void {
    const r = this.run;
    if (!r || !this.ui.get().plan?.waiting) return;
    r.i++;
    this.showPlan(false);
    this.planStep();
  }

  stopPlan(): void {
    this.run = null;
    this.set({ plan: null });
  }

  private later(fn: () => void, ms = PLAN_BEAT): void {
    window.setTimeout(fn, this.still ? 0 : ms);
  }

  private showPlan(waiting: boolean, stopped: string | null = null): void {
    const r = this.run;
    if (r) this.set({ plan: { steps: r.steps, i: r.i, waiting, stopped } });
  }

  // One step: drive to its place if you're not there (arrival comes back here), then its
  // act, or wait while you climb. The first thing the day refuses ends the plan, and says so.
  private planStep(): void {
    const r = this.run;
    if (!r) return;
    if (this.busy || this.trip) return this.later(() => this.planStep(), 80);
    const step = r.steps[r.i];
    if (!step) return this.planEnd(null);
    if (this.state.at !== step.place) {
      const why = this.travel(step.place);
      if (why) this.planEnd(why);
      return;
    }
    if (step.climb) return this.showPlan(true);
    const why = this.doAct(step.act!);
    if (why) return this.planEnd(why);
    // Bed ends the day, and the plan with it.
    if (step.act === SLEEP) return this.planEnd(null);
    r.i++;
    this.showPlan(false);
    this.later(() => this.planStep());
  }

  private planEnd(why: string | null): void {
    if (why) this.showPlan(false, why);
    else this.set({ plan: null });
    this.run = null;
  }

  // The day's done: it's tomorrow's plan, if you don't make another.
  private dayDone(): void {
    const yesterday = noted(this.today, { place: 'lot', act: SLEEP });
    this.today = [];
    const plans = { ...this.ui.get().plans, yesterday };
    savePlans(plans);
    this.set({ plans });
    if (this.run && this.run.steps[this.run.i]?.act !== SLEEP) this.planEnd(null);
  }

  // ---- the frame loop ----

  step(dt: number): void {
    const u = this.ui.get();
    if (u.view === 'scene') this.stepWalk(dt);
    else if (u.view === 'map' && this.trip) {
      this.trip.t += dt;
      if (this.trip.t >= this.trip.dur) this.arrive();
    } else if (u.view === 'wall' && this.att && u.climbing) {
      this.acc += dt;
      while (this.acc >= STEP && this.att && this.ui.get().climbing) {
        this.acc -= STEP;
        if (this.att.phase === 'lowered' || this.att.phase === 'sent') break;
        this.applyAttempt(stepAttempt(this.att, STEP));
      }
    }
    this.stepSpeed(dt);
    this.sound.tick(dt);
    if (this.scout.wag > 0) this.scout.wag -= dt;
    const f = this.fast.get();
    if (Math.abs(f.cam - this.cam) > 0.01 || f.att !== this.att)
      this.fast.set({ cam: this.cam, att: this.att });
  }

  private stepWalk(dt: number): void {
    const p = this.player;
    const d = p.tx - p.x;
    if (Math.abs(d) > 0.8) {
      const v = Math.sign(d) * Math.min(Math.abs(d), WALK_SPEED * dt);
      p.x += v;
      p.dir = Math.sign(d);
      const stride = Math.floor(p.phase / Math.PI);
      p.phase += Math.abs(v) * 0.14;
      if (Math.floor(p.phase / Math.PI) !== stride) this.sound.play('step');
      p.speed = Math.min(1, p.speed + dt * 5);
    } else {
      const was = p.speed;
      p.x = p.tx;
      p.speed = Math.max(0, p.speed - dt * 7);
      if (p.onArrive) {
        const f = p.onArrive;
        p.onArrive = null;
        f();
      }
      if (was > 0 && p.speed === 0 && Math.round(p.x) !== this.state.x) this.dispatch({ t: 'stand', x: p.x });
    }
    this.cam += (clamp(p.x - this.vw / 2, 0, this.sceneW() - this.vw) - this.cam) * Math.min(1, dt * 5);
  }

  frame(t: number, px: number): Frame {
    const u = this.ui.get();
    const trip = this.trip;
    let tripView: Frame['trip'] = null;
    if (trip) {
      const k = clamp(trip.t / trip.dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      tripView = { pts: trip.pts, pos: atLen(trip.pts, trip.L, e * trip.L[trip.L.length - 1]!) };
    }
    return {
      state: this.state,
      view: u.view,
      scene: u.scene,
      cam: this.cam,
      t,
      w: u.w,
      px,
      still: u.still,
      player: this.player,
      scout: this.scout,
      trip: tripView,
      wallRoute: u.wallRoute,
      att: this.att,
      speed: this.speedView(),
    };
  }

  draw(g: CanvasRenderingContext2D, t: number, px: number): void {
    render(g, this.frame(t, px));
  }

  // The map is the one slow painting; do it while the player is looking at the Lot.
  warm(): void {
    mapArt();
  }
}

// What a go taught you, from its events.
// Why the rules refused an action, or null.
function refusal(ev: GameEvent[]): string | null {
  const no = ev.find((e) => e.k === 'refused');
  return no?.k === 'refused' ? no.why : null;
}

function gainsIn(ev: GameEvent[]): Partial<Skills> {
  const e = ev.find((x): x is Extract<GameEvent, { k: 'skills' }> => x.k === 'skills');
  return e?.gains ?? {};
}

export const words = (text: string): number => text.split(/\s+/).filter(Boolean).length;
