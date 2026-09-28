// One frame of the world: a scene, the map or the wall, drawn from a snapshot the game
// hands over. Rendering reads state and never changes it.

import { CLIMB, isNight, picks, PLACES, ROUTES, type Attempt, type GameState } from '../sim';
import { rad, type G, type Pt } from './kit/geom';
import { BASE_ROUTES, DIM_PINS, GND, H, MAP_PINS, OY, W, Z, type PinKind } from './layout';
import { ACC, CREAM, drawFire, drawLights, label, routeTag, vanIcon } from './paint/fx';
import { mapArt } from './paint/map';
import { drawBelayerBack, drawClimber, drawDog, drawPerson, INK, LOOK } from './paint/people';
import { FIRE_X, LIGHTS, sceneArt } from './paint/scenes';
import { BELAYER, onRoute, wallArt } from './paint/wall';

export interface Frame {
  state: GameState;
  view: 'scene' | 'map' | 'wall';
  scene: string;
  cam: number;
  t: number;
  // Device pixels per logical pixel on the main canvas.
  px: number;
  // Reduced motion: no flicker, no bounce, no pulse.
  still: boolean;
  player: { x: number; dir: number; phase: number; speed: number };
  scout: { x: number; wag: number };
  trip: { pts: Pt[]; pos: Pt } | null;
  wallRoute: string;
  att: Attempt | null;
}

export function render(g: G, f: Frame): void {
  g.setTransform(f.px, 0, 0, f.px, 0, 0);
  if (f.view === 'map') renderMap(g, f);
  else if (f.view === 'wall') renderWall(g, f);
  else renderScene(g, f);
}

function renderScene(g: G, f: Frame): void {
  const lot = f.scene === 'lot';
  const night = lot && isNight(f.state.min);
  const art = sceneArt(f.scene, lot ? (night ? 'night' : 'morning') : 'day');
  const cam = f.cam;
  g.drawImage(art.sky, 0, 0, W, H);
  g.save();
  g.setTransform(f.px * Z, 0, 0, f.px * Z, 0, f.px * OY);
  for (const L of art.layers) g.drawImage(L.c, -cam * L.p, 0, L.w, H);
  if (lot) {
    drawFire(g, FIRE_X - cam, GND + 1, f.t, night, f.still);
    if (night) drawLights(g, LIGHTS, cam);
    drawDog(g, f.scout.x - cam, GND + 5, 1, f.t, f.scout.wag);
    drawPerson(g, LOOK.hazel!, { x: 586 - cam, y: GND, dir: -1, pose: 'mug', t: f.t });
  } else {
    label(g, 'poster', PLACES.road!.name.toUpperCase(), 272 - cam, GND - 46, {
      size: 7.5,
      color: '#F3E6CB',
      halo: '#7A5A3A',
    });
    drawPerson(g, LOOK.hazel!, { x: 760 - cam, y: GND, dir: -1, pose: 'belay', t: f.t });
  }
  const p = f.player;
  drawPerson(g, LOOK.you!, {
    x: p.x - cam,
    y: GND,
    dir: p.dir,
    phase: p.phase,
    speed: p.speed,
    pose: p.speed > 0.05 ? 'walk' : 'stand',
    t: f.t,
  });
  if (!lot)
    for (const r of BASE_ROUTES) {
      const def = ROUTES[r.route]!;
      routeTag(
        g,
        r.x - cam,
        GND - 100,
        r.n,
        def.grade,
        def.cruxes.length > 0,
        !!f.state.routes[r.route]?.sent,
      );
    }
  g.restore();
  if (night) {
    g.fillStyle = rad(g, W / 2, H * 0.55, H * 0.18, H * 0.72, [
      [0, 'rgba(0,0,0,0)'],
      [1, 'rgba(0,0,14,.42)'],
    ]);
    g.fillRect(0, 0, W, H);
  }
}

const PIN_FILL: Record<PinKind, string> = { crag: ACC.comic, camp: '#9CC77E', town: CREAM };

