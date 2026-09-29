// A value React can subscribe to without re-rendering everything else. The game keeps two:
// a slow one that changes on actions (sheets, HUD, talk) and a fast one that changes every
// frame (the camera, the attempt) which only the bubble and the climb panel read.

import { useSyncExternalStore } from 'react';

export interface Store<T> {
  get(): T;
  set(next: T): void;
  update(fn: (v: T) => T): void;
  subscribe(fn: () => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  const set = (next: T) => {
    if (next === value) return;
    value = next;
    for (const l of listeners) l();
  };
  return {
    get: () => value,
    set,
    update: (fn) => set(fn(value)),
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export function useStore<T>(s: Store<T>): T {
  return useSyncExternalStore(s.subscribe, s.get, s.get);
}
