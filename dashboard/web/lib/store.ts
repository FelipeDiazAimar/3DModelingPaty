"use client";
import { useMemo } from "react";
import { create } from "zustand";
import type { Snapshot } from "./types";

/** Reloj de reproducción leído cada cuadro por el 3D (no pasa por React). */
export const clock = { t: 0, live: true };

interface S {
  history: Snapshot[];
  connected: boolean;
  demo: boolean;
  selected: string | null;
  line: "Todas" | "L7" | "L8";
  /** null = en vivo (sigue la última muestra); número = reproduciendo/pausado en ese segundo simulado */
  playT: number | null;
  playing: boolean;
  speed: number; // segundos simulados por segundo real
  setHistory: (h: Snapshot[]) => void;
  addMany: (s: Snapshot[]) => void;
  setConnected: (b: boolean) => void;
  setDemo: (b: boolean) => void;
  select: (id: string | null) => void;
  setLine: (l: S["line"]) => void;
  setPlayT: (t: number | null) => void;
  setPlaying: (b: boolean) => void;
  setSpeed: (n: number) => void;
}

export const useStore = create<S>((set) => ({
  history: [], connected: false, demo: process.env.NEXT_PUBLIC_DEMO === "1", selected: null, line: "Todas",
  playT: null, playing: true, speed: 60,
  setHistory: (history) => set({ history }),
  addMany: (batch) =>
    set((st) => {
      if (!batch.length) return st;
      const last = st.history[st.history.length - 1];
      const fresh = last && batch[0].run !== last.run; // corrida nueva
      let out = fresh ? [...batch] : [...st.history, ...batch];
      if (!fresh && batch[0].t < (last?.t ?? 0)) out.sort((a, b) => a.t - b.t); // llegó desordenado
      if (out.length > 40000) out = out.slice(-30000);
      return fresh ? { history: out, playT: null, playing: true } : { history: out };
    }),
  setConnected: (connected) => set({ connected }),
  setDemo: (demo) => set({ demo, history: [], playT: null, playing: true }),
  select: (selected) => set({ selected }),
  setLine: (line) => set({ line }),
  setPlayT: (playT) => set({ playT }),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
}));

/** Índice de la última muestra con t <= pedido. */
export function indexAt(h: Snapshot[], t: number) {
  let lo = 0, hi = h.length - 1, ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (h[mid].t <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** Muestra interpolada en el tiempo t (posiciones y contadores suaves entre muestras). */
export function snapshotAt(h: Snapshot[], t: number): Snapshot | undefined {
  if (!h.length) return undefined;
  const i = indexAt(h, t);
  const a = h[i], b = h[i + 1];
  if (!b || t <= a.t) return a;
  const u = Math.min(1, (t - a.t) / Math.max(b.t - a.t, 1e-6));
  const fleet: Snapshot["fleet"] = {};
  for (const id of Object.keys(a.fleet)) {
    const fa = a.fleet[id], fb = b.fleet[id] ?? fa;
    fleet[id] = { ...fa, x: lerp(fa.x, fb.x, u), y: lerp(fa.y, fb.y, u) };
  }
  return { ...a, t, fleet };
}

/** Historial hasta el cabezal de reproducción. */
export function useHist() {
  const history = useStore((s) => s.history);
  const playT = useStore((s) => s.playT);
  return useMemo(() => (playT === null ? history : history.slice(0, indexAt(history, playT) + 1)), [history, playT]);
}

/** Muestra "actual" según el cabezal (en vivo = la última). */
export function useLatest() {
  const history = useStore((s) => s.history);
  const playT = useStore((s) => s.playT);
  return useMemo(() => (playT === null ? history[history.length - 1] : snapshotAt(history, playT)), [history, playT]);
}
