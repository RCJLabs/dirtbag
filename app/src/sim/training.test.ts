// Phase 21.3: training. Sessions through the load model, a phase that holds, a taper that
// waits its turn, prehab; and v0.956's ways round them closed.
import { describe, expect, it } from 'vitest';
import { injuryChance } from './body';
import { betaScale } from './climb';
import { hi, needFor } from './climber';
import { ROUTES } from './content/routes';
import { PROTOCOLS } from './content/training';
import { LOAD, TRAIN } from './dials';
import { act, newGame } from './game';
import { sessionGains, sessionLoad } from './sessions';
import type { Action, GameState, PhaseId } from './types';

const made = (over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('train'), { t: 'create', name: 'Kit', start: 'allrounder' }).state;
  return { ...s, cash: 500, gear: { ...s.gear, hangboard: 1 }, ...over };
};
const refused = (r: ReturnType<typeof act>) =>
  (r.events.find((e) => e.k === 'refused') as { why?: string } | undefined)?.why ?? null;
const run = (s: GameState, ...acts: Action[]): GameState => {
  for (const a of acts) {
    const r = act(s, a);
    const why = refused(r);
    if (why) throw new Error(why);
    s = r.state;
  }
  return s;
};
const sleep = (s: GameState, n = 1): GameState => {
  // No knocks (Phase 22.6a has its own tests).
  for (let i = 0; i < n; i++)
    s = run(
      { ...s, at: 'lot', min: 22 * 60, deck: { ...s.deck, knock: s.day } },
      { t: 'act', act: 'lot.sleep' },
    );
  return s;
};
const phased = (s: GameState, phase: PhaseId): GameState => ({ ...s, training: { ...s.training, phase } });

