"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Chart, axisT, axisV } from "@/components/Chart";
import { Card, Empty, Page, PageHead, Tag } from "@/components/Ui";
import { MACHINES, STATE_COLOR } from "@/lib/layout";
import { utilization } from "@/lib/derive";
import { useHist, useLatest, useStore } from "@/lib/store";

const WARMUP_H = 2.5; // informe: estado estable desde 2,5 h
const META_PLANTA_PAL_H = 3; // 36 pallets/día por línea, para dos líneas

const MACHINE_STATES = [
  { key: "proc", label: "Procesando", color: STATE_COLOR.proc },
  { key: "blocked", label: "Bloqueada", color: STATE_COLOR.blocked },
  { key: "starved", label: "Sin material", color: STATE_COLOR.starved },
  { key: "down", label: "En falla", color: STATE_COLOR.down },
  { key: "idle", label: "Inactiva", color: STATE_COLOR.idle },
] as const;

// Datos de ajuste y bondad de ajuste (Chi² y K-S, FITTING_EVIDENCIA.md)
const FITTING_TABS = {
  iat: {
    label: "Arribos MP (IAT)",
    sub: "Frecuencia de tiempo entre arribos de camiones de carne (minutos)",
    categories: ["0–1 min", "1–2 min", "2–3 min", "3–5 min", "5–10 min", ">10 min"],
    obs: [24, 21, 1, 0, 1, 2],
    teo: [15.5, 10.6, 7.2, 7.8, 5.1, 2.8],
    ks: "D = 0,4126 > Dcrit = 0,1943 (RECHAZADA)",
    metric: "n = 49 · Media 2,62 min · Mediana 1,03 min · CV = 3,42",
    concl: "Rechazo de exponencial por K-S: los camiones llegan en ráfagas u oleadas matutinas (el 92% en < 2 min). Se calibra con tabla empírica horaria.",
  },
  paros: {
    label: "Duración de Paradas",
    sub: "Frecuencia de duración de paradas no programadas (minutos)",
    categories: ["0–5 min", "5–10 min", "10–15 min", "15–20 min", "20–30 min", ">30 min"],
    obs: [742, 310, 115, 45, 35, 20],
    teo: [508, 304, 182, 109, 98, 66],
    ks: "D = 0,1399 > Dcrit = 0,0382 (RECHAZADA)",
    metric: "n = 1.267 · Media 10,0 min · Mediana 6,0 min",
    concl: "Rechazo de exponencial y lognormal por cola pesada. Predominio masivo de microparadas cortas (< 5 min) con eventos esporádicos de desarme mecánico.",
  },
  pesos: {
    label: "Pesos Pallet PT",
    sub: "Distribución de peso neto por pallet final de producto terminado (kg)",
    categories: ["<600 kg", "600–700", "700–800", "800–900", "900–1000", ">1000 kg"],
    obs: [15, 28, 95, 235, 92, 35],
    teo: [21, 57, 122, 154, 103, 43],
    ks: "D = 0,1460 > Dcrit = 0,0608 (RECHAZADA)",
    metric: "n = 500 · Media 862,5 kg · Desv. Est. 153,4 kg",
    concl: "Rechazo de distribución normal univariada por mezcla de SKUs: bimodalidad entre formatos de 35-45 cajas vs. estándar SUP de 144 cajas de 5 kg.",
  },
};

// Perfil de utilización por estación para diagnóstico del cuello de botella
const BOTTLENECK_STAGES = [
  { stage: "Desencajado Mesada", util: 68, rate: "3.500 s / pallet", bottleneck: false },
  { stage: "Picadora Weiler", util: 52, rate: "900 s / batch (6 t/h)", bottleneck: false },
  { stage: "Mezcladoras Ribbon", util: 58, rate: "1.200 s / batch", bottleneck: false },
  { stage: "Formadora F26 / F19", util: 89, rate: "18,33 s / caja (982 kg/h)", bottleneck: true },
  { stage: "Túnel de Congelado", util: 64, rate: "300 s / batch (cap. 60)", bottleneck: false },
  { stage: "Envasadora Fripack", util: 44, rate: "4,0 s / caja (150 paq/min)", bottleneck: false },
  { stage: "Robot Estibador", util: 38, rate: "144 cajas / pal (60 s)", bottleneck: false },
];

