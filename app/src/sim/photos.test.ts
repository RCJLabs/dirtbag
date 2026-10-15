// Phase 34.3: photos that sell (Evan's call: your sends), and the year's piece. A first send
// outside at V5 or harder, on your camera or shot by one of the crew there, is a photo; a
// magazine buys one a week, never for more than the poorest week a job pays.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { needFor } from './climber';
import { routesAt } from './content/gym';
import { JOBS } from './content/jobs';
import { PHOTO_SAYS, PIECE_SAYS } from './content/media';
import { PEOPLE } from './content/people';
import { ACTS } from './content/places';
import { ROUTES } from './content/routes';
import { PHOTO, PIECE } from './dials';
import { fill, money } from './format';
import { act, newGame } from './game';
import { fromAudience, photoBlocked, photoPrice, photoWorthy, pieceBlocked } from './media';
import { fromSave, toSave } from './save';
import type { Action, GameState, GoResult, PersonLog } from './types';
import { conditionsAt } from './weather';

const V66 = readFileSync(new URL('./fixtures/save-v66.json', import.meta.url), 'utf8');
const refused = (r: ReturnType<typeof act>) => r.events.some((e) => e.k === 'refused');
const lines = (r: ReturnType<typeof act>): string[] =>
  r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const play = (s: GameState, ...as: Action[]): GameState => {
  for (const a of as) {
    const r = act(s, a);
    if (refused(r)) throw new Error(JSON.stringify(r.events));
    s = r.state;
  }
  return s;
};
const sleep = (s: GameState) => {
  let r = act({ ...s, at: 'lot', min: 22 * 60 }, { t: 'act', act: 'lot.sleep' });
  if (r.state.encounter) r = act(r.state, { t: 'answer', opt: 0 });
  return r;
};

// A dry morning at Roadside, strong enough for anything there, warmed up.
const dry = Array.from({ length: 40 }, (_, i) => i + 10).find((d) => conditionsAt('photos', d, 'road').open)!;
const n = needFor(9);
const base = (over: Partial<GameState> = {}): GameState => {
  const s = newGame('photos');
  return {
    ...s,
    day: dry,
    at: 'road',
    min: 10 * 60,
    cash: 500,
    today: ['warm'],
    climber: {
      name: 'Kit',
      start: 'allrounder',
      skills: { power: n, fingers: n, endurance: n, technique: n, head: n },
    },
    ...over,
  };
};
const camera = (over: Partial<GameState> = {}) =>
  base({ gear: { ...newGame('photos').gear, camera: 1 }, ...over });
const SENT = (id: string): GoResult => ({
  sent: true,
  hi: ROUTES[id]!.moves,
  fellAt: null,
  tried: [],
  skin: 0,
});
const send = (s: GameState, id: string) =>
  act(play(s, { t: 'go', route: id }), { t: 'done', route: id, result: SENT(id) });
// The Project (V6) and The Warm Boulder (V2), both at Roadside.
const HARD = 'project';
const EASY = 'warm';
const photo = (route: string, by = 'camera', sold?: number) => ({
  route,
  day: dry,
  by,
  ...(sold ? { sold } : {}),
});
const withPhotos = (photos: GameState['media']['photos'], over: Partial<GameState> = {}): GameState => {
  const s = base(over);
  return { ...s, media: { ...s.media, photos } };
};

describe('a save from before the photos', () => {
  it('loads with none, and no piece asked for', () => {
    const r = fromSave(V66);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from).toBe(66);
    const old = JSON.parse(V66).state;
    expect(r.state).toEqual({ ...old, media: { ...old.media, photos: [], piece: null } });
    expect(old.retainers.physio).not.toBeNull();
    expect(photoBlocked(r.state, HARD)).toBe('No photo of that');
  });
});

describe('a save with photos', () => {
  it('keeps the camera, the photos and the piece', () => {
    const s = withPhotos([photo(HARD, 'camera', dry), photo('rsopen', 'hazel')], {
      gear: { ...newGame('photos').gear, camera: 1 },
    });
    const t = { ...s, media: { ...s.media, piece: { asked: dry, due: dry + PIECE.days, wrote: dry + 1 } } };
    const r = fromSave(toSave(t, 'test'));
    expect(r.ok && r.state).toEqual(t);
  });
});

describe('a photo', () => {
  it('comes of a first send outside at the grade, on your camera', () => {
    expect(ROUTES[HARD]!.grade).toBeGreaterThanOrEqual(PHOTO.from);
    const r = send(camera(), HARD);
    expect(r.state.media.photos).toEqual([photo(HARD)]);
    expect(lines(r)).toContain(PHOTO_SAYS.camera);
    // Sent again, it's the same photo.
    const again = send({ ...r.state, today: ['warm'] }, HARD);
    expect(again.state.media.photos).toHaveLength(1);
  });

  it('or shot by one of the crew there, and not of an easy line, a gym’s or nobody’s', () => {
    const pal: PersonLog = {
      bond: 6,
      last: dry - 1,
      since: 1,
      talked: true,
      invite: { day: dry, place: 'road', from: 9 * 60 },
    };
    const r = send(base({ people: { hazel: pal } }), HARD);
    expect(r.state.media.photos).toEqual([photo(HARD, 'hazel')]);
    expect(lines(r)).toContain(fill(PHOTO_SAYS.crew, { who: PEOPLE.hazel!.name }));
    expect(ROUTES[EASY]!.grade).toBeLessThan(PHOTO.from);
    expect(send(camera(), EASY).state.media.photos).toEqual([]);
    expect(send(base(), HARD).state.media.photos).toEqual([]);
    const gym = routesAt('photos', 'gym', dry).reduce((a, b) => (b.grade > a.grade ? b : a));
    expect(photoWorthy(base(), gym.id)).toBe(false);
  });
});