describe('training', () => {
  it('teaches the protocol’s skills, slowed by hi() and set by the phase', () => {
    const s = made();
    const p = PROTOCOLS.maxhangs!;
    const got = sessionGains(s, p);
    expect(Object.keys(got).sort()).toEqual(['fingers', 'power']);
    const k = s.climber.skills;
    expect(got.fingers! / got.power!).toBeCloseTo(
      (p.trains.fingers! * hi(k.fingers)) / (p.trains.power! * hi(k.power)),
      1,
    );
    expect(sessionGains(phased(s, 'build'), p).fingers!).toBeGreaterThan(got.fingers!);
    expect(sessionGains(phased(s, 'deload'), p).fingers!).toBeLessThan(got.fingers!);
    // A stronger climber gets more of a lesson, and keeps less of it: hi() wins.
    const strong = {
      ...s,
      climber: {
        ...s.climber,
        skills: { power: 100, fingers: 100, endurance: 100, technique: 100, head: 100 },
      },
    };
    expect(sessionGains(strong, p).fingers!).toBeLessThan(got.fingers!);
  });

  it('does a session at the van with a hangboard, once a day, and loads you like a go', () => {
    const bare = made({ gear: { shoes: 60, chalk: 30 } });
    expect(refused(act(bare, { t: 'train', protocol: 'maxhangs' }))).toMatch(/hangboard/);
    const s = made();
    const after = run(s, { t: 'train', protocol: 'maxhangs' });
    expect(after.climber.skills.fingers).toBeGreaterThan(s.climber.skills.fingers);
    expect(after.load.today).toBeCloseTo(s.load.today + sessionLoad(s, PROTOCOLS.maxhangs!), 2);
    expect(after.min).toBe(s.min + PROTOCOLS.maxhangs!.min);
    expect(refused(act(after, { t: 'train', protocol: 'pullups' }))).toMatch(/trained today/);
    // At the gym: a pass, and campus waits for V4.
    const gym = { ...s, at: 'gym', min: 10 * 60 };
    expect(refused(act(gym, { t: 'train', protocol: 'arc' }))).toMatch(/pass/);
    const passed = run(gym, { t: 'act', act: 'gym.pass' });
    expect(refused(act(passed, { t: 'train', protocol: 'campus' }))).toMatch(/V4/);
    expect(refused(act(passed, { t: 'train', protocol: 'arc' }))).toBeNull();
  });

  it('won’t train you fried or hurt, unlike v0.956', () => {
    const fried = made({ load: { acute: 60, chronic: 20, today: 0 } });
    expect(refused(act(fried, { t: 'train', protocol: 'maxhangs' }))).toMatch(/fried/);
    const hurt = made({ injury: { kind: 'tweaked finger', tier: 1, until: 5 } });
    expect(refused(act(hurt, { t: 'train', protocol: 'maxhangs' }))).toMatch(/tweaked finger/);
    // Prehab is fine hurt.
    expect(refused(act(hurt, { t: 'train', protocol: 'prehab' }))).toBeNull();
  });

  it('holds a phase for its lock, ends peak in a deload, and sheds load in the deload', () => {
    let s = run(made(), { t: 'phase', phase: 'build' });
    expect(refused(act(s, { t: 'phase', phase: 'peak' }))).toMatch(/more day/);
    s = sleep(s, TRAIN.lock);
    s = run(s, { t: 'phase', phase: 'peak' });
    const r = ROUTES.warm!;
    const beta = r.cruxes[0]!.beta[0]!;
    expect(betaScale(s, r, beta) / betaScale(phased(s, 'base'), r, beta)).toBeCloseTo(
      TRAIN.phases.peak.windows,
    );
    s = sleep(s, TRAIN.peakDays);
    expect(s.training.phase).toBe('deload');
    // A deload night keeps a fifth less of the acute load than a base night.
    const base = sleep({ ...phased(s, 'base'), load: { acute: 40, chronic: 30, today: 0 } });
    const de = sleep({ ...s, load: { acute: 40, chronic: 30, today: 0 } });
    expect(de.load.acute).toBeCloseTo(base.load.acute * TRAIN.phases.deload.acute, 1);
  });

  it('tapers for three days with no training and wider cruxes, then waits a fortnight', () => {
    let s = run(made(), { t: 'taper' });
    expect(refused(act(s, { t: 'train', protocol: 'maxhangs' }))).toMatch(/tapering/);
    const r = ROUTES.warm!;
    const beta = r.cruxes[0]!.beta[0]!;
    const plain = { ...s, training: { ...s.training, taper: null } };
    expect(betaScale(s, r, beta) / betaScale(plain, r, beta)).toBeCloseTo(TRAIN.taper.windows);
    s = sleep(s, TRAIN.taper.days - 1);
    expect(
      betaScale(s, r, beta) / betaScale({ ...s, training: { ...s.training, taper: null } }, r, beta),
    ).toBeCloseTo(TRAIN.taper.last);
    s = sleep(s);
    expect(refused(act(s, { t: 'train', protocol: 'maxhangs' }))).toBeNull();
    expect(refused(act(s, { t: 'taper' }))).toMatch(/Too soon/);
    s = sleep(s, TRAIN.taper.cooldown);
    expect(refused(act(s, { t: 'taper' }))).toBeNull();
  });

  it('cuts the chance of getting hurt with prehab, for a week and a day', () => {
    const risky = made({ load: { acute: 40, chronic: 20, today: 0 } });
    const r = ROUTES.warm!;
    const p = injuryChance(risky, r, 10, false);
    expect(p).toBeGreaterThan(0);
    const s = run(risky, { t: 'train', protocol: 'prehab' });
    expect(injuryChance(s, r, 10, false)).toBeCloseTo(p * TRAIN.prehab.risk);
    expect(refused(act(s, { t: 'train', protocol: 'prehab' }))).toMatch(/today/);
    expect(s.training.prehab - s.day + 1).toBe(TRAIN.prehab.days);
    expect(injuryChance(phased(risky, 'build'), r, 10, false)).toBeCloseTo(p * TRAIN.phases.build.risk);
    expect(LOAD.risk).toBeLessThan(40 / 20);
  });

  it('sells a hangboard at the shop', () => {
    const s = made({ at: 'shop', gear: { shoes: 60, chalk: 30 } });
    const after = run(s, { t: 'act', act: 'shop.hangboard' });
    expect(after.gear.hangboard).toBe(1);
    expect(refused(act(after, { t: 'act', act: 'shop.hangboard' }))).toBeTruthy();
    expect(needFor(0)).toBe(0);
  });
});
