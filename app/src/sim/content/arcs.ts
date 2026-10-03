// Phase 17.2: the cast's milestones. Each core character gets an arc of four beats, as
// Sage's (people.ts), due at the bonds in ARC.bonds and spaced by ARC.spacing; the fourth is
// its resolution. Every arc has a fork that changes when they're around: a stint away, or
// a day they keep for you. Sage's arc stays where it is; the timers (Ray's last season,
// Tam's, Frank's rig) are 17.3's.

import { ARC } from '../dials';
import type { TalkDef, TalkNode } from './people';

const beat = (text: string, opts: TalkNode['opts']): TalkNode => ({ calls: true, text, opts });

export const ARCS: Record<string, TalkNode[]> = {
  // Hazel: eleven years parked at the Lot, and the reason you stayed.
  hazel: [
    beat(
      'Hazel’s hood is up and her hands are black to the wrist. "Starter. Third one this year." She holds out a wrench without looking. "If you’re going to live in a van, you’d better learn which end of it to hit."',
      [
        {
          label: 'Take the wrench',
          primary: true,
          fx: {
            arc: true,
            cost: { min: 30 },
            bond: 1,
            line: 'Hazel’s van starts. She pretends she knew it would.',
          },
        },
        {
          label: '"Later, I’m climbing"',
          fx: { arc: true, line: 'Hazel shrugs. "Your loss. It’s a good starter story."' },
        },
      ],
    ),
    beat(
      'Hazel’s on the phone at the base, back to the wall. When she hangs up she sits on the rope bag for a while. "My sister. Kid’s sick, nothing serious, but she’s on her own with it." She doesn’t ask you anything.',
      [
        {
          label: '"Go. I’ll be here."',
          primary: true,
          fx: {
            arc: true,
            away: ARC.hazelHome,
            bond: 1,
            line: 'Hazel drives off before dark. Back in {away} days, the note on your windscreen says. The coffee’s on your shelf.',
          },
        },
        {
          label: '"Is there anything I can do from here?"',
          fx: { arc: true, line: 'She thinks about it. "Belay me. I need to fall off something."' },
        },
      ],
    ),
    beat(
      'Hazel walks you to the far end of the wall and points at a line with one rusted bolt and no chalk. "Mine. Ten years ago. Never did the top." She’s already tying in. "Don’t say anything encouraging."',
      [
        {
          label: 'Belay her',
          primary: true,
          when: { energy: 10 },
          fx: {
            arc: true,
            cost: { min: 90, energy: -10 },
            train: { head: 2 },
            line: 'Hazel falls off the top twice and doesn’t finish it. She’s smiling at the anchor anyway.',
          },
        },
        {
          label: '"It’ll still be there tomorrow"',
          fx: { arc: true, line: '"That’s the problem with it," Hazel says.' },
        },
      ],
    ),
    beat(
      'Hazel hands you the coffee pot, dented, with the handle taped. "I bought a new one. Took me eleven years." She looks at the Lot, the vans, your van. "I’m not going anywhere. Figured you should know that."',
      [
        {
          label: 'Take the pot',
          primary: true,
          fx: { arc: true, bondAtLeast: 7, line: 'You and Hazel: the same Lot, for as long as it lasts.' },
        },
      ],
    ),
  ],

  // Dex: a rival until the day he isn't.
  dex: [
    beat(
      'Dex is alone under the boulders, staring at a landing he doesn’t like. He doesn’t look at you. "Spot me." A pause. "If you’re not busy."',
      [
        {
          label: 'Spot him',
          primary: true,
          fx: {
            arc: true,
            cost: { min: 20 },
            bond: 1,
            line: 'Dex sends it and says nothing. He nods once on the walk down.',
          },
        },
        {
          label: '"Ask someone else"',
          fx: { arc: true, line: 'He does. It takes him an hour to find someone.' },
        },
      ],
    ),
    beat(
      'Dex is sitting on his pad, not climbing. "Sponsor dropped me. Said my numbers were flat." He laughs at nothing. "Numbers."',
      [
        {
          label: 'Sit with him a while',
          primary: true,
          fx: {
            arc: true,
            cost: { min: 30 },
            bond: 1,
            line: 'Neither of you says much. He climbs again before you leave.',
          },
        },
        {
          label: '"Train harder, then"',
          fx: {
            arc: true,
            away: ARC.dexTrains,
            train: { head: 1 },
            line: '"Yeah," Dex says. "Yeah. I will." He disappears into the Training Center for {away} days.',
          },
        },
      ],
    ),
    beat(
      'Dex nods at his project. "You’ve watched me fall off that enough to know it better than me. Go on. Show me what I’m doing wrong."',
      [
        {
          label: 'Trade goes with him',
          primary: true,
          when: { energy: 10 },
          fx: {
            arc: true,
            cost: { min: 90, energy: -10 },
            train: { power: 2 },
            line: 'You both fall off the same move all afternoon. It’s the best day out you’ve had in weeks.',
          },
        },
        { label: '"Not today"', fx: { arc: true, line: '"Coward," Dex says, and means something nicer.' } },
      ],
    ),
    beat(
      'Dex walks over with two coffees and gives you one. "I used to train to beat you." He drinks. "Now I train because you’ll notice if I don’t." He doesn’t wait for an answer.',
      [
        {
          label: 'Drink the coffee',
          primary: true,
          fx: { arc: true, bondAtLeast: 7, line: 'Dex Calloway: still a rival, on paper.' },
        },
      ],
    ),
  ],

  // Mara: the hardest climber you know, and the least impressed.
  mara: [
    beat(
      'Mara watches you climb, then takes your shoes off the pad and puts them back down facing the other way. "Your feet are lazy. Again. Quietly this time."',
      [
        {
          label: 'Do it quietly',
          primary: true,
          fx: {
            arc: true,
            cost: { min: 40 },
            train: { technique: 2 },
            line: 'Mara makes you climb it six times. The sixth one, she doesn’t say anything.',
          },
        },
        { label: '"My feet are fine"', fx: { arc: true, line: '"Fine is the word," Mara says.' } },
      ],
    ),
    beat(
      'Mara’s racking up for the hardest thing in the canyon. "I need a belayer who won’t talk. All day. You in?"',
      [
        {
          label: '"All day."',
          primary: true,
          when: { energy: 10 },
          fx: {
            arc: true,
            cost: { min: 180, energy: -10 },
            bond: 1,
            train: { head: 2 },
            line: 'You belay Mara all day. She doesn’t send. On the walk out she tells you it was a good day.',
          },
        },
        {
          label: '"Can’t today"',
          fx: {
            arc: true,
            away: ARC.maraCool,
            line: 'Mara nods and finds someone else. You don’t see her for {away} days.',
          },
        },
      ],
    ),
    beat(
      'Mara’s at the base with her finger taped to the next one, very still. "Pulley. Heard it go." She looks at the wall, not the finger. "A while. Less, if I’m stupid about it."',
      [
        {
          label: 'Bring her food every day',
          primary: true,
          fx: {
            arc: true,
            away: ARC.maraHurt,
            bond: 1,
            line: 'Mara’s off the rock for {away} days. You bring her food. She complains about all of it and eats all of it.',
          },
        },
        {
          label: 'Leave her to it',
          fx: {
            arc: true,
            away: ARC.maraHurt,
            line: 'Mara’s off the rock for {away} days. She’d have told you to leave her to it anyway.',
          },
        },
      ],
    ),
    beat(
      'Mara sends the line she’s been on all season, quietly, first go of the day. At the bottom she unties, coils the rope, and then she hugs you, hard, once. "Don’t tell anyone I did that."',
      [
        {
          label: 'Tell no one',
          primary: true,
          fx: {
            arc: true,
            bondAtLeast: 7,
            line: 'Mara sent it. You’ve told no one, which she counts as a lot.',
          },
        },
      ],
    ),
  ],

  // Rico: power, noise, and no money.
  rico: [
    beat(
      'Rico shows you a video on his phone: you, off the crux, arms windmilling. He’s set it to music. "This is art." He’s shown everyone.',
      [
        {
          label: 'Laugh',
          primary: true,
          fx: {
            arc: true,
            bond: 1,
            line: 'Rico’s video of your fall is the most-watched thing at the crag this week.',
          },
        },
        {
          label: '"Delete that"',
          fx: { arc: true, line: '"I’ll delete it when you send," Rico says. He means it, sort of.' },
        },
      ],
    ),
    beat(
      'Rico’s counting coins on a pad. "Van needs a tire. I need to eat this week. Pick one." He isn’t asking you for anything, loudly.',
      [
        {
          label: `Give him $${ARC.ricoLoan}`,
          primary: true,
          when: { pay: ARC.ricoLoan },
          fx: {
            arc: true,
            cost: { cash: -ARC.ricoLoan },
            bond: 1,
            line: 'Rico takes the money like it’s a loan. You both know it isn’t.',
          },
        },
        {
          label: '"I’m skint too"',
          fx: {
            arc: true,
            away: ARC.ricoWork,
            line: 'Rico picks up shifts in town. He’s off the rock for {away} days.',
          },
        },
      ],
    ),
    beat(
      'Rico’s quiet, which is how you know. "Gym in the city wants me setting. Full time. Real money." He spins a brush in his fingers. "I’d be good at it."',
      [
        {
          label: '"Take it. Come back on weekends."',
          primary: true,
          fx: {
            arc: true,
            away: ARC.ricoCity,
            bond: 1,
            line: 'Rico takes the job. He’s back in {away} days, he says, with the pads.',
          },
        },
        {
          label: '"You’d hate it"',
          fx: {
            arc: true,
            line: 'Rico turns it down. "You’re right," he says. "I’d have been great, though."',
          },
        },
      ],
    ),
    beat(
      'Rico sends the steepest thing he’s ever touched and drops off the top screaming. Everyone at the boulders turns round. He points at you. "THIS ONE. THIS ONE SPOTTED ME."',
      [
        {
          label: 'Yell back',
          primary: true,
          fx: {
            arc: true,
            bondAtLeast: 7,
            line: 'Rico sent it. Half the crag knows your name now, for the wrong reasons.',
          },
        },
      ],
    ),
  ],

  // Tam: long routes, early starts, and counting the seasons.
  tam: [
    beat(
      'Tam stops you at the first ledge. "You’re climbing like you’re late. Stand here. Breathe until your hands stop shaking. Then go."',
      [
        {
          label: 'Stand there',
          primary: true,
          fx: {
            arc: true,
            cost: { min: 30 },
            train: { endurance: 2 },
            line: 'You stand on the ledge till your hands stop. The rest of the route goes.',
          },
        },
        {
          label: '"I’ll rest at the top"',
          fx: { arc: true, line: '"Everybody does," Tam says. "Eventually."' },
        },
      ],
    ),
    beat(
      'Tam hands you an old rope, sun-faded, coiled exactly. "Ruth’s. My partner, thirty years. She’d want it used, not kept." He waits to see what you’ll do with it.',
      [
        {
          label: 'Lead on it today',
          primary: true,
          fx: {
            arc: true,
            bond: 1,
            line: 'You lead on Ruth’s rope. Tam belays and doesn’t say anything all morning.',
          },
        },
        {
          label: '"I’ll keep it safe"',
          fx: { arc: true, line: 'Tam nods. "Safe is a kind of used, I suppose."' },
        },
      ],
    ),
    beat(
      'Tam looks up at the route he’s led for thirty years, then at his knees. "You lead it. I’ll follow. That’s the order now."',
      [
        {
          label: 'Lead it',
          primary: true,
          when: { energy: 12 },
          fx: {
            arc: true,
            cost: { min: 150, energy: -12 },
            train: { head: 2, endurance: 2 },
            line: 'You lead Tam’s route. He follows it slow and clean and says you placed the third piece wrong.',
          },
        },
        {
          label: '"It’s yours. You lead."',
          fx: {
            arc: true,
            away: ARC.tamRest,
            line: 'Tam leads it, slowly. He rests his knees for {away} days after.',
          },
        },
      ],
    ),
    beat(
      'At the top of the long route Tam sits on the edge with his feet over and says nothing for a long time. "Good partner," he says finally, to the view or to you.',
      [
        {
          label: 'Sit with him',
          primary: true,
          fx: { arc: true, bondAtLeast: 7, line: 'Tam Okonkwo calls you his partner for the long ones.' },
        },
      ],
    ),
  ],

  // Ray: the wall's memory.
  ray: [
    beat(
      'Ray takes you to a bolt at head height, rusted brown. "First one I ever placed. Hand drill, three hours. My wrist still knows." He taps it. "Don’t clip it."',
      [
        {
          label: 'Listen to the rest',
          primary: true,
          fx: {
            arc: true,
            cost: { min: 30 },
            bond: 1,
            line: 'Ray tells you how the wall got its names. Two of them are rude.',
          },
        },
        { label: '"Noted"', fx: { arc: true, line: '"Everybody notes it," Ray says. "Then they clip it."' } },
      ],
    ),
    beat(
      'Ray’s got a drill, a bag of new bolts and a ladder that’s seen better days. "That one’s worse than mine. Hold the ladder or don’t, but don’t stand under it."',
      [
        {
          label: 'Hold the ladder',
          primary: true,
          fx: {
            arc: true,
            cost: { min: 120 },
            bond: 1,
            train: { head: 1 },
            line: 'You and Ray replace the worst bolt on the wall. Nobody will ever know, which is the point.',
          },
        },
        {
          label: 'Stand somewhere else',
          fx: { arc: true, line: 'Ray does it alone, slowly, and says it was fine.' },
        },
      ],
    ),
    beat(
      'Ray points at a line you’ve walked past a hundred times. "That one. Never sent it. Thirty-one years." He doesn’t sound sorry. "Somebody should, before I stop coming."',
      [
        {
          label: '"I’ll get on it"',
          primary: true,
          fx: {
            arc: true,
            bond: 1,
            line: 'Ray’s line is yours to try now. He says he’ll watch, from the rail.',
          },
        },
        {
          label: '"It’s yours, Ray"',
          fx: { arc: true, line: '"Not any more," Ray says. "That’s sort of the point."' },
        },
      ],
    ),
    beat(
      'Ray gives you a folded sheet of paper soft as cloth: the wall, drawn by hand, every line, who bolted it, who fell off it. "Someone should have this who’ll keep coming back."',
      [
        {
          label: 'Take the topo',
          primary: true,
          fx: {
            arc: true,
            bondAtLeast: 7,
            line: 'You have Ray’s topo of the wall. It’s better than the guidebook.',
          },
        },
      ],
    ),
  ],

  // Frank: nine years passing through.
  frank: [
    beat(
      'Frank’s under your van with a torch in his teeth before you’ve said anything. "Your leak." He comes out with a bit of rubber. "Was your leak."',
      [
        {
          label: 'Thank him',
          primary: true,
          fx: {
            arc: true,
            bond: 1,
            line: 'Frank fixed the leak. He won’t take anything for it, so you leave a beer on his step.',
          },
        },
        { label: '"I liked my leak"', fx: { arc: true, line: '"Everybody does, till winter," Frank says.' } },
      ],
    ),
    beat(
      'Frank’s quiet at the stove tonight. He shows you a photo, creased: a girl on a bike, maybe ten. "She’s nineteen now. I send a card every year. I don’t know if they get there." He puts the photo away.',
      [
        {
          label: '"Send this year’s from here"',
          primary: true,
          fx: {
            arc: true,
            bond: 1,
            line: 'Frank writes a card at the fire. He asks you how to spell "proud".',
          },
        },
        {
          label: 'Say nothing',
          fx: {
            arc: true,
            line: 'You sit with him till the stove goes out. That seems to be what he wanted.',
          },
        },
      ],
    ),
    beat(
      'Frank’s truck won’t turn over and there’s a tow rope in his hand. "Down the hill to the garage. Your van’ll do it. Probably."',
      [
        {
          label: 'Tow him',
          primary: true,
          fx: {
            arc: true,
            cost: { min: 60, energy: -6 },
            bond: 1,
            line: 'Your van tows Frank’s down the hill and doesn’t die. He says it’s the bravest thing your van’s ever done.',
          },
        },
        {
          label: '"Not in my van"',
          fx: {
            arc: true,
            away: ARC.frankGone,
            line: 'Frank gets a tow from town. He’s gone {away} days while the garage has it.',
          },
        },
      ],
    ),
    beat(
      'Frank’s at the fire with a map spread on his knees, but he isn’t looking at it. "Nine years I’ve been deciding where to go next." He folds it. "Turns out I’d already got there."',
      [
        {
          label: 'Stay up with him',
          primary: true,
          fx: {
            arc: true,
            bondAtLeast: 7,
            line: 'Frank isn’t passing through any more. He says it like it surprised him.',
          },
        },
      ],
    ),
  ],
};

// The start entries that open each beat, and the nodes, for a talk tree.
export const arcStarts = (who: string): TalkDef['start'] =>
  (ARCS[who] ?? []).map((_, i) => ({ when: { arc: `${who}/${i + 1}` }, node: `beat-${i + 1}` }));
export const arcNodes = (who: string): Record<string, TalkNode> =>
  Object.fromEntries((ARCS[who] ?? []).map((n, i) => [`beat-${i + 1}`, n]));
