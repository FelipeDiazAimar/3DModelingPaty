/**
 * Cinemáticas del 3D: recorridos de cámara suaves por la planta mientras la simulación sigue corriendo.
 * Coordenadas de Blender (x, y, z arriba). Tiempos en segundos reales (no simulados).
 *
 * Cada toma: la cámara viaja `viaje` segundos desde donde estaba hasta su punto de vista (curva suave con una
 * subida en el medio para pasar por encima de los edificios) y se queda `pausa` segundos girando despacio
 * alrededor del objetivo. Una toma puede mirar un punto fijo, una máquina (vista automática + ficha en vivo)
 * o seguir a un camión o a un montacargas.
 */
import { create } from "zustand";
import { byId, MACHINES, STATE_LABEL } from "./layout";
import { utilization } from "./derive";
import type { Snapshot } from "./types";

export type V3 = [number, number, number];
export type CineId = "planta" | "l7" | "paradas" | "logistica" | "cuello";
export type Seguir = { kind: "truck"; tipo: "MP" | "PT" } | { kind: "fleet"; id: string };

export interface Shot {
  pos?: V3;
  target?: V3;
  maquina?: string;     // id de layout: vista automática y ficha con sus números en vivo
  seguir?: Seguir;
  viaje: number;
  pausa: number;
  titulo: string;
  texto?: string;
  graficas?: boolean;   // abre las gráficas de la máquina
}

export const CINES: { id: CineId; label: string; sub: string; icon: "factory" | "meat" | "chart" | "truck" | "target" }[] = [
  { id: "planta", label: "Toda la planta", sub: "Ciclo 1, Ciclo 2 y Elaborados", icon: "factory" },
  { id: "l7", label: "Del pallet a la caja", sub: "Proceso completo de L7", icon: "meat" },
  { id: "paradas", label: "Paradas y gráficas", sub: "Cada máquina con sus gráficas", icon: "chart" },
  { id: "logistica", label: "Logística", sub: "Camiones y montacargas", icon: "truck" },
  { id: "cuello", label: "Cuello de botella", sub: "Dónde se frena la línea", icon: "target" },
];

/* ---------- recorridos ---------- */
const PLANTA: Shot[] = [
  { pos: [-150, -330, 230], target: [-170, 40, 0], viaje: 3, pausa: 4, titulo: "Planta San Jorge", texto: "Ciclo 1 (faena), Ciclo 2 (desposte) y Elaborados en un mismo predio." },
  { pos: [-95, 185, 28], target: [-148, 141, 2], viaje: 6, pausa: 3, titulo: "Báscula de camiones", texto: "Un solo ingreso: cada camión se pesa al entrar y al salir." },
  { pos: [-375, -70, 48], target: [-412, 20, 0], viaje: 7, pausa: 3, titulo: "Corrales", texto: "La hacienda espera por tropas antes de entrar a faena." },
  { pos: [-300, -6, 20], target: [-322, 25, 3], viaje: 5, pausa: 4, titulo: "Ciclo 1 · Playa de faena", texto: "Noqueo, sangría, cuereo, eviscerado, sierra de medias, palco de tipificación y balanza." },
  { pos: [-226, -24, 32], target: [-242, 25, 2], viaje: 5, pausa: 3, titulo: "Cámaras de oreo", texto: "Las medias pasan la noche en 14 cámaras antes del cuarteo." },
  { pos: [-158, -18, 24], target: [-165, 25, 1], viaje: 5, pausa: 4, titulo: "Ciclo 2 · Desposte y encajado", texto: "Cuarteo, dos líneas de desposte, encajado y charqueo." },
  { pos: [-168, -100, 22], target: [-172, -52, 2], viaje: 5, pausa: 3, titulo: "Túneles y despacho de cajas", texto: "Congelado de cajas, cámara de producto y muelles." },
  { pos: [45, 55, 48], target: [-10, 100, 0], viaje: 7, pausa: 4, titulo: "Elaborados · L1 a L6", texto: "Trenes de picado compartidos, carritos de pasta y seis líneas." },
  { pos: [62, -62, 44], target: [-5, -2, 0], viaje: 6, pausa: 5, titulo: "Elaborados · L7 y L8", texto: "Las dos líneas que simula FlexSim, de la materia prima al pallet terminado." },
  { pos: [-150, -330, 230], target: [-170, 40, 0], viaje: 7, pausa: 2, titulo: "Planta San Jorge" },
];

