/** Red de rutas de los montacargas (nodos NN_* de FlexSim, coordenadas de Blender) y caminos mínimos sobre ella. */
export type Pt = [number, number];

export const NODES: Record<string, Pt> = {
  NN_Recepcion: [-66, -29], NN_W_Pasillo: [-52, -29], NN_W_PuertaEnfr: [-52, -1.5], NN_W_PuertaCong: [-52, 22],
  NN_Est_L7: [33, 12], NN_Est_L8: [33, -20], NN_E_PuertaCong: [52, 22], NN_E_PuertaEnfr: [52, -1.5],
  NN_E_Pasillo: [52, -29], NN_Expedicion: [66, -29], NN_MPEnfr: [-62, -1.5], NN_MPCong: [-62, 22],
  NN_PTCong: [62, 22], NN_PTEnfr: [62, -1.5],
  // accesos a los puestos de desencajado (salen del pasillo oeste en línea recta)
  J_Des_L7: [-52, 12], D_Des_L7: [-48.3, 12], J_Des_L8: [-52, -20], D_Des_L8: [-48.3, -20],
};

const EDGES: [string, string][] = [
  ["NN_Recepcion", "NN_W_Pasillo"], ["NN_W_Pasillo", "J_Des_L8"], ["J_Des_L8", "NN_W_PuertaEnfr"], ["NN_W_PuertaEnfr", "J_Des_L7"],
  ["J_Des_L7", "NN_W_PuertaCong"], ["NN_W_PuertaEnfr", "NN_MPEnfr"], ["NN_W_PuertaCong", "NN_MPCong"],
  ["J_Des_L7", "D_Des_L7"], ["J_Des_L8", "D_Des_L8"],
  ["NN_Est_L7", "NN_E_PuertaCong"], ["NN_Est_L7", "NN_E_PuertaEnfr"], ["NN_Est_L8", "NN_E_PuertaEnfr"], ["NN_Est_L8", "NN_E_Pasillo"],
  ["NN_E_PuertaCong", "NN_E_PuertaEnfr"], ["NN_E_PuertaCong", "NN_PTCong"], ["NN_E_PuertaEnfr", "NN_E_Pasillo"],
  ["NN_E_PuertaEnfr", "NN_PTEnfr"], ["NN_E_Pasillo", "NN_Expedicion"],
];

const d = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Punto más cercano de un punto a un segmento: devuelve el punto y el parámetro 0..1. */
function nearestOnSeg(p: Pt, a: Pt, b: Pt): { q: Pt; u: number } {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const L2 = vx * vx + vy * vy || 1;
  const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2));
  return { q: [a[0] + vx * u, a[1] + vy * u], u };
}

interface Snap { q: Pt; ea: string; eb: string; dist: number }
function snap(p: Pt): Snap {
  let best: Snap | null = null;
  for (const [ea, eb] of EDGES) {
    const { q } = nearestOnSeg(p, NODES[ea], NODES[eb]);
    const dist = d(p, q);
    if (!best || dist < best.dist) best = { q, ea, eb, dist };
  }
  return best!;
}

/** Camino (polilínea) siguiendo la red entre dos puntos cualesquiera. */
export function pathBetween(a: Pt, b: Pt): Pt[] {
  const sa = snap(a), sb = snap(b);
  const pts: Record<string, Pt> = { ...NODES, __a: sa.q, __b: sb.q };
  const adj: Record<string, [string, number][]> = {};
  const link = (x: string, y: string) => {
    const w = d(pts[x], pts[y]);
    (adj[x] ??= []).push([y, w]);
    (adj[y] ??= []).push([x, w]);
  };
  const split = new Map<string, string[]>(); // arista -> nodos virtuales que la parten
  for (const [x, y] of EDGES) split.set(x + "|" + y, []);
  split.get(sa.ea + "|" + sa.eb)!.push("__a");
  split.get(sb.ea + "|" + sb.eb)!.push("__b");
  for (const [x, y] of EDGES) {
    const mids = split.get(x + "|" + y)!;
    const chain = [x, ...mids.sort((m, n) => d(pts[x], pts[m]) - d(pts[x], pts[n])), y];
    for (let i = 0; i < chain.length - 1; i++) link(chain[i], chain[i + 1]);
  }
  // Dijkstra (grafo de ~20 nodos)
  const dist: Record<string, number> = { __a: 0 };
  const prev: Record<string, string> = {};
  const todo = new Set(Object.keys(adj));
  while (todo.size) {
    let u: string | null = null;
    for (const n of todo) if (dist[n] !== undefined && (u === null || dist[n] < dist[u])) u = n;
    if (u === null || u === "__b") break;
    todo.delete(u);
    for (const [v, w] of adj[u] ?? []) if (dist[v] === undefined || dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
  }
  const route: Pt[] = [];
  for (let n: string | undefined = "__b"; n; n = prev[n]) route.unshift(pts[n]);
  return [a, ...route, b];
}

/** Posición a la fracción u (0..1) de la longitud de una polilínea. */
export function alongPath(path: Pt[], u: number): { x: number; y: number } {
  const lens = path.slice(1).map((p, i) => d(p, path[i]));
  const total = lens.reduce((s, v) => s + v, 0);
  if (total < 1e-6) return { x: path[0][0], y: path[0][1] };
  let dist = Math.max(0, Math.min(1, u)) * total, seg = 0;
  while (seg < lens.length - 1 && dist > lens[seg]) { dist -= lens[seg]; seg++; }
  const f = dist / Math.max(lens[seg], 1e-9);
  return { x: path[seg][0] + (path[seg + 1][0] - path[seg][0]) * f, y: path[seg][1] + (path[seg + 1][1] - path[seg][1]) * f };
}

const cache = new Map<string, Pt[]>();
/** Camino cacheado entre dos muestras de posición (redondeadas a 0,5 m). */
export function cachedPath(a: Pt, b: Pt): Pt[] {
  const k = `${Math.round(a[0] * 2)},${Math.round(a[1] * 2)}>${Math.round(b[0] * 2)},${Math.round(b[1] * 2)}`;
  let p = cache.get(k);
  if (!p) { p = pathBetween(a, b); cache.set(k, p); if (cache.size > 4000) cache.clear(); }
  return p;
}

/** Recorrido de ida y vuelta por una lista de nodos (para el demo). */
export function routeThrough(names: string[]): Pt[] {
  return names.map((n) => NODES[n]);
}
