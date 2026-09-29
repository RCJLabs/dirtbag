import { describe, expect, it } from 'vitest';
import { gains, gradeOf, needFor, STARTS } from './climber';
import { gymSet } from './content/gym';
import { ROUTES } from './content/routes';
import { BODY, CLIMB, DAY, MONEY } from './dials';
import { act, goBlocked, goCost, lessonAt, LOG_MAX, NAME_MAX, newGame, talkStart } from './game';
import type { Action, GameEvent, GameState, GoResult } from './types';
import { skyOn, sunOn } from './weather';

const lines = (ev: GameEvent[]) => ev.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const refusal = (ev: GameEvent[]) => ev.find((e) => e.k === 'refused');

// Plays actions in order and fails the test on the first refusal, so a test can't pass
// by quietly doing nothing.
function play(s: GameState, ...actions: Action[]): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  for (const a of actions) {
    const r = act(s, a);
    const no = refusal(r.events);
    if (no) throw new Error(`${JSON.stringify(a)} refused: ${no.k === 'refused' && no.why}`);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}

// Puts you somewhere at a time without the drive, for rules that don't care how you got there.
const at = (s: GameState, place: string, min: number = s.min): GameState => ({ ...s, at: place, min });
const crag = (min = 9 * 60) => at(newGame('t'), 'road', min);
const fell = (hi: number, fellAt: string, tried: string[], skin = 0): GoResult => ({
  sent: false,
  hi,
  fellAt,
  tried,
  skin,
});
const sent = (hi: number, tried: string[]): GoResult => ({ sent: true, hi, fellAt: null, tried, skin: 0 });

