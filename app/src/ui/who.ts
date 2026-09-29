// "Who's around" on a place card, in words: who you'd find there when you got there, and
// from when till when. At a crag with ropes or highballs, one more line says whether that
// means a belayer or a spotter, which is what you'd want to know before you burn the gas.

import {
  clockShort,
  DAY_END,
  knows,
  PARTNERS,
  PEOPLE,
  roped,
  ROUTES,
  staysAt,
  type GameState,
  type Stay,
} from '../sim';

export interface Who {
  // When you'd get there.
  at: number;
  lines: string[];
  cover: string | null;
}

// Someone you haven't met is just someone, till you have.
const nameOf = (s: GameState, who: string) =>
  knows(s, who) ? (PEOPLE[who]?.name ?? who) : "Someone you haven't met";

const till = (t: number) => (t >= DAY_END ? '' : ` till ${clockShort(t)}`);

// "till 5 PM" if they're there when you'd arrive; "from 9 AM till 6 PM" if they come later;
// and ", and from 5 PM" for a second stay.
function when(st: Stay, at: number, first: boolean): string {
  if (first && st.from <= at) return st.till >= DAY_END ? '' : `,${till(st.till)}`;
  return `${first ? ',' : ', and'} from ${clockShort(st.from)}${till(st.till)}`;
}

export function whoAround(s: GameState, place: string, at: number): Who {
  const stays = staysAt(s, place, at);
  const byWho = new Map<string, Stay[]>();
  for (const st of stays) byWho.set(st.who, [...(byWho.get(st.who) ?? []), st]);
  const lines = byWho.size
    ? [...byWho].map(([who, list]) => nameOf(s, who) + list.map((st, i) => when(st, at, i === 0)).join(''))
    : ['Nobody.'];

  const routes = Object.values(ROUTES).filter((r) => r.place === place);
  const ropes = routes.some(roped);
  const tall = routes.some((r) => r.highball);
  if (!ropes && !tall) return { at, lines, cover: null };
  const what = ropes && tall ? 'A belayer and a spotter' : ropes ? 'A belayer' : 'A spotter';
  // The first stretch a partner covers, joined up where their stays overlap.
  const spans = stays
    .filter((st) => PARTNERS.includes(st.who))
    .map((st): [number, number] => [Math.max(st.from, at), st.till])
    .sort((a, b) => a[0] - b[0]);
  if (!spans.length)
    return {
      at,
      lines,
      cover:
        ropes && tall
          ? 'Nobody to belay you or spot you.'
          : ropes
            ? 'Nobody to belay you: boulders only.'
            : 'Nobody to spot you.',
    };
  const [from, first] = spans[0]!;
  let end = first;
  for (const [a, b] of spans.slice(1)) if (a <= end) end = Math.max(end, b);
  const start = from <= at ? '' : ` from ${clockShort(from)}`;
  return { at, lines, cover: `${what}${start}${till(end)}.` };
}