function renderMap(g: G, f: Frame): void {
  g.drawImage(mapArt(), 0, 0, W, H);
  // The title, as a comic caption box.
  g.fillStyle = INK;
  g.fillRect(18, 59, 188, 38);
  g.fillStyle = '#F2C84B';
  g.fillRect(14, 55, 188, 38);
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.strokeRect(14, 55, 188, 38);
  label(g, 'comic', 'Dirtbag Valley', 108, 82, { size: 25, halo: '#F2C84B' });
  for (const [x, y] of DIM_PINS) {
    g.fillStyle = 'rgba(30,30,34,.4)';
    g.beginPath();
    g.arc(x, y, 5, 0, 6.2832);
    g.fill();
  }
  if (f.trip) {
    g.save();
    g.setLineDash([4, 4]);
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    f.trip.pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
    g.restore();
  }
  for (const [id, p] of Object.entries(MAP_PINS)) {
    if (f.state.at === id && !f.trip && !f.still) {
      const k = (f.t % 1.6) / 1.6;
      g.strokeStyle = ACC.comic;
      g.globalAlpha = 1 - k;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(p.x, p.y, 12 + k * 14, 0, 6.2832);
      g.stroke();
      g.globalAlpha = 1;
    }
    g.beginPath();
    g.arc(p.x, p.y, 11, 0, 6.2832);
    g.fillStyle = PIN_FILL[p.kind];
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.stroke();
    label(g, 'comic', PLACES[id]?.name ?? id, p.x + p.side * 17, p.y + 5, {
      size: 15,
      align: p.side > 0 ? 'left' : 'right',
    });
  }
  const here = MAP_PINS[f.state.at];
  const vp: Pt | null = f.trip ? [f.trip.pos[0], f.trip.pos[1] - 10] : here ? [here.x, here.y - 20] : null;
  if (vp) vanIcon(g, vp[0], vp[1], f.t, !!f.trip, f.still);
}

function renderWall(g: G, f: Frame): void {
  const route = f.wallRoute;
  const r = ROUTES[route]!;
  const log = f.state.routes[route];
  const pick = f.att?.pick ?? picks(f.state, route);
  g.drawImage(wallArt(route), 0, 0, W, H);

  // Each crux bracketed on the topo, with the beta you'll use there; "?" while there's
  // another way you haven't found.
  for (const c of r.cruxes) {
    const p0 = onRoute(route, c.from);
    const p1 = onRoute(route, c.to);
    const x = Math.max(p0[0], p1[0]) + 14;
    const my = (p0[1] + p1[1]) / 2;
    const unknown = c.beta.some((b, i) => i > 0 && !log?.known.includes(b));
    g.strokeStyle = ACC.comic;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x - 4, p0[1]);
    g.lineTo(x, p0[1]);
    g.lineTo(x, p1[1]);
    g.lineTo(x - 4, p1[1]);
    g.stroke();
    label(g, 'comic', c.name.replace(/^The /, ''), x + 6, my - 1, { size: 13, align: 'left' });
    label(g, 'comic', (r.beta[pick[c.id] ?? '']?.short ?? '') + (unknown ? '  ?' : ''), x + 6, my + 13, {
      size: 12,
      align: 'left',
      color: ACC.comic,
    });
  }

  const pos = f.att?.pos ?? 0;
  const [x, y] = onRoute(route, pos);
  const falling = f.att?.phase === 'fall';
  // Quickdraws on every bolt you've clipped, and the rope running through them.
  const rope: Pt[] = [drawBelayerBack(g, LOOK.hazel!, BELAYER.x, BELAYER.y)];
  for (const b of r.bolts) {
    if (b >= pos - CLIMB.clipPast) continue;
    const [bx, by] = onRoute(route, b);
    g.strokeStyle = ACC.comic;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(bx, by + 7);
    g.stroke();
    g.lineWidth = 1.3;
    g.beginPath();
    g.ellipse(bx, by + 9.5, 2.3, 3.2, 0, 0, 6.2832);
    g.stroke();
    rope.push([bx, by + 11]);
  }
  rope.push([x, y - 1]);
  g.strokeStyle = '#F4E6C8';
  g.lineWidth = 1.5;
  g.lineJoin = 'round';
  g.beginPath();
  rope.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
  g.stroke();

  // Your high point, flagged.
  const hi = log?.hi ?? 0;
  if (hi > 0 && hi < r.moves) {
    const [hx, hy] = onRoute(route, hi);
    g.fillStyle = ACC.comic;
    g.beginPath();
    g.moveTo(hx - 12, hy);
    g.lineTo(hx - 12, hy - 11);
    g.lineTo(hx - 3, hy - 8);
    g.lineTo(hx - 12, hy - 5);
    g.closePath();
    g.fill();
    g.strokeStyle = ACC.comic;
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(hx - 12, hy);
    g.lineTo(hx - 12, hy - 12);
    g.stroke();
  }
  drawClimber(g, LOOK.you!, x, y, falling ? 0 : Math.sin(pos * Math.PI), falling);
}