describe('the day', () => {
  it('starts scrappy: $41, a van, an empty name, and Hazel at the fire', () => {
    const s = newGame('test');
    expect(s).toMatchObject({
      day: 1,
      min: DAY.firstMin,
      cash: MONEY.start,
      fed: BODY.startFed,
      at: 'lot',
      x: null,
      climber: { name: '', start: 'allrounder', skills: STARTS.allrounder!.skills },
    });
    expect(talkStart(s, 'hazel-lot')).toBe('morning');
  });

  it('only moves the clock on actions', () => {
    const s = newGame('test');
    const stood = act(s, { t: 'stand', x: 512.4 }).state;
    expect(stood.min).toBe(s.min);
    expect(stood.x).toBe(512);
    const cooked = play(stood, { t: 'act', act: 'lot.cook' });
    expect(cooked.state).toMatchObject({
      min: s.min + 20,
      cash: s.cash - 2,
      energy: s.energy + 6,
      fed: Math.min(100, s.fed + 25),
    });
    expect(lines(cooked.events)).toEqual(['Ramen again. It works.']);
  });

  it('refuses what the rules forbid, with a reason and no change', () => {
    const s = newGame('test');
    const r = act(s, { t: 'act', act: 'cafe.shift' });
    expect(r.state).toBe(s);
    expect(r.events).toEqual([{ k: 'refused', why: "You're not there." }]);
    const cafe = at(s, 'cafe');
    expect(refusal(act(at(cafe, 'cafe', 15 * 60), { t: 'act', act: 'cafe.shift' }).events)).toEqual({
      k: 'refused',
      why: 'Shifts start by 3 PM.',
    });
    expect(refusal(act({ ...cafe, energy: 10 }, { t: 'act', act: 'cafe.shift' }).events)).toEqual({
      k: 'refused',
      why: 'Too tired to pull shots.',
    });
    const maxed = { ...at(s, 'diner'), cash: 5 - MONEY.cardLimit };
    expect(refusal(act(maxed, { t: 'act', act: 'diner.meal' }).events)).toEqual({
      k: 'refused',
      why: "The card's declined.",
    });
  });

  it('puts what you can’t cover on the card, up to its limit', () => {
    const r = play({ ...at(newGame('t'), 'diner'), cash: 5 }, { t: 'act', act: 'diner.meal' });
    expect(r.state.cash).toBe(-5);
    expect(lines(r.events)).toEqual([
      "You're $5 in the hole. It goes on the card.",
      "The special is meatloaf. It's always meatloaf.",
    ]);
  });

  it('charges gas and time for a drive, and a maxed card never strands you', () => {
    const s = { ...newGame('test'), cash: 5 };
    const r = play(s, { t: 'travel', to: 'road' });
    expect(r.state).toMatchObject({
      at: 'road',
      min: s.min + 60,
      cash: -7,
      energy: s.energy - BODY.driveEnergy,
    });
    expect(lines(r.events)).toEqual([
      "You're $7 in the hole. It goes on the card.",
      'Gas, $12. The van starts on the second try.',
    ]);
    const maxed = { ...at(newGame('t'), 'road'), cash: 5 - MONEY.cardLimit };
    const home = play(maxed, { t: 'travel', to: 'lot' });
    expect(home.state).toMatchObject({ at: 'lot', cash: maxed.cash });
    expect(lines(home.events)).toEqual(["The card's declined at the pump. You make it on fumes."]);
    expect(refusal(act(s, { t: 'travel', to: 'nowhere' }).events)?.k).toBe('refused');
  });

  it('sleeps only in the evening, and a night resets the day', () => {
    const s = newGame('test');
    expect(refusal(act(s, { t: 'act', act: 'lot.sleep' }).events)).toEqual({
      k: 'refused',
      why: "Not yet. The day's still going.",
    });
    const evening = at(s, 'lot', DAY.bedFrom);
    const tired = { ...evening, energy: 40, skin: 30, fed: 60, cash: 10, today: ['coffee'] };
    tired.routes = { pump: { ...emptyRoute(), goesToday: 3, sentToday: true } };
    const slept = play(tired, { t: 'act', act: 'lot.sleep' });
    expect(slept.state).toMatchObject({
      day: 2,
      min: DAY.wakeMin,
      energy: 40 + BODY.sleepEnergy,
      skin: 30 + BODY.sleepSkin,
      fed: 60 - BODY.nightFed,
      cash: 10 - MONEY.vanSpot,
      today: [],
      at: 'lot',
    });
    expect(slept.state.routes.pump).toMatchObject({ goesToday: 0, sentToday: false });
    expect(lines(slept.events)).toEqual([`Van spot, $${MONEY.vanSpot}. You're $8 in the hole.`]);
  });

  it('sleeps worse hungry, rough when the card is full, and pays the bills every seventh night', () => {
    const night = at(newGame('t'), 'lot', DAY.bedFrom);
    const hungry = play({ ...night, energy: 20, fed: 10 }, { t: 'act', act: 'lot.sleep' });
    expect(hungry.state.energy).toBe(20 + BODY.sleepEnergy - BODY.hungryNight);
    expect(lines(hungry.events)).toContain('You went to bed hungry, and it shows.');
    const broke = { ...night, energy: 20, cash: 10 - MONEY.cardLimit };
    const rough = play(broke, { t: 'act', act: 'lot.sleep' });
    expect(rough.state).toMatchObject({ cash: broke.cash, energy: 20 + BODY.roughEnergy });
    expect(lines(rough.events)[0]).toMatch(/pullout/);
    const bills = MONEY.registration + MONEY.insurance;
    const week = play({ ...night, day: 7, cash: 100 }, { t: 'act', act: 'lot.sleep' });
    expect(week.state).toMatchObject({ day: 8, cash: 100 - MONEY.vanSpot - bills });
    expect(lines(week.events)).toContain(
      `Registration and insurance: $${bills}. The week's bills don't care about your card.`,
    );
    const day6 = play({ ...night, day: 6, cash: 100 }, { t: 'act', act: 'lot.sleep' });
    expect(day6.state.cash).toBe(100 - MONEY.vanSpot);
  });

  it('pays a shift at the café, one a day, and setting at Send City trains technique', () => {
    const s = play(newGame('t'), { t: 'travel', to: 'cafe' }).state;
    const r = play(s, { t: 'act', act: 'cafe.shift' });
    expect(r.state).toMatchObject({
      cash: s.cash + 28,
      min: s.min + 180,
      energy: s.energy - 12,
      fed: s.fed - 8,
    });
    expect(r.state.today).toContain('worked');
    expect(refusal(act(r.state, { t: 'act', act: 'cafe.shift' }).events)).toEqual({
      k: 'refused',
      why: "You've done your shift today.",
    });
    const gym = at(newGame('t'), 'gym');
    const set = play(gym, { t: 'act', act: 'gym.set' }).state;
    expect(set.climber.skills.technique).toBe(gym.climber.skills.technique + 3);
    expect(set.today).toEqual(expect.arrayContaining(['worked', 'pass']));
    // Hungry, you can still work: there's always a way back from broke.
    expect(refusal(act({ ...s, fed: 0 }, { t: 'act', act: 'cafe.shift' }).events)).toBeUndefined();
  });

  it('keeps the message log to its cap', () => {
    let s = newGame('test');
    for (let i = 0; i < LOG_MAX + 20; i++)
      s = act({ ...s, cash: 100, energy: 50, min: 8 * 60 }, { t: 'act', act: 'lot.cook' }).state;
    expect(s.log).toHaveLength(LOG_MAX);
  });
});

