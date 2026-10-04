"use client";
import { Chart, axisT, axisV } from "@/components/Chart";
import { Card, Empty, Kpi, Page, PageHead, Tag } from "@/components/Ui";
import { series } from "@/lib/derive";
import type { Snapshot } from "@/lib/types";
import { useHist, useLatest, useStore } from "@/lib/store";

const NOMINAL = 982; // kg/h formadora (manual F26)
const ESTANDAR = 1843; // kg/h estándar línea 3 (Flow/Estuche 80 g)
const KG_CAJA = 5;

export default function Velocidad() {
  const h = useHist();
  const last = useLatest();
  if (!last) return <Page><PageHead title="Velocidad efectiva" sub="Qué tan cerca de su capacidad trabaja cada línea." /><Empty /></Page>;
  const hrs = Math.max(last.t / 3600, 0.01);
  const kg7 = (last.kpi.cajasL7 * KG_CAJA) / hrs, kg8 = (last.kpi.cajasL8 * KG_CAJA) / hrs;
  const pct = (v: number) => `${((v / NOMINAL) * 100).toFixed(0)} %`;
  // kg/h en ventana móvil de ~20 puntos
  const roll = (pick: (s: Snapshot) => number) => h.map((s, i) => {
    const j = Math.max(0, i - 60); const a = h[j];
    const dt = (s.t - a.t) / 3600;
    return [s.t / 3600, dt > 0 ? ((pick(s) - pick(a)) * KG_CAJA) / dt : 0] as [number, number];
  });
  return (
    <Page>
      <PageHead title="Velocidad efectiva" sub="Kilos por hora que salen de cada línea frente a la capacidad de la formadora y al estándar de la línea." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon="gauge" accent="brand" label="Línea 7" value={kg7.toFixed(0)} unit="kg/h" hint={`${pct(kg7)} de la nominal`} />
        <Kpi icon="gauge" accent="violet" label="Línea 8" value={kg8.toFixed(0)} unit="kg/h" hint={`${pct(kg8)} de la nominal`} />
        <Kpi icon="cog" accent="blue" label="Nominal formadora" value={String(NOMINAL)} unit="kg/h" hint="Manual F26" />
        <Kpi icon="bolt" accent="green" label="Estándar de línea" value={String(ESTANDAR)} unit="kg/h" hint="Flow/Estuche 80 g" />
      </div>
      <Card title="Kilos por hora en el tiempo" sub="Ventana móvil de 1 h · líneas de referencia en 982 y 1843 kg/h" right={<Tag kind="real">Referencias del informe</Tag>}>
        <Chart height={320} option={{ legend: { top: 0, right: 0 }, xAxis: axisT, yAxis: axisV, series: [
          { name: "Línea 7", type: "line", showSymbol: false, data: roll((s) => s.kpi.cajasL7) },
          { name: "Línea 8", type: "line", showSymbol: false, data: roll((s) => s.kpi.cajasL8) },
          { name: "Nominal", type: "line", showSymbol: false, lineStyle: { type: "dashed", color: "#8b97a8" }, data: series(h, () => NOMINAL) },
          { name: "Estándar", type: "line", showSymbol: false, lineStyle: { type: "dashed", color: "#16a37f" }, data: series(h, () => ESTANDAR) },
        ] }} />
      </Card>
      <p className="mt-3 max-w-[75ch] text-[12px] text-muted">El informe señala que la brecha entre 982 (nominal de la formadora, no de un operario) y 1843 kg/h (estándar) debe conciliarse en planta.</p>
    </Page>
  );
}
