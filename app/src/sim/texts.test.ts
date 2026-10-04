// Phase 25.6: texting the crew. Each partner you know says where they'll be and when, or why
// not, in their own words, without the same excuse every few days.
import { describe, expect, it } from 'vitest';
import { AWAY_TEXT, BUSY, SULK_TEXT } from './content/texts';
import { PLACES } from './content/places';
import { act, newGame } from './game';
import { stintOn } from './lives';
import { DAY_END, whereIs } from './presence';
import { crewTexts, crewToText, textBack } from './texts';
import type { GameState, PersonLog } from './types';

const made = (people: Record<string, Partial<PersonLog>> = {}, over: Partial<GameState> = {}): GameState => {
  const s = act(newGame('texts'), { t: 'create', name: 'Robin', start: 'allrounder' }).state;
  const logs = Object.fromEntries(
    Object.entries(people).map(([w, p]) => [
      w,
      { bond: 3, last: 0, since: 1, talked: true, ...p } as PersonLog,
    ]),
  );
  return { ...s, people: { ...s.people, ...logs }, ...over };
};
const outLater = (s: GameState, who: string, day: number) => {
  for (let m = 9 * 60; m < DAY_END; m++)
    if (whereIs(s.seed, who, day, m, s.people[who], s.people)) return true;
  return false;
};

describe('texting the crew', () => {
  it('reaches the partners you know, closest first', () => {
    expect(crewToText(made())).toEqual(['hazel']);
    expect(crewToText(made({ mara: { bond: 5 }, rico: { bond: 1 } }))).toEqual(['mara', 'rico', 'hazel']);
    expect(crewTexts(made({ mara: {} }))[0]).toMatch(/^Mara: “/);
  });

  it('says where and when when they’re out, and why not when they aren’t', () => {
    const s = made({ mara: {} });
    let out = 0;
    let busy = 0;
    for (let d = 20; d < 80; d++) {
      const at = { ...s, day: d, min: 9 * 60 };
      const said = textBack(at, 'mara');
      if (outLater(at, 'mara', d)) {
        out++;
        expect(said).toMatch(new RegExp(`^${PLACES.gorge!.name}, \\d`));
        expect(said).toContain('You coming?');
      } else {
        busy++;
        // A stint away (lives.ts) says so; any other day, one of hers.
        const st = stintOn(s.seed, 'mara', d);
        expect(st ? AWAY_TEXT[st.kind] : BUSY.mara).toContain(said);
      }
    }
    expect(out).toBeGreaterThan(0);
    expect(busy).toBeGreaterThan(0);
  });

  it('answers for tomorrow in the evening, once there’s nothing left of today', () => {
    const s = made({ mara: {} });
    const d = Array.from({ length: 60 }, (_, i) => i + 20).find((x) => outLater(s, 'mara', x + 1))!;
    expect(textBack({ ...s, day: d, min: 21 * 60 }, 'mara')).toMatch(/tomorrow from/);
  });

  it('uses their own excuses, not the same one every few days', () => {
    const s = made({ tam: {} });
    const said = new Set(
      Array.from({ length: 80 }, (_, i) => i + 20)
        .filter((d) => !outLater(s, 'tam', d) && !stintOn(s.seed, 'tam', d))
        .map((d) => textBack({ ...s, day: d, min: 9 * 60 }, 'tam')),
    );
    expect(said.size).toBeGreaterThanOrEqual(5);
    for (const t of said) expect(BUSY.tam).toContain(t);
  });

  it('says so when they’re away, and goes short when they’ve fallen out', () => {
    const away = made({ sage: { away: 999 } }, { day: 40, min: 9 * 60 });
    expect([...AWAY_TEXT.away, ...AWAY_TEXT.hurt]).toContain(textBack(away, 'sage'));
    const sulk = made({ rico: { away: 47, avoid: 'mara' }, mara: {} }, { day: 40, min: 9 * 60 });
    expect(SULK_TEXT).toContain(textBack(sulk, 'rico'));
  });
});
