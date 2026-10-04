// Phase 25.6: what the strangers at a busy crag say when you stop by, as data. v0.956's
// walker chats were its most-repeated text, every kind seen about ten times by day 30; these
// are walked by the seed, a few a day, and some only when they'd be true.

import type { KeeperLine } from './keepers';

export const CROWD: KeeperLine[] = [
  { text: '"Is this the V3? The book says V3. My forearms say the book is lying."' },
  { text: '"You climbing that? Go ahead. I’m just looking at it. I’ve been looking at it for a year."' },
  { text: '"We drove six hours for this. Six. I’ve already fallen off the first move eleven times."' },
  { text: '"Do you know if the left foot’s on? Everybody says something different about the left foot."' },
  { text: '"My boyfriend says I overgrip. I say he under-sends." She seems pleased with it.' },
  {
    text: 'Somebody offers you a gummy bear from a bag that’s been in a chalk bucket. You take it. Of course you take it.',
  },
  { text: '"Nice pad. Is that the new one? Mine’s held together with duct tape and optimism."' },
  { text: '"I flashed this in 2009. It was easier then. Everything was easier then."' },
  { text: 'A kid in a helmet asks if you’re famous. You say no. The kid looks relieved.' },
  { text: '"You local? Where’s good when it’s like this? Don’t say the gym."' },
  { text: '"I’m not projecting it. I’m getting to know it."' },
  { text: 'A dog trots over, sniffs your chalk bag, and goes back to its people with a full report.' },
  { text: '"Spot me? You don’t have to catch me. Just make a noise if I’m going to die."' },
  { text: '"Watch the third hold. It spins. Everybody finds out the hard way, so: you’re welcome."' },
  { text: '"Somebody chipped that hold in the eighties. Don’t tell anyone it’s easier now."' },
  { text: '"We’re doing a link-up. It’s three problems. We’ve done none of them."' },
  { text: '"Is it always this busy? It’s never this busy. It’s always this busy."' },
  { text: '"The rock’s greasy. Or I am. Hard to tell, honestly."', when: { sky: 'hot' } },
  {
    text: '"Wait for the shade. Everybody who didn’t wait for the shade is at the bottom with us."',
    when: { sky: 'hot' },
  },
  {
    text: '"Too cold to feel my fingers, so technically I can’t feel the crimps hurting. Science."',
    when: { season: 'winter' },
  },
  {
    text: '"Conditions are perfect. Absolutely perfect. I still can’t do it, but it’s perfect."',
    when: { sky: 'prime' },
  },
  {
    text: '"Wait, you sent the hard one? The one round the corner? Can I see your hands?"',
    when: { grade: 9 },
  },
  {
    text: 'Someone nudges a friend and says your name. You pretend you didn’t hear. You heard.',
    when: { grade: 11 },
  },
];

// Five a day and they've gone back to their own climbing.
export const CROWD_DONE = 'The crowd’s gone back to their own projects.';
export const CROWD_PER_DAY = 5;
