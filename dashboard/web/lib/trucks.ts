/**
 * Camiones animados de la planta (materia prima a Elaborados y expedición de PT). Coordenadas de Blender (m).
 *
 * Los horarios salen de los datos de FlexSim: cada camión llega cuando termina la tanda anterior y se va
 * cuando FlexSim terminó de registrar su tanda de pallets (kpi.palletsMP recibidos / kpi.palletsPT despachados).
 * Recorrido: ruta → portón norte → báscula de ingreso → calles internas → muelle (entra marcha atrás) →
 * báscula de egreso → ruta. Todo apoyado en el piso, por la mano derecha, con las esquinas redondeadas.
 */
import type { Snapshot } from "./types";

type Pt = [number, number];
interface Leg { pts: Pt[]; v: number; rev?: boolean }   // v en m/s; rev = marcha atrás (la cola va adelante)
interface Wait { wait: number }
type Step = Leg | Wait;
interface Sample { t: number; x: number; y: number; h: number }  // h: rumbo de la cabina (rad, Blender)

export type TruckKind = "MP" | "PT";
export const CAPACIDAD: Record<TruckKind, number> = { MP: 8, PT: 24 };   // pallets por camión
const DOCKS_Y = [-30, -20];                                              // dos muelles por lado (eje y)
// centro del camión en el muelle: cola contra el andén (x = ±75); el camión enganchado mide 18,1 m
const DOCK_X: Record<TruckKind, number> = { MP: -84.05, PT: 84.05 };
const SALIDA_EXTRA = 300;  // s simulados que el camión espera en el muelle después del último pallet

const V_RUTA = 14, V_CALLE = 6, V_LENTO = 3, V_REVERSA = 1.5, PESAJE = 45;

