// The game as the player drives it: the sim's state, what's on screen, and the loop that
// moves between them. Every change to the state goes through dispatch() into the sim; this
// class only decides what to show and when, and animates walking, driving and the wall.

import {
  act,
  attemptInput,
  goResult,
  gradeLabel,
  isNight,
  lineName,
  newGame,
  PEOPLE,
  PLACES,
  routeOfId,
  routesAt,
  startAttempt,
  STEP,
  stepAttempt,
  talkStart,
  THINGS,
  whereIs,
  type Action,
  type Attempt,
  type AttemptEvent,
  type FallRun,
  type GameEvent,
  type GameState,
  type SendStyle,
  type Skills,
} from '../sim';
import { arcTable, atLen, clamp, type Pt } from '../view/kit/geom';
import {
  DIM_PINS,
  MAP_PINS,
  OY,
  presentIn,
  SCENES,
  spotHot,
  VW,
  WAKE_X,
  widthOf,
  Z,
  type Hot,
  type Use,
} from '../view/layout';
import { mapArt } from '../view/paint/map';
import { render, type Frame } from '../view/render';
import { drivePath } from '../view/valley';
import * as persist from './persist';
import { createStore, type Store } from './store';

export type View = 'scene' | 'map' | 'wall';

export type SheetId =
  | { k: 'van' }
  | { k: 'cragVan' }
  | { k: 'desk' }
  | { k: 'place'; id: string }
  | { k: 'beta'; route: string }
  | { k: 'fall'; route: string; fall: FallRun; notes: string[]; gains: Partial<Skills> }
  | { k: 'sent'; route: string; style: SendStyle; go: number; gains: Partial<Skills>; notes: string[] }
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
  | { k: 'you' }
  | { k: 'week' }
  | { k: 'settings' }
  | { k: 'restart' };

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
}

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

  private player = { x: 300, tx: 300, dir: 1, phase: 0, speed: 0, onArrive: null as (() => void) | null };
  private scout = { x: 436, wag: 0 };
  private cam = 0;
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

  constructor(opts: { still?: boolean } = {}) {
    this.systemStill = !!opts.still;
    const settings = persist.loadSettings();
    const b = persist.boot(freshSeed);
    this.state = b.state;
    const home = PLACES[this.state.at];
    this.ui = createStore<Ui>({
      state: this.state,
      view: home?.scene ? 'scene' : 'map',
      scene: home?.scene ?? 'lot',
      sheet: home?.scene ? null : { k: 'place', id: this.state.at },
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
    });
    this.fast = createStore<Fast>({ cam: 0, att: null });
    if (home?.scene) this.enter(home.scene, this.state.x ?? undefined);
    if (b.note) this.toast(b.note);
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
    for (const e of r.events) {
      if (e.k === 'line') this.toast(e.text);
      else if (e.k === 'refused') this.toast(e.why);
    }
    if (changed) this.noteComings(before);
    if (changed && !persist.save(this.state)) this.toast("Couldn't save. The browser's storage may be full.");
    this.sync();
    return r.events;
  }

  // People keep their own hours. When the clock takes someone away from where you are, or
  // brings them, say so: otherwise they just blink out of the scene.
  private noteComings(before: GameState): void {
    const s = this.state;
    if (before.at !== s.at || before.day !== s.day) return;
    for (const who of Object.keys(PEOPLE)) {
      const was = whereIs(before.seed, who, before.day, before.min) === s.at;
      const is = whereIs(s.seed, who, s.day, s.min) === s.at;
      const name = PEOPLE[who]!.name;
      if (was && !is) this.toast(`${name} heads out.`);
      else if (!was && is) this.toast(`${name} turns up.`);
    }
  }

  private sync(): void {
    this.ui.update((u) => ({ ...u, state: this.state, hud: this.held?.hud ?? hudOf(this.state) }));
  }

  private set(p: Partial<Ui>): void {
    this.ui.update((u) => ({ ...u, ...p }));
  }

  // ---- toasts: one at a time, in order, never over the controls ----

  // A line gets its full time on screen when nothing's waiting behind it, and just enough
  // to read when something is, so a quick player never reads news from two actions ago.
  toast(text: string): void {
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
    if (!persist.saveSettings(settings)) this.toast("Couldn't keep that setting in this browser.");
    this.set({ settings, still: stillFor(settings, this.systemStill) });
  }

  create(name: string, start: string): void {
    const ev = this.dispatch({ t: 'create', name, start });
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
    this.cam = clamp(px - VW / 2, 0, widthOf(scene) - VW);
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
  }

  enterScene(scene: string, x?: number): void {
    this.fadeTo(() => this.enter(scene, x));
  }

  openMap(): void {
    this.hush();
    this.fadeTo(() => this.set({ view: 'map', sheet: null, hint: null }));
  }

  // The HUD's one button: Map in a scene, Close on the map, Down on the wall.
  nav(): void {
    if (this.busy) return;
    const u = this.ui.get();
    if (u.view === 'map') {
      const scene = PLACES[this.state.at]?.scene;
      if (scene && !this.trip) this.enterScene(scene, this.state.x ?? undefined);
    } else if (u.view === 'wall') {
      if (!u.climbing) this.walkOff();
    } else this.openMap();
  }

  navLabel(u: Ui): string | null {
    if (u.view === 'wall') return u.climbing ? null : 'Down';
    if (u.view === 'map') return u.driving || !PLACES[this.state.at]?.scene ? null : 'Close';
    return 'Map';
  }

  openSheet(sheet: SheetId | null): void {
    this.set({ sheet, talk: null });
  }

  closeSheet(): void {
    this.set({ sheet: null });
  }

  hush(): void {
    if (this.ui.get().talk) this.set({ talk: null });
  }

  // ---- scenes: walking and using things ----

  private sceneW(): number {
    return widthOf(this.ui.get().scene);
  }

  // A scene's hotspots: its fixed things, plus whoever's there right now.
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
      if (node) this.set({ talk: { talk: u.talk, node }, sheet: null });
    } else if ('thing' in u) {
      const th = THINGS[u.thing];
      if (u.wag) this.scout.wag = 1.4;
      if (!th) return;
      const s = this.state;
      const night = isNight(s.min);
      if (th.away && whereIs(s.seed, th.away.who, s.day, s.min) !== s.at) this.toast(th.away.text);
      else if (night && th.nightAct) this.dispatch({ t: 'act', act: th.nightAct });
      else this.toast(night ? (th.night ?? th.day) : th.day);
    } else if ('route' in u) this.lookUp(u.route);
    else {
      const r = routesAt(this.state.seed, 'gym', this.state.day)[u.problem];
      if (r) this.lookUp(r.id);
    }
  }

  // A tap on the screen, in logical pixels.
  tap(sx: number, sy: number): void {
    if (this.busy || !this.state.climber.name) return;
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

  private tapMap(sx: number, sy: number): void {
    if (this.trip) return;
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
    this.set({ talk: next?.node ? { talk: t.talk, node: next.node } : null });
  }

  // ---- places and the map ----

  doAct(id: string): void {
    if (id === 'lot.sleep') {
      this.closeSheet();
      this.fadeTo(() => {
        const ev = this.dispatch({ t: 'act', act: id });
        if (!ev.some((e) => e.k === 'refused')) this.enter('lot', WAKE_X);
      });
      return;
    }
    this.dispatch({ t: 'act', act: id });
  }

  travel(to: string): void {
    if (this.trip) return;
    const from = this.state.at;
    const hud = hudOf(this.state);
    this.held = { hud, lines: [] };
    const ev = this.dispatch({ t: 'travel', to });
    if (ev.some((e) => e.k === 'refused')) {
      const lines = this.held.lines;
      this.held = null;
      this.sync();
      for (const l of lines) this.toast(l);
      return;
    }
    this.hush();
    const pts = drivePath(from, to, MAP_PINS);
    const trip: Trip = { to, pts, L: arcTable(pts), t: 0, dur: this.still ? 0.01 : 1.8 };
    const start = () => {
      this.trip = trip;
      this.set({ view: 'map', sheet: null, driving: true, hint: null });
    };
    if (this.ui.get().view !== 'map') this.fadeTo(start);
    else start();
  }

  private arrive(): void {
    const trip = this.trip!;
    this.trip = null;
    const lines = this.held?.lines ?? [];
    this.held = null;
    this.set({ driving: false });
    this.sync();
    for (const l of lines) this.toast(l);
    const scene = PLACES[trip.to]?.scene;
    if (scene) this.enterScene(scene);
    else this.openSheet({ k: 'place', id: trip.to });
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

  pick(route: string, crux: string, beta: string): void {
    this.dispatch({ t: 'pick', route, crux, beta });
  }

  go(): void {
    const route = this.ui.get().wallRoute;
    const r = routeOfId(this.state, route);
    if (!r) return;
    const ev = this.dispatch({ t: 'go', route });
    if (ev.some((e) => e.k === 'refused')) return;
    this.att = startAttempt(this.state, r);
    this.acc = 0;
    this.fast.set({ cam: this.cam, att: this.att });
    this.set({ sheet: null, climbing: true });
  }

  // The hold button: finger down (true) or up (false).
  press(on: boolean): void {
    const a = this.att;
    if (!a || !this.ui.get().climbing) return;
    if (!on && !a.hold) return;
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
      r?.place === 'gym'
        ? routesAt(this.state.seed, 'gym', this.state.day).findIndex((p) => p.id === route)
        : -1;
    const hot = SCENES[scene]!.hots.find((h) =>
      'route' in h.use ? h.use.route === route : 'problem' in h.use && h.use.problem === slot,
    );
    this.enterScene(scene, hot?.stand);
  }

  private applyAttempt(r: { att: Attempt; events: AttemptEvent[] }): void {
    this.att = r.att;
    for (const e of r.events) {
      if (e.k === 'lowered') this.finishFall();
      else if (e.k === 'sent') this.finishSend();
    }
  }

  private finishFall(): void {
    const a = this.att!;
    const route = a.route;
    const ev = this.dispatch({ t: 'done', route, result: goResult(a) });
    const notes = ev.flatMap((e) =>
      (e.k === 'learned' && e.how === 'fall') || e.k === 'injured' ? [e.text] : [],
    );
    this.set({ climbing: false, sheet: { k: 'fall', route, fall: a.fall!, notes, gains: gainsIn(ev) } });
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
    window.setTimeout(
      () => {
        this.set({
          stamp: null,
          climbing: false,
          sheet: fa
            ? { k: 'fa', route, style, go, gains, notes, from: 'send' }
            : { k: 'sent', route, style, go, gains, notes },
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
      sheet: sh.from === 'send' ? { k: 'sent', route, style, go, gains, notes } : { k: 'beta', route },
    });
  }

  // ---- starting over ----

  restart(): void {
    this.closeSheet();
    this.fadeTo(() => {
      persist.wipe();
      this.state = newGame(freshSeed());
      persist.save(this.state);
      this.toasts = [];
      this.sync();
      this.enter('lot');
    });
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
      p.phase += Math.abs(v) * 0.14;
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
    this.cam += (clamp(p.x - VW / 2, 0, this.sceneW() - VW) - this.cam) * Math.min(1, dt * 5);
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
      px,
      still: u.still,
      player: this.player,
      scout: this.scout,
      trip: tripView,
      wallRoute: u.wallRoute,
      att: this.att,
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
function gainsIn(ev: GameEvent[]): Partial<Skills> {
  const e = ev.find((x): x is Extract<GameEvent, { k: 'skills' }> => x.k === 'skills');
  return e?.gains ?? {};
}
