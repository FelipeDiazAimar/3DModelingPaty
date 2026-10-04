import type { Snapshot } from "./types";
import { MACHINES, META_PAL_DIA_LINEA } from "./layout";

/** Utilización acumulada = muestras en "proc" / muestras totales. */
export function utilization(h: Snapshot[], id: string) {
  let n = 0, p = 0, b = 0, s = 0, d = 0;
  for (const x of h) {
    const m = x.machines[id]; if (!m) continue;
    n++; if (m.state === "proc") p++; else if (m.state === "blocked") b++; else if (m.state === "starved") s++; else if (m.state === "down") d++;
  }
  if (!n) return { proc: 0, blocked: 0, starved: 0, down: 0, idle: 0 };
  return { proc: p / n, blocked: b / n, starved: s / n, down: d / n, idle: 1 - (p + b + s + d) / n };
}

export function series(h: Snapshot[], pick: (s: Snapshot) => number) {
  return h.map((s) => [s.t / 3600, pick(s)] as [number, number]);
}

/** Pallets PT por hora en ventana móvil (por defecto 4 h). */
export function ratePalletsHour(h: Snapshot[], windowH = 4) {
  if (h.length < 2) return 0;
  const last = h[h.length - 1];
  const t0 = last.t - windowH * 3600;
  const first = h.find((x) => x.t >= t0) ?? h[0];
  const dt = (last.t - first.t) / 3600;
  return dt > 0 ? (last.kpi.palletsPT - first.kpi.palletsPT) / dt : 0;
}

export function compliance(h: Snapshot[]) {
  const last = h[h.length - 1]; if (!last) return 0;
  const days = Math.max(last.t / 86400, 1 / 24);
  const meta = META_PAL_DIA_LINEA * 2 * days; // L7 + L8
  return last.kpi.palletsPT / meta;
}

export interface Insight { level: "ok" | "warn" | "crit"; title: string; text: string; target?: string }

export function insights(h: Snapshot[]): Insight[] {
  const last = h[h.length - 1]; if (!last) return [];
  const out: Insight[] = [];
  // cuello de botella: máquina de línea con mayor utilización acumulada
  const lineM = MACHINES.filter((m) => m.kind === "machine" && m.stage !== "estibado" && m.stage !== "desencajado"); // acumuladores no marcan ritmo
  const u = lineM.map((m) => ({ m, u: utilization(h, m.id) })).sort((a, b) => b.u.proc - a.u.proc);
  if (u[0] && u[0].u.proc > 0)
    out.push({ level: "ok", title: `Cuello de botella: ${u[0].m.label} ${u[0].m.line}`, text: `Trabaja el ${(u[0].u.proc * 100).toFixed(0)} % del tiempo: es la que marca el ritmo de la línea.`, target: u[0].m.id });
  const blocked = lineM.map((m) => ({ m, u: utilization(h, m.id) })).filter((x) => x.u.blocked > 0.15).sort((a, b) => b.u.blocked - a.u.blocked)[0];
  if (blocked) out.push({ level: "warn", title: `${blocked.m.label} ${blocked.m.line} se bloquea`, text: `Pasa el ${(blocked.u.blocked * 100).toFixed(0)} % del tiempo esperando que la siguiente etapa reciba.`, target: blocked.m.id });
  const idle = lineM.filter((m) => /B_L/.test(m.id)).map((m) => ({ m, u: utilization(h, m.id) })).filter((x) => x.u.proc < 0.1 && h.length > 20)[0];
  if (idle) out.push({ level: "ok", title: `${idle.m.label} ${idle.m.line} casi no se usa`, text: "Con estos tiempos alcanza con la máquina A; la B queda de reserva.", target: idle.m.id });
  const c = compliance(h);
  out.push({ level: c >= 0.95 ? "ok" : c >= 0.8 ? "warn" : "crit", title: `Cumplimiento del programa: ${(c * 100).toFixed(0)} %`, text: `Meta del tablero: ${META_PAL_DIA_LINEA} pallets/día por línea.` });
  return out;
}
