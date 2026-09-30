// Dreams (Phase 22.8), as data: v0.956's three, its prices, and what each one does for good.
// Home Base says exactly what it stops charging, where v0.956's said "ever".

export type DreamId = 'rig' | 'warchest' | 'homebase';

export interface Dream {
  id: DreamId;
  name: string;
  cost: number;
  blurb: string;
  perk: string;
  // Said the day you claim it.
  claimed: string;
}

export const DREAMS: Dream[] = [
  {
    id: 'rig',
    name: 'The Dream Rig',
    cost: 2800,
    blurb: 'A fully dialed adventure van: the rig you actually want to live out of.',
    perk: 'Every spot costs half as much for good, and every upgrade Dale fits is fitted.',
    claimed:
      'The Dream Rig. Bed, kitchen, heater, the lot, and a van you’d choose again. Every spot costs half now.',
  },
  {
    id: 'warchest',
    name: 'The War Chest',
    cost: 5000,
    blurb: 'A real bankroll for the trips of a lifetime: flights, permits, no compromises.',
    perk: 'Every expedition costs half as much.',
    claimed: 'The War Chest. The big trips are half what they were, and the walls look closer for it.',
  },
  {
    id: 'homebase',
    name: 'Home Base',
    cost: 9000,
    blurb: 'A cabin at the edge of the Lot, and a kitchen in it. The dirtbag who made it.',
    perk: 'No more paying for the Lot, and no more tickets there. A kitchen. The weekly bills still come.',
    claimed:
      'Home Base. A cabin at the edge of the Lot, a kitchen, and nobody coming round about the parking.',
  },
];

export const dreamById = (id: string): Dream | undefined => DREAMS.find((d) => d.id === id);
