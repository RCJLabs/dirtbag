// Phase 25.6: crew drama, as data. Each of the crew asks in their own way for a day you'd
// already given someone else; then what it comes to.

import { CREW } from '../dials';
import { fill } from '../format';
import type { TalkDef, TalkNode } from './people';

const NAME: Record<string, string> = { sage: 'Sage', mara: 'Mara', rico: 'Rico', tam: 'Tam' };

// How each asks. {b} is who you'd promised the day.
const ASK: Record<string, string> = {
  sage: 'Sage has the topo out before you’ve said hello. "This weekend. The arête. I’ve got the moves; I need your belay and nobody else’s." You told {b} you’d climb with them this weekend.',
  mara: 'Mara catches you at the van. "This weekend I’m sending. I want you on the rope, not some gym kid who short-ropes." You promised {b} the weekend a week ago.',
  rico: 'Rico is bouncing. "This weekend, the roof, it’s going, I need you, bring pads, bring snacks." The weekend was {b}’s, and you said so.',
  tam: 'Tam doesn’t ask for much, so when he does, you listen. "This weekend. I’d like you on the rope. It may be my last good go at it." You’d given the weekend to {b}.',
};

export const CREW_LINES = {
  pick: 'You tell {b} something came up. {b} says it’s fine, in the voice that means it isn’t, and isn’t around for a week. By the weekend {a} and {b} aren’t speaking, and it’s about you, and everyone knows it.',
  keep: 'You tell {a} the weekend is {b}’s. {a} takes it badly, disappears for a week, and takes it out on {b}, not you. The two of them stop climbing anywhere near each other.',
  mend: '{a} watches {b} leave the moment {a} turns up, again. "It’s stupid," {a} says. "All this over a weekend."',
  mended:
    'It takes two beers and a long silence. Then {b} laughs at something {a} says, and it’s over, the way these things end: nobody says sorry and everybody means it.',
  set: 'You get them both to the fire. {b} leaves before the coals are down. Some things don’t mend; they scar over.',
  leave: 'You leave it. It isn’t yours to fix, or it is and you aren’t ready.',
};

const words = (a: string, b: string) => ({ a: NAME[a] ?? a, b: NAME[b] ?? b });
const others = (who: string) => CREW.who.filter((w) => w !== who);

// The beats on one of the crew's talk tree: asking about each of the others, and mending it.
export const crewStarts = (who: string): TalkDef['start'] =>
  NAME[who]
    ? others(who).flatMap((b) => [
        { when: { crew: `${who}/mend/${b}` }, node: `crew-mend-${b}` },
        { when: { crew: `${who}/ask/${b}` }, node: `crew-ask-${b}` },
      ])
    : [];

export const crewNodes = (who: string): Record<string, TalkNode> =>
  NAME[who]
    ? Object.fromEntries(
        others(who).flatMap((b) => {
          const w = words(who, b);
          const ask: TalkNode = {
            calls: true,
            text: fill(ASK[who]!, w),
            opts: [
              { label: `Go with ${w.a}`, primary: true, fx: { crew: { do: 'pick', with: b } } },
              { label: `Keep your word to ${w.b}`, fx: { crew: { do: 'keep', with: b } } },
            ],
          };
          const mend: TalkNode = {
            calls: true,
            text: fill(CREW_LINES.mend, w),
            opts: [
              { label: 'Get them both to the fire', primary: true, fx: { crew: { do: 'mend', with: b } } },
              { label: 'Leave it', fx: { crew: { do: 'leave', with: b } } },
            ],
          };
          return [
            [`crew-ask-${b}`, ask],
            [`crew-mend-${b}`, mend],
          ];
        }),
      )
    : {};
