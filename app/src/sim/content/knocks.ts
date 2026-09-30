// Knocks on the van at night (Phase 22.6a), as data: v0.956's ten, in its words, by where
// you're parked. Each has three answers and what each does to you. v0.956's standing,
// reputation, crafting materials and grime have no home in the rebuild: those effects are
// gone, and the scavenging knock's finds are just the finding. Its British turns are
// American here, as the valley is. Psyche is v0.956's scale; events.ts halves it.

import type { GameState } from '../types';

export type Spot = GameState['spot'];

export interface KnockFx {
  psyche?: number;
  energy?: number;
  cash?: number;
  // With the friend whose driveway it is.
  bond?: number;
  supplies?: number;
}

export interface Knock {
  id: string;
  spots: Spot[];
  title: string;
  sit: string;
  opts: { label: string; out: string; fx: KnockFx }[];
}

export const KNOCKS: Knock[] = [
  {
    id: 'cop',
    spots: ['lot'],
    title: 'A Flashlight on the Glass',
    sit: 'A flashlight sweeps the curtain and somebody raps twice on the panel with a knuckle. Not aggressive. Official.',
    opts: [
      {
        label: 'Open up and be a person about it',
        out: 'You crack the door, say good evening, admit exactly what you are doing. He looks at you a long moment and tells you to be gone by seven. You are gone by six.',
        fx: { psyche: -2 },
      },
      {
        label: 'Lie absolutely still',
        out: 'You do not breathe for four minutes. The light moves off. You lie awake the rest of the night listening for it to come back, which is its own kind of cost.',
        fx: { psyche: -4, energy: -8 },
      },
      {
        label: 'Get up and move the van now',
        out: 'You drive two blocks and park behind the hardware store, and sleep badly on a slope, and are not tagged.',
        fx: { energy: -6, psyche: -1 },
      },
    ],
  },
  {
    id: 'drunk',
    spots: ['lot', 'truckstop'],
    title: 'Wrong Vehicle',
    sit: 'Somebody is pulling on the side door handle and telling their friend this is definitely the right car.',
    opts: [
      {
        label: 'Yell that it is not a taxi',
        out: 'A long pause, then a genuinely mortified apology through the glass, and the sound of two people helping each other away down the road.',
        fx: { psyche: 1 },
      },
      {
        label: 'Get out and sort them out',
        out: 'They are nineteen and one of them cannot stand up. You end up calling them a ride and waiting with them until it comes. You lose an hour and gain something you cannot name.',
        fx: { energy: -10, psyche: 4 },
      },
      {
        label: 'Wait it out with a hand on the door',
        out: 'They give up eventually. You spend twenty minutes with your heart going, and it takes a while after that to get back down.',
        fx: { psyche: -3, energy: -5 },
      },
    ],
  },
  {
    id: 'jump',
    spots: ['lot', 'truckstop', 'trailhead'],
    title: 'Somebody Needs a Jump',
    sit: 'A soft knock, and an apology before the sentence even starts. Their battery is dead and yours is the only rig with a light on.',
    opts: [
      {
        label: 'Get the cables out',
        out: 'Ten minutes, one dead battery, one running engine, and a handshake that goes on slightly too long. They ask your name twice so they remember it.',
        fx: { energy: -6, psyche: 5 },
      },
      {
        label: 'Cables, and take the twenty they offer',
        out: 'They insist. You take it, and something small goes out of the exchange as the bill goes in.',
        fx: { energy: -6, cash: 20, psyche: 1 },
      },
      {
        label: 'Tell them you have no cables',
        out: 'You do have cables. You listen to them try three more vans and lie there feeling exactly as good about it as you would expect.',
        fx: { psyche: -6 },
      },
    ],
  },
  {
    id: 'headlights',
    spots: ['trailhead'],
    title: 'Headlights at Two',
    sit: 'A truck comes up the dirt road with its brights on and parks close enough that you can hear the radio. Voices. Doors.',
    opts: [
      {
        label: 'Go say hello',
        out: 'Three locals with a cooler, out to sit on the tailgate and argue about nothing. They hand you a beer for turning up. You get four hours of sleep and no regrets.',
        fx: { energy: -12, psyche: 7 },
      },
      {
        label: 'Stay put and stay quiet',
        out: 'They are gone by four and never knew you were there. You sleep badly through the radio.',
        fx: { energy: -6, psyche: -1 },
      },
      {
        label: 'Start the van and find somewhere else',
        out: 'You give up the spot at 2 a.m. and take the first flat pull-off you find, which turns out to be on a slope.',
        fx: { energy: -10, psyche: -2 },
      },
    ],
  },
  {
    id: 'critter',
    spots: ['trailhead', 'ridge'],
    title: 'Something in the Food Box',
    sit: 'A scrabbling, deliberate noise, close. Something with hands is going through your pantry crate.',
    opts: [
      {
        label: 'Bang on the wall and shout',
        out: 'It leaves, unhurried, deeply unimpressed with you, and takes the bread.',
        fx: { psyche: -1, energy: -3 },
      },
      {
        label: 'Get out with the light and secure everything properly',
        out: 'Twenty minutes in the cold, doing the thing you should have done at dusk. Nothing gets taken and you sleep sound after.',
        fx: { energy: -8, psyche: 2 },
      },
      {
        label: 'Roll over',
        out: 'In the morning the crate is open, the bread is gone, and there are extremely small handprints on the bumper.',
        fx: { psyche: 1, energy: 2 },
      },
    ],
  },
  {
    id: 'wind',
    spots: ['ridge'],
    title: 'The Van Moves',
    sit: 'The wind up here has been working on the rig for an hour and just rocked it hard enough to wake you properly.',
    opts: [
      {
        label: 'Turn it nose-in and go back to sleep',
        out: 'Two minutes of driving, and the van stops being a sail. You sleep like the dead.',
        fx: { energy: -3, psyche: 2 },
      },
      {
        label: 'Get up and watch it',
        out: 'You sit in the driver’s seat with a blanket and watch a front come over the valley in the dark. You do not get back to sleep and you are not sorry.',
        fx: { energy: -14, psyche: 9 },
      },
      {
        label: 'Ride it out where you are',
        out: 'The van rocks all night. You dream about being at sea, which is not the worst dream.',
        fx: { energy: -7 },
      },
    ],
  },
  {
    id: 'sharedspot',
    spots: ['ridge'],
    title: 'Somebody Else Knows About This Spot',
    sit: 'Another rig comes up the road at midnight, sees your van, and stops well short of it, which tells you everything about who they are.',
    opts: [
      {
        label: 'Wave them in',
        out: 'Two vans, one ridge, a fire built from what you both had. They knew about this place from the same person you did.',
        fx: { energy: -8, psyche: 8 },
      },
      {
        label: 'Nod and leave it at that',
        out: 'Two rigs, a hundred yards apart, both quiet. In the morning there is a coffee on your bumper, still warm.',
        fx: { psyche: 4 },
      },
      {
        label: 'Pretend to be asleep',
        out: 'They park down the road. You feel oddly like you have failed a small test that nobody set.',
        fx: { psyche: -3 },
      },
    ],
  },
  {
    id: 'guard',
    spots: ['truckstop'],
    title: 'The Man in the Hi-Vis',
    sit: 'Somebody with a clipboard and a flashlight is going down the line of parked rigs, and yours is next.',
    opts: [
      {
        label: 'Buy something inside and show the receipt',
        out: 'Turns out a customer can sleep here. Eleven dollars for a coffee and a bag of chips is the cheapest campsite in the county.',
        fx: { cash: -11, psyche: 1 },
      },
      {
        label: 'Explain yourself honestly',
        out: 'He has heard it all before and does not care in the slightest. Stay as long as you need. Do not make a mess.',
        fx: { psyche: 3 },
      },
      {
        label: 'Move to the far end of the lot',
        out: 'You end up parked between two reefer trucks. You sleep, technically.',
        fx: { energy: -8, psyche: -2 },
      },
    ],
  },
  {
    id: 'scavenge',
    spots: ['truckstop', 'lot'],
    title: 'The Dumpster Behind the Building',
    sit: 'You get up at three to use the bathroom and see somebody wheeling a perfectly good roll of webbing out of the dumpster behind the shop.',
    opts: [
      {
        label: 'Have a proper look yourself',
        out: 'Webbing, most of a tarp, and a length of cord somebody threw out for no reason a sane person could name. You need a wash after.',
        fx: { energy: -4, supplies: -5, psyche: 2 },
      },
      {
        label: 'Ask them what else is in there',
        out: 'They show you. You end up talking for half an hour about the things people throw away. They give you the cord out of their own haul.',
        fx: { energy: -6, psyche: 4 },
      },
      {
        label: 'Go back to bed',
        out: 'You lie there thinking about that webbing for a solid ten minutes before you sleep.',
        fx: { psyche: -1 },
      },
    ],
  },
  {
    id: 'friend',
    spots: ['driveway'],
    title: 'One in the Morning',
    sit: 'The porch light comes on. {who} comes out in a bathrobe with two mugs, taps the glass, and gets in the passenger seat without asking.',
    opts: [
      {
        label: 'Talk until it gets light',
        out: 'They tell you the thing they have not told anybody. You do not fix it. You are just the person who was parked in the driveway at the right time.',
        fx: { energy: -14, psyche: 9, bond: 2 },
      },
      {
        label: 'One mug, then sleep',
        out: 'Half an hour, one coffee, nothing heavy. They say thanks for being around, and mean it more than the sentence carries.',
        fx: { energy: -4, psyche: 5, bond: 1 },
      },
      {
        label: 'Say you have an early start',
        out: 'They take the second mug back inside without a word about it. The porch light goes off.',
        fx: { psyche: -5, bond: -1 },
      },
    ],
  },
];
