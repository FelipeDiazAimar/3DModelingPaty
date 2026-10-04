"use client";
import { Chart, axisT, axisV } from "@/components/Chart";
import { Card, Empty, Kpi, Page, PageHead } from "@/components/Ui";
import { MACHINES } from "@/lib/layout";
import { series } from "@/lib/derive";
import { useHist, useLatest, useStore } from "@/lib/store";

export default function Colas() {
  const h = useHist();
  const last = useLatest();
  const stores = MACHINES.filter((m) => m.kind === "store");
  const line = useStore((s) => s.line);
  const inLine = MACHINES.filter((m) => m.kind === "machine" && (line === "Todas" || m.line === line));
  if (!last) return <Page><PageHead title="Colas y trabajo en proceso" sub="Cuánto material está esperando y dónde se acumula." /><Empty /></Page>;
  const wip = inLine.reduce((a, m) => a + (last.machines[m.id]?.content ?? 0), 0);
  const peakQ = Math.max(...stores.map((m) => last.machines[m.id]?.content ?? 0));
  return (
    <Page>
      <PageHead title="Colas y trabajo en proceso" sub="Cuánto material está esperando y dónde se acumula." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon="stack" accent="blue" label="Ítems dentro de las líneas" value={String(wip)} />
        <Kpi icon="layers" accent="amber" label="Mayor cola o cámara" value={String(peakQ)} unit="ítems" />
        <Kpi icon="truck" accent="blue" label="Cola de recepción" value={String(last.machines["QRecepcion"]?.content ?? 0)} />
        <Kpi icon="pallet" accent="green" label="Cola de expedición" value={String(last.machines["QExpedicion"]?.content ?? 0)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Cámaras y colas en el tiempo" sub="Pallets almacenados">
          <Chart height={300} option={{ legend: { top: 0, right: 0, type: "scroll" }, xAxis: axisT, yAxis: axisV,
            series: stores.map((m) => ({ name: m.label, type: "line", showSymbol: false, data: series(h, (s) => s.machines[m.id]?.content ?? 0) })) }} />
        </Card>
        <Card title="Trabajo en proceso por etapa" sub="Ítems dentro de cada máquina ahora">
          <Chart height={300} option={{ grid: { left: 150, right: 16, top: 10, bottom: 24 }, xAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } },
            yAxis: { type: "category", inverse: true, data: inLine.map((m) => `${m.label} ${m.line}`) },
            series: [{ type: "bar", data: inLine.map((m) => last.machines[m.id]?.content ?? 0) }] }} />
        </Card>
      </div>
    </Page>
  );
}