describe('your climber', () => {
  it('is made once, from a name and one of four starts', () => {
    const s = newGame('t');
    const r = play(s, { t: 'create', name: '  Alex Honnoldson the Third  ', start: 'technician' });
    expect(r.state.climber).toEqual({
      name: 'Alex Honnoldson'.slice(0, NAME_MAX),
      start: 'technician',
      skills: STARTS.technician!.skills,
    });
    expect(refusal(act(r.state, { t: 'create', name: 'B', start: 'boulderer' }).events)?.k).toBe('refused');
    expect(refusal(act(s, { t: 'create', name: '   ', start: 'boulderer' }).events)).toEqual({
      k: 'refused',
      why: 'You need a name.',
    });
    expect(refusal(act(s, { t: 'create', name: 'A', start: 'soloist' }).events)?.k).toBe('refused');
  });
});

describe('beta', () => {
  it('Hazel tells you the heel hook, and you can pick it', () => {
    const s = newGame('test');
    expect(refusal(act(s, { t: 'pick', route: 'pump', crux: 'B', beta: 'B2' }).events)?.k).toBe('refused');
    const told = play(s, { t: 'say', talk: 'hazel-lot', node: 'morning', opt: 0 });
    expect(told.events).toContainEqual({ k: 'learned', route: 'pump', beta: 'B2', how: 'told', text: '' });
    expect(told.events).toContainEqual({ k: 'talk', node: 'roof' });
    expect(told.state.routes.pump?.told).toEqual(['B2']);
    const picked = play(told.state, { t: 'pick', route: 'pump', crux: 'B', beta: 'B2' });
    expect(picked.state.routes.pump?.pick.B).toBe('B2');
    expect(talkStart(told.state, 'hazel-lot')).toBe('known');
  });

  it('a fall at the crimps shows you the other way; the roof takes two', () => {
    const s = play(crag(), { t: 'go', route: 'pump' }).state;
    const a = play(s, { t: 'done', route: 'pump', result: fell(5, 'A', ['A1'], 4) });
    expect(a.events).toContainEqual(expect.objectContaining({ k: 'learned', beta: 'A2', how: 'fall' }));
    expect(a.state.skin).toBe(s.skin - 4);
    expect(a.state.routes.pump?.hi).toBe(5);
    const b1 = play(a.state, { t: 'done', route: 'pump', result: fell(14, 'B', ['A1', 'B1']) });
    expect(b1.events.some((e) => e.k === 'learned')).toBe(false);
    const b2 = play(b1.state, { t: 'done', route: 'pump', result: fell(14, 'B', ['A1', 'B1']) });
    expect(b2.events).toContainEqual(expect.objectContaining({ k: 'learned', beta: 'B2', how: 'fall' }));
    expect(b2.state.routes.pump?.told).toEqual([]);
  });

  it("Sage shows you something on the line you're working, once a day", () => {
    const day2 = at({ ...newGame('t'), day: 2 }, 'gym', 10 * 60);
    expect(talkStart(day2, 'sage')).toBe('meet');
    // With nothing tried, the lesson is the easiest problem's trick.
    const first = gymSet('t', 1)[0]!;
    expect(lessonAt(day2)).toMatchObject({ r: { id: first.id }, beta: 'A2' });
    const worked = { ...day2, routes: { [gymSet('t', 1)[3]!.id]: { ...emptyRoute(), goes: 3 } } };
    expect(lessonAt(worked)?.r.id).toBe(gymSet('t', 1)[3]!.id);
    const r = play(day2, { t: 'say', talk: 'sage', node: 'meet', opt: 0 });
    expect(r.events).toContainEqual(
      expect.objectContaining({ k: 'learned', route: first.id, beta: 'A2', how: 'watched' }),
    );
    expect(r.state.min).toBe(day2.min + 20);
    expect(r.state.people.sage).toEqual({ bond: 1, last: 2, since: 2 });
    expect(talkStart(r.state, 'sage')).toBe('done');
    // Nobody to show you when they're not here; a goodbye still works.
    const gone = at({ ...newGame('t'), day: 3 }, 'gym', 10 * 60);
    expect(refusal(act(gone, { t: 'say', talk: 'sage', node: 'again', opt: 0 }).events)).toEqual({
      k: 'refused',
      why: "They're not here.",
    });
    expect(refusal(act(gone, { t: 'say', talk: 'sage', node: 'again', opt: 2 }).events)).toBeUndefined();
  });
});

