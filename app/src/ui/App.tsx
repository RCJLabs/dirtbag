import { useEffect, useRef } from 'react';
import type { Game } from '../game/game';
import { useStore } from '../game/store';
import { H, screenWidth, WIDE } from '../view/layout';
import { Bubble } from './Bubble';
import { ClimbPanel } from './ClimbPanel';
import { SpeedPanel } from './SpeedPanel';
import { BuskPanel } from './BuskPanel';
import { Create } from './Create';
import { Goal } from './Goal';
import { PlanChip } from './PlanChip';
import { Hots } from './Hots';
import { Hud } from './Hud';
import { back, canSkip, hub, onPad } from './input';
import { move } from './nav';
import { glyphs } from './Glyph';
import { Meter, meterLine } from './meter';
import { BINDABLE, keyOf } from '../game/binds';
import { desktop } from '../game/desktop';
import { Pad } from './pad';
import { Sheet } from './Sheet';
import type { Dir } from './spatial';

const ARROWS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

// The screen: 740 logical pixels tall, scaled to fit the window, and as wide as the window's
// shape allows: 360 in portrait, up to W_MAX in landscape. The world is on a canvas
// underneath and the panels are on top. The canvas draws every frame; React redraws the
// panels only when the game says something changed.
export function App({ game }: { game: Game }) {
  const ui = useStore(game.ui);
  const stage = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const st = stage.current!;
    const sc = screen.current!;
    const cv = canvas.current!;
    const g = cv.getContext('2d')!;
    let px = 2;
    const fit = () => {
      const r = st.getBoundingClientRect();
      const w = screenWidth(r.width / Math.max(1, r.height));
      const k = Math.min(r.width / w, r.height / H);
      sc.style.setProperty('--k', k.toFixed(4));
      sc.style.setProperty('--w', `${w}px`);
      // Backing pixels to match the device, capped: past 3x nobody can tell.
      px = Math.min(3, Math.max(1, k * (window.devicePixelRatio || 1)));
      cv.width = Math.round(w * px);
      cv.height = Math.round(H * px);
      game.resize(w);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(st);
    fit();

    // Phase 14.1: a controller, read each frame. While it's the one in use, the focus ring
    // shows on whatever it's on, as a keyboard's would.
    const pad = new Pad();
    // Phase 14.6: the frame meter, written straight into its line, never through React.
    const meter = new Meter();
    let raf = 0;
    let last = 0;
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000 || 0);
      last = ts;
      const f = meter.frame(ts);
      const line = f && document.getElementById('meter');
      if (f && line) line.textContent = meterLine(f);
      const u = game.ui.get();
      pad.binds = u.settings.binds.pad;
      const evs = pad.poll(ts / 1000);
      // Phase 14.6b: Settings asking for a button takes the next one pressed; the D-pad stops
      // the asking and moves as it always does.
      const asked = u.rebind?.device === 'pad' && pad.fresh.length ? pad.fresh[0]! : null;
      if (asked !== null) game.rebound(asked);
      if (asked === null || !BINDABLE.includes(asked))
        for (const ev of evs) {
          sc.dataset.input = 'pad';
          game.sound.unlock();
          onPad(game, ev);
        }
      game.step(dt);
      if (!document.hidden) game.draw(g, ts / 1000, px);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const down = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const k = r.height / H;
      game.tap((e.clientX - r.left) / k, (e.clientY - r.top) / k);
    };
    cv.addEventListener('pointerdown', down);

    // Phase 14.6b: the keys as Settings has them; Enter always presses, the arrows always move.
    const keys = () => game.ui.get().settings.binds.keys;
    const is = (e: KeyboardEvent, k: string) => keyOf(e.key) === k;
    const hold = (e: KeyboardEvent) => is(e, keys().press) || e.key === 'Enter';
    const keydown = (e: KeyboardEvent) => {
      // Settings asking for a key takes the next one; one no role can take just stops it.
      if (game.ui.get().rebind?.device === 'keys') {
        game.rebound(e.key);
        if (!ARROWS[e.key]) {
          e.preventDefault();
          return;
        }
      }
      const a = document.activeElement;
      // A field keeps its own keys, but for Up and Down, which leave it.
      const typing = a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement;
      const dir: Dir | undefined = ARROWS[e.key];
      const moves =
        !!dir && !e.metaKey && !e.ctrlKey && !e.altKey && !(typing && (dir === 'left' || dir === 'right'));
      // Phase 14.1: the arrows move focus to the nearest button that way. Where there's none,
      // the key does what it would have (a long sheet scrolls).
      const step = () => {
        if (move(dir!)) e.preventDefault();
      };
      // While you're making your climber, keys are for the form.
      if (!game.state.climber.name) {
        if (moves) step();
        return;
      }
      const onButton = a instanceof HTMLButtonElement;
      const u = game.ui.get();
      // On the speed wall: F and J (or the arrows) are your hands.
      if (u.speed && u.speed.phase !== 'done') {
        const hand =
          is(e, keys().left) || e.key === 'ArrowLeft'
            ? 0
            : is(e, keys().right) || e.key === 'ArrowRight'
              ? 1
              : null;
        if (hand !== null) {
          e.preventDefault();
          if (!e.repeat) game.speedGrab(hand);
        }
        return;
      }
      // Outside the café (Phase 22.5b): Space or Enter strums.
      if (u.busk && u.busk.phase === 'play') {
        if (hold(e)) {
          e.preventDefault();
          if (!e.repeat) game.buskTap();
        } else if (is(e, keys().back) && canSkip(u)) game.cookSkip();
        return;
      }
      // Back (Escape, unless Settings moved it) puts down whatever's open, the most recent
      // first: a conversation, a sheet that has a close button, then the map, back to where
      // you are.
      if (is(e, keys().back)) {
        back(game);
        return;
      }
      // Left and right walk a scene with nothing open; every other arrow moves focus, but
      // mid-go, when the hold is all there is.
      const walking = u.view === 'scene' && !u.sheet && !u.talk && (dir === 'left' || dir === 'right');
      if (moves && !walking && !u.climbing) {
        step();
        return;
      }
      // The HUD's buttons: M the map, J the journal, P the plan. Never from a field: a crew
      // can have an M in its name.
      const to = is(e, keys().map)
        ? 'map'
        : is(e, keys().journal)
          ? 'journal'
          : is(e, keys().plan)
            ? 'plan'
            : null;
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && to) {
        hub(game, to);
        return;
      }
      if (u.view === 'wall') {
        // The hold button takes Space and Enter itself, when it has focus; a rebound key it
        // doesn't know comes through here.
        const own = a?.id === 'hold' && (e.key === ' ' || e.key === 'Enter');
        if (u.climbing && hold(e) && !own) {
          e.preventDefault();
          if (!e.repeat) game.press(true);
        } else if (!u.climbing && !u.sheet && hold(e) && !onButton) {
          // The wall again, as a tap on it does: its beta sheet.
          e.preventDefault();
          game.tap(0, 0);
        }
        return;
      }
      if (u.view !== 'scene' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        game.walkKey(e.key === 'ArrowLeft' ? -1 : 1);
      } else if (hold(e) && !onButton && !u.talk && !u.sheet) {
        e.preventDefault();
        game.useNearest();
      }
    };
    const keyup = (e: KeyboardEvent) => {
      const u = game.ui.get();
      if (u.view === 'wall' && hold(e)) game.press(false);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') game.walkKey(0);
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    // Phase 14.6b: a text field reached by the pad, on the desktop: Steam's floating keyboard
    // under it (Steam shows it only where its overlay is up, as on a Deck).
    const typed = (e: FocusEvent) => {
      const t = e.target;
      if (!desktop || sc.dataset.input !== 'pad' || !(t instanceof HTMLInputElement) || t.type !== 'text')
        return;
      const r = t.getBoundingClientRect();
      const k = window.devicePixelRatio || 1;
      desktop.keyboard(r.left * k, r.top * k, r.width * k, r.height * k);
    };
    window.addEventListener('focusin', typed);

    // Sound can only start from a gesture, so every tap and key offers it one. A button in
    // the panels ticks as it's pressed; the hold button has the climbing's own sounds.
    const wake = (e: Event) => {
      game.sound.unlock();
      // A finger, a mouse or a key: the controller's no longer the one in use.
      if (e.type === 'pointerdown' || e.type === 'keydown') delete sc.dataset.input;
    };
    const tick = (e: MouseEvent) => {
      const b = (e.target as Element | null)?.closest?.('button');
      if (b && b.id !== 'hold') game.sound.play('tap');
    };
    window.addEventListener('pointerdown', wake, true);
    window.addEventListener('keydown', wake, true);
    sc.addEventListener('click', tick);

    const warm = window.setTimeout(() => game.warm(), 1200);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener('pointerdown', down);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('focusin', typed);
      window.removeEventListener('pointerdown', wake, true);
      window.removeEventListener('keydown', wake, true);
      sc.removeEventListener('click', tick);
      clearTimeout(warm);
    };
  }, [game]);

  return (
    <div className="stage" ref={stage}>
      <div
        className={[
          'screen',
          ui.settings.text === 'large' && 'large',
          ui.still && 'still',
          ui.view === 'map' && 'on-map',
          ui.w >= WIDE && 'wide',
        ]
          .filter(Boolean)
          .join(' ')}
        id="scr"
        ref={screen}
      >
        <canvas id="cv" ref={canvas} aria-label="Game scene" />
        <div className="ui">
          <Hud game={game} ui={ui} />
          <Hots game={game} ui={ui} />
          {ui.talk && <Bubble game={game} talk={ui.talk.talk} node={ui.talk.node} />}
          {ui.sheet && <Sheet game={game} id={ui.sheet} ui={ui} />}
          {ui.climbing && <ClimbPanel game={game} />}
          {ui.speed && <SpeedPanel game={game} />}
          {ui.busk && <BuskPanel game={game} />}
          {ui.view === 'map' && !ui.driving && !ui.sheet && !ui.busk && (
            <div className="corner">
              <button type="button" className="restart" onClick={() => game.openSheet({ k: 'restart' })}>
                Start over
              </button>
              <button
                type="button"
                className="restart"
                id="b-settings"
                onClick={() => game.openSheet({ k: 'settings' })}
              >
                Settings
              </button>
            </div>
          )}
          {ui.stamp && (
            <div className="stamp" id="stamp">
              <b>Sent</b>
              <span id="stamp-line">{ui.stamp}</span>
            </div>
          )}
          {ui.settings.meter === 'on' && <div className="meter" id="meter" aria-hidden="true" />}
          {ui.toast && (
            <div className="toast" id="toast" role="status" key={ui.toast.n}>
              {glyphs(ui.toast.text)}
            </div>
          )}
          <Goal game={game} ui={ui} />
          <PlanChip game={game} ui={ui} />
          {ui.hint && !ui.sheet && !ui.talk && (
            <p className="hint" id="hint">
              {ui.hint}
            </p>
          )}
          {!ui.state.climber.name && <Create game={game} />}
          <div className={`fade${ui.fading ? ' on' : ''}`} />
        </div>
      </div>
    </div>
  );
}
