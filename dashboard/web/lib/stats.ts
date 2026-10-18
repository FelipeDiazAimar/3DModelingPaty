/**
 * stats.ts — Cálculo estadístico puro para el dashboard (sin render).
 *
 * Teoría aplicada (citas):
 * - ET2 p.19-21: Chi-cuadrado frecuencias: X2_0 = SUM (fo-fe)^2/fe,
 *   fe = N/n, regla fe>=5, gl = n-1, decisión X2_0 < X2_{a,n-1} no rechaza H0.
 * - ET2 p.22-24: K-S uniformidad: ordenar, F_N=i/N, D_N=max|F_N-x_(i)|,
 *   comparar con d_{a,N} (tabla p.23; N>35: 1.36/sqrt(N) para a=0.05).
 * - ET6 p.15: ECDF escalera + K-S bilateral bondad: D despues=i/n-F(xi),
 *   D antes=F(xi)-(i-1)/n, D=max (en valor absoluto).
 * - ET6 p.16: Chi bondad X2=SUM(O-E)^2/E, gl=k-1-p (p=params estimados),
 *   E>=5 (agrupar si no), normal via z=(x-mu)/sigma + tabla Phi.
 * - ET6 p.21 (Ej.2): Normal: z, E=N[F(b)-F(a)] con F=Phi, gl=k-p-1=5-2-1=2,
 *   X2crit(2;0.05)=5.991, ejemplo X2=2.239 no rechaza.
 *
 * Convenciones del repo:
 * - Cálculo siempre con punto decimal; la coma es-AR solo en render
 *   (toLocaleString("es-AR") en componentes, nunca aquí).
 * - Sin side effects, sin dependencias nuevas: solo Math + imports tipo/series.
 * - Reutiliza Snapshot (types.ts) y series() (derive.ts) vía timeAvg().
 */

import type { Snapshot } from "./types";
import { series } from "./derive";

/** ECDF: para cada x, % datos <= x. Ordena copia, devuelve [[x, i/n]]. (ET6 p.15) */
export function ecdf(vals: number[]): [number, number][] {
  if (vals.length === 0) return [];
  const s = [...vals].sort((a, b) => a - b);
  return s.map((x, idx) => [x, (idx + 1) / s.length] as [number, number]);
}

