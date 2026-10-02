// What going to bed now would do: the night's costs, the morning's cash, how your body will
// read, and tomorrow's sky. The van shows it at night, so the numbers a player weighs before
// sleeping are the ones sleep will use. Pure: nothing here changes the state.
import { projected, ratio, zone, daysOff, type Zone } from './body';
import { ACTS } from './content/places';
import { BODY, FOOD, LIFESTYLE, MONEY, SUPPLIES, type Lifestyle } from './dials';
import { isSick, SICK_NAME, sickOdds } from './sick';
import { psycheBy, psycheDay, psycheWord, type PsycheWord } from './psyche';
import { MEAL_NAME } from './content/food';
import { livingTonight, skimps } from './jobs';
import { weeklyBills } from './clinic';
import { nightAt, type Night } from './spots';
import { conditions, type Sky } from './weather';
import type { GameState } from './types';

// A day with no trips out: the van spot, two packets of ramen, and a seventh of the week's
// bills. Runway is how many of those days your cash covers without a shift.
export const BASE_BURN =
  MONEY.vanSpot + 2 * -(ACTS['lot.cook']!.cost.cash ?? 0) + (MONEY.registration + MONEY.insurance) / 7;
export const runway = (cash: number): number => Math.max(0, cash) / BASE_BURN;

export interface Tonight {
  // What parking tonight costs, gas included, or 0 in the pullout when the card won't take
  // it; and where it'll be (Phase 22.2b), with the ticket odds at the Lot.
  spot: number;
  rough: boolean;
  night: Night;
  // The meal you've had the last FOOD.same times running, if you have (Phase 22.3).
  same: string | null;
  // Phase 22.4c: supplies by morning, tonight's chance of waking sick, and what you have now.
  supplies: number;
  sickOdds: number;
  sick: string | null;
  // Phase 22.4d: psyche by morning, in a word, and what today did to it.
  psyche: { word: PsycheWord; up: string[]; down: string[] };
  // Energy back by morning, after a rough or hungry night.
  energy: number;
  hungry: boolean;
  // How you live tonight (Phase 22.1): the tier you chose, what it costs and gives back, and
  // whether the card's too short for it, so it's a dirtbag's night instead.
  living: { tier: Lifestyle; cost: number; energy: number; skin: number; skimped: boolean };
  // Skin back by morning.
  skin: number;
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
  const night = nightAt(s);
  const rough = night.rough;
  const spot = night.cost;
  const hungry = s.fed < BODY.hungryBelow;
  const billsIn = (7 - (s.day % 7)) % 7;
  const bills = weeklyBills(s);
  const life = rough ? LIFESTYLE.dirtbag : livingTonight(s, spot);
  const cash = s.cash - spot - life.cost - (billsIn === 0 ? bills : 0);
  const p = projected(s.load);
  return {
    spot,
    rough,
    night,
    supplies: Math.max(
      0,
      Math.min(100, s.supplies - SUPPLIES.night + (night.spot === 'truckstop' ? SUPPLIES.truckstop : 0)),
    ),
    sickOdds: isSick(s) ? 0 : sickOdds(s, night.heat).odds,
    sick: isSick(s) && s.sick ? SICK_NAME[s.sick.kind] : null,
    psyche: { word: psycheWord(psycheBy(s).level), up: psycheDay(s).up, down: psycheDay(s).down },
    same:
      s.meals.length >= FOOD.same && s.meals.every((m) => m === s.meals[0]) ? MEAL_NAME[s.meals[0]!]! : null,
    energy:
      (rough ? BODY.roughEnergy : BODY.sleepEnergy) -
      (hungry ? BODY.hungryNight : 0) +
      life.energy +
      night.energy,
    hungry,
    living: { tier: s.lifestyle, ...life, skimped: !rough && s.lifestyle !== 'dirtbag' && skimps(s, spot) },
    skin: BODY.sleepSkin + life.skin,
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
