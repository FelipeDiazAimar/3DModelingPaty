"use client";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Chart, axisT, axisV } from "./Chart";
import { KpiMini } from "./Ui";
import { CScroll } from "./CScroll";
import { FLEET, MACHINES, STAGES, STAGE_LABEL, STATE_COLOR, STATE_LABEL, byId } from "@/lib/layout";
import { compliance, insights, ratePalletsHour, series, utilization } from "@/lib/derive";
import { useHist, useLatest, useStore } from "@/lib/store";

export function KpiChips() {
  const h = useHist();
  const last = useLatest();
  const rate = ratePalletsHour(h);
  const comp = compliance(h);
  const procs = MACHINES.filter((m) => m.kind === "machine" && /(Form[AB]|Tunel)/.test(m.id));
  const active = last ? procs.filter((m) => last.machines[m.id]?.state === "proc").length : 0;
  return (
    <div className="pointer-events-auto flex items-center gap-2">
      <KpiMini icon="pallet" accent="brand" label="Pallets PT" value={last ? String(last.kpi.palletsPT) : "—"} hint={`${rate.toFixed(2)} pal/h (últimas 4 h)`} />
      <KpiMini icon="target" accent="green" label="Cumplimiento" value={last ? `${(comp * 100).toFixed(0)}` : "—"} unit="%" tone={comp >= 0.95 ? "ok" : comp >= 0.8 ? "warn" : "crit"} hint="Meta: 36 pal/día por línea" />
      <KpiMini icon="truck" accent="blue" label="MP recibida" value={last ? String(last.kpi.palletsMP) : "—"} hint="Pallets de camiones a cámaras" />
      <KpiMini icon="cog" accent="violet" label="Activas" value={last ? `${active}/${procs.length}` : "—"} hint="Formadoras y túneles trabajando" />
    </div>
  );
}

function Bar({ label, v, c }: { label: string; v: number; c: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px] font-semibold">
        <span className="text-muted">{label}</span>
        <span className="tnum">{(v * 100).toFixed(0)} %</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e6ecf4]">
        <div className="h-full rounded-full" style={{ width: `${v * 100}%`, background: c }} />
      </div>
    </div>
  );
}

function MachinePanel({ id }: { id: string }) {
  const h = useHist();
  const last = useLatest();
  const m = byId(id)!;
  const live = last?.machines[id];
  const u = utilization(h, id);
  const hrs = Math.max((last?.t ?? 0) / 3600, 0.01);
  const cells: [string, number][] = [
    ["Dentro", live?.content ?? 0],
    ["Entradas", live?.inp ?? 0],
    ["Salidas", live?.out ?? 0],
  ];
  return (
    <>
      <div className="flex items-start justify-between pr-8">
        <div>
          <div className="text-[12px] font-semibold text-muted">
            {m.line === "Común" ? "Logística" : `Línea ${m.line.slice(1)} · ${STAGE_LABEL[m.stage]}`}
          </div>
          <h2 className="text-[22px] font-extrabold tracking-tight">{m.label}</h2>
        </div>
      </div>
      <span className="mt-1 inline-block rounded-full px-3 py-1 text-[12px] font-bold text-white" style={{ background: STATE_COLOR[live?.state ?? "idle"] }}>
        {STATE_LABEL[live?.state ?? "idle"]}
      </span>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-[#f1f5fa] px-3 py-2">
            <div className="text-[11px] font-semibold text-muted">{k}</div>
            <div className="tnum text-[20px] font-extrabold">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[12px] text-muted">
        Ritmo medio: <b className="tnum text-ink">{((live?.out ?? 0) / hrs).toFixed(1)}</b> ítems/h
      </div>
      <div className="mt-4 space-y-2.5">
        <Bar label="Procesando" v={u.proc} c="var(--ok)" />
        <Bar label="Bloqueada" v={u.blocked} c="var(--warn)" />
        <Bar label="Sin material" v={u.starved} c="#d6a21a" />
        <Bar label="Inactiva" v={u.idle} c="#8b97a8" />
      </div>
      <div className="mt-3">
        <div className="text-[12px] font-semibold text-muted">Contenido en el tiempo</div>
        <Chart
          height={120}
          option={{
            grid: { left: 28, right: 6, top: 8, bottom: 20 },
            xAxis: axisT,
            yAxis: axisV,
            series: [{ type: "line", showSymbol: false, smooth: true, areaStyle: { opacity: 0.12 }, data: series(h, (s) => s.machines[id]?.content ?? 0) }],
          }}
        />
      </div>
      <Link href={`/produccion?m=${id}`} className="mt-1 inline-block text-[13px] font-bold text-brand">
        Ver detalle de producción
      </Link>
    </>
  );
}

function FleetPanel({ id }: { id: string }) {
  const f = useLatest()?.fleet[id];
  const meta = FLEET.find((x) => x.id === id)!;
  const cells: [string, string][] = [
    ["Estado", f?.state ?? "—"],
    ["Con carga", f?.carrying ? "Sí" : "No"],
    ["Traslados", String(f?.moves ?? 0)],
    ["Posición", f ? `${f.x.toFixed(0)}, ${f.y.toFixed(0)} m` : "—"],
  ];
  return (
    <>
      <div className="text-[12px] font-semibold text-muted">Montacargas</div>
      <h2 className="text-[22px] font-extrabold tracking-tight">{meta.label}</h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-[#f1f5fa] px-3 py-2">
            <div className="text-[11px] font-semibold text-muted">{k}</div>
            <div className="tnum text-[17px] font-extrabold capitalize">{v}</div>
          </div>
        ))}
      </div>
      <Link href="/flota" className="mt-4 inline-block text-[13px] font-bold text-brand">
        Ver todos los montacargas
      </Link>
    </>
  );
}