const L7: Shot[] = [
  { maquina: "SrcCamionesMP", viaje: 4, pausa: 5, titulo: "1 · Llegan los camiones de MP", texto: "Pallets de carne congelada y enfriada." },
  { maquina: "QRecepcion", viaje: 3, pausa: 5, titulo: "2 · Recepción", texto: "Los pallets esperan a que el montacargas los lleve a cámara." },
  { maquina: "RackMPCongelado", viaje: 3, pausa: 5, titulo: "3 · Cámara de MP", texto: "Stock de materia prima congelada." },
  { maquina: "Desencajado_L7", viaje: 3, pausa: 6, titulo: "4 · Desencajado", texto: "Se sacan los bloques de carne de las cajas." },
  { maquina: "Picadora_L7", viaje: 3, pausa: 6, titulo: "5 · Picado", texto: "La carne se pica por batch." },
  { maquina: "MezA_L7", viaje: 3, pausa: 6, titulo: "6 · Mezclado", texto: "Se agregan los aditivos de la fórmula." },
  { maquina: "FormA_L7", viaje: 3, pausa: 6, titulo: "7 · Formado", texto: "La formadora da forma a las hamburguesas." },
  { maquina: "Tunel_L7", viaje: 3, pausa: 6, titulo: "8 · Túnel de congelado", texto: "Las hamburguesas se congelan en continuo." },
  { maquina: "EnvA_L7", viaje: 3, pausa: 6, titulo: "9 · Envasado", texto: "Detector de metales y envasado." },
  { maquina: "EncA_L7", viaje: 3, pausa: 6, titulo: "10 · Encajonado", texto: "Cajas de 5 kg con control de peso." },
  { maquina: "EstA_L7", viaje: 3, pausa: 6, titulo: "11 · Estibado", texto: "El robot arma el pallet de producto terminado." },
  { maquina: "RackPTCongelado", viaje: 3, pausa: 5, titulo: "12 · Cámara de PT", texto: "Pallets terminados esperando despacho." },
  { maquina: "QExpedicion", viaje: 3, pausa: 5, titulo: "13 · Expedición", texto: "Los pallets salen en camión." },
];

const PARADAS: Shot[] = ["Desencajado_L7", "Picadora_L7", "MezA_L7", "FormA_L7", "FormB_L7", "Tunel_L7", "EnvA_L7", "EncA_L7", "EstA_L7"]
  .map((id) => ({ maquina: id, viaje: 3, pausa: 10, titulo: `${byId(id)?.label ?? id} · L7`, graficas: true }));

const LOGISTICA: Shot[] = [
  { seguir: { kind: "truck", tipo: "MP" }, viaje: 4, pausa: 14, titulo: "Camión de materia prima", texto: "Entra por la báscula, retrocede al muelle de recepción y descarga." },
  { seguir: { kind: "fleet", id: "MontacargasRecep" }, viaje: 3, pausa: 9, titulo: "Montacargas de recepción", texto: "Del muelle a las cámaras de materia prima." },
  { seguir: { kind: "fleet", id: "MontacargasAlmacenMP" }, viaje: 3, pausa: 9, titulo: "Montacargas de cámara a línea", texto: "Lleva los pallets de MP a los puestos de desencajado." },
  { seguir: { kind: "fleet", id: "MontacargasLineaPT" }, viaje: 3, pausa: 9, titulo: "Montacargas de PT", texto: "Retira los pallets terminados de los robots estibadores." },
  { seguir: { kind: "fleet", id: "MontacargasExped" }, viaje: 3, pausa: 9, titulo: "Montacargas de expedición", texto: "De la cámara de PT al camión." },
  { seguir: { kind: "truck", tipo: "PT" }, viaje: 4, pausa: 14, titulo: "Camión de expedición", texto: "Se carga en el muelle y sale pesándose en la báscula." },
  { pos: [40, -110, 70], target: [0, -10, 0], viaje: 6, pausa: 3, titulo: "Logística de Elaborados" },
];

const pct = (v: number) => `${Math.round(v * 100)} %`;

