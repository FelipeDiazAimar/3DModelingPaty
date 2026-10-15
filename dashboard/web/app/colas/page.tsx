"use client";
import { Chart, axisT } from "@/components/Chart";
import { Card, Empty, Kpi, Page, PageHead, Tag } from "@/components/Ui";
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

  // Serie temporal de WIP total en máquinas de línea
  const wipSeries = series(h, (s) => inLine.reduce((a, m) => a + (s.machines[m.id]?.content ?? 0), 0));
  const palletsSeries = series(h, (s) => s.kpi.palletsPT);

  return (
    <Page>
      <PageHead title="Colas y trabajo en proceso" sub="Cuánto material está esperando y cómo evoluciona el inventario en proceso (WIP) frente a la producción." />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon="stack" accent="blue" label="Ítems dentro de las líneas" value={String(wip)} hint="WIP instantáneo en curso" />
        <Kpi icon="layers" accent="amber" label="Mayor cola o cámara" value={String(peakQ)} unit="ítems" hint="Pico de acumulación" />
        <Kpi icon="truck" accent="blue" label="Cola de recepción" value={String(last.machines["QRecepcion"]?.content ?? 0)} hint="Pallets esperando mesada" />
        <Kpi icon="pallet" accent="green" label="Cola de expedición" value={String(last.machines["QExpedicion"]?.content ?? 0)} hint="Pallets listos para despacho" />
      </div>

      {/* Gráfico 4: Evolución Temporal del WIP y Producción Acumulada */}
      <Card
        className="mb-4"
        title="Evolución Temporal del WIP y Producción Acumulada (Dinámica 24 h)"
        sub="Comportamiento del inventario en proceso en relación con los pallets de producto terminado entregados"
        right={<Tag kind="real">Dinámica de Línea</Tag>}
      >
        <Chart
          height={320}
          option={{
            legend: { top: 0, right: 16 },
            grid: { left: 55, right: 60, top: 36, bottom: 28 },
            xAxis: axisT,
            yAxis: [
              {
                type: "value",
                name: "WIP en Línea (cajas)",
                nameTextStyle: { color: "#8b97a8" },
                splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } },
              },
              {
                type: "value",
                name: "Pallets PT Acumulados",
                nameTextStyle: { color: "#8b97a8" },
                splitLine: { show: false },
              },
            ],
            series: [
              {
                name: "WIP Total en Línea",
                type: "line",
                showSymbol: false,
                lineStyle: { width: 2.5, color: "#2b59ff" },
                areaStyle: { opacity: 0.12, color: "#2b59ff" },
                data: wipSeries,
                markLine: {
                  silent: true,
                  symbol: "none",
                  data: [
                    { xAxis: 2.5, name: "Fin warm-up", label: { formatter: "Fin Warm-up (2,5 h)" }, lineStyle: { color: "#d9293b", type: "dashed", width: 2 } },
                  ],
                },
              },
              {
                name: "Pallets PT Terminados",
                type: "line",
                yAxisIndex: 1,
                showSymbol: false,
                lineStyle: { width: 3, color: "#16a37f" },
                data: palletsSeries,
              },
            ],
          }}
        />
        <div className="mt-2 text-[12px] leading-relaxed text-muted">
          <b>Análisis de estabilidad:</b> Tras el período de calentamiento de 2,5 h, el WIP alcanza un nivel de régimen en torno a los valores de diseño. Las oscilaciones periódicas corresponden a la alimentación por batches desde las mezcladoras hacia las tolvas de las formadoras; las caídas pronunciadas o amontonamientos señalan paradas operativas en la línea.
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Cámaras y colas en el tiempo" sub="Evolución de pallets almacenados en cámaras MP y PT">
          <Chart height={300} option={{
            legend: { top: 0, right: 0, type: "scroll" },
            xAxis: axisT,
            yAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } },
            series: stores.map((m) => ({ name: m.label, type: "line", showSymbol: false, data: series(h, (s) => s.machines[m.id]?.content ?? 0) })),
          }} />
        </Card>

        <Card title="Trabajo en proceso por etapa" sub="Ítems instantáneos dentro de cada máquina">
          <Chart height={300} option={{
            grid: { left: 150, right: 16, top: 10, bottom: 24 },
            xAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } },
            yAxis: { type: "category", inverse: true, data: inLine.map((m) => `${m.label} ${m.line}`) },
            series: [{ type: "bar", itemStyle: { color: "#2b59ff", borderRadius: [0, 4, 4, 0] }, data: inLine.map((m) => last.machines[m.id]?.content ?? 0) }],
          }} />
        </Card>
      </div>
    </Page>
  );
}
