// Phase 19.2 (Evan's calls, 16 Oct 2026): the full game's unlock in the Android app, bought once
// through Google Play and restored from Play on any phone. The page asks Play through the
// Digital Goods API and Payment Request, which Chrome offers inside the app (the TWA). The app
// acknowledges each purchase itself, on the phone (twa/PlayAcknowledger.java): version 2 of the
// API leaves that to a server, and Play refunds a purchase nobody acknowledges.
//
// What it unlocks is the gate's (unlock.ts): an honor gate, kept in the player's storage.

import { keepUnlock } from './unlock';
import { store } from './storage';

export const PLAY_BILLING = 'https://play.google.com/billing';
// The one-time product in the Play Console: Evan's to make, with this id.
export const UNLOCK_ITEM = 'full_game';

interface Amount {
  currency: string;
  value: string;
}
export interface Goods {
  getDetails(ids: string[]): Promise<{ itemId: string; price: Amount }[]>;
  listPurchases(): Promise<{ itemId: string; purchaseToken: string }[]>;
}

declare global {
  interface Window {
    getDigitalGoodsService?: (method: string) => Promise<Goods>;
  }
}

// Whether this is the Android app. Play's payments policy lets the app sell the full game only
// through Play, so it never shows another store's page. Chrome says the app opened the page only
// on its first load (the referrer), so the tab remembers it past a reload.
const APP_TAB = 'dirtbag.android';
export function inAndroidApp(): boolean {
  const fromApp = typeof document !== 'undefined' && document.referrer.startsWith('android-app://');
  try {
    if (fromApp) sessionStorage.setItem(APP_TAB, '1');
    return fromApp || sessionStorage.getItem(APP_TAB) === '1';
  } catch {
    return fromApp;
  }
}

let asked: Promise<Goods | null> | undefined;
// Play, if the page can reach it: only in the Android app, with Play Billing on.
export function goods(): Promise<Goods | null> {
  asked ??= (async () => {
    try {
      const g = (await window.getDigitalGoodsService?.(PLAY_BILLING)) ?? null;
      if (g) sessionStorage.setItem(APP_TAB, '1');
      return g;
    } catch {
      return null;
    }
  })();
  return asked;
}

// For tests: ask Play afresh.
export function forgetPlay(): void {
  asked = undefined;
  offer = null;
}

// Whether Play lists the unlock as this account's.
export async function owned(g: Goods): Promise<boolean> {
  try {
    return (await g.listPurchases()).some((p) => p.itemId === UNLOCK_ITEM);
  } catch {
    return false;
  }
}

// An amount as Play gives it, in its currency, the way the player's phone writes money.
export function money(a: Amount, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: a.currency }).format(Number(a.value));
  } catch {
    return `${a.value} ${a.currency}`;
  }
}

// Play's price for the unlock, or null if Play won't say.
export async function priceOf(g: Goods): Promise<string | null> {
  try {
    const d = (await g.getDetails([UNLOCK_ITEM])).find((i) => i.itemId === UNLOCK_ITEM);
    return d ? money(d.price) : null;
  } catch {
    return null;
  }
}

// What the last card offers in the Android app, once Play has answered.
export interface Offer {
  price: string | null;
}
let offer: Offer | null = null;
export const playOffer = (): Offer | null => offer;

// At start-up, while the full game is locked: Play's word on it. An unlock bought before (a new
// phone, the browser's data cleared) opens the game at once; otherwise the last card offers it.
export async function askPlay(redraw: () => void, reopen: () => void): Promise<void> {
  const g = await goods();
  if (!g) return;
  if ((await owned(g)) && keepUnlock(store(), 'play')) return reopen();
  offer = { price: await priceOf(g) };
  redraw();
}

export type Bought = 'bought' | 'cancelled' | 'failed' | 'noPlay';

// Buys the unlock through Play's own sheet. It counts once Play lists it, not on the sheet's
// word, and then it's kept here.
export async function buyUnlock(): Promise<Bought> {
  const g = await goods();
  if (!g) return 'noPlay';
  let response: PaymentResponse;
  try {
    const request = new PaymentRequest([{ supportedMethods: PLAY_BILLING, data: { sku: UNLOCK_ITEM } }], {
      // Play shows its own price; the API wants a total all the same.
      total: { label: 'Total', amount: { currency: 'USD', value: '0' } },
    });
    response = await request.show();
  } catch (e) {
    return e instanceof Error && e.name === 'AbortError' ? 'cancelled' : 'failed';
  }
  try {
    await response.complete('success');
  } catch {
    // The sheet's already gone; what counts is Play's list.
  }
  if (!(await owned(g))) return 'failed';
  return keepUnlock(store(), 'play') ? 'bought' : 'failed';
}

// "You've bought it already": Play's list, again.
export async function restoreUnlock(): Promise<'restored' | 'none' | 'noPlay'> {
  const g = await goods();
  if (!g) return 'noPlay';
  if (!(await owned(g))) return 'none';
  return keepUnlock(store(), 'play') ? 'restored' : 'none';
}
