// Phase 17.1, criterion 1: no two people share a look, and everyone who stands in a scene
// has a look and a talk.
import { describe, expect, it } from 'vitest';
import { PEOPLE, TALK } from '../sim/content/people';
import { SPOTS } from './layout';
import { LOOK, STRANGERS } from './paint/people';

describe('looks', () => {
  it('gives everyone in the cast a look of their own, unlike anyone else’s or a stranger’s', () => {
    for (const who of Object.keys(PEOPLE)) expect(LOOK[who], who).toBeDefined();
    const all = [...Object.values(LOOK), ...STRANGERS].map((l) => JSON.stringify(l));
    expect(new Set(all).size).toBe(all.length);
    // At a glance means the shirt: nobody wears the same one.
    const shirts = [...Object.values(LOOK), ...STRANGERS].map((l) => l.shirt);
    expect(new Set(shirts).size).toBe(shirts.length);
  });

  it('stands only people with a look and a talk in a scene', () => {
    for (const spots of Object.values(SPOTS))
      for (const p of spots) {
        expect(LOOK[p.who], p.who).toBeDefined();
        expect(TALK[p.talk]?.who, p.talk).toBe(p.who);
      }
  });
});
