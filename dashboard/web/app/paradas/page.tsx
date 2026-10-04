"use client";
import { Chart } from "@/components/Chart";
import { Card, Empty, Page, PageHead, Tag } from "@/components/Ui";
import { MACHINES } from "@/lib/layout";
import { utilization } from "@/lib/derive";
import { useHist, useLatest, useStore } from "@/lib/store";

// Tablero Sep–Oct 2026 (FITTING_EVIDENCIA.md): minutos de paro en la línea 3 y en toda la planta.
const TABLERO = [
  { eq: "Formadora (FOR)", l3: 412, planta: 3812 },
  { eq: "Estuchadora (EST)", l3: 338, planta: 938 },
  { eq: "Túnel (TUN)", l3: 147, planta: 1065 },
  { eq: "Picadora (PIC)", l3: 79, planta: 609 },
  { eq: "Flowpack (FLW)", l3: 50, planta: 1969 },
];

export default function Paradas() {
  const h = useHist();
  const last = useLatest();
  const lineM = MACHINES.filter((m) => m.kind === "machine");
  const rows = lineM.map((m) => ({ m, u: utilization(h, m.id) })).sort((a, b) => b.u.blocked + b.u.starved - (a.u.blocked + a.u.starved)).slice(0, 12);
  return (
    <Page>
      <PageHead title="Paradas y tiempo perdido" sub="Dónde se pierde tiempo: lo que muestra el tablero real de la planta y lo que hoy se ve en la simulación." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Pareto de paros del tablero (minutos, Sep–Oct)" sub="Línea 3 contra el total de planta" right={<Tag kind="real" />}>
          <Chart height={300} option={{
            legend: { top: 0, right: 0 }, grid: { left: 120, right: 16, top: 30, bottom: 24 },
            xAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } },
            yAxis: { type: "category", inverse: true, data: TABLERO.map((t) => t.eq) },
            series: [
              { name: "Línea 3", type: "bar", data: TABLERO.map((t) => t.l3) },
              { name: "Planta", type: "bar", data: TABLERO.map((t) => t.planta) },
            ],
          }} />
          <p className="mt-2 text-[12px] text-muted">Total planta: 12.610 min · Línea 3: 1.324 min.</p>
        </Card>
        <Card title="Fallas simuladas" sub="El modelo todavía no tiene MTBF/MTTR cargados" right={<Tag kind="sinCorrida" />}>
          <p className="text-[14px] leading-relaxed text-muted">
            Las máquinas del modelo no fallan: se tomaron como disponibles las 24 h. Para compararlas con el tablero hay que cargar los tiempos de paro (MTTR por equipo y MTBF bajo el supuesto de 3 turnos). Mientras tanto, abajo se ve el tiempo que cada máquina pierde por esperar material o por bloqueo.
          </p>
        </Card>
      </div>
      <Card className="mt-4" title="Tiempo perdido por bloqueo o falta de material" sub="Las 12 máquinas con más espera acumulada">
        {!last ? <Empty /> : (
          <Chart height={340} option={{
            legend: { top: 0, right: 0 }, grid: { left: 150, right: 16, top: 30, bottom: 24 },
            xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value} %" }, splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } },
            yAxis: { type: "category", inverse: true, data: rows.map((r) => `${r.m.label} ${r.m.line}`) },
            series: [
              { name: "Bloqueada", type: "bar", stack: "t", itemStyle: { color: "#e08a1e" }, data: rows.map((r) => +(r.u.blocked * 100).toFixed(1)) },
              { name: "Sin material", type: "bar", stack: "t", itemStyle: { color: "#d6a21a" }, data: rows.map((r) => +(r.u.starved * 100).toFixed(1)) },
            ],
          }} />
        )}
      </Card>
    </Page>
  );
}
