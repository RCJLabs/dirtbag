// What going to bed now would do: the night's costs, the morning's cash, how your body will
// read, and tomorrow's sky. The van shows it at night, so the numbers a player weighs before
// sleeping are the ones sleep will use. Pure: nothing here changes the state.
import { projected, ratio, zone, daysOff, type Zone } from './body';
import { ACTS } from './content/places';
import { BODY, MONEY } from './dials';
import { headroom } from './cond';
import { conditions, type Sky } from './weather';
import type { GameState } from './types';

// A day with no trips out: the van spot, two packets of ramen, and a seventh of the week's
// bills. Runway is how many of those days your cash covers without a shift.
export const BASE_BURN =
  MONEY.vanSpot + 2 * -(ACTS['lot.cook']!.cost.cash ?? 0) + (MONEY.registration + MONEY.insurance) / 7;
export const runway = (cash: number): number => Math.max(0, cash) / BASE_BURN;

export interface Tonight {
  // The van spot tonight: MONEY.vanSpot, or 0 in the pullout when the card won't take it.
  spot: number;
  rough: boolean;
  // Energy back by morning, after a rough or hungry night.
  energy: number;
  hungry: boolean;
  // The week's bills: due tonight (billsIn 0) or in so many nights.
  bills: number;
  billsIn: number;
  // Cash in the morning, whole days of runway it covers, and what the card still takes.
  cash: number;
  runway: number;
  card: number;
  // How your body reads in the morning, and days still off the rock.
  zone: Zone;
  off: number;
  sky: Sky;
}

export function tonight(s: GameState): Tonight {
  const rough = headroom(s) < MONEY.vanSpot;
  const spot = rough ? 0 : MONEY.vanSpot;
  const hungry = s.fed < BODY.hungryBelow;
  const billsIn = (7 - (s.day % 7)) % 7;
  const bills = MONEY.registration + MONEY.insurance;
  const cash = s.cash - spot - (billsIn === 0 ? bills : 0);
  const p = projected(s.load);
  return {
    spot,
    rough,
    energy: (rough ? BODY.roughEnergy : BODY.sleepEnergy) - (hungry ? BODY.hungryNight : 0),
    hungry,
    bills,
    billsIn,
    cash,
    runway: Math.floor(runway(cash)),
    card: Math.max(0, cash + MONEY.cardLimit),
    zone: zone(ratio({ acute: p.acute, chronic: p.chronic, today: 0 })),
    off: daysOff({ ...s, day: s.day + 1 }),
    sky: conditions(s.seed, s.day + 1).sky,
  };
}
