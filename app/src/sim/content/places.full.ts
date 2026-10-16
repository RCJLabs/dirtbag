// The later places' words (Phase 14.5b): what each is called, its card's lines, why it's shut
// when it is. The full game's only; the demo's build takes places.demo.ts (build/demo.ts).
import type { PlaceWords } from './places';

export const PLACE_WORDS: Record<string, PlaceWords> = {
  moon: {
    name: 'Moonstone Boulders',
    away: 'Quartzite highballs out in the desert. A real road trip.',
    here: 'Sand, sky, and boulders the size of houses.',
    locked: 'Tall, hard and a long way out. Come back when you’re climbing V6.',
  },
  mesa: {
    name: 'Sandstone Mesa',
    away: 'Red desert sandstone, three hours out. World-class, and brutal about it.',
    here: 'Red rock, black varnish, and nobody for miles.',
    locked: 'V7 and up, and they mean it. Come back when you’re climbing V7.',
    closed: { season: 'summer', why: 'Too hot to hold anything till fall' },
  },
  stone: {
    name: 'The Big Stone',
    away: 'A valley of granite big walls, four hours out. The proving ground.',
    here: 'Granite to the sky on both sides. Your neck hurts already.',
    locked: 'The walls are V8 and up, and they don’t care who you are. Come back when you’re climbing V8.',
  },
  wind: {
    name: 'Wind River Walls',
    away: 'High alpine granite past the Gorge. A long, costly haul for the committed.',
    here: 'Thin air, cold rock, and weather you watch.',
    locked: 'V9 and up, and a long way up at that. Come back when you’re climbing V9.',
    closed: { season: 'winter', why: 'Snowed in till spring' },
  },
  crucible: {
    name: 'The Crucible',
    away: 'A remote, frigid wall four hours east, over the pass. Where the grades run out.',
    here: 'Black gneiss, cold wind, and nothing easy.',
    locked: 'Nothing here is under V13. Come back when you’re climbing V11, and even then.',
  },
  cove: {
    name: 'Psicobloc Cove',
    away: 'Deep-water solo on a limestone sea cliff, two hours out. A fall is just a splash.',
    here: 'Salt on your hands, the swell under you, and no pads anywhere.',
    locked: 'The cliff starts at V2 but the swim doesn’t. Come back when you’re climbing V4.',
    closed: { season: ['fall', 'winter', 'spring'], why: 'Cold, rough seas till summer' },
  },
  bluff: {
    name: 'Miller’s Bluff',
    away: 'Limestone on the back of a farm east of the Lot. Never climbed: Ed Miller wants {bluff} for it.',
    here: 'Cows over the fence, and a wall nobody has ever chalked.',
  },
  hollow: {
    name: 'The Hollow',
    away: 'The slot canyon past the Gorge that nobody puts on a map. Headstones, and rock nobody has touched.',
    here: 'Cool red sandstone, old headstones, and not one tick mark.',
    locked: 'Hard lines, and nobody to ask. Come back when you’re climbing V8.',
  },
  cave: {
    name: 'The Cave',
    away: 'The bouldering cave at the trailhead. Steep plastic, V5 and up. Day pass {pass}.',
    here: 'Low ceiling, loud music, everyone upside down.',
  },
  center: {
    name: 'The Training Center',
    away: 'The comp gym in Midtown. Run-and-jumps and volumes, V7 to V14. Day pass {centerPass}.',
    here: 'White walls, big volumes, a comp clock nobody turns off.',
    locked: 'The desk checks your ticklist: V7 and up. Come back when you’re climbing V7.',
  },
};
