"use client";
import { formatES } from "@/lib/format";
import { COLOR_AFECTADA, COLOR_CUELLO, ETAPAS_FLUJO, NOMBRE_ETAPA, type Paquete } from "@/lib/cuellos";

const f = (v: number, d = 0) => formatES(v, d);

/** Barras de ocupación por etapa (E1 contra el escenario), con el cuello en rojo y las etapas más afectadas en naranja. */
export function CuelloPanel({ p, etiquetaBase, etiquetaEsc, esBase }: { p: Paquete; etiquetaBase: string; etiquetaEsc: string; esBase: boolean }) {
  const fila = (id: string) => p.etapas.find((e) => e.id === id)!;
  const rol = (id: string) => (id === p.cuello.etapa ? "cuello" : p.afectadas.includes(id) ? "afectada" : "normal");
  const color = (id: string) => (rol(id) === "cuello" ? COLOR_CUELLO : rol(id) === "afectada" ? COLOR_AFECTADA : "#7d8ca3");
  const r = fila("camara_mp");
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted">
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-5 rounded-sm bg-[#c9d3e2]" />{etiquetaBase}</span>
        {!esBase && <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-5 rounded-sm bg-[#7d8ca3]" />{etiquetaEsc}</span>}
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOR_CUELLO }} />Cuello</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOR_AFECTADA }} />Más afectada</span>
      </div>
      <div className="grid grid-cols-[88px_1fr_auto] items-center gap-x-3 gap-y-2.5 text-[12.5px] md:grid-cols-[110px_1fr_190px]">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Etapa</div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Ocupación (procesando + bloqueada)</div>
        <div className="text-right text-[11px] font-bold uppercase tracking-wide text-muted">Capacidad implícita</div>
        {ETAPAS_FLUJO.map((id) => {
          const e = fila(id);
          const base = e.ocup_base ?? 0, esc = e.ocup ?? 0;
          const rl = rol(id);
          return (
            <div key={id} className="contents">
              <div className="flex items-center gap-1.5 font-semibold">
                {rl !== "normal" && <i className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color(id) }} />}
                <span className={rl === "normal" ? "text-muted" : ""}>{NOMBRE_ETAPA[id]}</span>
              </div>
              <div className="space-y-[3px]">
                {!esBase && <div className="relative h-[7px] overflow-hidden rounded-full bg-[#eef3fa]"><div className="h-full rounded-full bg-[#c9d3e2]" style={{ width: `${Math.min(100, base)}%` }} /></div>}
                <div className="relative h-[9px] overflow-hidden rounded-full bg-[#eef3fa]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, esc)}%`, background: color(id) }} /></div>
              </div>
              <div className="tnum text-right text-[12px]">
                <b style={{ color: rl === "cuello" ? COLOR_CUELLO : undefined }}>{f(esc)} %</b>
                {!esBase && <span className="text-muted"> (antes {f(base)} %)</span>}
                <div className="text-[11px] text-muted">{e.cap != null ? `${f(e.cap, 1)} t/día` : ""}{!esBase && e.cap_base != null && Math.abs((e.cap ?? 0) - e.cap_base) > 0.5 ? ` (antes ${f(e.cap_base, 1)})` : ""}</div>
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 font-semibold">
          {rol("camara_mp") !== "normal" && <i className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color("camara_mp") }} />}
          <span className={rol("camara_mp") === "normal" ? "text-muted" : ""}>Cámaras de MP</span>
        </div>
        <div className="text-[12px] text-muted">Pallets de materia prima esperando (promedio de las 24 h)</div>
        <div className="tnum text-right text-[12px]"><b>{f(r.rack ?? 0, 1)}</b>{!esBase && <span className="text-muted"> (antes {f(r.rack_base ?? 0, 1)})</span>}<div className="text-[11px] text-muted">máx. {f(r.rack_max ?? 0)}</div></div>
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-muted">Capacidad implícita = lo que la etapa dejaría pasar si estuviera ocupada el 100 % del tiempo (entradas por día ÷ ocupación). El cuello es la de menor capacidad. En el túnel y el estibado «procesando» solo significa que tienen algo adentro, por eso no compiten.</p>
    </div>
  );
}
