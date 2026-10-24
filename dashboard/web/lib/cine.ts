/**
 * Cinemáticas del 3D: recorridos de cámara suaves por la planta mientras la simulación sigue corriendo.
 * Coordenadas de Blender (x, y, z arriba). Tiempos en segundos reales (no simulados).
 *
 * Cada toma: la cámara viaja `viaje` segundos desde donde estaba hasta su punto de vista (curva suave con una
 * subida en el medio para pasar por encima de los edificios) y se queda `pausa` segundos girando despacio
 * alrededor del objetivo. Una toma puede mirar un punto fijo, una máquina (vista automática + ficha en vivo)
 * o seguir al camión de la cinemática. `escena` activa la animación del camión que se abre y del que parte.
 */
import { create } from "zustand";
import { byId, MACHINES, STATE_LABEL } from "./layout";
import { utilization } from "./derive";
import type { Snapshot } from "./types";

export type V3 = [number, number, number];
export type CineId = "planta" | "elaborados" | "l7" | "paradas" | "cuello";
export type Escena = "camion_abre" | "camion_sale";

export interface Shot {
  pos?: V3;
  target?: V3;
  maquina?: string;     // id de layout: vista automática y ficha con sus números en vivo
  seguirCamion?: boolean; // la cámara sigue al camión de la cinemática
  escena?: Escena;
  viaje: number;
  pausa: number;
  titulo: string;
  texto?: string;
  graficas?: boolean;   // abre las gráficas de la máquina
}

export const CINES: { id: CineId; label: string; sub: string; icon: "factory" | "meat" | "chart" | "layers" | "target" }[] = [
  { id: "planta", label: "Toda la planta", sub: "Ciclo 1, Ciclo 2 y Elaborados", icon: "factory" },
  { id: "elaborados", label: "Elaborados", sub: "Presentación del sector", icon: "layers" },
  { id: "l7", label: "Del pallet a la caja", sub: "Proceso completo de L7", icon: "meat" },
  { id: "paradas", label: "Paradas y gráficas", sub: "Cada máquina con sus gráficas", icon: "chart" },
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
  { pos: [62, -62, 44], target: [-5, -2, 0], viaje: 6, pausa: 4, titulo: "Elaborados · L7 y L8", texto: "Las dos líneas que simula FlexSim, de la materia prima al pallet terminado." },
  { pos: [98, 4, 10], target: [84, -20, 1.6], escena: "camion_abre", viaje: 5, pausa: 9, titulo: "Camión de expedición", texto: "Cargado con 22 pallets de producto terminado: 144 cajas de 5 kg por pallet." },
  { seguirCamion: true, escena: "camion_sale", viaje: 3, pausa: 33, titulo: "Partida", texto: "Sale del muelle, se pesa en la báscula de egreso y toma la ruta." },
  { pos: [-150, -330, 230], target: [-170, 40, 0], viaje: 7, pausa: 2, titulo: "Planta San Jorge" },
];

const ELABORADOS: Shot[] = [
  { pos: [115, -95, 80], target: [0, 60, 0], viaje: 4, pausa: 4, titulo: "Elaborados", texto: "Ocho líneas de hamburguesas: L1 a L6 en la ampliación y L7–L8, las que simula FlexSim." },
  { pos: [-92, 38, 38], target: [-57, 92, 1], viaje: 6, pausa: 5, titulo: "Trenes de picado", texto: "Dos trenes compartidos (picadora y dos mezcladoras) abastecen con carritos a L1, L2, L4, L5 y L6." },
  { pos: [-42, 84, 24], target: [-10, 103, 1], viaje: 5, pausa: 5, titulo: "Línea 3", texto: "Bloque propio con descarga directa: picadora, dos mezcladoras, dos formadoras y dos estuchadoras." },
  { pos: [22, 152, 32], target: [0, 120, 0], viaje: 5, pausa: 5, titulo: "Líneas 1 a 6", texto: "Formadora, túnel de congelado, envasado, encajonado y robot estibador." },
  { pos: [96, 58, 30], target: [56, 100, 2], viaje: 5, pausa: 5, titulo: "Cámara de PT y supercongelados", texto: "Racks de producto terminado y tres muelles de despacho." },
  { pos: [-62, -8, 22], target: [-45, 4, 1], viaje: 6, pausa: 5, titulo: "Recepción y desencajado", texto: "Cámaras de MP congelada y enfriada y los puestos de desencajado de L7 y L8." },
  { pos: [40, -44, 26], target: [0, -4, 1], viaje: 5, pausa: 5, titulo: "Líneas 7 y 8", texto: "Picado, mezclado, formado, túnel, envasado, encajonado y estibado." },
  { pos: [130, -130, 110], target: [0, 40, 0], viaje: 6, pausa: 3, titulo: "Elaborados" },
];

