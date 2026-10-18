"use client";
import { useMemo, useState } from "react";
import { Chart, axisTiempoH } from "@/components/Chart";
import { Card, Empty, Kpi, Page, PageHead, Tag, Table } from "@/components/Ui";
import { MACHINES } from "@/lib/layout";
import { series, busyOf, nOf, qOf, timeAverages, lambdaArrivals, WARMUP_H } from "@/lib/derive";
import { littleCheck } from "@/lib/stats";
import { formatES } from "@/lib/format";
import { useHist, useLatest, useStore } from "@/lib/store";

const FOCUS_OPTS = ["FormA_L7", "FormB_L7", "Tunel_L7", "EnvA_L7", "Desencajado_L7", "FormA_L8"];

export default function Colas() {
  const h = useHist();
  const last = useLatest();
  const stores = MACHINES.filter((m) => m.kind === "store");
  const line = useStore((s) => s.line);
  const inLine = MACHINES.filter((m) => m.kind === "machine" && (line === "Todas" || m.line === line));
  const [focus, setFocus] = useState("FormA_L7");

  const avg = useMemo(() => (h.length > 1 ? timeAverages(h, focus) : null), [h, focus]);
  const lambda = useMemo(() => lambdaArrivals(h, focus), [h, focus]);
  const little = useMemo(() => {
    if (!avg || avg.T <= 0) return null;
    // W por vía clientes: sin log por cliente en el puente, se estima W=L/λ solo como referencia (no verifica, ET5 p.15).
    const Wref = lambda > 0 ? avg.L / lambda / 3600 : 0;
    return { ...littleCheck(avg.L, lambda * 3600, Wref), Wref, note: true };
  }, [avg, lambda]);

  if (!last) return <Page><PageHead title="Colas y trabajo en proceso" sub="Cuánto material está esperando y dónde se acumula." /><Empty /></Page>;

  const wip = inLine.reduce((a, m) => a + (last.machines[m.id]?.content ?? 0), 0);
  const peakQ = Math.max(0, ...stores.map((m) => last.machines[m.id]?.content ?? 0));

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
        sub="WIP instantáneo en cajas (eje izq.) vs. pallets PT acumulados desde inicio de corrida (eje der.). Doble escala: no comparar magnitudes. WIP filtra por línea; Pallets PT es total planta."
        right={<Tag kind="supuesto">Dinámica de Línea</Tag>}
      >
        <Chart
          height={320}
          option={{
            legend: { top: 0, right: 16 },
            grid: { left: 55, right: 60, top: 36, bottom: 28 },
            xAxis: axisTiempoH,
            yAxis: [
              {
                type: "value",
                name: "WIP [cajas]",
                nameTextStyle: { color: "#8b97a8" },
                splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } },
              },
              {
                type: "value",
                name: "PT acumulado [pallets]",
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
            xAxis: axisTiempoH,
            yAxis: { type: "value", name: "Pallets [n]", splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } },
            series: stores.map((m) => ({ name: m.label, type: "line", showSymbol: false, data: series(h, (s) => s.machines[m.id]?.content ?? 0) })),
          }} />
        </Card>

        <Card title="Trabajo en proceso por etapa" sub="Ítems instantáneos dentro de cada máquina">
          <Chart height={300} option={{
            grid: { left: 150, right: 16, top: 10, bottom: 24 },
            xAxis: { type: "value", name: "WIP [cajas]", splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } },
            yAxis: { type: "category", inverse: true, data: inLine.map((m) => `${m.label} ${m.line}`) },
            series: [{ type: "bar", itemStyle: { color: "#2b59ff", borderRadius: [0, 4, 4, 0] }, data: inLine.map((m) => last.machines[m.id]?.content ?? 0) }],
          }} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Sistema analizado: Formadora A" sub="G/G/1/∞/∞/FIFO — ET5 p.6-7 (omitir K/N/D ⇒ ∞/∞/FIFO)" right={<Tag kind="supuesto">G/G/1/∞/∞/FIFO · FIFO</Tag>}>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {FOCUS_OPTS.map((id) => (
              <button key={id} onClick={() => setFocus(id)} className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${focus === id ? "bg-ink text-white" : "bg-[#eef3fb] text-muted hover:text-ink"}`}>{id}</button>
            ))}
          </div>
          <p className="text-[12px] leading-relaxed text-muted">A=G: IAT empírico por ráfagas (ET2, K-S rechaza M) · B=G: servicio con fallas lognormal · c=1 · K=∞ · N=∞ · D=FIFO no expropiativa. N=Q+B instante a instante ⇒ L=Lq+ρ (ET5 p.12-13).</p>
        </Card>
        <Card title={`N(t), Q(t), B(t) — ${focus}`} sub="Escalonadas, mismo Tiempo [h] (ET5 p.12-13). Sombreado previo a 2,5 h excluido de promedios." right={<Tag kind="supuesto">Q derivada: N−B</Tag>}>
          <Chart height={280} option={{
            legend: { top: 0, right: 0 },
            grid: { left: 45, right: 45, top: 30, bottom: 28 },
            xAxis: axisTiempoH,
            yAxis: [{ type: "value", name: "Clientes [n]" }, { type: "value", name: "B", min: 0, max: 1, splitLine: { show: false } }],
            series: [
              { name: "N(t)", type: "line", step: "middle", showSymbol: false, data: series(h, (s) => nOf(s, focus)) },
              { name: "Q(t)", type: "line", step: "middle", showSymbol: false, data: series(h, (s) => qOf(s, focus)) },
              { name: "B(t)", type: "line", step: "middle", showSymbol: false, yAxisIndex: 1, data: series(h, (s) => busyOf(s, focus)), markLine: { silent: true, symbol: "none", data: [{ xAxis: WARMUP_H, label: { formatter: "Fin warm-up" } }] } },
            ],
          }} />
          <p className="mt-2 text-[12px] text-muted">Q derivada como N−B (el puente no emite cola explícita; riguroso: FlexSim debe emitir queue_{"{id}"} y leer Q, no derivarla).</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title={`Áreas y promedios temporales — ${focus}`} sub={`Solo t≥${WARMUP_H} h (ET5 p.12). T_eff=${avg ? formatES(avg.T / 3600, 2) : "—"} h`}>
          {!avg ? <Empty /> : (
            <Table head={[{ label: "Función" }, { label: "Área", right: true }, { label: "Promedio", right: true }]}>
              <tr><td className="first">B(t) → ρ</td><td className="num">{formatES(avg.AB / 3600, 2)}</td><td className="num">ρ={formatES(avg.rho * 100, 1)} %</td></tr>
              <tr><td className="first">Q(t) → Lq</td><td className="num">{formatES(avg.AQ / 3600, 2)}</td><td className="num">Lq={formatES(avg.Lq, 2)}</td></tr>
              <tr><td className="first">N(t) → L</td><td className="num">{formatES(avg.AN / 3600, 2)}</td><td className="num">L={formatES(avg.L, 2)}</td></tr>
            </Table>
          )}
          <p className="mt-2 text-[12px] text-muted">Control: |L−(Lq+ρ)|={avg ? formatES(avg.check_L, 4) : "—"} (debe →0; si no cierra, hay error en gráficos/estadísticos, ET5 p.12-13).</p>
        </Card>
        <Card title="Chequeo Ley de Little" sub="L=λW, Lq=λWq por dos vías independientes (ET5 p.15)" right={<Tag kind="sinCorrida">W clientes pendiente</Tag>}>
          {!avg || !little ? <Empty /> : (
            <>
              <p className="text-[13px]">λ={formatES(lambda * 3600, 2)} ítems/h (vía arribos t≥warm-up) · L={formatES(avg.L, 2)} (vía áreas)</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">W por vía clientes pendiente (el puente no trae log por cliente): W_ref=L/λ={formatES(little.Wref, 3)} h solo referencial. No se muestra como verificado: si Lq=sumaEsperas/T, cierra por álgebra y no prueba nada (ET5 p.15). Requiere tabla de permanencias por caja/pallet o CSV.</p>
            </>
          )}
        </Card>
      </div>
    </Page>
  );
}
