// Phase 28.3: favours, as data. What you ask the crew for and how they say yes; what they ask
// you for, each in their own way, and how they take a no. {cash} is filled from the dials.

import { FAVOUR } from '../dials';
import { bodyNote, costLabel, money } from '../format';
import type { TalkDef, TalkNode } from './people';
import type { FavourAsk, FavourWhat } from '../types';

// What you ask for, said in their yes.
export const FAVOUR_WHAT: Record<FavourWhat, { label: string; said: string; note: string }> = {
  shift: {
    label: 'Cover your shift',
    said: 'Your shift',
    note: 'Your next shift on the schedule, today’s or tomorrow’s. No pay, no strike, no credit toward a raise.',
  },
  rack: { label: 'Lend you a rack', said: 'The rack', note: 'Trad lines, today, on their gear.' },
  ride: {
    label: 'Drive you',
    said: 'A ride',
    note: 'Today’s driving on them: no gas, no wear on the van, and it goes whatever state the van’s in.',
  },
};

export const FAVOUR_YES: Record<string, string> = {
  hazel: 'Hazel: “{what}? Fine. That’s one you owe me.”',
  sage: 'Sage: “{what}. Of course. I’m writing it down, though.”',
  mara: 'Mara: “{what}. Once. Don’t make it a habit.”',
  rico: 'Rico: “{what}? Easy. You can pay me in snacks.”',
  tam: 'Tam: “{what}. Happy to. That’s what this is for.”',
};
export const FAVOUR_EVEN = '{name}: “{what}. Now we’re square.”';

// What they ask you.
const ASK: Record<string, Record<FavourAsk, string>> = {
  hazel: {
    belay:
      'Hazel’s got the rope out already. “Catch me on the thing I keep falling off. Nobody watches my feet like you.”',
    ride: '“The van’s making the noise again. Run me to the garage? I’ll buy the coffee next time.”',
    loan: 'Hazel doesn’t look at you when she asks. “{cash}, just for a bit. The starter, again. I’ll pay it back. You know I will.”',
  },
  sage: {
    belay: 'Sage has a list. “I need a few belays on my project. I’ve written down what to watch for.”',
    ride: '“My van’s at the shop. Could you drive me in to pick it up? I’ll owe you.”',
    loan: '“This is embarrassing. Could you spot me {cash} till the guiding pays? It always pays late.”',
  },
  mara: {
    belay: 'Mara doesn’t ask so much as announce. “You’re belaying me. I’m sending today.”',
    ride: '“Van won’t start. You’re driving me into town. I’ll navigate.”',
    loan: 'Mara looks like she’d rather be falling off something. “{cash}. You’ll have it back. Don’t make it a thing.”',
  },
  rico: {
    belay: '“Spot me! I’m so close I can taste it. It tastes like chalk.”',
    ride: '“My van needs a tire and I need a ride. Same problem, really.”',
    loan: '“So. Hypothetically. {cash} till payday? I’ll pay it back. I’ve paid people back before.”',
  },
  tam: {
    belay: 'Tam asks quietly. “Would you give me a belay? The young ones short-rope me.”',
    ride: '“I’ve an appointment in town I’d rather not drive to. Would you take me?”',
    loan: '“I hate asking. {cash}, and you’ll have it back. Ruth always said never borrow from climbers, and here I am.”',
  },
};

// What a yes costs, on its button, from the dials.
const COST: Record<FavourAsk, string> = {
  belay: `${costLabel({ min: FAVOUR.belay.min })} · ${bodyNote({ energy: -FAVOUR.belay.energy })}`,
  ride: costLabel({ min: FAVOUR.ride.min, cash: -FAVOUR.ride.cash }),
  loan: `${money(FAVOUR.loan)}, back in ${FAVOUR.loanDays} days`,
};

// What a yes costs you, said.
export const FAVOUR_DID: Record<FavourAsk, string> = {
  belay: 'You give {name} the belay, and the catches.',
  ride: 'You drive {name} into town and back.',
  loan: 'You hand {name} {cash}. Back soon, supposedly.',
};

// How they take a no.
export const FAVOUR_NO: Record<string, string> = {
  hazel: 'Hazel shrugs. “Fair enough.” It doesn’t sound fair enough.',
  sage: 'Sage nods and crosses something off the list. It might have been you.',
  mara: '“Right.” Mara turns away before you’ve finished explaining.',
  rico: 'Rico laughs it off, then doesn’t talk to you for the rest of the day.',
  tam: '“No, of course. Never mind.” Tam means it, which is somehow worse.',
};

export const FAVOUR_REPAID = '{name} pays back the {cash}, as promised.';

// Two of them want your day: the second ask, after you'd said yes to the first.
export const FAVOUR_CLASH = '{a} needs you today, for {what}. You already told {b} yes.';
export const CLASH_WHAT: Record<string, string> = { belay: 'a belay', ride: 'a ride' };

const NAME: Record<string, string> = { hazel: 'Hazel', sage: 'Sage', mara: 'Mara', rico: 'Rico', tam: 'Tam' };
const CLASHERS = ['sage', 'mara', 'rico', 'tam'];

// Their asks on their talk tree, and the clash for those who can fall out.
export const favourStarts = (who: string): TalkDef['start'] =>
  ASK[who]
    ? [
        ...(CLASHERS.includes(who)
          ? CLASHERS.filter((b) => b !== who).map((b) => ({
              when: { favourClash: `${who}/${b}` },
              node: `crew-favour-clash-${b}`,
            }))
          : []),
        ...(['belay', 'ride', 'loan'] as FavourAsk[]).map((k) => ({
          when: { favour: `${who}/${k}` },
          node: `crew-favour-${k}`,
        })),
      ]
    : [];

// `yes` is each ask's gate: what it costs, so a yes you can't afford isn't offered.
export const favourNodes = (
  who: string,
  yes: Record<FavourAsk, TalkNode['opts'][number]['when']>,
): Record<string, TalkNode> => {
  if (!ASK[who]) return {};
  const asks = Object.fromEntries(
    (['belay', 'ride', 'loan'] as FavourAsk[]).map((k) => [
      `crew-favour-${k}`,
      {
        calls: true as const,
        text: ASK[who]![k].replace('{cash}', money(FAVOUR.loan)),
        opts: [
          { label: `Yes · ${COST[k]}`, primary: true, when: yes[k], fx: { favour: 'yes' as const } },
          { label: 'Not this time', fx: { favour: 'no' as const } },
        ],
      },
    ]),
  );
  const clashes = CLASHERS.includes(who)
    ? Object.fromEntries(
        CLASHERS.filter((b) => b !== who).map((b) => [
          `crew-favour-clash-${b}`,
          {
            calls: true as const,
            text: FAVOUR_CLASH.replace('{a}', NAME[who]!).replace('{b}', NAME[b]!),
            opts: [
              {
                label: `Go with ${NAME[who]}`,
                primary: true,
                fx: { crew: { do: 'pick' as const, with: b }, favour: 'clash' as const },
              },
              {
                label: `Keep your word to ${NAME[b]}`,
                fx: { crew: { do: 'keep' as const, with: b }, favour: 'clash' as const },
              },
            ],
          },
        ]),
      )
    : {};
  return { ...asks, ...clashes };
};