const L7: Shot[] = [
  { maquina: "SrcCamionesMP", viaje: 4, pausa: 5, titulo: "1 · Llegan los camiones de MP", texto: "Pallets de carne congelada y enfriada." },
  { maquina: "QRecepcion", viaje: 3, pausa: 5, titulo: "2 · Recepción", texto: "Los pallets esperan a que el montacargas los lleve a cámara." },
  { maquina: "RackMPCongelado", viaje: 3, pausa: 5, titulo: "3 · Cámara de MP", texto: "Stock de materia prima congelada." },
  { maquina: "Desencajado_L7", viaje: 3, pausa: 6, titulo: "4 · Desencajado", texto: "Se consume el pallet caja a caja: un batch de 1500 kg." },
  { maquina: "Picadora_L7", viaje: 3, pausa: 6, titulo: "5 · Picado", texto: "La carne se pica por batch." },
  { maquina: "MezA_L7", viaje: 3, pausa: 6, titulo: "6 · Mezclado", texto: "Se agregan los aditivos y el batch se divide en 10 cargas de 150 kg." },
  { maquina: "FormA_L7", viaje: 3, pausa: 6, titulo: "7 · Formado", texto: "Cada carga sale como 30 bandejas de hamburguesas de 5 kg." },
  { maquina: "Tunel_L7", viaje: 3, pausa: 6, titulo: "8 · Túnel de congelado", texto: "Las bandejas se congelan en continuo." },
  { maquina: "EnvA_L7", viaje: 3, pausa: 6, titulo: "9 · Envasado", texto: "Detector de metales y envasado en paquetes." },
  { maquina: "EncA_L7", viaje: 3, pausa: 6, titulo: "10 · Encajonado", texto: "Cajas de 5 kg con control de peso." },
  { maquina: "EstA_L7", viaje: 3, pausa: 6, titulo: "11 · Estibado", texto: "El robot arma el pallet de 144 cajas." },
  { maquina: "RackPTCongelado", viaje: 3, pausa: 5, titulo: "12 · Cámara de PT", texto: "Pallets terminados esperando despacho." },
  { maquina: "QExpedicion", viaje: 3, pausa: 5, titulo: "13 · Expedición", texto: "Los pallets salen en camión." },
];

const PARADAS: Shot[] = ["Desencajado_L7", "Picadora_L7", "MezA_L7", "FormA_L7", "FormB_L7", "Tunel_L7", "EnvA_L7", "EncA_L7", "EstA_L7"]
  .map((id) => ({ maquina: id, viaje: 3, pausa: 10, titulo: `${byId(id)?.label ?? id} · L7`, graficas: true }));

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
    case "elaborados": return ELABORADOS;
    case "l7": return L7;
    case "paradas": return PARADAS;
    case "cuello": return cuello(h);
  }
}

/** Vista automática de una máquina, desde arriba de las paredes (7 m) y del lado de adentro de la nave,
 *  para que ninguna pared quede entre la cámara y la máquina. */
const NAVE = { x0: -72, x1: 72, y0: -32, y1: 32 };
export function vistaMaquina(id: string, i: number): { pos: V3; target: V3 } | null {
  const m = byId(id);
  if (!m) return null;
  const r = Math.max(10, Math.max(m.sx, m.sy, m.sz) * 2.2 + 7);
  const target: V3 = [m.x, m.y, m.sz * 0.5];
  const adentro = m.x > NAVE.x0 && m.x < NAVE.x1 && m.y > NAVE.y0 && m.y < NAVE.y1;
  const base = -115 + i * 37;
  for (let k = 0; k < 12; k++) {
    const a = ((base + k * 30) * Math.PI) / 180;
    const x = m.x + r * Math.cos(a), y = m.y + r * Math.sin(a);
    if (!adentro || (x > NAVE.x0 + 2 && x < NAVE.x1 - 2 && y > NAVE.y0 + 2 && y < NAVE.y1 - 2)) {
      return { target, pos: [x, y, Math.max(10, target[2] + r * 0.75)] };
    }
  }
  return { target, pos: [m.x, m.y - r, Math.max(10, target[2] + r * 0.75)] };
}

/* ---------- unidades de cada máquina (qué ítem entra, qué sale; ver SUPUESTOS_v2.md, unidades de carga) ---------- */
export interface Unidad { entra: string; sale: string; adentro: string }
const U = (entra: string, sale = entra, adentro = entra): Unidad => ({ entra, sale, adentro });
export function unidades(id: string): Unidad {
  const base = id.replace(/_L[78]$/, "");
  switch (base) {
    case "SrcCamionesMP": case "QRecepcion": case "RackMPCongelado": case "RackMPEnfriado": return U("pallets de MP");
    case "Desencajado": return U("pallets de MP", "batches", "pallets de MP");
    case "Picadora": return U("batches");
    case "MezA": case "MezB": return U("batches", "cargas", "batches");
    case "FormA": case "FormB": return U("cargas", "bandejas", "bandejas");
    case "Tunel": return U("bandejas");
    case "EnvA": case "EnvB": return U("bandejas", "paquetes", "paquetes");
    case "EncA": case "EncB": return U("paquetes", "cajas", "cajas");
    case "EstA": case "EstB": return U("cajas");
    case "RackPTCongelado": case "RackPTEnfriado": case "QExpedicion": case "SinkExpedicion": return U("pallets de PT");
    default: return U("ítems");
  }
}

/* ---------- estado compartido (lo maneja CineRig y lo leen el overlay y el camión de la cinemática) ---------- */
interface CineState {
  id: CineId | null;
  shots: Shot[];
  idx: number;
  t0: number;          // performance.now() del comienzo de la toma actual
  play: (id: CineId, h: Snapshot[]) => void;
  stop: () => void;
  setIdx: (i: number, t0: number) => void;
}
export const useCine = create<CineState>((set) => ({
  id: null, shots: [], idx: 0, t0: 0,
  play: (id, h) => set({ id, shots: armarCine(id, h), idx: 0, t0: performance.now() }),
  stop: () => set({ id: null, shots: [], idx: 0 }),
  setIdx: (idx, t0) => set({ idx, t0 }),
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
    ritmo, entreSalidas: ritmo > 0 ? 3600 / ritmo : null, u, unidad: unidades(id),
  };
}

/** Pares de máquinas iguales en L7 y L8 (para comparar). */
export const gemela = (id: string) => (id.endsWith("_L7") ? id.replace("_L7", "_L8") : id.endsWith("_L8") ? id.replace("_L8", "_L7") : null);