/* ---------- geometría ---------- */
/** Redondea cada esquina con un arco de radio r (curva cuadrática entre r antes y r después del vértice). */
function redondear(pts: Pt[], r = 6): Pt[] {
  if (pts.length < 3) return pts;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const d1 = Math.hypot(b[0] - a[0], b[1] - a[1]), d2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const k1 = Math.min(r, d1 / 2) / (d1 || 1), k2 = Math.min(r, d2 / 2) / (d2 || 1);
    const p0: Pt = [b[0] + (a[0] - b[0]) * k1, b[1] + (a[1] - b[1]) * k1];
    const p2: Pt = [b[0] + (c[0] - b[0]) * k2, b[1] + (c[1] - b[1]) * k2];
    for (let s = 0; s <= 8; s++) {
      const u = s / 8;
      out.push([(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * b[0] + u * u * p2[0],
                (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * b[1] + u * u * p2[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Arco de circunferencia (centro, radio, ángulos en grados), para la maniobra de marcha atrás. */
function arco(cx: number, cy: number, r: number, a0: number, a1: number, n = 12): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + (a1 - a0) * i / n) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Pt;
  });
}

/* ---------- recorridos (mano derecha; ver PLAN_MODELO_3D.md, báscula y calles) ---------- */
const INGRESO: Step[] = [
  { pts: [[-620, 198.5], [-140, 198.5]], v: V_RUTA },
  { pts: redondear([[-140, 198.5], [-132.5, 198.5], [-132.5, 176], [-154, 176], [-154, 151]]), v: V_LENTO },
  { pts: [[-154, 151], [-154, 141]], v: 1.5 },
  { wait: PESAJE },                                                          // pesaje de ingreso
  { pts: redondear([[-154, 141], [-154, 126], [-132.5, 126], [-132.5, 110]]), v: V_LENTO },
];
const EGRESO: Step[] = [
  { pts: redondear([[-127.5, 110], [-127.5, 120], [-142, 120], [-142, 131]]), v: V_LENTO },
  { pts: [[-142, 131], [-142, 141]], v: 1.5 },
  { wait: PESAJE },                                                          // pesaje de egreso
  { pts: redondear([[-142, 141], [-142, 169], [-127.5, 169], [-127.5, 203.5], [-140, 203.5]]), v: V_LENTO },
  { pts: [[-140, 203.5], [-620, 203.5]], v: V_RUTA },
];

function llegadaMP(yd: number): Step[] {
  return [
    ...INGRESO,
    { pts: redondear([[-132.5, 110], [-132.5, 2], [-104, 2], [-104, yd - 8]]), v: V_CALLE },
    { pts: [...arco(-96, yd - 8, 8, 180, 90), [DOCK_X.MP, yd]], v: V_REVERSA, rev: true },
  ];
}
function salidaMP(yd: number): Step[] {
  return [
    { pts: redondear([[DOCK_X.MP, yd], [-112, yd], [-127.5, yd + 8], [-127.5, 110]]), v: V_CALLE },
    ...EGRESO,
  ];
}
function llegadaPT(yd: number): Step[] {
  return [
    ...INGRESO,
    { pts: redondear([[-132.5, 110], [-132.5, -66], [122.5, -66], [122.5, -40], [104, -40], [104, yd + 8]]), v: V_CALLE },
    { pts: [...arco(96, yd + 8, 8, 0, -90), [DOCK_X.PT, yd]], v: V_REVERSA, rev: true },
  ];
}
function salidaPT(yd: number): Step[] {
  return [
    { pts: redondear([[DOCK_X.PT, yd], [110, yd], [119.5, yd - 8], [119.5, -62], [-127.5, -62], [-127.5, 110]]), v: V_CALLE },
    ...EGRESO,
  ];
}

/** Convierte un recorrido en muestras de tiempo (cada ~1 m) con posición y rumbo de la cabina. */
function pista(steps: Step[]): Sample[] {
  const out: Sample[] = [];
  let t = 0, x = 0, y = 0, h = 0;
  for (const s of steps) {
    if ("wait" in s) { t += s.wait; out.push({ t, x, y, h }); continue; }
    for (let i = 0; i < s.pts.length - 1; i++) {
      const [a, b] = [s.pts[i], s.pts[i + 1]];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 1e-6) continue;
      const dir = Math.atan2(b[1] - a[1], b[0] - a[0]);
      h = s.rev ? dir + Math.PI : dir;
      const n = Math.max(1, Math.ceil(L));
      for (let k = out.length ? 1 : 0; k <= n; k++) {
        const u = k / n;
        x = a[0] + (b[0] - a[0]) * u;
        y = a[1] + (b[1] - a[1]) * u;
        out.push({ t: t + (L * u) / s.v, x, y, h });
      }
      t += L / s.v;
    }
  }
  return out;
}

const PISTAS: Record<TruckKind, { in: Sample[]; out: Sample[] }[]> = {
  MP: DOCKS_Y.map((yd) => ({ in: pista(llegadaMP(yd)), out: pista(salidaMP(yd)) })),
  PT: DOCKS_Y.map((yd) => ({ in: pista(llegadaPT(yd)), out: pista(salidaPT(yd)) })),
};

function enPista(p: Sample[], t: number): Sample {
  if (t <= p[0].t) return p[0];
  if (t >= p[p.length - 1].t) return p[p.length - 1];
  let lo = 0, hi = p.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p[m].t <= t) lo = m; else hi = m; }
  const a = p[lo], b = p[hi], u = (t - a.t) / Math.max(b.t - a.t, 1e-9);
  let dh = b.h - a.h;
  while (dh > Math.PI) dh -= 2 * Math.PI;
  while (dh < -Math.PI) dh += 2 * Math.PI;
  return { t, x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, h: a.h + dh * u };
}

/* ---------- horarios desde el historial de FlexSim ---------- */
interface Viaje { kind: TruckKind; k: number; start: number; leave: number | null }