function ChartGuide({ title, shows, watch }: { title: string; shows: string; watch: string }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Qué muestra y qué mirar: ${title}`}
        className="shrink-0 rounded-full bg-[#eef3fb] px-3 py-1.5 text-[11px] font-bold text-ink transition hover:bg-[#e1e9f5]"
      >
        ¿Qué mirar?
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => { event.preventDefault(); setOpen(false); }}
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus();
        }}
        onClick={(event) => { if (event.target === dialogRef.current) setOpen(false); }}
        className="fixed inset-0 m-auto max-h-[min(80dvh,560px)] w-[min(92vw,480px)] rounded-3xl border border-white bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand">Guía del gráfico</p>
              <h2 id={titleId} className="mt-1 text-[20px] font-extrabold tracking-tight">{title}</h2>
            </div>
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              aria-label="Cerrar explicación"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eef3fb] text-lg font-bold hover:bg-[#e1e9f5]"
            >
              ×
            </button>
          </div>
          <div className="mt-5 space-y-4 text-[14px] leading-relaxed">
            <p><b>Qué muestra:</b> {shows}</p>
            <p><b>Qué mirar:</b> {watch}</p>
          </div>
        </div>
      </dialog>
    </>
  );
}

export default function Metricas() {
  const h = useHist();
  const last = useLatest();
  const line = useStore((s) => s.line);
  const [tabFit, setTabFit] = useState<keyof typeof FITTING_TABS>("iat");

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
  const machines = MACHINES
    .filter((m) => m.kind === "machine" && (line === "Todas" || m.line === line))
    .map((m) => ({ ...m, states: utilization(h, m.id) }))
    .sort((a, b) => b.states.proc - a.states.proc);

  const curFit = FITTING_TABS[tabFit];
  const palletComparison = [
    { name: "Pallets MP recibidos", data: h.map((s) => [s.t / 3600, s.kpi.palletsMP] as [number, number]) },
    { name: "Pallets PT producidos", data: h.map((s) => [s.t / 3600, s.kpi.palletsPT] as [number, number]) },
  ];

  return (
    <Page>
      <PageHead title="Métricas y estadísticas del problema" sub="Validación estadística de entrada (tests K-S), warm-up, perfil de cuello de botella y utilización de equipos." />
      {!last ? <Empty /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Gráfico 2: Histograma y Ajustes de Bondad (K-S) */}
          <Card
            className="lg:col-span-2"
            title="Histogramas y Ajuste de Bondad Kolmogorov-Smirnov (Datos Reales)"
            sub={curFit.sub}
            right={
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex gap-1.5 rounded-xl bg-[#eef3fb] p-1">
                  {(Object.keys(FITTING_TABS) as (keyof typeof FITTING_TABS)[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => setTabFit(k)}
                      className={`rounded-lg px-2.5 py-1 text-[12px] font-bold transition ${tabFit === k ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
                    >
                      {FITTING_TABS[k].label}
                    </button>
                  ))}
                </div>
                <ChartGuide
                  title={curFit.label}
                  shows={`${curFit.sub}. Las barras representan las frecuencias observadas y la línea roja el ajuste teórico esperado.`}
                  watch={curFit.concl}
                />
              </div>
            }
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f8fafc] px-3 py-2 text-[12px]">
              <span className="font-semibold text-ink">{curFit.metric}</span>
              <span className="rounded-md bg-red-50 px-2 py-0.5 font-bold text-brand">{curFit.ks}</span>
            </div>
            <Chart
              height={300}
              option={{
                legend: { top: 0, right: 16 },
                grid: { left: 45, right: 16, top: 32, bottom: 28 },
                xAxis: {
                  type: "category",
                  data: curFit.categories,
                  axisLabel: { color: "#5a6b82", fontSize: 11 },
                },
                yAxis: {
                  type: "value",
                  name: "Frecuencia",
                  splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } },
                },
                series: [
                  {
                    name: "Frecuencia Observada (Planta)",
                    type: "bar",
                    barWidth: "40%",
                    itemStyle: { color: "#2b59ff", borderRadius: [4, 4, 0, 0] },
                    data: curFit.obs,
                  },
                  {
                    name: "Ajuste Teórico (Esperado)",
                    type: "line",
                    smooth: true,
                    showSymbol: true,
                    symbolSize: 7,
                    itemStyle: { color: "#d9293b" },
                    lineStyle: { width: 3, color: "#d9293b" },
                    data: curFit.teo,
                  },
                ],
              }}
            />
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              <b>Diagnóstico estadístico:</b> {curFit.concl}
            </p>
          </Card>

          {/* Gráfico 3: Perfil de Utilización y Cuello de Botella */}
          <Card
            className="lg:col-span-2"
            title="Perfil de Utilización Comparativa por Estación (Diagnóstico del Cuello de Botella)"
            sub="Porcentaje de tiempo efectivo de procesamiento a lo largo de la línea productiva"
            right={<div className="flex items-center gap-2"><Tag kind="real">Restricción de Flujo</Tag><ChartGuide title="Utilización comparativa por estación" shows="Compara el porcentaje de tiempo efectivo de procesamiento de las etapas productivas." watch="La etapa con utilización más alta se acerca a su capacidad y puede limitar el ritmo de toda la línea. También observá las estaciones con menor uso: podrían estar esperando producto del cuello de botella." /></div>}
          >
            <Chart
              height={260}
              option={{
                grid: { left: 160, right: 40, top: 20, bottom: 24 },
                xAxis: {
                  type: "value",
                  max: 100,
                  axisLabel: { formatter: "{value} %" },
                  splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } },
                },
                yAxis: {
                  type: "category",
                  inverse: true,
                  data: BOTTLENECK_STAGES.map((s) => s.stage),
                  axisLabel: { color: "#0f1b2d", fontWeight: "bold", fontSize: 12 },
                },
                series: [
                  {
                    name: "Utilización",
                    type: "bar",
                    barWidth: "55%",
                    itemStyle: {
                      color: (params: { dataIndex: number }) => {
                        return BOTTLENECK_STAGES[params.dataIndex].bottleneck ? "#d9293b" : "#2b59ff";
                      },
                      borderRadius: [0, 4, 4, 0],
                    },
                    label: {
                      show: true,
                      position: "right",
                      formatter: (p: { dataIndex: number; value: unknown }) => {
                        const st = BOTTLENECK_STAGES[p.dataIndex];
                        return st.bottleneck ? `${p.value}% (CUELLO DE BOTELLA)` : `${p.value}%`;
                      },
                      fontWeight: "bold",
                      fontSize: 11,
                      color: "#0f1b2d",
                    },
                    data: BOTTLENECK_STAGES.map((s) => s.util),
                  },
                ],
              }}
            />
            <div className="mt-2 rounded-xl bg-amber-50/70 p-3 text-[12px] leading-relaxed text-[#8a520a]">
              <b>Efecto Restricción:</b> La <b>Formadora F26</b> opera con una utilización promedio del <b>89%</b> (982 kg/h nominales), dictando el throughput máximo posible del sistema. Las etapas aguas arriba (mezcladoras y picadora) sufren bloqueos periódicos por contrapresión al llenarse los pulmones, mientras que el envasado y robot estibador operan con capacidad ociosa (44% y 38%), desabastecidos de material.
            </div>
          </Card>

          {/* Calentamiento y Steady State */}
          <Card title="Período de Calentamiento (Warm-up)" sub="Pallets PT por hora, promedio móvil de 10 muestras (Estilo Welch)" right={<div className="flex items-center gap-2"><Tag kind="supuesto">Warm-up: 2,5 h</Tag><ChartGuide title="Período de calentamiento" shows="El ritmo de producción de pallets terminados por hora: la línea tenue es la tasa entre muestras y la marcada es su promedio móvil de 10 muestras." watch="La línea vertical marca el fin del warm-up estimado en 2,5 horas y la horizontal, la meta de 3 pallets por hora para ambas líneas. Observá si el ritmo se estabiliza y se acerca a la meta después del calentamiento." /></div>}>
            <Chart option={{ legend: { top: 0, right: 0 }, xAxis: axisT, yAxis: axisV, series: [
              { name: "Instantáneo", type: "line", showSymbol: false, lineStyle: { opacity: 0.35 }, data: raw },
              { name: "Suavizado", type: "line", showSymbol: false, lineStyle: { width: 3 }, data: smooth,
                markLine: { silent: true, symbol: "none", data: [
                  { xAxis: WARMUP_H, name: "Fin de warm-up", label: { formatter: "Fin de warm-up (2,5 h)" }, lineStyle: { color: "#d9293b", width: 2 } },
                  { yAxis: META_PLANTA_PAL_H, name: "Meta planta", label: { formatter: "Meta (3 pal/h)" }, lineStyle: { color: "#16a37f", width: 2 } },
                ] } },
            ] }} />
            <p className="text-[12px] text-muted">A partir de las 2,5 h la planta entra en régimen estable (3 pallets/h combinando ambas líneas).</p>
          </Card>

          <Card title="Pallets recibidos y terminados" sub="Acumulado durante la corrida" right={<ChartGuide title="Pallets recibidos y terminados" shows="Compara la cantidad acumulada de pallets de materia prima recibidos con los pallets de producto terminado." watch="La separación entre líneas ayuda a detectar acumulación o retraso entre recepción y salida. Es una comparación de conteos, no un balance exacto de masa: los tamaños y pesos de los pallets pueden diferir." />}>
            <Chart option={{ legend: { top: 0, right: 0 }, xAxis: axisT, yAxis: axisV, series: palletComparison.map((item) => ({
              name: item.name,
              type: "line",
              showSymbol: false,
              areaStyle: item.name === "Pallets PT producidos" ? { opacity: 0.1 } : undefined,
              data: item.data,
            })) }} />
          </Card>

          <Card title="Intervalo de Confianza del 95 %" sub="Throughput esperado por réplica (E.T.6)" right={<Tag kind="sinCorrida" />}>
            <p className="text-[14px] leading-relaxed text-muted">
              Requiere la ejecución de 10 réplicas independientes con números aleatorios comunes en el Experimenter de FlexSim. El objetivo del informe es acotar el semiancho del intervalo al <i>h ≤ 2%</i> de la media muestral para validar la precisión del estimador.
            </p>
          </Card>

          {/* Uso detallado de máquinas en simulación */}
          <Card className="lg:col-span-2" title="Distribución de Estados en Simulación" sub={`Porcentaje de tiempo por estado operativo · ${line === "Todas" ? "Todas las líneas" : `Línea ${line.slice(1)}`}`} right={<ChartGuide title="Distribución de estados en simulación" shows="Para cada máquina, indica qué porcentaje de las muestras estuvo procesando, bloqueada, sin material, en falla o inactiva." watch="Compará el tiempo procesando con las esperas: mucho bloqueo puede señalar una limitación aguas abajo; mucha falta de material, un problema de abastecimiento. Los porcentajes se calculan con las muestras disponibles de esta corrida." />}>
            <Chart height={Math.max(300, machines.length * 26)} option={{
              legend: { top: 0, type: "scroll" },
              grid: { left: 150, right: 20, top: 36, bottom: 28 },
              xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value} %" }, splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } },
              yAxis: { type: "category", inverse: true, data: machines.map((m) => `${m.label} · ${m.line === "Común" ? "Común" : `L${m.line.slice(1)}`}`) },
              series: MACHINE_STATES.map((state) => ({
                name: state.label,
                type: "bar",
                stack: "estado",
                itemStyle: { color: state.color },
                data: machines.map((m) => +(m.states[state.key] * 100).toFixed(1)),
              })),
            }} />
            <p className="mt-2 text-[12px] text-muted">Refleja la proporción de estados muestreados en tiempo real desde FlexSim o el simulador de demo.</p>
          </Card>
        </div>
      )}
    </Page>
  );
}
