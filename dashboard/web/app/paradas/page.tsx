"use client";
import { Chart } from "@/components/Chart";
import { Card, Empty, Page, PageHead, Tag, Table } from "@/components/Ui";
import { ValidacionE1, ParosSimulados } from "@/components/E1";
import { MACHINES } from "@/lib/layout";
import { utilization } from "@/lib/derive";
import { useHist, useLatest } from "@/lib/store";

// Tablero Sep–Oct 2026: 12.610 min, 1.267 eventos válidos de 1.278 filas (11 vacíos).
// SUPUESTO declarado (FITTING §B): operación continua 3 turnos 33d Sep01-Oct03 → 33*24*60=47520 min; MTBF=47520/eventos por equipo.
// MTTR lognormal por equipo (ET6 p.12; estadística/tab paros: lognormal D=0,1399 mejor que exponencial D=0,2097, ambas rechazadas n=1267 por cola pesada máx 987min).
// EST/BL combinado 121ev/2081min MTBF 392.7; APS/CTA 96ev/740min MTBF 495.0.
const PARETO_DATA = [
  { eq: "Formadoras (FOR)", min: 3812, eventos: 364, mttr: 10.5, mtbf: 130.5, pct: 30.2 },
  { eq: "Estuchadoras (EST/BL)", min: 2081, eventos: 121, mttr: 17.2, mtbf: 392.7, pct: 16.5 },
  { eq: "Flowpack (FLW)", min: 1969, eventos: 295, mttr: 6.7, mtbf: 161.1, pct: 15.6 },
  { eq: "Túneles de Frío (TUN)", min: 1065, eventos: 107, mttr: 10.0, mtbf: 444.1, pct: 8.4 },
  { eq: "Cintas / Alim. (APS/CTA)", min: 740, eventos: 96, mttr: 7.7, mtbf: 495.0, pct: 5.9 },
  { eq: "Picadoras (PIC)", min: 609, eventos: 54, mttr: 11.3, mtbf: 880.0, pct: 4.8 },
  { eq: "Servicios y Otros", min: 2334, eventos: 230, mttr: 10.1, mtbf: 206.6, pct: 18.5 },
];

const totalMin = PARETO_DATA.reduce((acc, item) => acc + item.min, 0);
let runningSum = 0;
const cumPcts = PARETO_DATA.map((item) => {
  runningSum += item.min;
  return +((runningSum / totalMin) * 100).toFixed(1);
});

