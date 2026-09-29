// One frame of the world: a scene, the map or the wall, drawn from a snapshot the game
// hands over. Rendering reads state and never changes it.

import {
  belayer,
  CLIMB,
  conditionsAt,
  gradeLabel,
  isNight,
  lineGrade,
  picks,
  PLACES,
  ROUTES,
  routeOfId,
  routesAt,
  talkStart,
  TALK,
  type Attempt,
  type GameState,
} from '../sim';
import { rad, type G, type Pt } from './kit/geom';
import {
  BOARD_X0,
  CRAGS,
  DIM_PINS,
  GND,
  H,
  HEAD_Y,
  MAP_PINS,
  OY,
  presentIn,
  PROBLEM_X,
  SCENES,
  W,
  Z,
  type PinKind,
} from './layout';
import {
  ACC,
  boulderTag,
  CREAM,
  drawFire,
  drawLights,
  drawRain,
  drawSun,
  drawWet,
  label,
  routeTag,
  speechMark,
  tapeTag,
  vanIcon,
} from './paint/fx';
import { TAPE } from './paint/gym';
import { mapArt } from './paint/map';
import { drawBelayerBack, drawClimber, drawDog, drawPerson, INK, LOOK } from './paint/people';
import { BIG } from './paint/scale';
import { FIRE_X, LIGHTS, sceneArt, type SceneArt, type Tod } from './paint/scenes';
import { belayAt, onRoute, rockPath, routeStretch, wallOf } from './paint/wall';
import { sceneSun, sunLight, wallSun, wetness } from './sun';