function InsightsList() {
  const h = useHist();
  const select = useStore((s) => s.select);
  const list = insights(h);
  const col = { ok: "var(--ok)", warn: "var(--warn)", crit: "var(--crit)" };
  return (
    <>
      <h2 className="text-[18px] font-extrabold tracking-tight">Lo que importa ahora</h2>
      <p className="mt-0.5 text-[12px] text-muted">Elegí una máquina en el 3D para ver sus números en vivo.</p>
      <ul className="mt-4 space-y-2.5">
        {list.length === 0 && <li className="text-[13px] text-muted">Esperando datos de la simulación…</li>}
        {list.map((i, k) => (
          <li key={k}>
            <button
              disabled={!i.target}
              onClick={() => i.target && select(i.target)}
              className="w-full rounded-xl bg-[#f1f5fa] p-3 text-left transition hover:bg-[#e8eef7] disabled:cursor-default"
            >
              <div className="flex items-center gap-2 text-[13px] font-bold">
                <span className="h-2 w-2 rounded-full" style={{ background: col[i.level] }} />
                {i.title}
              </div>
              <div className="mt-1 text-[12px] leading-snug text-muted">{i.text}</div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export function SidePanel() {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  if (!selected) return null; // el card solo aparece al tocar una máquina
  return (
    <div className="glass pointer-events-auto relative w-full overflow-hidden">
      {selected && (
        <button
          onClick={() => select(null)}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-[#e6ecf4] text-sm font-bold hover:bg-[#d8e0ec]"
        >
          ×
        </button>
      )}
      <CScroll className="max-h-[38dvh] md:max-h-[max(220px,calc(100dvh-420px))]" innerClassName="max-h-[38dvh] p-4 md:max-h-[max(220px,calc(100dvh-420px))] md:p-5">
        <AnimatePresence mode="wait">
          <motion.div key={selected ?? "none"} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {!selected ? <InsightsList /> : FLEET.some((f) => f.id === selected) ? <FleetPanel id={selected} /> : <MachinePanel id={selected} />}
          </motion.div>
        </AnimatePresence>
      </CScroll>
    </div>
  );
}

/** Recorrido del batch: etapas de la línea con el estado actual de cada una. */
export function BatchTrack() {
  const last = useLatest();
  const line = useStore((s) => s.line);
  const select = useStore((s) => s.select);
  const l = line === "L8" ? "L8" : "L7";
  return (
    <div className="glass pointer-events-auto w-[clamp(430px,calc(100vw-890px),760px)] px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-bold">Recorrido del batch · Línea {l.slice(1)}</h3>
        <span className="text-[11px] text-muted">Batch de 1500 kg → 10 cargas → 300 cajas de 5 kg</span>
      </div>
      <ol className="flex items-start">
        {STAGES.map((st, i) => {
          const ms = MACHINES.filter((m) => m.line === l && m.stage === st);
          const working = ms.some((m) => last?.machines[m.id]?.state === "proc");
          const blocked = ms.some((m) => last?.machines[m.id]?.state === "blocked");
          const c = working ? "var(--ok)" : blocked ? "var(--warn)" : "#b6c0cf";
          return (
            <li key={st} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : ""}`} style={{ background: c }} />
                <button
                  onClick={() => ms[0] && select(ms[0].id)}
                  aria-label={STAGE_LABEL[st]}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white text-[11px] font-extrabold"
                  style={{ boxShadow: `0 0 0 2.5px ${c}, var(--shadow)`, color: c }}
                >
                  {i + 1}
                </button>
                <div className={`h-0.5 flex-1 ${i === STAGES.length - 1 ? "opacity-0" : ""}`} style={{ background: c }} />
              </div>
              <span className="mt-1.5 text-[11px] font-semibold">{STAGE_LABEL[st]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function BottomTable() {
  const [tab, setTab] = useState<"Máquinas" | "Montacargas" | "Colas">("Máquinas");
  const last = useLatest();
  const line = useStore((s) => s.line);
  const select = useStore((s) => s.select);
  const rows = MACHINES.filter(
    (m) => (tab === "Máquinas" ? m.kind === "machine" : tab === "Colas" ? m.kind === "store" : false) && (line === "Todas" || m.line === line || m.line === "Común"),
  );
  return (
    <div className="glass pointer-events-auto w-full p-3.5">
      <div className="mb-2 flex gap-1">
        {(["Máquinas", "Montacargas", "Colas"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="nav-link" aria-current={tab === t ? "page" : undefined}>
            {t}
          </button>
        ))}
      </div>
      <CScroll innerClassName="max-h-[150px]"><ul className="divide-y divide-[var(--line)] pr-3">
        {tab === "Montacargas"
          ? FLEET.map((f) => {
              const l = last?.fleet[f.id];
              return (
                <li key={f.id}>
                  <button onClick={() => select(f.id)} className="flex w-full items-center justify-between px-2 py-1.5 text-left text-[12px] hover:bg-white/70">
                    <span className="font-bold">{f.label}</span>
                    <span className="capitalize text-muted">
                      {l?.state ?? "—"}
                      {l?.carrying ? " · con carga" : ""}
                    </span>
                  </button>
                </li>
              );
            })
          : rows.map((m) => {
              const s = last?.machines[m.id];
              return (
                <li key={m.id}>
                  <button onClick={() => select(m.id)} className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[12px] hover:bg-white/70">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATE_COLOR[s?.state ?? "idle"] }} />
                    <span className="font-bold">{m.label}</span>
                    <span className="text-muted">{m.line === "Común" ? "" : m.line}</span>
                    <span className="tnum ml-auto text-muted">{s ? `${s.content} dentro` : "—"}</span>
                  </button>
                </li>
              );
            })}
      </ul></CScroll>
    </div>
  );
}