const TABLERO_L3 = [
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
      <PageHead title="Paradas y tiempo perdido" sub="Dónde se pierde tiempo: Diagrama de Pareto de paradas no programadas, MTBF/MTTR y bloqueos en simulación." />

      {/* Gráfico 1: Diagrama de Pareto — exploratorio web, no criterio de cátedra */}
      <Card title="Diagrama de Pareto de Paradas No Programadas — exploratorio web" sub="Ordenamiento descriptivo tablero Sep–Oct 2026, 12.610 min. No es criterio de cátedra: validación según ET6 §5 (p.34-38)." right={<><Tag kind="real">Tablero Planta</Tag><Tag kind="supuesto">Exploratorio web</Tag></>}>
        <Chart
          height={340}
          option={{
            legend: { top: 0, right: 16 },
            grid: { left: 55, right: 55, top: 36, bottom: 48 },
            tooltip: {
              trigger: "axis",
              formatter: (params: unknown) => {
                const arr = Array.isArray(params) ? params : [params];
                const bar = arr.find((p: { seriesType: string }) => p.seriesType === "bar");
                const line = arr.find((p: { seriesType: string }) => p.seriesType === "line");
                const item = PARETO_DATA[bar?.dataIndex ?? 0];
                return `<div style="font-weight:700;margin-bottom:4px;">${item?.eq}</div>
                  <div>Tiempo total: <b>${item?.min.toLocaleString("es-AR")} min</b> (${item?.pct}%)</div>
                  <div>Acumulado: <b>${line?.data}%</b></div>
                  <div>Fallas registradas: <b>${item?.eventos}</b></div>
                  <div>MTTR promedio: <b>${item?.mttr} min</b></div>
                  <div>MTBF estimado: <b>${item?.mtbf} min</b></div>`;
              },
            },
            xAxis: {
              type: "category",
              data: PARETO_DATA.map((d) => d.eq),
              axisLabel: { interval: 0, rotate: 18, fontSize: 11, color: "#5a6b82" },
            },
            yAxis: [
              {
                type: "value",
                name: "Tiempo parado [min]",
                nameTextStyle: { color: "#8b97a8" },
                splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } },
              },
              {
                type: "value",
                name: "% acumulado [%]",
                nameTextStyle: { color: "#8b97a8" },
                min: 0,
                max: 100,
                axisLabel: { formatter: "{value} %" },
                splitLine: { show: false },
              },
            ],
            series: [
              {
                name: "Minutos de paro",
                type: "bar",
                itemStyle: { color: "#d9293b", borderRadius: [4, 4, 0, 0] },
                data: PARETO_DATA.map((d) => d.min),
              },
              {
                name: "% Acumulado",
                type: "line",
                yAxisIndex: 1,
                showSymbol: true,
                symbolSize: 8,
                itemStyle: { color: "#2b59ff" },
                lineStyle: { width: 3, color: "#2b59ff" },
                data: cumPcts,
                markLine: {
                  silent: true,
                  symbol: "none",
                  lineStyle: { type: "dashed", color: "#e08a1e", width: 2 },
                  data: [{ yAxis: 80, label: { formatter: "80% ref. visual (no criterio)", position: "insideEndTop" } }],
                },
              },
            ],
          }}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3 text-[12px] text-muted">
          <span><b>Lectura exploratoria (no 80/20):</b> orden descriptivo; el 70,8% en 4 equipos (FOR/EST-FLW/TUN) es solo visual — «Servicios y Otros» excluida del ranking. No reemplaza validación ET6 §5.2-5.5 ni prueba de hipótesis.</span>
          <span className="font-semibold text-ink">Total Planta: 12.610 min (1.267 eventos válidos de 1.278 filas)</span>
        </div>
      </Card>

      {/* Tabla detallada de Confiabilidad y MTBF / MTTR */}
      <Card className="mt-4" title="Indicadores de Confiabilidad por Estación (MTBF y MTTR)" sub="Ajustes empíricos y lognormales para calibración de FlexSim">
        <Table maxH={300} head={[{ label: "Estación / Máquina" }, { label: "Fallas (n)", right: true }, { label: "Minutos Parado", right: true }, { label: "MTTR (Reparación)", right: true }, { label: "MTBF (Entre Fallas)", right: true }, { label: "% del Tiempo Parado", right: true }]}>
          {PARETO_DATA.map((row) => (
            <tr key={row.eq}>
              <td className="first font-semibold">{row.eq}</td>
              <td className="num">{row.eventos}</td>
              <td className="num">{row.min.toLocaleString()} min</td>
              <td className="num font-bold text-brand">{row.mttr} min</td>
              <td className="num font-semibold">{row.mtbf} min</td>
              <td className="num">{row.pct} %</td>
            </tr>
          ))}
        </Table>
        <p className="mt-2 text-[12px] text-muted">MTBF bajo supuesto 3 turnos continuo (47520/eventos). Si el régimen real no fue continuo, recalcular ventana. MTTR a FlexSim como lognormal por equipo (ET6 p.12,22).</p>
      </Card>

      <ValidacionE1 />
      <ParosSimulados />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Comparativa Línea 3 vs. Total Planta" sub="Concentración de fallas en la línea piloto de estuche" right={<Tag kind="real" />}>
          <Chart height={280} option={{
            legend: { top: 0, right: 0 }, grid: { left: 120, right: 16, top: 30, bottom: 24 },
            xAxis: { type: "value", splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } },
            yAxis: { type: "category", inverse: true, data: TABLERO_L3.map((t) => t.eq) },
            series: [
              { name: "Línea 3", type: "bar", itemStyle: { color: "#2b59ff" }, data: TABLERO_L3.map((t) => t.l3) },
              { name: "Planta Total", type: "bar", itemStyle: { color: "#d9293b" }, data: TABLERO_L3.map((t) => t.planta) },
            ],
          }} />
          <p className="mt-2 text-[12px] text-muted">L3 total 1.324 min (FITTING §B). Gráfico: 5 equipos = 1.026 min (412+338+147+79+50); resto 298 min no graficado —incl. APS 13ev/155min—. Barra EST = solo EST (26ev/338min); EST BL L3 (1ev/60min) excluido del gráfico. Pareto planta combina EST+EST BL = 121ev/2.081min.</p>
        </Card>

        <Card title="Pérdidas por Espera y Bloqueo en Simulación" sub="Máquinas con mayor inactividad por desbalance o falta de material" right={<Tag kind="supuesto">Dinámico</Tag>}>
          {!last ? <Empty /> : (
            <Chart height={280} option={{
              legend: { top: 0, right: 0 }, grid: { left: 140, right: 16, top: 30, bottom: 24 },
              xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value} %" }, splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } },
              yAxis: { type: "category", inverse: true, data: rows.slice(0, 6).map((r) => `${r.m.label} ${r.m.line}`) },
              series: [
                { name: "Bloqueada", type: "bar", stack: "t", itemStyle: { color: "#e08a1e" }, data: rows.slice(0, 6).map((r) => +(r.u.blocked * 100).toFixed(1)) },
                { name: "Sin material", type: "bar", stack: "t", itemStyle: { color: "#d6a21a" }, data: rows.slice(0, 6).map((r) => +(r.u.starved * 100).toFixed(1)) },
              ],
            }} />
          )}
          <p className="mt-2 text-[12px] text-muted">El bloqueo aguas arriba de la formadora evidencia el cuello de botella del sistema.</p>
        </Card>
      </div>
    </Page>
  );
}
