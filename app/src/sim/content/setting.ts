// Phase 18.1: the setter's puzzle, as data. A shift's brief (the wall, the grade the gym
// wants, who's climbing this week) and a hand of moves; you hang five of them in order.
// v0.956's was its best job (docs/audit/economy.md §3): a legible puzzle with a live grade
// and marks for what fits. Its flaw was that at full craft most random sets came out
// classic; here there's no craft, and the brief changes every shift, so the right set does.

export type MoveKind = 'rest' | 'crimp' | 'power' | 'technical' | 'dyno';

export interface SetMove {
  name: string;
  kind: MoveKind;
  // How hard, 0 (a rest) to 3 (a crux on its own).
  hard: number;
}

export const SET_MOVES: Record<string, SetMove> = {
  jug: { name: 'Big jug', kind: 'rest', hard: 0 },
  shake: { name: 'Kneebar shake', kind: 'rest', hard: 0 },
  rail: { name: 'Crimp rail', kind: 'crimp', hard: 1 },
  pinch: { name: 'Wide pinch', kind: 'crimp', hard: 2 },
  mono: { name: 'Mono pocket', kind: 'crimp', hard: 3 },
  undercling: { name: 'Undercling', kind: 'power', hard: 1 },
  deadpoint: { name: 'Deadpoint', kind: 'power', hard: 2 },
  campus: { name: 'Campus move', kind: 'power', hard: 3 },
  smear: { name: 'Smear', kind: 'technical', hard: 1 },
  gaston: { name: 'Gaston', kind: 'technical', hard: 2 },
  heel: { name: 'Heel hook', kind: 'technical', hard: 2 },
  slap: { name: 'Slap', kind: 'dyno', hard: 2 },
  dyno: { name: 'Double dyno', kind: 'dyno', hard: 3 },
};

export type Wall = 'slab' | 'vertical' | 'overhang' | 'roof';

export const SET_WALLS: Record<Wall, { name: string; fits: MoveKind[] }> = {
  slab: { name: 'the slab', fits: ['technical', 'crimp'] },
  vertical: { name: 'the vertical', fits: ['crimp', 'technical', 'dyno'] },
  overhang: { name: 'the overhang', fits: ['power', 'dyno'] },
  roof: { name: 'the roof', fits: ['power', 'technical'] },
};

export type Crowd = 'beginners' | 'regulars' | 'team' | 'kids';

// Who's in the gym this week, and what they want of a set: the check that pleases them.
export const CROWDS: Record<Crowd, { name: string; wants: string }> = {
  beginners: { name: 'Beginners’ week', wants: 'nothing that’s a crux on its own, and a rest' },
  regulars: { name: 'The regulars', wants: 'the grade, exactly' },
  team: { name: 'The comp team', wants: 'a dyno, and a crux on its own' },
  kids: { name: 'Kids’ club', wants: 'a dyno, and nothing over the grade' },
};

// What the gym says of the set, by how it went (score from the bottom up).
export const SET_SAYS: [number, string][] = [
  [0, 'It’s on the wall. People climb it the way you climb stairs.'],
  [0.4, 'A decent set. Someone falls off the crux and laughs, which is the idea.'],
  [0.6, 'People queue for it. Somebody asks who set it.'],
  [0.8, 'The best thing on the wall this week. The desk kid has stopped pretending not to try it.'],
];
