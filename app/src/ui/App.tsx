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
import { Sheet } from './Sheet';

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

    let raf = 0;
    let last = 0;
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000 || 0);
      last = ts;
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

    const hold = (e: KeyboardEvent) => e.key === ' ' || e.key === 'Enter';
    const keydown = (e: KeyboardEvent) => {
      // While you're typing your name, keys are for the form.
      if (!game.state.climber.name) return;
      const a = document.activeElement;
      const onButton = a instanceof HTMLButtonElement;
      const u = game.ui.get();
      // On the speed wall: F and J (or the arrows) are your hands.
      if (u.speed && u.speed.phase !== 'done') {
        const hand =
          e.key === 'f' || e.key === 'F' || e.key === 'ArrowLeft'
            ? 0
            : e.key === 'j' || e.key === 'J' || e.key === 'ArrowRight'
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
        }
        return;
      }
      // Escape puts down whatever's open, the most recent first: a conversation, a sheet
      // that has a close button, then the map, back to where you are.
      if (e.key === 'Escape') {
        const x = document.querySelector<HTMLButtonElement>('#sheet .x');
        if (u.talk) game.hush();
        else if (x) x.click();
        else if (!u.sheet && u.view === 'map' && game.navLabel(u) === 'Close') game.nav();
        return;
      }
      if (u.view === 'wall') {
        if (u.climbing && hold(e) && a?.id !== 'hold') {
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
      } else if ((e.key === 'm' || e.key === 'M') && !u.talk) game.openMap();
    };
    const keyup = (e: KeyboardEvent) => {
      const u = game.ui.get();
      if (u.view === 'wall' && hold(e)) game.press(false);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') game.walkKey(0);
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    // Sound can only start from a gesture, so every tap and key offers it one. A button in
    // the panels ticks as it's pressed; the hold button has the climbing's own sounds.
    const wake = () => game.sound.unlock();
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
          {ui.toast && (
            <div className="toast" id="toast" role="status" key={ui.toast.n}>
              {ui.toast.text}
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