describe('goes and sends', () => {
  it('a go costs what the button says, and Hazel on belay counts as a day together', () => {
    const s = crag();
    const r = play(s, { t: 'go', route: 'pump' });
    const c = goCost(ROUTES.pump!);
    expect(r.state).toMatchObject({
      min: s.min + c.min,
      energy: s.energy + c.energy,
      fed: s.fed + c.fed,
      skin: s.skin + c.skin,
    });
    expect(r.state.routes.pump).toMatchObject({ goes: 1, goesToday: 1 });
    expect(r.state.people.hazel).toEqual({ bond: 1, last: 1, since: 1 });
    expect(play(r.state, { t: 'go', route: 'pump' }).state.people.hazel?.bond).toBe(1);
    // Real rock costs more skin than plastic.
    expect(goCost(ROUTES.crimpfest!).skin).toBeLessThan(-CLIMB.skin.crimp);
  });

  it('needs a line that is here, daylight, dry rock and a belayer for a rope', () => {
    const s = crag();
    expect(refusal(act(newGame('t'), { t: 'go', route: 'pump' }).events)).toEqual({
      k: 'refused',
      why: "That line isn't here.",
    });
    expect(goBlocked(crag(CLIMB.darkFrom), ROUTES.warm!)).toBe('Too dark to climb');
    // Hazel heads home at five; bouldering needs nobody.
    expect(goBlocked(crag(17 * 60 + 30), ROUTES.pump!)).toBe('Nobody here to belay you');
    expect(goBlocked(crag(17 * 60 + 30), ROUTES.warm!)).toBeNull();
    const rain = Array.from({ length: 30 }, (_, i) => i + 2).find((d) => skyOn('t', d) === 'rain')!;
    expect(goBlocked({ ...s, day: rain }, ROUTES.warm!)).toBe('The rock is soaked');
    expect(goBlocked({ ...s, fed: 0 }, ROUTES.warm!)).toBe("You're running on empty");
    expect(goBlocked({ ...s, energy: 5 }, ROUTES.warm!)).toBe('Too tired to try');
    expect(goBlocked({ ...s, skin: 10 }, ROUTES.warm!)).toBe('Your skin is done for today');
  });

  it('Send City wants a day pass, and closes at ten', () => {
    const gym = at(newGame('t'), 'gym', 10 * 60);
    const p = gymSet('t', 1)[0]!;
    expect(refusal(act(gym, { t: 'go', route: p.id }).events)).toEqual({
      k: 'refused',
      why: 'Buy a day pass at the desk first.',
    });
    const passed = play(gym, { t: 'act', act: 'gym.pass' }, { t: 'go', route: p.id }).state;
    expect(passed.cash).toBe(gym.cash - MONEY.dayPass);
    expect(goBlocked({ ...passed, min: 22 * 60 }, p)).toBe('Send City is closed');
  });

  it('first go: onsight, or flash if you were told; later goes: redpoint', () => {
    const top = sent(24, ['A1', 'B1']);
    const onsight = play(crag(), { t: 'go', route: 'pump' }, { t: 'done', route: 'pump', result: top });
    expect(onsight.events).toContainEqual({ k: 'sent', route: 'pump', style: 'onsight', go: 1 });
    const flash = play(
      newGame('t'),
      { t: 'say', talk: 'hazel-lot', node: 'morning', opt: 0 },
      { t: 'travel', to: 'road' },
      { t: 'go', route: 'pump' },
      { t: 'done', route: 'pump', result: top },
    );
    expect(flash.events).toContainEqual({ k: 'sent', route: 'pump', style: 'flash', go: 1 });
    const red = play(
      crag(),
      { t: 'go', route: 'pump' },
      { t: 'done', route: 'pump', result: fell(5, 'A', ['A1']) },
      { t: 'rest', route: 'pump' },
      { t: 'go', route: 'pump' },
      { t: 'done', route: 'pump', result: top },
    );
    expect(red.events).toContainEqual({ k: 'sent', route: 'pump', style: 'redpoint', go: 2 });
    expect(red.state.routes.pump?.sent).toMatchObject({ day: 1, go: 2, style: 'redpoint' });
    expect(talkStart(red.state, 'hazel-crag')).toBe('sent');
  });

  it('warns about the sun once a day, when a go starts on a line the sun has reached', () => {
    // By 4 on a prime day the sun has the whole wall, the Warm Boulder last.
    const r = play(crag(16 * 60), { t: 'go', route: 'warm' }, { t: 'go', route: 'warm' });
    expect(lines(r.events).filter((l) => l.startsWith("Sun's on"))).toHaveLength(1);
    const morning = play(crag(), { t: 'go', route: 'warm' });
    expect(lines(morning.events)).toEqual([]);
    // The sun reaches the far boulders first and the Warm Boulder by the road last: at the
    // same minute, one's greasy and the other's still in the shade.
    const t = sunOn('t', 1, 'road', 'fingercrack');
    expect(sunOn('t', 1, 'road', 'warm')).toBeGreaterThan(t);
    expect(lines(play(crag(t), { t: 'go', route: 'fingercrack' }).events)).toContain(
      "Sun's on this line now. Everything feels greasy.",
    );
    expect(lines(play(crag(t), { t: 'go', route: 'warm' }).events)).toEqual([]);
  });
});