/** El cuello de botella se arma con los datos del momento: las más ocupadas, las que esperan y las bloqueadas. */
function cuello(h: Snapshot[]): Shot[] {
  const maq = MACHINES.filter((m) => m.kind === "machine");
  if (h.length < 10) {
    return [{ pos: [62, -62, 44], target: [-5, -2, 0], viaje: 4, pausa: 6, titulo: "Cuello de botella", texto: "Todavía no hay datos de la simulación: corré FlexSim o el demo y volvé a abrir esta cinemática." }];
  }
  const u = maq.map((m) => ({ m, u: utilization(h, m.id) }));
  const tomadas = new Set<string>();
  const top = (f: (x: (typeof u)[number]) => number, n: number) =>
    [...u].sort((a, b) => f(b) - f(a)).filter((x) => f(x) > 0.02 && !tomadas.has(x.m.id)).slice(0, n)
      .map((x) => { tomadas.add(x.m.id); return x; });
  const ocupadas = top((x) => x.u.proc, 3);
  const esperan = top((x) => x.u.starved, 2);
  const bloqueadas = top((x) => x.u.blocked, 2);
  const shots: Shot[] = [{ pos: [62, -62, 44], target: [-5, -2, 0], viaje: 4, pausa: 4, titulo: "Cuello de botella", texto: "Dónde se frena la producción según lo que lleva simulado FlexSim." }];
  ocupadas.forEach((x, i) => shots.push({
    maquina: x.m.id, viaje: 3, pausa: 7, titulo: `${i === 0 ? "El más cargado" : "Muy cargada"}: ${x.m.label} ${x.m.line}`,
    texto: `Procesa el ${pct(x.u.proc)} del tiempo. ${i === 0 ? "Es la que marca el ritmo: lo que entra de más espera delante de ella." : "Tiene poco margen para absorber una parada."}`,
  }));
  esperan.forEach((x) => shots.push({
    maquina: x.m.id, viaje: 3, pausa: 6, titulo: `Espera material: ${x.m.label} ${x.m.line}`,
    texto: `Pasa el ${pct(x.u.starved)} del tiempo sin material: la frena lo que viene antes.`,
  }));
  bloqueadas.forEach((x) => shots.push({
    maquina: x.m.id, viaje: 3, pausa: 6, titulo: `Bloqueada: ${x.m.label} ${x.m.line}`,
    texto: `Pasa el ${pct(x.u.blocked)} del tiempo sin poder entregar: lo que sigue no da abasto.`,
  }));
  return shots;
}

export function armarCine(id: CineId, h: Snapshot[]): Shot[] {
  switch (id) {
    case "planta": return PLANTA;
    case "l7": return L7;
    case "paradas": return PARADAS;
    case "logistica": return LOGISTICA;
    case "cuello": return cuello(h);
  }
}

/** Vista automática de una máquina: alrededor de ella, cada toma desde un ángulo distinto. */
export function vistaMaquina(id: string, i: number): { pos: V3; target: V3 } | null {
  const m = byId(id);
  if (!m) return null;
  const r = Math.max(9, Math.max(m.sx, m.sy, m.sz) * 2.4 + 6);
  const a = (-115 + i * 37) * (Math.PI / 180);
  return { target: [m.x, m.y, m.sz * 0.55], pos: [m.x + r * Math.cos(a), m.y + r * Math.sin(a), m.sz * 0.55 + r * 0.6] };
}

/* ---------- estado compartido (lo maneja CineRig y lo lee el overlay) ---------- */
interface CineState {
  id: CineId | null;
  shots: Shot[];
  idx: number;
  play: (id: CineId, h: Snapshot[]) => void;
  stop: () => void;
  setIdx: (i: number) => void;
}
export const useCine = create<CineState>((set) => ({
  id: null, shots: [], idx: 0,
  play: (id, h) => set({ id, shots: armarCine(id, h), idx: 0 }),
  stop: () => set({ id: null, shots: [], idx: 0 }),
  setIdx: (idx) => set({ idx }),
}));

/* ---------- números de una máquina para la ficha y las gráficas ---------- */
export function fichaMaquina(h: Snapshot[], id: string) {
  const last = h[h.length - 1];
  const m = last?.machines[id];
  if (!last || !m) return null;
  const u = utilization(h, id);
  // ritmo de salida de las últimas 2 h simuladas
  const t0 = last.t - 7200;
  let i = h.length - 1;
  while (i > 0 && h[i - 1].t >= t0) i--;
  const a = h[i], dt = (last.t - a.t) / 3600;
  const ritmo = dt > 0.05 ? (m.out - (a.machines[id]?.out ?? 0)) / dt : 0;
  return {
    estado: STATE_LABEL[m.state] ?? m.state, state: m.state, dentro: m.content, entradas: m.inp, salidas: m.out,
    ritmo, entreSalidas: ritmo > 0 ? 3600 / ritmo : null, u,
  };
}

/** Pares de máquinas iguales en L7 y L8 (para comparar). */
export const gemela = (id: string) => (id.endsWith("_L7") ? id.replace("_L7", "_L8") : id.endsWith("_L8") ? id.replace("_L8", "_L7") : null);