/** Viajes de cada tipo: el camión k llega cuando terminó la tanda k-1 y se va cuando se completó la suya. */
function viajes(h: Snapshot[], kind: TruckKind): Viaje[] {
  if (!h.length) return [];
  const key = kind === "MP" ? "palletsMP" : "palletsPT";
  const C = CAPACIDAD[kind];
  const k0 = Math.floor((h[0].kpi?.[key] ?? 0) / C);   // si la web se abrió a mitad de corrida
  const cruces: number[] = [];                        // cruces[j] = primer t con kpi >= C·(k0 + j)
  let next = C * (k0 + 1);
  for (const s of h) {
    const v = s.kpi?.[key] ?? 0;
    while (v >= next) { cruces.push(s.t); next += C; }
  }
  const out: Viaje[] = [];
  const desfase = kind === "PT" ? 150 : 0;  // si llegan juntos, el de PT entra a la báscula después del de MP
  for (let j = 0; j <= cruces.length; j++) {
    out.push({ kind, k: k0 + j, start: (j === 0 ? h[0].t : cruces[j - 1]) + desfase, leave: j < cruces.length ? cruces[j] + SALIDA_EXTRA : null });
  }
  return out;
}

let cacheKey = "";
let cache: Viaje[] = [];
function todosLosViajes(h: Snapshot[]): Viaje[] {
  const key = `${h.length}|${h[0]?.run ?? ""}|${h[0]?.t ?? ""}|${h[h.length - 1]?.t ?? ""}`;
  if (key !== cacheKey) { cacheKey = key; cache = [...viajes(h, "MP"), ...viajes(h, "PT")]; }
  return cache;
}

export interface TruckPose { slot: number; kind: TruckKind; x: number; y: number; h: number; estado: string }

/** Camiones a la vista en el tiempo t (slot 0-1 = MP, 2-3 = PT: un camión por muelle). */
export function trucksAt(h: Snapshot[], t: number): TruckPose[] {
  const out: TruckPose[] = [];
  for (const v of todosLosViajes(h)) {
    const dock = v.k % 2;
    const p = PISTAS[v.kind][dock];
    const tin = p.in[p.in.length - 1].t, tout = p.out[p.out.length - 1].t;
    if (t < v.start) continue;
    const slot = (v.kind === "MP" ? 0 : 2) + dock;
    let s: Sample, estado: string;
    if (t < v.start + tin) { s = enPista(p.in, t - v.start); estado = "llegando"; }
    else if (v.leave === null || t < Math.max(v.leave, v.start + tin)) {
      s = p.in[p.in.length - 1];
      estado = v.kind === "MP" ? "descargando" : "cargando";
    } else {
      const t0 = Math.max(v.leave, v.start + tin);
      if (t >= t0 + tout) continue;
      s = enPista(p.out, t - t0);
      estado = "saliendo";
    }
    out.push({ slot, kind: v.kind, x: s.x, y: s.y, h: s.h, estado });
  }
  return out;
}

/* ---------- camión de la cinemática (no sale de los datos: lo maneja la cinemática) ---------- */
/** Pose del camión de PT en el muelle `dock` (0 o 1). */
export function muellePT(dock: number) {
  const p = PISTAS.PT[dock].in;
  const s = p[p.length - 1];
  return { x: s.x, y: s.y, h: s.h };
}
/** Duración del recorrido de salida del muelle `dock` hasta la ruta (s, a la velocidad real). */
export function duracionSalidaPT(dock: number) {
  const p = PISTAS.PT[dock].out;
  return p[p.length - 1].t;
}
/** Pose a los `t` segundos de salir del muelle `dock`. */
export function poseSalidaPT(dock: number, t: number) {
  const s = enPista(PISTAS.PT[dock].out, t);
  return { x: s.x, y: s.y, h: s.h };
}
/** Pose del camión de MP en el muelle `dock` (0 o 1). */
export function muelleMP(dock: number) {
  const p = PISTAS.MP[dock].in;
  const s = p[p.length - 1];
  return { x: s.x, y: s.y, h: s.h };
}
