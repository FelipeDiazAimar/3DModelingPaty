import type { ReactNode } from "react";
import { CScroll } from "./CScroll";
import { Icon, type IconName } from "./Icons";

const ACCENT = {
  brand: ["#fff0f1", "#d9293b"], blue: ["#eaf0ff", "#2b59ff"], green: ["#e3f7ef", "#12906f"],
  amber: ["#fff4e0", "#d17a0a"], violet: ["#f0ebff", "#6d4af0"],
} as const;
export type Accent = keyof typeof ACCENT;

export function IconChip({ name, accent = "blue", size = 44 }: { name: IconName; accent?: Accent; size?: number }) {
  const [bg, fg] = ACCENT[accent];
  return (
    <span className="grid shrink-0 place-items-center rounded-[16px]" style={{ width: size, height: size, background: `linear-gradient(145deg, ${bg}, #fff)`, color: fg, boxShadow: `inset 0 0 0 1px ${fg}22` }}>
      <Icon name={name} size={Math.round(size * 0.5)} />
    </span>
  );
}

export function Kpi({ label, value, unit, delta, tone = "ink", hint, icon = "cube", accent = "blue" }: {
  label: string; value: string; unit?: string; delta?: number; tone?: "ink" | "ok" | "warn" | "crit"; hint?: string; icon?: IconName; accent?: Accent;
}) {
  const c = { ink: "text-ink", ok: "text-[var(--ok)]", warn: "text-[var(--warn)]", crit: "text-[var(--crit)]" }[tone];
  return (
    <div className="glass flex min-w-[190px] items-center gap-3.5 px-4 py-3.5">
      <IconChip name={icon} accent={accent} />
      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold text-muted">{label}</div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className={`tnum text-[28px] font-extrabold leading-none tracking-tight ${c}`}>{value}</span>
          {unit && <span className="text-[12px] font-bold text-muted">{unit}</span>}
          {delta !== undefined && delta !== 0 && (
            <span className={`tnum ml-1 text-[12px] font-bold ${delta > 0 ? "text-[var(--ok)]" : "text-[var(--crit)]"}`}>{delta > 0 ? "▲" : "▼"} {Math.abs(delta)}</span>
          )}
        </div>
        {hint && <div className="mt-1 truncate text-[11px] text-muted">{hint}</div>}
      </div>
    </div>
  );
}

/** KPI compacto para el header: ícono, valor y rótulo corto. */
export function KpiMini({ label, value, unit, tone = "ink", hint, icon, accent = "blue" }: {
  label: string; value: string; unit?: string; tone?: "ink" | "ok" | "warn" | "crit"; hint?: string; icon: IconName; accent?: Accent;
}) {
  const c = { ink: "text-ink", ok: "text-[var(--ok)]", warn: "text-[var(--warn)]", crit: "text-[var(--crit)]" }[tone];
  return (
    <div className="glass flex shrink-0 items-center gap-2.5 py-1.5 pl-2 pr-3.5" title={hint ? `${label} · ${hint}` : label}>
      <IconChip name={icon} accent={accent} size={34} />
      <div className="leading-tight">
        <div className="flex items-baseline gap-1"><span className={`tnum text-[18px] font-extrabold tracking-tight ${c}`}>{value}</span>{unit && <span className="text-[11px] font-bold text-muted">{unit}</span>}</div>
        <div className="whitespace-nowrap text-[10.5px] font-semibold text-muted">{label}</div>
      </div>
    </div>
  );
}

export function Card({ title, sub, children, className = "", right }: { title: string; sub?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={`card p-4 md:p-5 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-extrabold tracking-tight">{title}</h3>
          {sub && <p className="mt-0.5 text-[12px] text-muted">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Tag({ kind, children }: { kind: "supuesto" | "sinCorrida" | "real"; children?: ReactNode }) {
  const m = { supuesto: ["#fff4e0", "#a8620b", "Supuesto"], sinCorrida: ["#fde8eb", "#a81a2a", "Sin corrida"], real: ["#e3f6f0", "#0e7a5f", "Dato real"] }[kind];
  return <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: m[0], color: m[1] }}>{children ?? m[2]}</span>;
}

/** Píldora de estado de máquina. */
export function StatePill({ state }: { state?: string }) {
  const m: Record<string, [string, string, string]> = {
    proc: ["#e3f7ef", "#0e7a5f", "Procesando"], idle: ["#eef1f6", "#5a6b82", "Inactiva"], blocked: ["#fff1dc", "#b86a06", "Bloqueada"],
    starved: ["#fff6d6", "#9a7506", "Sin material"], down: ["#fde8eb", "#a81a2a", "En falla"],
  };
  const [bg, fg, label] = m[state ?? "idle"] ?? m.idle;
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: bg, color: fg }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: fg }} />{label}</span>;
}

/** Barra horizontal chica para tablas. */
export function MiniBar({ v, color = "var(--brand)" }: { v: number; color?: string }) {
  return <span className="inline-block h-1.5 w-20 overflow-hidden rounded-full bg-[#e3eaf4] align-middle"><span className="block h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, v)) * 100}%`, background: color }} /></span>;
}

/** Tabla con estilo propio: encabezado fijo, filas con hover, bordes redondeados. */
export function Table({ head, children, maxH }: { head: { label: string; right?: boolean }[]; children: ReactNode; maxH?: number }) {
  return (
    <div className="tbl-wrap">
      <CScroll innerClassName="" className="" >
        <div className="overflow-x-auto" style={maxH ? { maxHeight: maxH } : undefined}>
          <table className="tbl min-w-[640px]">
            <thead><tr>{head.map((h) => <th key={h.label} className={h.right ? "text-right" : ""}>{h.label}</th>)}</tr></thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      </CScroll>
    </div>
  );
}

export function PageHead({ title, sub, right }: { title: string; sub: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-tight md:text-[30px]">{title}</h1>
        <p className="mt-1 max-w-[70ch] text-[14px] text-muted">{sub}</p>
      </div>
      {right}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <CScroll className="h-full" innerClassName="px-3 pb-40 pt-2 md:px-5 md:pb-28">
      <div className="mx-auto max-w-[1280px]">{children}</div>
    </CScroll>
  );
}

export function Empty() {
  return (
    <div className="card grid place-items-center gap-3 p-12 text-center">
      <div className="spinner" aria-hidden />
      <p className="max-w-[44ch] text-[14px] text-muted">Esperando datos de la simulación. Corré PLANTASJ.fsm en FlexSim o activá el demo arriba a la derecha.</p>
    </div>
  );
}
