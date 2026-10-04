import type { Snapshot } from "./types";

type Listener = (s: Snapshot) => void;
interface G { history: Snapshot[]; listeners: Set<Listener>; lastIngest: number }
const g = globalThis as unknown as { __paty?: G };
export const state: G = (g.__paty ??= { history: [], listeners: new Set(), lastIngest: 0 });

export function push(s: Snapshot) {
  const last = state.history[state.history.length - 1];
  if (last && s.run !== last.run) state.history.length = 0; // corrida nueva
  state.history.push(s);
  const n = state.history.length;
  if (n > 1 && state.history[n - 2].t > s.t) state.history.sort((a, b) => a.t - b.t); // los envíos asíncronos pueden llegar desordenados
  if (state.history.length > 40000) state.history.splice(0, state.history.length - 40000);
  state.lastIngest = Date.now();
  state.listeners.forEach((l) => l(s));
}
export function reset() { state.history.length = 0; }
