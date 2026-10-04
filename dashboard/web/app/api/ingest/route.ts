import { push } from "@/lib/serverState";
import type { MState, Snapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

const MS: MState[] = ["idle", "proc", "blocked", "starved", "down"];
const FS = ["esperando", "viajando", "cargando"] as const;

interface Wire {
  run?: number; t: number;
  m: Record<string, [number, number, number, number]>;
  f: Record<string, [number, number, number, number, number]>;
  k: [number, number, number, number];
}

/** Expande el JSON compacto de FlexSim al formato que usa la web. */
export async function POST(req: Request) {
  const w = (await req.json()) as Wire;
  const machines: Snapshot["machines"] = {};
  for (const [id, v] of Object.entries(w.m)) if (id !== "_") machines[id] = { state: MS[v[0]] ?? "idle", content: v[1], inp: v[2], out: v[3] };
  const fleet: Snapshot["fleet"] = {};
  for (const [id, v] of Object.entries(w.f)) if (id !== "_") fleet[id] = { x: v[0], y: v[1], state: FS[v[2]] ?? "esperando", carrying: v[3], moves: v[4] };
  push({ run: w.run, t: w.t, machines, fleet, kpi: { palletsMP: w.k[0], palletsPT: w.k[1], cajasL7: w.k[2], cajasL8: w.k[3] } });
  return new Response("ok");
}
