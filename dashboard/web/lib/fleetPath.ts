import { alongPath, cachedPath } from "./network";
import { indexAt } from "./store";
import type { Snapshot } from "./types";

/** Posición del montacargas en el tiempo t: entre dos muestras sigue el camino de la red (no la línea recta). */
export function fleetAt(h: Snapshot[], id: string, t: number): { x: number; y: number } | null {
  if (!h.length) return null;
  const i = indexAt(h, t);
  const a = h[i], b = h[i + 1];
  const fa = a.fleet[id];
  if (!fa) return null;
  if (!b || t <= a.t) return { x: fa.x, y: fa.y };
  const fb = b.fleet[id] ?? fa;
  if (Math.hypot(fb.x - fa.x, fb.y - fa.y) < 0.05) return { x: fa.x, y: fa.y };
  const u = (t - a.t) / Math.max(b.t - a.t, 1e-6);
  return alongPath(cachedPath([fa.x, fa.y], [fb.x, fb.y]), u);
}
