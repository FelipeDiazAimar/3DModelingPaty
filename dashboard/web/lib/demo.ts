import type { MachineLive, MState, Snapshot } from "./types";
import { FLEET, MACHINES } from "./layout";

/** Recorridos rígidos (rectas con giros a 90°, como los nodos de ruta de FlexSim). Coordenadas de Blender. */
const ROUTES: Record<string, [number, number][]> = {
  MontacargasRecep: [[-67, -28], [-53.2, -28], [-53.2, -1.5], [-62, -1.5]],
  MontacargasAlmacenMP: [[-53.2, -0.8], [-53.2, 12], [-48.3, 12]],
  MontacargasLineaPT: [[31.8, 12.7], [40, 12.7], [40, -1.5], [62, -1.5]],
  MontacargasExped: [[64.8, -28.3], [64.8, -1.5], [62, -1.5]],
};
const SPEED = 3; // m/s

function routePos(id: string, t: number, k: number) {
  const pts = ROUTES[id];
  if (!pts) return { x: 0, y: 0, forward: false };
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  const cyc = (t * SPEED + k * 40) % (2 * total); // ida y vuelta por el mismo camino
  const forward = cyc < total;
  let d = forward ? cyc : 2 * total - cyc, seg = 0;
  while (seg < lens.length - 1 && d > lens[seg]) { d -= lens[seg]; seg++; }
  const f = d / Math.max(lens[seg], 1e-6);
  return { x: pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * f, y: pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * f, forward };
}

/** Datos sintéticos SOLO para ver la web sin FlexSim. Siempre se marcan como DEMO. */
export function demoSnapshot(t: number): Snapshot {
  const machines: Record<string, MachineLive> = {};
  MACHINES.forEach((m, i) => {
    const ph = Math.sin(t / 900 + i * 1.7);
    const r = ((Math.sin(t / 311 + i) + 1) / 2);
    let state: MState = r < 0.62 ? "proc" : r < 0.78 ? "starved" : r < 0.9 ? "blocked" : "idle";
    if (/B_L/.test(m.id)) state = r < 0.1 ? "proc" : "idle";
    machines[m.id] = {
      state,
      content: Math.max(0, Math.round(4 + ph * 3 + (m.kind === "store" ? 40 : 0))),
      inp: Math.floor(t / (40 + i * 6)),
      out: Math.floor(t / (42 + i * 6)),
    };
  });
  const fleet: Snapshot["fleet"] = {};
  FLEET.forEach((f, i) => {
    const r = routePos(f.id, t, i);
    fleet[f.id] = { x: r.x, y: r.y, state: r.forward ? "viajando" : "viajando", carrying: r.forward ? 1 : 0, moves: Math.floor(t / 600) };
  });
  const pt = Math.floor(t / 1450);
  return { t, machines, fleet, kpi: { palletsMP: Math.floor(t / 1800), palletsPT: pt, cajasL7: Math.floor(t / 19), cajasL8: Math.floor(t / 20) }, demo: true };
}