describe('what a go teaches', () => {
  it('trains the route and the beta you tried; a lap of a sent line teaches less', () => {
    const s = play(crag(), { t: 'go', route: 'warm' }).state;
    const before = s.climber.skills;
    const r = play(s, { t: 'done', route: 'warm', result: sent(7, ['A1']) });
    const ev = r.events.find((e) => e.k === 'skills');
    const want = gains(before, {
      grade: 2,
      sent: true,
      progress: 1,
      type: 'endurance',
      styles: ['endurance'],
    });
    for (const [k, v] of Object.entries(want)) {
      expect(ev?.k === 'skills' && ev.gains[k as keyof typeof want]).toBeCloseTo(v * CLIMB.learn, 1);
      expect(r.state.climber.skills[k as keyof typeof want]).toBeGreaterThan(before[k as keyof typeof want]);
    }
    const lap = play(
      r.state,
      { t: 'go', route: 'warm' },
      { t: 'done', route: 'warm', result: sent(7, ['A1']) },
    );
    const lapEv = lap.events.find((e) => e.k === 'skills');
    const lapWant = gains(r.state.climber.skills, {
      grade: 2,
      sent: true,
      progress: 1,
      type: 'endurance',
      styles: ['endurance'],
    });
    expect(lapEv?.k === 'skills' && lapEv.gains.endurance).toBeCloseTo(
      lapWant.endurance! * CLIMB.learn * CLIMB.repeatLearn,
      1,
    );
  });

  it('says so when your grade moves', () => {
    const edge = needFor(1) - 0.2;
    const s = play(
      {
        ...crag(),
        climber: {
          name: 'A',
          start: 'allrounder',
          skills: { power: edge, fingers: edge, endurance: edge, technique: edge, head: edge },
        },
      },
      { t: 'go', route: 'warm' },
    ).state;
    expect(gradeOf(s.climber.skills)).toBe(0);
    const r = play(s, { t: 'done', route: 'warm', result: sent(7, ['A1']) });
    expect(r.events).toContainEqual(expect.objectContaining({ k: 'skills', grade: 1 }));
    expect(lines(r.events)).toContain("Something clicks. You're climbing V1 now.");
  });
});

function emptyRoute() {
  return {
    known: [],
    told: [],
    pick: {},
    falls: {},
    goes: 0,
    goesToday: 0,
    hi: 0,
    sent: null,
    sentToday: false,
  };
}
