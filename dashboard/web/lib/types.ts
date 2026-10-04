export type MState = "proc" | "idle" | "blocked" | "starved" | "down";

export interface MachineLive {
  state: MState;
  content: number; // ítems dentro
  inp: number; // entradas acumuladas
  out: number; // salidas acumuladas
}
export interface FleetLive {
  x: number; // coords Blender (m)
  y: number;
  state: "viajando" | "cargando" | "esperando";
  carrying: number;
  moves: number;
}
export interface Snapshot {
  run?: number; // id de corrida (cambia al reiniciar la simulación)
  t: number; // segundos simulados
  machines: Record<string, MachineLive>;
  fleet: Record<string, FleetLive>;
  kpi: { palletsMP: number; palletsPT: number; cajasL7: number; cajasL8: number };
  demo?: boolean;
}
export interface LayoutItem {
  id: string; label: string; line: "L7" | "L8" | "Común";
  stage: string; kind: "machine" | "store" | "dock";
  x: number; y: number; sx: number; sy: number; sz: number;
}
export interface FleetItem { id: string; label: string; x: number; y: number }
