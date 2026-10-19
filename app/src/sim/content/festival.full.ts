// Phase 20.3: the crag day at Moonstone, in words (Evan's calls, 19 Oct 2026). The full game's
// only: Moonstone is past the demo, and its twin (festival.demo.ts) is blank. Blanks: {time}
// when the scramble starts and {till} when it ends, {who} whoever's leading the trail work,
// {name} a climber in the scramble, {n} how many problems, {second} and {third} what they pay.

export const FESTIVAL_SAYS = {
  name: 'The Moonstone crag day',
  // The morning of it, wherever you wake; for someone who can't get there yet; and rain there.
  morning:
    'It’s the crag day out at Moonstone: the old guard’s trail work this morning, the scramble at {time}, and a fire tonight.',
  notYet: 'It’s the crag day out at Moonstone, and the whole desert’s gone. One winter you’ll go too.',
  rained: 'Rain at Moonstone. The crag day’s off till the first dry day.',
  washed: 'Rain at Moonstone again. There’ll be no crag day this winter.',
  // On the week ahead, on the day it's set for.
  week: 'The crag day at Moonstone, if it’s dry.',
  // Coming in before the scramble: the scene, and the three ways in.
  scene:
    'The whole desert’s here. The old guard have been out since first light with rakes and a wheelbarrow, putting the trail back where it goes. There’s a folding table by the vans with a sign-up sheet for the scramble at {time}, and a box of new shoes under it for whoever wins.',
  trail: {
    label: 'Grab a rake',
    out: '{who} hands you a rake and points uphill. A morning of moving rocks, and the trail up to the Egg is a trail again. Nobody thanks you, which is how you know it counted.',
  },
  scramble: {
    label: 'Sign up for the scramble',
    note: 'From {time} to {till}, every boulder here counts once: the most sent wins, the fewest goes on them settling a tie. New shoes for first; {second} for second, {third} for third.',
    out: 'You write your name at the bottom of the sheet and somebody hands you a scorecard on a string. From {time}, every boulder here counts, once.',
  },
  climb: {
    label: 'Just climb',
    note: 'The crag’s packed all day: a queue at every boulder, and beta for the asking.',
    out: 'You give the table a wide berth. Every problem at the crag has a crowd under it, and every crowd has an opinion.',
  },
  // {who}, when neither Ray nor Frank is out here.
  oldHand: 'One of the old guard',
  // Coming in once it's started.
  late: 'The scramble started without you, and the crag’s heaving. You climb anyway.',
  // The scorecard, from the van while it's on.
  hand: 'Hand in your scorecard',
  handNote: 'So far: {card}. It closes at {till}.',
  notYetOn: 'The scramble starts at {time}.',
  // The scorecard handed in ({card}: "4 problems in 9 goes", {place}: "3rd"), how you placed
  // from the top down, what the podium pays, and the field.
  scrambled: 'The scramble: {card}, {place} of {of}.',
  won: 'Nobody sent more. Somebody hands you the box of shoes, and somebody else wants to know your size.',
  podium: 'On the podium, near enough: a crate turned on its end, and your name read out wrong.',
  mid: 'Mid-pack. You sent what you came to send, and one or two you didn’t.',
  low: 'A rough afternoon, and the crowd under every boulder saw all of it.',
  shoes: 'New shoes, in the box they came in.',
  shoesPaid: 'Your shoes are new already, so they pay you what the box is worth:',
  wonBy: '{name} won it with {n}.',
  dexAhead: 'Dex beat you, and made sure you knew.',
  dexBehind: 'You beat Dex. He says he wasn’t trying.',
  // That night at the fire, by how you spent the day, and who's there.
  fire: {
    trail:
      'Back at the Lot the fire’s built from the deadfall off the trail, and {who} says the trail’s the best it’s looked in years. {who} says that every year.',
    scramble:
      'Back at the Lot everybody at the fire has a scorecard, and a story about the one that got away.',
    climb:
      'Back at the Lot everybody at the fire was out at Moonstone, and everybody has a problem to tell you about.',
  },
  alone:
    'Nobody you know is at the fire, but everybody at it was at Moonstone today, and that’s enough to be going on with.',
  with: {
    hazel: 'Hazel wants every problem you did, in order.',
    sage: 'Sage reads out the scramble’s results as if they were the news.',
    dex: 'Dex tells everyone what he’d have sent if they’d let him warm up.',
    mara: 'Mara brought a rake home by mistake and won’t say whose it is.',
    rico: 'Rico has a new worst fall to tell, and for once it isn’t yours.',
    tam: 'Tam says the trail used to go round the other side of the Egg, and nobody argues.',
    ray: 'Ray tells the one about the first time they fixed the trail: all winter, four of them, one wheelbarrow.',
    frank: 'Frank brings his chair and a pot of chili that’s been on since the trail work started.',
  } as Record<string, string>,
};