function quantileSorted(sorted: number[], q: number): number {
  const n = sorted.length;
  const pos = (n - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (base + 1 < n) return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  return sorted[base];
}

export interface BoxStats {
  q1: number;
  med: number;
  q3: number;
  ric: number;
  low: number;
  high: number;
  outliers: number[];
}

/**
 * Boxplot (ET6 p.6): caja Q1-Q3 (50% central), línea mediana,
 * RIC=Q3-Q1, límites Q1-1.5*RIC / Q3+1.5*RIC,
 * bigotes al dato extremo dentro de límites, fuera = outliers.
 * Cuantiles por interpolación lineal (tipo 7).
 */
export function boxplotStats(vals: number[]): BoxStats {
  if (vals.length === 0) return { q1: 0, med: 0, q3: 0, ric: 0, low: 0, high: 0, outliers: [] };
  const s = [...vals].sort((a, b) => a - b);
  const q1 = quantileSorted(s, 0.25);
  const med = quantileSorted(s, 0.5);
  const q3 = quantileSorted(s, 0.75);
  const ric = q3 - q1;
  const limLow = q1 - 1.5 * ric;
  const limHigh = q3 + 1.5 * ric;
  const inside = s.filter((v) => v >= limLow && v <= limHigh);
  const low = inside.length > 0 ? inside[0] : q1;
  const high = inside.length > 0 ? inside[inside.length - 1] : q3;
  const outliers = s.filter((v) => v < limLow || v > limHigh);
  return { q1, med, q3, ric, low, high, outliers };
}

export interface Chi2Row {
  i: number; // 1-based, como tablas ET2 p.21 / ET6 p.20
  obs: number; // O_i
  esp: number; // E_i
  aporte: number; // (O-E)^2/E
}

/**
 * Tabla Chi-cuadrado (ET2 p.19-20, ET6 p.16).
 * chi2 = SUM aporte. gl = k-1-p se calcula fuera (ET6 p.16,21:
 * p=2 para Normal mu/sigma; ej. gl=5-2-1=2, crit 5.991).
 * Exige obs.length===esp.length y esp>0 (ET2 regla fe>=5: agrupar antes).
 */
export function chi2Table(obs: number[], esp: number[]): { rows: Chi2Row[]; chi2: number } {
  if (obs.length !== esp.length) throw new Error("chi2Table: obs y esp deben tener igual longitud");
  const rows: Chi2Row[] = obs.map((o, idx) => {
    const e = esp[idx];
    if (!(e > 0)) throw new Error("chi2Table: cada esp debe ser > 0 (agrupar clases con E<5)");
    return { i: idx + 1, obs: o, esp: e, aporte: ((o - e) * (o - e)) / e };
  });
  const chi2 = rows.reduce((a, r) => a + r.aporte, 0);
  return { rows, chi2 };
}

export interface KsRow {
  i: number; // posición 1..n en muestra ordenada
  x: number; // x_(i)
  emp: number; // F_N = i/n
  teo: number; // F(x_(i)) teórica vía cdf
  dAfter: number; // |i/n - F(xi)| (después del salto, ET6 p.15)
  dBefore: number; // |F(xi) - (i-1)/n| (antes del salto, ET6 p.15)
}

/**
 * Tabla K-S bilateral (ET6 p.15, ejemplo p.18-19; base ET2 p.22-24).
 * dmax = max(dAfter, dBefore). Decisión fuera: dmax < d_{a,N} no rechaza.
 * Tabla ET2 p.23: N=20 a=0.05 -> 0.294; N>35 -> 1.36/sqrt(N).
 */
export function ksTable(
  vals: number[],
  cdf: (x: number) => number
): { rows: KsRow[]; dmax: number } {
  if (vals.length === 0) return { rows: [], dmax: 0 };
  const s = [...vals].sort((a, b) => a - b);
  const n = s.length;
  let dmax = 0;
  const rows: KsRow[] = s.map((x, idx) => {
    const i = idx + 1;
    const emp = i / n;
    const teo = cdf(x);
    const dAfter = Math.abs(emp - teo);
    const dBefore = Math.abs(teo - (i - 1) / n);
    const d = dAfter > dBefore ? dAfter : dBefore;
    if (d > dmax) dmax = d;
    return { i, x, emp, teo, dAfter, dBefore };
  });
  return { rows, dmax };
}

/**
 * Phi(z) = P(Z<=z), N(0,1). Aproximación Abramowitz-Stegun 7.1.26
 * (error < 7.5e-8). Soporta ET6 p.20-21 paso 2: F=Phi(z), z=(x-mu)/sigma,
 * con simetría F(-z)=1-F(z) ya incluida.
 */
export function phi(z: number): number {
  const a1 = 0.31938153;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;
  const p = 0.2316419;
  const az = Math.abs(z);
  const t = 1 / (1 + p * az);
  const nd = Math.exp((-az * az) / 2) / Math.sqrt(2 * Math.PI);
  const q = nd * t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  return z >= 0 ? 1 - q : q;
}

/**
 * Exponencial F(x)=1-exp(-lambda*x), lambda=1/mu (ET6 p.10, ejemplo p.18:
 * mu=xbar=3.3055, lambda=0.3025). x<=0 -> 0; mu<=0 -> NaN.
 */
export function expCDF(x: number, mu: number): number {
  if (!(mu > 0)) return NaN;
  if (x <= 0) return 0;
  return 1 - Math.exp(-x / mu);
}

/**
 * Área bajo serie [[x,y]] por trapecio (x en horas). Base de promedios
 * temporales. Ignora tramos con dx<=0 o no finitos.
 */
export function areaUnder(s: [number, number][]): number {
  if (s.length < 2) return 0;
  let acc = 0;
  for (let k = 1; k < s.length; k++) {
    const a = s[k - 1];
    const b = s[k];
    const dx = b[0] - a[0];
    if (!(dx > 0)) continue;
    if (!Number.isFinite(a[1]) || !Number.isFinite(b[1])) continue;
    acc += (dx * (a[1] + b[1])) / 2;
  }
  return acc;
}

/**
 * Promedio temporal de pick sobre historial: areaUnder(series(h,pick))/span.
 * Reutiliza Snapshot + series() (derive.ts). span=(last.t-first.t)/3600.
 */
export function timeAvg(h: Snapshot[], pick: (s: Snapshot) => number): number {
  if (h.length === 0) return 0;
  if (h.length === 1) return pick(h[0]);
  const area = areaUnder(series(h, pick));
  const span = (h[h.length - 1].t - h[0].t) / 3600;
  if (!(span > 0)) return pick(h[h.length - 1]);
  return area / span;
}

export interface LittleResult {
  L: number; // WIP promedio (p.ej. timeAvg(h, wipPick))
  lambda: number; // throughput mismo flujo (ítems/h)
  W: number; // tiempo medio en sistema (h)
  lambdaW: number; // lambda*W
  errRel: number; // |L-lambdaW|/|L|
  ok: boolean; // errRel <= tol (def 0.05)
}

/**
 * Chequeo Ley de Little L ~= lambda*W para página Colas.
 * L vía timeAvg, lambda vía (conteo fin-ini)/span, W medido/estimado.
 * Solo aritmética; el formato es-AR va en render.
 */
export function littleCheck(L: number, lambda: number, W: number, tol?: number): LittleResult {
  const t = tol === undefined ? 0.05 : tol;
  const lambdaW = lambda * W;
  const denom = Math.abs(L) > 1e-12 ? Math.abs(L) : 1;
  const errRel = Math.abs(L - lambdaW) / denom;
  return { L, lambda, W, lambdaW, errRel, ok: errRel <= t };
}
