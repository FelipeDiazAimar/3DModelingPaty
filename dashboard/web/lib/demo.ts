import type { MachineLive, MState, Snapshot } from "./types";
import { FLEET, MACHINES } from "./layout";

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
    const a = t / 120 + i * 1.6;
    fleet[f.id] = { x: f.x + Math.cos(a) * 14, y: f.y + Math.sin(a) * 9, state: i % 2 ? "viajando" : "cargando", carrying: i % 2, moves: Math.floor(t / 600) };
  });
  const pt = Math.floor(t / 1450);
  return { t, machines, fleet, kpi: { palletsMP: Math.floor(t / 1800), palletsPT: pt, cajasL7: Math.floor(t / 19), cajasL8: Math.floor(t / 20) }, demo: true };
}
