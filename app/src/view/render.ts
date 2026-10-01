// One frame of the world: a scene, the map or the wall, drawn from a snapshot the game
// hands over. Rendering reads state and never changes it.

import {
  belayer,
  CLIMB,
  indoor,
  protection,
  revealed,
  roped,
  conditionsAt,
  gradeLabel,
  gradeName,
  isNight,
  lineGrade,
  picks,
  PLACES,
  ROUTES,
  routeOfId,
  routesAt,
  talkStart,
  TALK,
  WALLS,
  crowdNow,
  EXPEDITIONS,
  SPEED,
  stormOn,
  type Attempt,
  type GameState,
  type RouteDef,
} from '../sim';
import { rad, type G, type Pt } from './kit/geom';
import { mulberry32 } from './kit/noise';
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
  CAVE_X,
  CENTER_X,
  SCENES,
  SPEED_LANE,
  MAP_FIT,
  MAP_K,
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
import { CAVE_TAPE, CENTER_TAPE, speedHold, TAPE } from './paint/gym';
import { mapArt } from './paint/map';
import { drawBelayerBack, drawClimber, drawDog, drawPerson, INK, LOOK, STRANGERS } from './paint/people';
import { BIG } from './paint/scale';
import { drawSkyMarks, FIRE_X, LIGHTS, sceneArt, SKY_W, type SceneArt, type Tod } from './paint/scenes';
import { belayAt, onRoute, rockPath, routeStretch, topoFor, traceSelected, wallOf } from './paint/wall';
import { sceneSun, sunLight, wallSun, wetness } from './sun';
import { EXPED_SKY_W, expedScene, expedSpot, SCENED } from './paint/expeds';