export interface Frame {
  state: GameState;
  view: 'scene' | 'map' | 'wall';
  scene: string;
  cam: number;
  t: number;
  // Device pixels per logical pixel on the main canvas.
  px: number;
  // Reduced motion: no flicker, no bounce, no pulse, no falling rain.
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

// Raining where you are: the valley's sky, or a place's own out of it.
const wet = (s: GameState, place: string) => conditionsAt(s.seed, s.day, place).sky === 'rain';
// Where the water runs on wet rock: fixed per wall, so it runs the same way every time.
const WET_SEED = 57;
const wetSeed = (id: string) => [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, WET_SEED);

// Where a scene is seen from: the screen, or a place card's header. Its size in logical
// pixels, the world's zoom and where the world's top sits, and device pixels a logical one.
export interface Eye {
  w: number;
  h: number;
  z: number;
  oy: number;
  px: number;
}

// The Lot has a morning and a night; the crags and the gym look the same all day.
export const todAt = (scene: string, min: number): Tod =>
  scene === 'lot' ? (isNight(min) ? 'night' : 'morning') : 'day';

function renderScene(g: G, f: Frame): void {
  const eye: Eye = { w: W, h: H, z: Z, oy: OY, px: f.px };
  sceneBack(g, sceneArt(f.scene, todAt(f.scene, f.state.min)), f.cam, eye);
  sceneLive(g, f.state, f.scene, f.cam, eye, f);
}

// The painted part of a scene: its sky, then its layers, each moved by the camera as far as
// its distance says. An eye on a band of the world sees the band of sky the screen shows
// behind it.
export function sceneBack(g: G, art: SceneArt, cam: number, eye: Eye): void {
  const sky = art.sky;
  const k = sky.height / H;
  g.setTransform(eye.px, 0, 0, eye.px, 0, 0);
  g.drawImage(
    sky,
    0,
    (OY - (eye.oy * Z) / eye.z) * k,
    sky.width,
    (eye.h / eye.z) * Z * k,
    0,
    0,
    eye.w,
    eye.h,
  );
  g.setTransform(eye.px * eye.z, 0, 0, eye.px * eye.z, 0, eye.px * eye.oy);
  for (const L of art.layers) g.drawImage(L.c, -cam * L.p, 0, L.w, H);
  g.setTransform(eye.px, 0, 0, eye.px, 0, 0);
}

// Who's with you: on the screen, you and Scout. A place card's header shows the place
// without you.
interface Company {
  t: number;
  still: boolean;
  player?: Frame['player'];
  scout?: Frame['scout'];
}

// The live part of a scene, over its painted back: the fire, the light and the wet on the
// rock, the tags, and the people there at the state's hour.
export function sceneLive(g: G, s: GameState, scene: string, cam: number, eye: Eye, f: Company): void {
  const lot = scene === 'lot';
  const crag = CRAGS[scene];
  const place = SCENES[scene]?.place ?? s.at;
  const gym = scene === 'gym';
  const night = lot && isNight(s.min);
  const vw = eye.w / eye.z;
  g.save();
  g.setTransform(eye.px * eye.z, 0, 0, eye.px * eye.z, 0, eye.px * eye.oy);
  if (lot) {
    drawFire(g, FIRE_X - cam, GND + 1, f.t, night, f.still);
    if (night) drawLights(g, LIGHTS, cam);
    if (f.scout) drawDog(g, f.scout.x - cam, GND + 5, 1, f.t, f.scout.wag);
  }
  // The day on the rock: the sun's edge crossing the crag, and the wet after rain.
  if (crag) {
    const sun = sceneSun(s, scene);
    if (sun) drawSun(g, sun.x - cam, sun.lit, -10, vw + 10, -40, H + 40, sunLight(s.min));
    const w = wetness(s, place);
    if (w)
      drawWet(
        g,
        crag.wall[0] - cam,
        Math.min(crag.wall[1], crag.width) + 20 - cam,
        -20,
        GND + 20,
        WET_SEED,
        w === 'soaked',
      );
  }
  // Scout rode out with you: he's by the van.
  if (crag && s.dog && f.scout) drawDog(g, 238 - cam, GND + 5, 1, f.t, 0);
  // The crag's sign, with a closure notice pinned under it when the season shuts it; then
  // the tags on the rock, and the people in front of them.
  if (crag) {
    const sign = crag.sign - cam;
    label(g, 'poster', PLACES[place]!.name.toUpperCase(), sign, GND - 46, {
      size: 7.5,
      color: '#F3E6CB',
      halo: '#7A5A3A',
    });
    if (conditionsAt(s.seed, s.day, place).closed)
      label(g, 'poster', 'CLOSED', sign, GND - 30, { size: 7.5, color: '#FFFFFF', halo: ACC.comic });
    for (const r of crag.lines)
      routeTag(g, r.x - cam, GND - 100, r.n, gradeLabel(ROUTES[r.route]!), true, !!s.routes[r.route]?.sent);
    for (const b of crag.boulders)
      boulderTag(g, b.x - cam, GND - b.h - 12, lineGrade(s, ROUTES[b.route]!), !!s.routes[b.route]?.sent);
  }
  if (gym) {
    const lines = routesAt(s.seed, 'gym', s.day);
    lines
      .filter((r) => !r.board)
      .forEach((r, n) =>
        tapeTag(g, PROBLEM_X[n]! - cam, GND - 26, TAPE[n]!, gradeLabel(r), !!s.routes[r.id]?.sent),
      );
    // The board's problems, tagged along its kicker.
    lines
      .filter((r) => r.board)
      .forEach((r, n) =>
        tapeTag(g, BOARD_X0 + 25 + n * 50 - cam, GND - 16, '#2B2825', gradeLabel(r), !!s.routes[r.id]?.sent),
      );
  }
  for (const p of presentIn(s, scene)) {
    drawPerson(g, LOOK[p.who]!, { x: p.x - cam, y: GND, dir: p.face, pose: p.pose, t: f.t });
    // They've something to tell you.
    const opener = talkStart(s, p.talk);
    if (opener && TALK[p.talk]?.nodes[opener]?.calls) speechMark(g, p.x - cam, HEAD_Y - 10, f.t, f.still);
  }
  const p = f.player;
  if (p)
    drawPerson(g, LOOK.you!, {
      x: p.x - cam,
      y: GND,
      dir: p.dir,
      phase: p.phase,
      speed: p.speed,
      pose: p.speed > 0.05 ? 'walk' : 'stand',
      t: f.t,
    });
  g.restore();
  g.setTransform(eye.px, 0, 0, eye.px, 0, 0);
  if (night) {
    // Sized by the longer side, so a wide header darkens at its ends as the tall screen does.
    const r = Math.max(eye.w, eye.h);
    g.fillStyle = rad(g, eye.w / 2, eye.h * 0.55, r * 0.18, r * 0.72, [
      [0, 'rgba(0,0,0,0)'],
      [1, 'rgba(0,0,14,.42)'],
    ]);
    g.fillRect(0, 0, eye.w, eye.h);
  }
  if (!gym && wet(s, place)) drawRain(g, eye.w, eye.h, f.t, f.still);
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
    label(g, 'comic', PLACES[id]?.name ?? id, p.x + p.side * 17, p.y + 5 + (p.dy ?? 0), {
      size: 15,
      align: p.side > 0 ? 'left' : 'right',
    });
    // A crag you can't climb today says so before you burn the gas: shut for the season,
    // or soaked.
    const shut = PLACES[id]?.crag ? conditionsAt(f.state.seed, f.state.day, id) : null;
    const why = shut?.closed ? 'CLOSED' : shut && !shut.open ? 'SOAKED' : null;
    if (why) label(g, 'poster', why, p.x, p.y + 25, { size: 9, color: '#FFFFFF', halo: ACC.comic });
  }
  const here = MAP_PINS[f.state.at];
  const vp: Pt | null = f.trip ? [f.trip.pos[0], f.trip.pos[1] - 10] : here ? [here.x, here.y - 20] : null;
  if (vp) vanIcon(g, vp[0], vp[1], f.t, !!f.trip, f.still);
}

