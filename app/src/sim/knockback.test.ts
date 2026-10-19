// Phase 35.3: knocks that come back (Evan's call). Help whoever knocked and they come back
// once, weeks later, with a thank-you in their own voice; turn them away and it's remembered,
// in a line, not a punishment.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { KNOCKS } from './content/knocks';
import { SPOT_IDS } from './spots';
import { EVENTS } from './dials';
import { knockBackDue, knockTonight } from './events';
import { act, newGame } from './game';
import { fromSave, validate } from './save';
import type { GameState } from './types';

const V74 = readFileSync(new URL('./fixtures/save-v74.json', import.meta.url), 'utf8');
const base = (over: Partial<GameState> = {}): GameState => ({
  ...act(newGame('knockback'), { t: 'create', name: 'Kit', start: 'allrounder' }).state,
  cash: 200,
  energy: 50,
  min: 21 * 60,
  at: 'lot',
  ...over,
});
const owing = (b: GameState['deck']['back'], over: Partial<GameState> = {}) => {
  const s = base(over);
  return { ...s, deck: { ...s.deck, back: b } };
};
const lines = (r: ReturnType<typeof act>) => r.events.flatMap((e) => (e.k === 'line' ? [e.text] : []));
const knock = (id: string) => KNOCKS.find((k) => k.id === id)!;
// The night it's due: the first from the answer on that knockBackDue says so.
const dueOn = (s: GameState): number => {
  for (let d = s.day; d < s.day + 60; d++) if (knockBackDue({ ...s, day: d })) return d;
  throw new Error('never due');
};

describe('knocks that come back', () => {
  it('remember whom you helped and whom you turned away, once a knock, ever', () => {
    const at = (id: string, opt: number, s = base({ day: 10 })) =>
      act({ ...s, encounter: { kind: 'knock', id } }, { t: 'answer', opt }).state;
    expect(at('jump', 0).deck.back).toEqual([{ id: 'jump', opt: 0, day: 10 }]);
    expect(at('jump', 2).deck.back).toEqual([{ id: 'jump', opt: 2, day: 10 }]);
    // Yelling at the drunks isn't helping them; the cop isn't anyone to help.
    expect(at('drunk', 0).deck.back).toEqual([]);
    expect(at('cop', 0).deck.back).toEqual([]);
    // Helped twice, back once.
    const twice = at('jump', 0, { ...at('jump', 0), day: 30 });
    expect(twice.deck.back).toHaveLength(1);
  });

  it('bring the one you helped back to the door weeks later, once, with a thank-you', () => {
    const s = owing([{ id: 'jump', opt: 0, day: 10 }], { day: 10 });
    const d = dueOn(s);
    expect(d - 10).toBeGreaterThanOrEqual(EVENTS.knock.back[0]);
    expect(d - 10).toBeLessThanOrEqual(EVENTS.knock.back[1]);
    const night = act({ ...s, day: d }, { t: 'act', act: 'lot.sleep' });
    expect(night.state.encounter).toEqual({ kind: 'knock', id: 'back-jump' });
    expect(night.state.deck.back[0]!.done).toBe(true);
    const back = knock('back-jump');
    const r = act(night.state, { t: 'answer', opt: 0 });
    expect(lines(r)[0]).toBe(back.opts[0]!.out);
    // The oranges, against the coffee: the same night slept, the supplies they bring.
    const coffee = act(night.state, { t: 'answer', opt: 1 });
    expect(r.state.supplies - coffee.state.supplies).toBe(back.opts[0]!.fx.supplies!);
    // Not again.
    expect(knockBackDue({ ...r.state, day: d + 30 })).toBeNull();
  });

  it('waits for a night a knock could come: not one that has had its encounter', () => {
    const s = owing([{ id: 'sharedspot', opt: 0, day: 10 }], { day: 10 });
    const d = dueOn(s);
    expect(knockBackDue({ ...s, day: d, deck: { ...s.deck, last: d } })).toBeNull();
    expect(knockBackDue({ ...s, day: d + 1 })?.knock?.id).toBe('back-sharedspot');
  });

  it('remembers the one you turned away in a line, not a card, and the night goes on', () => {
    const away = knock('sharedspot').away!;
    const s = owing([{ id: 'sharedspot', opt: away.opt, day: 10 }], { day: 10 });
    const d = dueOn(s);
    const r = act({ ...s, day: d, deck: { ...s.deck, knock: d } }, { t: 'act', act: 'lot.sleep' });
    expect(lines(r)).toContain(away.line);
    expect(r.state.encounter).toBeNull();
    expect(r.state.deck.back[0]!.done).toBe(true);
  });

  it('never come by chance, and every knock you can help has one waiting', () => {
    for (const k of KNOCKS.filter((x) => x.id.startsWith('back-'))) expect(k.spots).toEqual([]);
    for (let day = 5; day < 300; day++)
      for (const spot of SPOT_IDS) expect(knockTonight(base({ day }), spot)?.id ?? '').not.toMatch(/^back-/);
    for (const k of KNOCKS.filter((x) => x.helped)) {
      expect(knock(`back-${k.id}`), k.id).toBeTruthy();
      for (const i of k.helped!) expect(k.opts[i], k.id).toBeTruthy();
    }
    const words = KNOCKS.filter((k) => k.id.startsWith('back-')).flatMap((k) => [
      k.title,
      k.sit,
      ...k.opts.flatMap((o) => [o.label, o.out]),
    ]);
    for (const k of KNOCKS) if (k.away) words.push(k.away.line);
    for (const t of words) {
      expect(t, t).not.toMatch(/\d/);
      expect(t, t).not.toMatch(/'/);
    }
  });

  it('won’t load a return owed by a knock that has none, or for an answer that helped nobody', () => {
    const s = owing([{ id: 'jump', opt: 0, day: 10 }]);
    expect(validate(s)).toEqual([]);
    expect(validate({ ...s, deck: { ...s.deck, back: [{ id: 'cop', opt: 0, day: 10 }] } })).toContain('deck');
    expect(validate({ ...s, deck: { ...s.deck, back: [{ id: 'drunk', opt: 0, day: 10 }] } })).toContain(
      'deck',
    );
  });

  it('loads a real 0.999.71 save, owing nobody', () => {
    const r = fromSave(V74);
    if (!r.ok) throw new Error(r.why);
    expect(r.from).toBe(74);
    const old = JSON.parse(V74).state;
    expect(r.state).toEqual({
      ...old,
      deck: { ...old.deck, back: [] },
      sesh: null,
      seshFirsts: 0,
      vanPlan: expect.any(Object),
    });
  });
});