export interface Frame {
  state: GameState;
  view: 'scene' | 'map' | 'wall';
  scene: string;
  cam: number;
  t: number;
  // The screen's width in logical pixels: W in portrait, up to W_MAX on a wide window.
  w: number;
  // Device pixels per logical pixel on the main canvas.
  px: number;
  // Reduced motion: no flicker, no bounce, no pulse, no falling rain.
  still: boolean;
  player: { x: number; dir: number; phase: number; speed: number };
  scout: { x: number; wag: number };
  trip: { pts: Pt[]; pos: Pt } | null;
  wallRoute: string;
  att: Attempt | null;
  // A run on the speed wall: holds taken, and whether you're slipping.
  speed: { holds: number; slip: boolean } | null;
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

function renderScene(g: G, f: Frame, company: Company = f): void {
  const x = f.state.expedition;
  if (x && SCENED.includes(x.id)) return renderExped(g, f, x.id);
  const eye: Eye = { w: f.w, h: H, z: Z, oy: OY, px: f.px };
  sceneBack(g, sceneArt(f.scene, todAt(f.scene, f.state.min)), f.cam, eye);
  sceneLive(g, f.state, f.scene, f.cam, eye, company);
}

// Away on an expedition (Phase 24.6–24.8): its own scene, in its light and weather, and where
// you've got to on the wall, flagged, with your portaledge.
function renderExped(g: G, f: Frame, id: string): void {
  const s = f.state;
  const x = s.expedition!;
  const e = EXPEDITIONS[id]!;
  const night = isNight(s.min);
  const storm = stormOn(s.seed, id, e, s.day);
  const x0 = (EXPED_SKY_W - f.w) / 2;
  g.setTransform(f.px, 0, 0, f.px, 0, 0);
  g.drawImage(expedScene(id, night, storm), x0, 0, f.w, H, 0, 0, f.w, H);
  const [sx, sy] = expedSpot(id, x.pitch / e.pitches);
  const px = sx - x0;
  if (night) {
    g.fillStyle = rad(g, px, sy, 0, 14, [
      [0, 'rgba(255,231,168,.7)'],
      [1, 'rgba(255,231,168,0)'],
    ]);
    g.fillRect(px - 14, sy - 14, 28, 28);
  }
  g.fillStyle = '#D8693A';
  g.fillRect(px - 5, sy - 4, 10, 4);
  g.fillStyle = INK;
  g.fillRect(px - 5, sy, 10, 1.5);
  g.strokeStyle = ACC.comic;
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(px + 7, sy - 2);
  g.lineTo(px + 30, sy - 14);
  g.stroke();
  label(g, 'comic', `${x.pitch} of ${e.pitches}`, px + 33, sy - 12, { size: 13, align: 'left' });
  if (storm) drawRain(g, f.w, H, f.t, f.still);
}

// The painted part of a scene: its sky, then its layers, each moved by the camera as far as
// its distance says. An eye on a band of the world sees the band of sky the screen shows
// behind it, as much of it across as its zoom says, from the middle out.
export function sceneBack(g: G, art: SceneArt, cam: number, eye: Eye): void {
  const sky = art.sky;
  const kc = sky.height / H;
  const k = eye.z / Z;
  const sw = Math.min(SKY_W, eye.w / k);
  const x0 = (SKY_W - sw) / 2;
  const y0 = OY - eye.oy / k;
  g.setTransform(eye.px, 0, 0, eye.px, 0, 0);
  g.drawImage(sky, x0 * kc, y0 * kc, sw * kc, (eye.h / k) * kc, 0, 0, eye.w, eye.h);
  drawSkyMarks(g, art.marks, x0, y0, k);
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
  speed?: Frame['speed'];
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
      routeTag(
        g,
        r.x - cam,
        GND - 100,
        r.n,
        revealed(s, ROUTES[r.route]!) ? gradeLabel(ROUTES[r.route]!) : '?',
        true,
        !!s.routes[r.route]?.sent,
      );
    // Each wall's name, high on the rock where it starts.
    for (const w of crag.walls ?? []) {
      const def = WALLS[w.wall]!;
      label(g, 'poster', def.name.toUpperCase(), w.x - cam, GND - 250, {
        size: 9,
        color: '#FFFDF5',
        halo: '#2B2A33',
      });
      label(
        g,
        'poster',
        `${gradeName('sport', def.grade)} · ${def.pitches.length} PITCHES${s.wall?.id === w.wall ? ` · ON P${s.wall.next + 1}` : ''}`,
        w.x - cam,
        GND - 236,
        {
          size: 7.5,
          color: '#FFFDF5',
          halo: '#2B2A33',
        },
      );
    }
    for (const b of crag.boulders)
      boulderTag(
        g,
        b.x - cam,
        GND - b.h - 12,
        revealed(s, ROUTES[b.route]!) ? lineGrade(s, ROUTES[b.route]!) : '?',
        !!s.routes[b.route]?.sent,
      );
  }
  if (scene === 'center')
    routesAt(s.seed, 'center', s.day).forEach((r, n) =>
      tapeTag(g, CENTER_X[n]! - cam, GND - 26, CENTER_TAPE[n]!, gradeLabel(r), !!s.routes[r.id]?.sent),
    );
  if (scene === 'cave')
    routesAt(s.seed, 'cave', s.day).forEach((r, n) =>
      tapeTag(g, CAVE_X[n]! - cam, GND - 26, CAVE_TAPE[n]!, gradeLabel(r), !!s.routes[r.id]?.sent),
    );
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
  // The crowd, if there is one: strangers at the foot of the lines, the same ones all day.
  if (crag) {
    const n = { empty: 0, quiet: 1, busy: 3, packed: 5 }[crowdNow(s, place)];
    const spots = [...crag.lines.map((l) => l.x), ...crag.boulders.map((b) => b.x)];
    const r = mulberry32(s.day * 131 + place.length * 17 + spots.length);
    for (let i = 0; i < n && spots.length; i++) {
      const x = spots.splice(Math.floor(r() * spots.length), 1)[0]! + (r() - 0.5) * 36;
      drawPerson(g, STRANGERS[i % STRANGERS.length]!, {
        x: x - cam,
        y: GND,
        dir: r() < 0.5 ? -1 : 1,
        pose: r() < 0.25 ? 'sit' : 'stand',
        t: f.t + i,
      });
    }
  }
  for (const p of presentIn(s, scene)) {
    drawPerson(g, LOOK[p.who]!, { x: p.x - cam, y: GND, dir: p.face, pose: p.pose, t: f.t });
    // They've something to tell you.
    const opener = talkStart(s, p.talk);
    if (opener && TALK[p.talk]?.nodes[opener]?.calls) speechMark(g, p.x - cam, HEAD_Y - 10, f.t, f.still);
  }
  // On the speed wall: you're up it, not standing in the room.
  if (gym && f.speed) {
    const n = Math.min(f.speed.holds, SPEED.holds - 1);
    const [hx, hy] = speedHold(SPEED_LANE, n);
    const slip = f.speed.slip && !f.still ? 3 : 0;
    drawClimber(g, LOOK.you!, hx - cam, hy + 24 + slip, f.speed.holds % 2, false);
  }
  const p = f.speed && gym ? null : f.player;
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

// The map's valley is composed for portrait; a wider screen sees more country either side
// of it, and the valley stays in the middle.
export const mapLeft = (w: number): number => (w - W) / 2;

// The map's art as it's drawn: padded, so the valley scaled into MAP_FIT still reaches both
// sides of a portrait screen.
export const valleyArt = (): HTMLCanvasElement => mapArt(W + 1);

function renderMap(g: G, f: Frame): void {
  // The valley, fitted between the HUD and the buttons (MAP_FIT), its pins and roads with it,
  // on a dark ground that frames it where it doesn't reach.
  g.fillStyle = INK;
  g.fillRect(0, 0, f.w, H);
  g.translate(mapLeft(f.w), 0);
  g.translate(W / 2, MAP_FIT.top);
  g.scale(MAP_K, MAP_K);
  g.translate(-W / 2, -MAP_FIT.from);
  const wide = valleyArt();
  const ww = wide.width / (wide.height / H);
  g.drawImage(wide, (W - ww) / 2, 0, ww, H);
  g.setTransform(f.px, 0, 0, f.px, 0, 0);
  // The title, as a comic caption box, under the HUD's left end.
  g.fillStyle = INK;
  g.fillRect(16, 76, 160, 30);
  g.fillStyle = '#F2C84B';
  g.fillRect(12, 72, 160, 30);
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.strokeRect(12, 72, 160, 30);
  label(g, 'comic', 'Dirtbag Valley', 92, 94, { size: 21, halo: '#F2C84B' });
  g.translate(mapLeft(f.w), 0);
  g.translate(W / 2, MAP_FIT.top);
  g.scale(MAP_K, MAP_K);
  g.translate(-W / 2, -MAP_FIT.from);
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
  g.setTransform(f.px, 0, 0, f.px, 0, 0);
}

// A wall close up is composed for portrait. On a wider screen it's a panel down the middle,
// over the scene you looked up from, dimmed, with you out of it: you're on the wall.
function renderWall(g: G, f: Frame): void {
  const r = routeOfId(f.state, f.wallRoute);
  if (!r) return;
  const ox = (f.w - W) / 2;
  if (ox > 0) {
    renderScene(g, f, { t: f.t, still: f.still });
    g.setTransform(f.px, 0, 0, f.px, 0, 0);
    g.fillStyle = 'rgba(24,20,18,.5)';
    g.fillRect(0, 0, f.w, H);
    g.fillStyle = INK;
    g.fillRect(ox + 5, 0, W, H);
    g.save();
    g.setTransform(f.px, 0, 0, f.px, f.px * ox, 0);
    g.beginPath();
    g.rect(0, 0, W, H);
    g.clip();
  }
  wallPanel(g, f, r);
  if (ox > 0) {
    g.restore();
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(ox, 0);
    g.lineTo(ox, H);
    g.moveTo(ox + W, 0);
    g.lineTo(ox + W, H);
    g.stroke();
  }
  wallWeather(g, f, r);
}

// Over the whole screen: the rain, and the edges closing in as the pump bar fills, pulsing
// near the top. The gradient is squashed to the screen's shape so the sides close in as
// much as the ends.
function wallWeather(g: G, f: Frame, r: RouteDef): void {
  const s = f.state;
  if (r.exped) {
    // Up on an expedition (Phase 24.6): its storm, and its night.
    const e = EXPEDITIONS[r.exped];
    if (e && stormOn(s.seed, r.exped, e, s.day)) drawRain(g, f.w, H, f.t, f.still);
    if (isNight(s.min)) {
      g.fillStyle = 'rgba(16,22,48,.55)';
      g.fillRect(0, 0, f.w, H);
    }
  } else if (!indoor(r.place) && wet(s, r.place)) drawRain(g, f.w, H, f.t, f.still);
  const pump = f.att && (f.att.phase === 'climb' || f.att.phase === 'crux') ? f.att.pump : 0;
  if (pump > 45) {
    const beat = f.still || pump < 80 ? 1 : 0.85 + 0.15 * Math.sin(f.t * 8);
    const a = Math.min(0.7, Math.pow((pump - 45) / 55, 1.2) * 0.7) * beat;
    const w = f.w;
    const k = H / w;
    g.save();
    g.translate(w / 2, H * 0.42);
    g.scale(1, k);
    g.fillStyle = rad(g, 0, 0, w * 0.2, w * 0.78, [
      [0, 'rgba(30,8,8,0)'],
      [1, `rgba(30,8,8,${a.toFixed(3)})`],
    ]);
    g.fillRect(-w / 2, -0.42 * w, w, w);
    g.restore();
  }
}

// The wall itself, in the portrait column's pixels.
function wallPanel(g: G, f: Frame, r: RouteDef): void {
  const s = f.state;
  const wall = wallOf(r);
  const log = s.routes[r.id];
  const pick = f.att?.pick ?? picks(s, r);
  // On a close-up wall the climber is drawn big, so labels stand further off the line.
  const off = wall.big ? 44 : 14;
  g.drawImage(wall.art, 0, 0, W, H);
  if (!indoor(r.place)) {
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

  // A myth's line, once you can read it: the wall's art leaves it out till then.
  if (r.hiddenUntil && roped(r) && revealed(s, r)) traceSelected(g, topoFor(r));

  // Each crux bracketed on the topo, with the beta you'll use there; "?" while there's
  // another way you haven't found. A myth you can't read shows none.
  for (const c of revealed(s, r) ? r.cruxes : []) {
    const p0 = onRoute(r, c.from);
    const p1 = onRoute(r, c.to);
    // Right of the line, unless the line runs up the wall's right edge: then left of it, so
    // the labels never sit beside a neighbour's line instead.
    const right = Math.max(p0[0], p1[0]) + off;
    const flip = right > W - 118;
    const x = flip ? Math.min(p0[0], p1[0]) - off : right;
    const d = flip ? -1 : 1;
    const y0 = p0[1] - (wall.big ? 30 : 0);
    const y1 = p1[1] - (wall.big ? 30 : 0);
    const my = (y0 + y1) / 2;
    const unknown = c.beta.some((b, i) => i > 0 && !log?.known.includes(b));
    g.strokeStyle = ACC.comic;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x - 4 * d, y0);
    g.lineTo(x, y0);
    g.lineTo(x, y1);
    g.lineTo(x - 4 * d, y1);
    g.stroke();
    const align = flip ? 'right' : 'left';
    label(g, 'comic', c.name.replace(/^The /, ''), x + 6 * d, my - 1, { size: 13, align });
    label(g, 'comic', (r.beta[pick[c.id] ?? '']?.short ?? '') + (unknown ? '  ?' : ''), x + 6 * d, my + 13, {
      size: 12,
      align,
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
  if (roped(r)) {
    // Quickdraws on every bolt you've clipped, or the pieces you've placed, and the rope
    // running through them to whoever's belaying. A trad line shows its stances too: the
    // ones you've passed without placing are where you ran it out.
    // Up on an expedition, your partner belays from the anchor (Phase 24.6).
    const who = r.exped ? (s.expedition?.partner ?? null) : belayer(s);
    const [bx0, by0] = belayAt(r);
    const rope: Pt[] = who ? [drawBelayerBack(g, LOOK[who]!, bx0, by0)] : [];
    const trad = r.disc === 'trad';
    if (trad)
      for (const at of r.stances ?? []) {
        if (f.att?.placed.includes(at)) continue;
        const [sx, sy] = onRoute(r, at);
        g.strokeStyle = 'rgba(255,255,255,.55)';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(sx - 7, sy + 4);
        g.lineTo(sx + 7, sy + 3);
        g.stroke();
      }
    const pieces = f.att ? protection(f.att, r) : trad ? [] : r.bolts.filter((b) => b < pos - CLIMB.clipPast);
    for (const b of pieces) {
      const [bx, by] = onRoute(r, b);
      g.strokeStyle = ACC.comic;
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx, by + 7);
      g.stroke();
      if (trad) {
        // A cam: its lobes in the crack, a sling to the rope.
        g.fillStyle = '#C8553F';
        g.beginPath();
        g.arc(bx, by, 3, 0, 6.2832);
        g.fill();
      }
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
}