function renderWall(g: G, f: Frame): void {
  const s = f.state;
  const r = routeOfId(s, f.wallRoute);
  if (!r) return;
  const wall = wallOf(r);
  const log = s.routes[r.id];
  const pick = f.att?.pick ?? picks(s, r);
  // On a close-up wall the climber is drawn big, so labels stand further off the line.
  const off = wall.big ? 44 : 14;
  g.drawImage(wall.art, 0, 0, W, H);
  if (r.place !== 'gym') {
    const sun = wallSun(s, r);
    if (sun) drawSun(g, sun.x, sun.lit, -10, W + 10, 0, H, sunLight(s.min));
    const w = wetness(s, r.place);
    if (w) {
      g.save();
      rockPath(g, r);
      g.clip();
      drawWet(g, 0, W, 0, H, wetSeed(r.id), w === 'soaked');
      g.restore();
    }
  }

  // Each crux bracketed on the topo, with the beta you'll use there; "?" while there's
  // another way you haven't found.
  for (const c of r.cruxes) {
    const p0 = onRoute(r, c.from);
    const p1 = onRoute(r, c.to);
    const x = Math.min(W - 118, Math.max(p0[0], p1[0]) + off);
    const y0 = p0[1] - (wall.big ? 30 : 0);
    const y1 = p1[1] - (wall.big ? 30 : 0);
    const my = (y0 + y1) / 2;
    const unknown = c.beta.some((b, i) => i > 0 && !log?.known.includes(b));
    g.strokeStyle = ACC.comic;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x - 4, y0);
    g.lineTo(x, y0);
    g.lineTo(x, y1);
    g.lineTo(x - 4, y1);
    g.stroke();
    label(g, 'comic', c.name.replace(/^The /, ''), x + 6, my - 1, { size: 13, align: 'left' });
    label(g, 'comic', (r.beta[pick[c.id] ?? '']?.short ?? '') + (unknown ? '  ?' : ''), x + 6, my + 13, {
      size: 12,
      align: 'left',
      color: ACC.comic,
    });
  }

  // What this go has climbed, chalked onto the line as a soft band under the rope, so a
  // watcher can see how far it got against your flag and the top.
  const reach = f.att ? (f.att.fall ? f.att.fall.from : f.att.pos) : 0;
  if (reach > 0.05) {
    g.strokeStyle = 'rgba(255,255,255,.34)';
    g.lineWidth = wall.big ? 11 : 7;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    routeStretch(r, 0, reach).forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
    g.stroke();
    g.lineCap = 'butt';
  }

  const pos = f.att?.pos ?? 0;
  const [x, y] = onRoute(r, pos);
  const falling = f.att?.phase === 'fall';
  if (r.disc === 'sport') {
    // Quickdraws on every bolt you've clipped, and the rope running through them to
    // whoever's belaying.
    const who = belayer(s);
    const [bx0, by0] = belayAt(r);
    const rope: Pt[] = who ? [drawBelayerBack(g, LOOK[who]!, bx0, by0)] : [];
    for (const b of r.bolts) {
      if (b >= pos - CLIMB.clipPast) continue;
      const [bx, by] = onRoute(r, b);
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
    if (rope.length) {
      rope.push([x, y - 1]);
      g.strokeStyle = '#F4E6C8';
      g.lineWidth = 1.5;
      g.lineJoin = 'round';
      g.beginPath();
      rope.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
      g.stroke();
    }
  }

  // Where it came off. On a close-up wall the climber covers the spot; the flag and the
  // fall sheet's bar say it there.
  if (f.att?.fall && !wall.big) {
    const [fx, fy] = onRoute(r, f.att.fall.from);
    g.strokeStyle = ACC.comic;
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(fx - 5, fy - 5);
    g.lineTo(fx + 5, fy + 5);
    g.moveTo(fx + 5, fy - 5);
    g.lineTo(fx - 5, fy + 5);
    g.stroke();
  }

  // Your high point, flagged.
  const hi = log?.hi ?? 0;
  if (hi > 0 && hi < r.moves) {
    const [hx0, hy] = onRoute(r, hi);
    const hx = hx0 - (wall.big ? 30 : 0);
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
  const stride = falling ? 0 : Math.sin(pos * Math.PI);
  // Pumped arms shake: nothing under half a bar, then more and more as it fills. Only while
  // you're on the wall: once you're off or at the chains, it's over.
  const pump = f.att && (f.att.phase === 'climb' || f.att.phase === 'crux') ? f.att.pump : 0;
  const shake = f.still ? 0 : Math.pow(Math.max(0, pump - 55) / 45, 1.5) * (wall.big ? 4 : 2.2);
  const sx = x + Math.sin(f.t * 43) * shake;
  const sy = y + Math.cos(f.t * 37) * shake * 0.6;
  if (wall.big) {
    g.save();
    g.translate(sx, sy);
    g.scale(BIG, BIG);
    drawClimber(g, LOOK.you!, 0, 0, stride, falling);
    g.restore();
  } else drawClimber(g, LOOK.you!, sx, sy, stride, falling);
  if (r.place !== 'gym' && wet(s, r.place)) drawRain(g, W, H, f.t, f.still);
  // And the world narrows: the edges close in as the bar fills, pulsing near the top. The
  // gradient is squashed to the screen's shape so the sides close in as much as the ends.
  if (pump > 45) {
    const beat = f.still || pump < 80 ? 1 : 0.85 + 0.15 * Math.sin(f.t * 8);
    const a = Math.min(0.7, Math.pow((pump - 45) / 55, 1.2) * 0.7) * beat;
    const k = H / W;
    g.save();
    g.translate(W / 2, H * 0.42);
    g.scale(1, k);
    g.fillStyle = rad(g, 0, 0, W * 0.2, W * 0.78, [
      [0, 'rgba(30,8,8,0)'],
      [1, `rgba(30,8,8,${a.toFixed(3)})`],
    ]);
    g.fillRect(-W / 2, -0.42 * W, W, W);
    g.restore();
  }
}
