// Phase 19.2: the unlock through Play, against a fake Play: its price as the phone writes money,
// a purchase that counts only once Play lists it, a restore at start-up and by hand, and the
// Android app known past a reload.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keepIn } from './storage';
import { unlockIn } from './unlock';
import {
  askPlay,
  buyUnlock,
  forgetPlay,
  goods,
  inAndroidApp,
  money,
  owned,
  playOffer,
  priceOf,
  restoreUnlock,
  UNLOCK_ITEM,
  type Goods,
} from './play';

function storage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
  };
}

// Play, as the page sees it: what this account has bought, and the unlock's price.
function play(bought: string[] = [], price = { currency: 'USD', value: '4.99' }) {
  const g: Goods & { bought: string[] } = {
    bought,
    getDetails: async (ids) => ids.filter((i) => i === UNLOCK_ITEM).map((itemId) => ({ itemId, price })),
    listPurchases: async () => g.bought.map((itemId) => ({ itemId, purchaseToken: `t-${itemId}` })),
  };
  return g;
}

// Payment Request as Play's sheet answers it: bought (Play lists it after), cancelled, or broken.
function sheet(g: ReturnType<typeof play>, answer: 'buy' | 'cancel' | 'break' | 'vanish') {
  const shown: unknown[] = [];
  vi.stubGlobal(
    'PaymentRequest',
    class {
      constructor(methods: unknown) {
        shown.push(methods);
      }
      async show() {
        if (answer === 'cancel') throw Object.assign(new Error('cancelled'), { name: 'AbortError' });
        if (answer === 'break') throw new Error('broken');
        if (answer === 'buy') g.bought.push(UNLOCK_ITEM);
        return { details: { purchaseToken: 't' }, complete: async () => undefined };
      }
    },
  );
  return shown;
}

let ls: Storage;
let tab: Storage;
beforeEach(() => {
  ls = storage();
  tab = storage();
  vi.stubGlobal('sessionStorage', tab);
  vi.stubGlobal('document', { referrer: '' });
  vi.stubGlobal('window', { localStorage: ls });
  forgetPlay();
});
afterEach(() => {
  keepIn(undefined);
  vi.unstubAllGlobals();
});

const reach = (g: Goods | null) =>
  vi.stubGlobal('window', {
    localStorage: ls,
    getDigitalGoodsService: async (m: string) => {
      if (m !== 'https://play.google.com/billing' || !g) throw new Error('no service');
      return g;
    },
  });

describe('Play, from the page', () => {
  it('writes Play’s price the way the phone writes money', () => {
    expect(money({ currency: 'USD', value: '4.99' }, 'en-US')).toBe('$4.99');
    // Intl puts a no-break space between the number and the euro sign.
    expect(money({ currency: 'EUR', value: '4.99' }, 'de-DE')).toBe('4,99\u00a0€');
    expect(money({ currency: 'nope', value: '4.99' })).toBe('4.99 nope');
  });

  it('finds Play only in the Android app, and remembers the app past a reload', async () => {
    expect(await goods()).toBeNull();
    forgetPlay();
    reach(null);
    expect(await goods()).toBeNull();
    expect(inAndroidApp()).toBe(false);

    forgetPlay();
    const g = play();
    reach(g);
    expect(await goods()).toBe(g);
    expect(inAndroidApp()).toBe(true);
  });

  it('knows the app by how it was opened', () => {
    vi.stubGlobal('document', { referrer: 'android-app://io.github.rcjlabs.dirtbag/' });
    expect(inAndroidApp()).toBe(true);
    vi.stubGlobal('document', { referrer: '' });
    expect(inAndroidApp()).toBe(true);
    tab.clear();
    expect(inAndroidApp()).toBe(false);
  });

  it('reads Play’s list and price, and nothing when Play won’t say', async () => {
    expect(await owned(play([UNLOCK_ITEM]))).toBe(true);
    expect(await owned(play(['something_else']))).toBe(false);
    expect(await priceOf(play([], { currency: 'GBP', value: '4.49' }))).toBe(
      money({ currency: 'GBP', value: '4.49' }),
    );
    const broken: Goods = {
      getDetails: () => Promise.reject(new Error('x')),
      listPurchases: () => Promise.reject(new Error('x')),
    };
    expect(await owned(broken)).toBe(false);
    expect(await priceOf(broken)).toBeNull();
  });
});

describe('at start-up, locked', () => {
  it('opens the game for an unlock bought before', async () => {
    reach(play([UNLOCK_ITEM]));
    const redraw = vi.fn();
    const reopen = vi.fn();
    await askPlay(redraw, reopen);
    expect(reopen).toHaveBeenCalledOnce();
    expect(redraw).not.toHaveBeenCalled();
    expect(unlockIn(ls)).toBe('play');
  });

  it('otherwise offers it, at Play’s price', async () => {
    reach(play());
    const redraw = vi.fn();
    const reopen = vi.fn();
    await askPlay(redraw, reopen);
    expect(reopen).not.toHaveBeenCalled();
    expect(redraw).toHaveBeenCalledOnce();
    expect(playOffer()).toEqual({ price: money({ currency: 'USD', value: '4.99' }) });
    expect(unlockIn(ls)).toBeNull();
  });

  it('offers nothing outside the app', async () => {
    const redraw = vi.fn();
    await askPlay(redraw, vi.fn());
    expect(redraw).not.toHaveBeenCalled();
    expect(playOffer()).toBeNull();
  });
});

describe('buying it', () => {
  it('counts once Play lists it, and keeps it', async () => {
    const g = play();
    reach(g);
    const shown = sheet(g, 'buy');
    expect(await buyUnlock()).toBe('bought');
    expect(shown).toEqual([
      [{ supportedMethods: 'https://play.google.com/billing', data: { sku: UNLOCK_ITEM } }],
    ]);
    expect(unlockIn(ls)).toBe('play');
  });

  it('takes a cancel quietly, and a failure as one', async () => {
    const g = play();
    reach(g);
    sheet(g, 'cancel');
    expect(await buyUnlock()).toBe('cancelled');
    sheet(g, 'break');
    expect(await buyUnlock()).toBe('failed');
    expect(unlockIn(ls)).toBeNull();
  });

  it('doesn’t take the sheet’s word for it', async () => {
    const g = play();
    reach(g);
    sheet(g, 'vanish');
    expect(await buyUnlock()).toBe('failed');
    expect(unlockIn(ls)).toBeNull();
  });

  it('says when there’s no Play to ask', async () => {
    expect(await buyUnlock()).toBe('noPlay');
    expect(await restoreUnlock()).toBe('noPlay');
  });
});

describe('“You’ve bought it already”', () => {
  it('finds it on the account, or says it isn’t there', async () => {
    const g = play();
    reach(g);
    expect(await restoreUnlock()).toBe('none');
    expect(unlockIn(ls)).toBeNull();
    g.bought.push(UNLOCK_ITEM);
    expect(await restoreUnlock()).toBe('restored');
    expect(unlockIn(ls)).toBe('play');
  });
});
