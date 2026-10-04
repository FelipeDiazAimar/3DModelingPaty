"use client";
import { Chart, axisT, axisV } from "@/components/Chart";
import { Card, Empty, Page, PageHead, Tag } from "@/components/Ui";
import { useHist, useLatest, useStore } from "@/lib/store";

const WARMUP_H = 2.5; // informe: estado estable desde 2,5 h

export default function Estadistica() {
  const h = useHist();
  const last = useLatest();
  // pallets PT por hora entre muestras, suavizado con promedio móvil (estilo Welch, ventana 10)
  const raw = h.map((s, i) => {
    const a = h[Math.max(0, i - 1)]; const dt = (s.t - a.t) / 3600;
    return [s.t / 3600, dt > 0 ? (s.kpi.palletsPT - a.kpi.palletsPT) / dt : 0] as [number, number];
  });
  const w = 10;
  const smooth = raw.map(([t], i) => {
    const sl = raw.slice(Math.max(0, i - w + 1), i + 1);
    return [t, sl.reduce((a, b) => a + b[1], 0) / sl.length] as [number, number];
  });
  return (
    <Page>
      <PageHead title="Estadística de la simulación" sub="Lo que pide la cátedra: período de calentamiento, intervalos de confianza y ajuste de distribuciones." />
      {!last ? <Empty /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Período de calentamiento" sub="Pallets PT por hora, promedio móvil de 10 muestras" right={<Tag kind="supuesto">Warm-up del informe: 2,5 h</Tag>}>
            <Chart option={{ legend: { top: 0, right: 0 }, xAxis: axisT, yAxis: axisV, series: [
              { name: "Instantáneo", type: "line", showSymbol: false, lineStyle: { opacity: 0.35 }, data: raw },
              { name: "Suavizado", type: "line", showSymbol: false, lineStyle: { width: 3 }, data: smooth,
                markLine: { silent: true, symbol: "none", data: [{ xAxis: WARMUP_H, label: { formatter: "Fin de warm-up" } }], lineStyle: { type: "dashed", color: "#d9293b" } } },
            ] }} />
          </Card>
          <Card title="Intervalo de confianza del 95 %" sub="Throughput por réplica" right={<Tag kind="sinCorrida" />}>
            <p className="text-[14px] leading-relaxed text-muted">Necesita 10 réplicas independientes con semillas distintas por escenario. Cuando se corran con el Experimenter de FlexSim, acá aparecen las barras con el semiancho h (objetivo ≤ 2 % del promedio).</p>
          </Card>
          <Card title="Histogramas y ajuste K-S" sub="Llegadas de MP, duración de paros y peso de pallets PT" right={<Tag kind="real">Ajustes del tablero</Tag>}>
            <ul className="space-y-2 text-[13px]">
              <li className="flex justify-between gap-3"><span className="text-muted">Llegadas de MP · exponencial rechazada</span><b className="tnum">D = 0,41 &gt; 0,19</b></li>
              <li className="flex justify-between gap-3"><span className="text-muted">Duración de paros · lognormal rechazada</span><b className="tnum">D = 0,14 &gt; 0,038</b></li>
              <li className="flex justify-between gap-3"><span className="text-muted">Peso del pallet PT · normal rechazada</span><b className="tnum">D = 0,146 &gt; 0,061</b></li>
            </ul>
            <p className="mt-3 text-[12px] text-muted">En los tres casos se usan tablas empíricas, no distribuciones teóricas.</p>
          </Card>
        </div>
      )}
    </Page>
  );
}
