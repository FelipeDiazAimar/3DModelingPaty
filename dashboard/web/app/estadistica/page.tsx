"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Chart, axisT, axisV } from "@/components/Chart";
import { Card, Empty, Page, PageHead, Tag, Table } from "@/components/Ui";
import { MACHINES, STATE_COLOR } from "@/lib/layout";
import { utilization } from "@/lib/derive";
import { useHist, useLatest, useStore } from "@/lib/store";
import { ecdf, boxplotStats, chi2Table, ksTable, expCDF, phi } from "@/lib/stats";
import { formatES } from "@/lib/format";

const WARMUP_H = 2.5; // informe: estado estable desde 2,5 h
const META_PLANTA_PAL_H = 3; // 36 pallets/día por línea, para dos líneas

const MACHINE_STATES = [
  { key: "proc", label: "Procesando", color: STATE_COLOR.proc },
  { key: "blocked", label: "Bloqueada", color: STATE_COLOR.blocked },
  { key: "starved", label: "Sin material", color: STATE_COLOR.starved },
  { key: "down", label: "En falla", color: STATE_COLOR.down },
  { key: "idle", label: "Inactiva", color: STATE_COLOR.idle },
] as const;

// Tests estilo cátedra 2026 - E.T. 2 - Teoría.pdf p.15-24 + 2026_-_E_T__6_-_Teoría.pdf p.15-16,21-24 (H0/H1, α=0,05, n/k/p, gl=k-1-p, estadístico vs crítico, decisión no se rechaza/se rechaza).
// Fuente: datos_trazabilidad/FITTING_EVIDENCIA.md §A/B/C + fitting_series/*.csv (IAT n=49 | Paros n=1267 válidos de 1278 filas−11 vacíos | Pesos n=500).
// Chi² exige E≥5 por clase (ET2 p.20 / ET6 p.16): display IAT agrupa cola en ≥5 min (E=7,3); test formal IAT k=8 equiprobables E=6,1 y Pesos k=8 E≥21,7.
// K-S bilateral ET6 p.15 (máx de i/n−F y F−(i−1)/n) vs simplificada ET2 p.24 (solo |i/n−x(i)|, Coss Bu).
const FITTING_TABS = {
  iat: {
    label: "Arribos MP (IAT)",
    sub: "Frecuencia de tiempo entre arribos de camiones de carne (minutos) — display 5 clases E≥5; test formal k=8 equiprobables",
    categories: ["0–1 min", "1–2 min", "2–3 min", "3–5 min", "≥5 min"],
    obs: [24, 21, 1, 0, 3],
    teo: [15.5, 10.6, 7.2, 8.3, 7.3],
    ks: "con α=0,05 se rechaza H0; muestra no compatible; se adopta empírica (K-S D=0,4126 > Dcrit=0,1943)",
    metric: "n = 49 · Media 2,62 min · Mediana 1,03 min · CV = 3,42 · λ̂ = 1/2,62",
    test: "H0: IAT ∼ Exp(λ=1/2,62) vs H1: no exponencial · α=0,05 · Chi² k=8 p=1 gl=6: χ²₀=0,143 < crit 12,592 → no se rechaza H0 (pasa) | K-S bilateral n=49: D=0,4126 > Dcrit=0,1943 (=1,36/√49) → se rechaza H0. Veredicto: exponencial no compatible (CV=3,42≠1, 92% <2 min); prima K-S sin agrupar.",
    concl: "Con α=0,05 se rechaza H0 por K-S; muestra no compatible con exponencial simple (ráfagas/oleadas matutinas, 92% en <2 min). Se adopta empírica horaria (iat_empirica_hora.csv).",
    ficha: "Variable: IAT arribos MP (min) · Fuente: iat_recepcion_min.csv · Período: mañana 2026-10-03 · Descriptivas: n=49 media 2,62 mediana 1,03 CV 3,42 · Candidatas: exponencial λ̂=1/2,62 · Elegida: empírica por hora · Prueba: Chi² k=8 gl=6 + K-S bilateral D=0,4126 vs 0,1943 · Interpretación: ráfagas, no exponencial simple.",
  },
  paros: {
    label: "Duración de Paradas",
    sub: "Frecuencia de duración de paradas no programadas (minutos) — display 6 clases E≥5; K-S no agrupa (ET6 p.15)",
    categories: ["0–5 min", "5–10 min", "10–15 min", "15–20 min", "20–30 min", ">30 min"],
    obs: [587, 438, 107, 46, 43, 46],
    teo: [508, 304, 182, 109, 98, 66],
    ks: "con α=0,05 se rechaza H0 en ambas; muestra no compatible; se adopta empírica/lognormal por equipo (lognormal D=0,1399 / exp D=0,2097 > Dcrit=0,0382)",
    metric: "n = 1.267 válidos (1.278 filas−11 vacíos) · Media 10,0 min · Mediana 6,0 min",
    test: "H0: paros ∼ Lognormal vs H1: no lognormal (y H0′: ∼Exp media 10) · α=0,05 · K-S bilateral n=1267: Dlog=0,1399 > Dcrit=0,0382 (=1,36/√1267) → se rechaza H0; Dexp=0,2097 > 0,0382 → se rechaza H0′. Mejor candidato lognormal pero rechazado por cola pesada (máx 987 min).",
    concl: "Con α=0,05 se rechaza H0 (lognormal) y H0′ (exponencial); muestra no compatible. Curva roja = exponencial media 10 solo referencial. El 80,9% dura ≤10 min (46,3% ≤5 min), 3,6% >30 min. Se adopta MTTR lognormal por equipo + empírica.",
    ficha: "Variable: duración paros no programadas (min) · Fuente: paros_eventos.csv · Período: 01-sep al 03-oct-2026 (33 días) · Descriptivas: n=1267 media 10,0 mediana 6,0 máx 987 · Candidatas: lognormal y exponencial media 10 · Elegida: lognormal por equipo / empírica (ninguna pasa) · Prueba: K-S bilateral D=0,1399/0,2097 vs 0,0382 · Interpretación: cola pesada, 80,9% ≤10 min.",
  },
  pesos: {
    label: "Pesos Pallet PT",
    sub: "Distribución de peso neto por pallet final de producto terminado (kg) — display 6 clases E≥5; test formal k=8",
    categories: ["<600 kg", "600–700", "700–800", "800–900", "900–1000", ">1000 kg"],
    obs: [22, 1, 109, 218, 96, 54],
    teo: [21.8, 50.6, 98.6, 127.4, 109.2, 92.5],
    ks: "con α=0,05 se rechaza H0; muestra no compatible; se adopta empírica (K-S D=0,146 > Dcrit=0,0608)",
    metric: "n = 500 · Media 862,5 kg · Desv. Est. 153,4 kg · μ̂=862,5 σ̂=153,4",
    test: "H0: pesos ∼ Normal(μ=862,5; σ=153,4) vs H1: no normal · α=0,05 · Chi² k=8 p=2 gl=5: χ²₀=243,465 > crit 11,07 → se rechaza H0 | K-S bilateral n=500: D=0,146 > Dcrit=0,0608 (=1,36/√500) → se rechaza H0. Mezcla por SKU (hueco 600–700: 1 vs 50,6 esp.; picos 1250 kg fam.724).",
    concl: "Con α=0,05 se rechaza H0 normal; muestra no compatible (mezcla/bimodal + picos deterministas >1000 kg, 18×1250 kg). Se adopta empírica cajas_PT_pmf + mezcla por SKU/familia.",
    ficha: "Variable: peso neto pallet PT (kg) · Fuente: pesos_PT_kg.csv · Período: trazabilidad sep–oct 2026 · Descriptivas: n=500 media 862,5 σ 153,4 · Candidatas: normal μ̂=862,5 σ̂=153,4 · Elegida: empírica + mezcla SKU · Prueba: Chi² k=8 gl=5 χ²=243,465 vs 11,07 + K-S D=0,146 vs 0,0608 · Interpretación: mezcla, no normal única.",
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

const FIT_SRC: Record<string, { file: string; cdf: (x: number) => number; cdfLabel: string; unit: string }> = {
  iat: { file: "iat", cdf: (x) => expCDF(x, 2.62), cdfLabel: "Exp(λ=1/2,62)", unit: "min" },
  paros: { file: "paros", cdf: (x) => expCDF(x, 10.0), cdfLabel: "Exp(media 10) referencial", unit: "min" },
  pesos: { file: "pesos", cdf: (x) => phi((x - 862.5) / 153.4), cdfLabel: "Normal(862,5; 153,4)", unit: "kg" },
};

function FittingDetail({ tab, obs, esp, categories }: { tab: string; obs: number[]; esp: number[]; categories: string[] }) {
  const [vals, setVals] = useState<number[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/fitting/${FIT_SRC[tab].file}.json`).then((r) => r.json()).then((v: number[]) => { if (alive) setVals(v); }).catch(() => { if (alive) setVals([]); });
    return () => { alive = false; };
  }, [tab]);
  const detail = useMemo(() => {
    if (!vals || vals.length === 0) return null;
    const cdf = FIT_SRC[tab].cdf;
    const ks = ksTable(vals, cdf);
    const box = boxplotStats(vals);
    const chi = chi2Table(obs, esp);
    const idx = ks.rows.findIndex((r) => Math.abs(r.dAfter) === ks.dmax || Math.abs(r.dBefore) === ks.dmax);
    const c = idx < 0 ? 0 : idx;
    const lo = Math.max(0, c - 7);
    const rows = ks.rows.slice(lo, lo + 15);
    const ec = ecdf(vals);
    return { ks, box, chi, rows, ec, xStar: ks.rows[c]?.x ?? 0 };
  }, [vals, tab, obs, esp]);
  if (!vals) return <p className="text-[12px] text-muted">Cargando muestra…</p>;
  if (!detail) return <p className="text-[12px] text-muted">Sin muestra disponible.</p>;
  const { ks, box, chi, rows, ec } = detail;
  const svals = [...vals].sort((a, b) => a - b);
  const F = FIT_SRC[tab].cdf;
  const dmaxPt = (() => {
    const r = ks.rows.reduce((m, x) => (Math.max(x.dAfter, x.dBefore) > Math.max(m.dAfter, m.dBefore) ? x : m), ks.rows[0]);
    return [[r.x, r.teo], [r.x, r.emp]] as [number, number][];
  })();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={`ECDF vs teórica — ${FIT_SRC[tab].cdfLabel}`} sub={`Escalera %≤x vs F(x), flecha Dmax=${formatES(ks.dmax, 4)} (ET6 p.15)`}>
        <Chart height={260} option={{
          legend: { top: 0, right: 16 },
          xAxis: { type: "value", name: `x [${FIT_SRC[tab].unit}]` },
          yAxis: { type: "value", min: 0, max: 1, name: "F" },
          series: [
            { name: "ECDF", type: "line", step: "end", showSymbol: false, lineStyle: { width: 2 }, data: ec.filter((_, i) => i % Math.ceil(ec.length / 400) === 0) },
            { name: "F teórica", type: "line", smooth: true, showSymbol: false, lineStyle: { width: 2, color: "#d9293b" }, data: svals.filter((_, i) => i % Math.ceil(svals.length / 400) === 0).map((x) => [x, F(x)] as [number, number]) },
            { name: "Dmax", type: "line", showSymbol: true, symbolSize: 8, lineStyle: { width: 2, type: "dashed", color: "#d9293b" }, data: dmaxPt },
          ],
        }} />
      </Card>
      <Card title="Boxplot — Q1/mediana/Q3, bigotes 1,5·RIC" sub={`n=${vals.length} · RIC=${formatES(box.ric, 2)} · outliers=${box.outliers.length} (ET6 p.6)`}>
        <Chart height={260} option={{
          xAxis: { type: "category", data: [tab] },
          yAxis: { type: "value", name: `x [${FIT_SRC[tab].unit}]` },
          series: [
            { name: "boxplot", type: "boxplot", data: [[box.low, box.q1, box.med, box.q3, box.high]] },
            { name: "outliers", type: "scatter", data: box.outliers.slice(0, 200).map((v) => [0, v]) },
          ],
        }} />
        <p className="mt-2 text-[12px] text-muted">Q1={formatES(box.q1, 2)} · Med={formatES(box.med, 2)} · Q3={formatES(box.q3, 2)} · bigotes [{formatES(box.low, 2)}, {formatES(box.high, 2)}].</p>
      </Card>
      <Card className="lg:col-span-2" title="Bondad de ajuste — Chi² (O,E) + K-S bilateral" sub="Chi² Σ(O−E)²/E, gl=k−1−p (ET6 p.16,21) · K-S D± bilateral (ET6 p.15, tabla p.18-19)">
        <Table head={[{ label: "Intervalo" }, { label: "O", right: true }, { label: "E", right: true }, { label: "(O−E)²/E", right: true }]}>
          {chi.rows.map((r, i) => (
            <tr key={r.i}><td className="first">{categories[i] ?? r.i}</td><td className="num">{r.obs}</td><td className="num">{formatES(r.esp, 1)}</td><td className="num">{formatES(r.aporte, 3)}</td></tr>
          ))}
        </Table>
        <p className="mt-2 text-[12px] text-muted">χ²={formatES(chi.chi2, 3)} (comparar con χ²crit(gl;α=0,05)). K-S Dmax={formatES(ks.dmax, 4)} (ventana ±7 en torno a Dmax, n={vals.length}).</p>
        <Table maxH={300} head={[{ label: "i", right: true }, { label: "x(i)", right: true }, { label: "i/n", right: true }, { label: "F", right: true }, { label: "D+", right: true }, { label: "D−", right: true }]}>
          {rows.map((r) => (
            <tr key={r.i}><td className="num">{r.i}</td><td className="num">{formatES(r.x, 2)}</td><td className="num">{formatES(r.emp, 4)}</td><td className="num">{formatES(r.teo, 4)}</td><td className="num">{formatES(r.dAfter, 4)}</td><td className="num">{formatES(r.dBefore, 4)}</td></tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

export default function Estadistica() {
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
              <b>Test cátedra (ET2 p.19/22 · ET6 p.15-16,18-21):</b> {curFit.test}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              <b>Diagnóstico estadístico:</b> {curFit.concl}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              <b>Ficha ET6 p.24:</b> {curFit.ficha}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              <b>Nota metodológica:</b> Chi² con E≥5 por clase (ET2 p.20 / ET6 p.16, agrupando cola si E&lt;5) y gl=k−1−p;
              K-S bilateral ET6 p.15 (máx antes/después del salto) vs versión simplificada ET2 p.24. Curva roja paros =
              exponencial media 10 solo referencial (mejor candidato lognormal D=0,1399 pero también rechazado vs
              Dcrit=0,0382).
            </p>
          </Card>

          <div className="lg:col-span-2">
            <FittingDetail tab={tabFit} obs={curFit.obs} esp={curFit.teo} categories={curFit.categories} />
          </div>

          {/* Gráfico 3: Perfil de Utilización y Cuello de Botella */}
          <Card
            className="lg:col-span-2"
            title="Perfil de Utilización Comparativa por Estación (Diagnóstico del Cuello de Botella)"
            sub="Estimación estática ilustrativa, no medición de esta corrida — ver Distribución de Estados para utilización en vivo"
            right={<div className="flex items-center gap-2"><Tag kind="supuesto">Estimación estática</Tag><ChartGuide title="Utilización comparativa por estación" shows="Compara el porcentaje de tiempo efectivo de procesamiento de las etapas productivas." watch="La etapa con utilización más alta se acerca a su capacidad y puede limitar el ritmo de toda la línea. También observá las estaciones con menor uso: podrían estar esperando producto del cuello de botella." /></div>}
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
              <b>Efecto Restricción:</b> <b>Dato:</b> Formadora 18,33 s/caja = 982 kg/h nominales (SUPUESTOS T5). <b>Supuesto ilustrativo:</b> perfil 89% formadora vs resto — estimación estática, no medición de esta corrida. El bloqueo aguas arriba y la ociosidad de envasado/robot son el efecto esperado si la formadora restringe el flujo; contrastar con Distribución de Estados en vivo.
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