describe('a photo’s price', () => {
  it('runs with the grade and your followers, less on a phone, and stops at the cap', () => {
    const s = base();
    const g = ROUTES[HARD]!.grade - PHOTO.from + 1;
    expect(photoPrice(s, photo(HARD))).toBe(PHOTO.base * g);
    const known = { ...s, media: { ...s.media, followers: PHOTO.fans } };
    expect(photoPrice(known, photo(HARD))).toBe(PHOTO.base * g * 2);
    expect(photoPrice(s, photo(HARD, 'hazel'))).toBe(Math.round(PHOTO.base * g * PHOTO.phone));
    const top = Object.values(ROUTES).find((r) => r.grade >= 14 && !r.wall && !r.exped)!;
    expect(photoPrice(known, photo(top.id))).toBe(PHOTO.cap);
  });

  it('never makes a week of them out-earn the poorest week a job pays', () => {
    const weeks = Object.entries(JOBS).map(([id, j]) => {
      const a = Object.values(ACTS).find((x) => x.job?.id === id && x.job.shifts === 1)!;
      return (a.cost.cash ?? 0) * (j.posts ?? 7);
    });
    expect(PHOTO.cap * (7 / PHOTO.every)).toBeLessThan(Math.min(...weeks));
  });
});

describe('pitching a photo', () => {
  it('sells it once, and one a week', () => {
    const s = withPhotos([photo(HARD), photo('rsopen')]);
    const price = photoPrice(s, photo(HARD));
    const r = act(s, { t: 'photo', route: HARD });
    expect(refused(r)).toBe(false);
    expect(r.state.cash).toBe(s.cash + price);
    expect(r.state.media.photos[0]!.sold).toBe(dry);
    expect(lines(r)).toContain(fill(PHOTO_SAYS.sold, { line: ROUTES[HARD]!.name, cash: money(price) }));
    expect(refused(act(r.state, { t: 'photo', route: 'rsopen' }))).toBe(true);
    expect(refused(act({ ...r.state, day: dry + PHOTO.every }, { t: 'photo', route: HARD }))).toBe(true);
    expect(refused(act({ ...r.state, day: dry + PHOTO.every }, { t: 'photo', route: 'rsopen' }))).toBe(false);
  });
});

describe('the year’s piece', () => {
  const sold = (over: Partial<GameState> = {}) =>
    withPhotos(
      Array.from({ length: PIECE.after }, (_, i) =>
        photo(['project', 'rsopen', 'highball'][i]!, 'camera', dry - 7 * (i + 1)),
      ),
      over,
    );

  it('is asked for once the magazine’s run your photos, and written at the van', () => {
    expect(sleep(withPhotos([photo(HARD, 'camera', dry - 7)])).state.media.piece).toBeNull();
    const r = sleep(sold());
    const due = dry + PIECE.days;
    expect(r.state.media.piece).toEqual({ asked: dry + 1, due });
    expect(lines(r)).toContain(fill(PIECE_SAYS.ask, { due }));
    const s = { ...r.state, at: 'road', min: 10 * 60, energy: 100 };
    expect(pieceBlocked(s)).toBe('You write it at the van');
    const at = { ...s, at: 'lot' };
    const w = act(at, { t: 'piece' });
    expect(refused(w)).toBe(false);
    expect(w.state.cash).toBe(at.cash + PIECE.pay);
    expect(w.state.media.followers).toBe(at.media.followers + fromAudience(at, PIECE.followers));
    expect(w.state.media.piece!.wrote).toBe(at.day);
    expect(lines(w)).toContain(fill(PIECE_SAYS.paid, { cash: money(PIECE.pay) }));
    expect(refused(act(w.state, { t: 'piece' }))).toBe(true);
    // Not asked again within the year.
    let t = w.state;
    for (let i = 0; i < 3; i++) t = sleep(t).state;
    expect(t.media.piece!.asked).toBe(dry + 1);
  });

  it('lapses unwritten, and comes again a year from the ask', () => {
    let s = sleep(sold()).state;
    const lapsed: number[] = [];
    for (let i = 0; i < PIECE.days + 1; i++) {
      const r = sleep(s);
      if (lines(r).includes(PIECE_SAYS.lapsed)) lapsed.push(s.day);
      s = r.state;
    }
    expect(lapsed).toEqual([dry + PIECE.days]);
    expect(pieceBlocked({ ...s, at: 'lot' })).toBe('No piece to write');
    const later = sleep({ ...s, day: dry + PIECE.every });
    expect(later.state.media.piece!.asked).toBe(dry + PIECE.every + 1);
  });
});

describe('the photos’ and the piece’s words', () => {
  it('come from the rules, with no number of their own', () => {
    for (const t of [...Object.values(PHOTO_SAYS), ...Object.values(PIECE_SAYS)]) expect(t).not.toMatch(/\d/);
  });
});
