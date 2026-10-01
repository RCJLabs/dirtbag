// What happens up there (Phase 24.4) [proposed]: a few things a big wall does to you, as
// data. One comes some mornings on the wall, never the first and never twice a trip (events
// in game.ts); each is a call with its cost said. `fx`: energy, days of food and water, a
// pitch fixed or lost, the portaledge gone, bond with your partner, psyche, and whether the
// day's gone with it (you camp where you are). The costs show beside each call, formatted
// from `fx` (wallNote), so the text here never says a number the rules use.

export interface WallFx {
  energy?: number;
  food?: number;
  pitch?: number;
  ledge?: false;
  bond?: number;
  psyche?: number;
  day?: true;
}

export interface WallOpt {
  label: string;
  sub: string;
  out: string;
  fx: WallFx;
}

export interface WallEvent {
  id: string;
  title: string;
  sit: string;
  // Only where the water's snow (the stove's), or only roped (a partner's in it).
  melt?: true;
  roped?: true;
  opts: WallOpt[];
}

export const WALL_EVENTS: WallEvent[] = [
  {
    id: 'cam',
    title: 'Something Small and Expensive',
    sit: 'A cam comes off your harness at the belay, hits the slab once, and is gone into the air. It was the one that fit the next crack.',
    opts: [
      {
        label: 'Climb on without it',
        sub: 'Run it out where it would have gone.',
        out: 'You run it out where the cam would have gone. It goes. You do not enjoy it.',
        fx: { energy: -15, psyche: -3 },
      },
      {
        label: 'Rap down and look for it',
        sub: 'Down after it, and back up.',
        out: 'Two raps down it is wedged in a crack, smug. By the time you jug back up the light’s going.',
        fx: { day: true, energy: -10 },
      },
    ],
  },
  {
    id: 'haulbag',
    title: 'The Pig',
    sit: 'The haul bag jams under a flake fifty feet below the anchor and will not come. You can feel the rope take the weight of a week of food.',
    opts: [
      {
        label: 'Rap down and free it',
        sub: 'Hard work, and the bag comes whole.',
        out: 'You lower off, shoulder the flake, and the bag swings free. Jugging back up takes everything you had for the morning.',
        fx: { energy: -25 },
      },
      {
        label: 'Cut the bag loose of the food on top',
        sub: 'Lighter, and less to eat.',
        out: 'Food and water go to the talus. The bag comes up the next time you pull. You try not to do the arithmetic.',
        fx: { food: -2 },
      },
    ],
  },
  {
    id: 'rockfall',
    title: 'Something Coming Down',
    sit: 'A crack like a rifle, high above. Then the whir. Then nothing, then a lot of something, all at once, down the line you were about to climb.',
    opts: [
      {
        label: 'Wait it out under the roof',
        sub: 'Slow, and you’re both whole.',
        out: 'You sit under the roof with your helmets touching while the wall sheds. By the afternoon it’s quiet, and too late to start.',
        fx: { day: true },
      },
      {
        label: 'Go between the volleys',
        sub: 'Quick, and something will hit you.',
        out: 'You go between volleys. Something the size of a fist finds your shoulder on the way. You lead the rest of the day one-armed in your head.',
        fx: { energy: -30, psyche: -4 },
      },
    ],
  },
  {
    id: 'squall',
    title: 'Not in the Forecast',
    sit: 'The sky that was clear at breakfast is gray by the second anchor, and the wind has turned around to come straight up the wall at you.',
    opts: [
      {
        label: 'Sit it out on the portaledge',
        sub: 'Ride it out where you are.',
        out: 'You zip the fly and wait while the portaledge swings. The squall eats the day and some of what you brought.',
        fx: { day: true, food: -1 },
      },
      {
        label: 'Retreat a pitch to the ledge below',
        sub: 'Safer ground, and the pitch above to fix again.',
        out: 'You rap a pitch to the big ledge and ride it out there. It’s better there. The pitch above will have to be fixed again.',
        fx: { pitch: -1, energy: -10 },
      },
    ],
  },
  {
    id: 'party',
    title: 'Somebody Else’s Bad Day',
    sit: 'A party two pitches up is yelling, and not the good kind. One of them has a bad ankle and the other is not sure how to get him down.',
    roped: true,
    opts: [
      {
        label: 'Go up and help them down',
        sub: 'Your partner sees you do it.',
        out: 'You spend the day lowering a stranger and his ankle down the wall. Your partner doesn’t say anything about it, which is how you know.',
        fx: { day: true, energy: -20, bond: 1, psyche: 4 },
      },
      {
        label: 'Call down for a rescue and keep climbing',
        sub: 'The rangers will come. You feel it all day.',
        out: 'You shout down to the meadow for a rescue and keep climbing. The helicopter comes in the afternoon. It doesn’t feel like a choice you’d tell at the fire.',
        fx: { psyche: -5 },
      },
    ],
  },
  {
    id: 'stove',
    title: 'The Stove Quits',
    sit: 'The stove coughs twice and dies with half a pot of snow in it. Up here, the stove is the water.',
    melt: true,
    opts: [
      {
        label: 'Strip it down and fix it',
        sub: 'An hour with numb fingers.',
        out: 'An hour of cold fingers and a jet the size of a hair. It lights. You melt a pot and drink half of it standing up.',
        fx: { energy: -15 },
      },
      {
        label: 'Melt what you can in a bottle in your sleeping bag',
        sub: 'Less water, and the days run shorter.',
        out: 'You sleep with a bottle of snow against your chest. It gives you a mouthful by morning. The days just got shorter.',
        fx: { food: -2 },
      },
    ],
  },
];

export const wallEventById = (id: string): WallEvent | undefined => WALL_EVENTS.find((e) => e.id === id);
