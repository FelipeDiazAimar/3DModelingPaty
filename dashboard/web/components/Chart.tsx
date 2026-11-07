"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { EChartsOption } from "echarts";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false, loading: () => <div className="skeleton h-full min-h-[120px] w-full" /> });

const base = {
  textStyle: { fontFamily: "var(--font-ui), system-ui", color: "#5a6b82" },
  grid: { left: 44, right: 16, top: 28, bottom: 28 },
  tooltip: { trigger: "axis", backgroundColor: "#0f1b2d", borderWidth: 0, textStyle: { color: "#fff", fontSize: 12 } },
  animationDuration: 400,
};
export const PALETTE = ["#d9293b", "#2b59ff", "#16a37f", "#e08a1e", "#7a5af8", "#0f1b2d"];

/** Diezma series largas (máx. ~700 puntos) para que los gráficos sigan fluidos. */
function thin(option: EChartsOption): EChartsOption {
  const sr = option.series;
  if (!Array.isArray(sr)) return option;
  return {
    ...option,
    series: sr.map((x) => {
      const d = (x as { data?: unknown[] }).data;
      if (!Array.isArray(d) || d.length <= 800) return x;
      const step = Math.ceil(d.length / 700);
      return { ...x, data: d.filter((_, i) => i % step === 0 || i === d.length - 1) };
    }) as EChartsOption["series"],
  };
}

export function Chart({ option, height = 260 }: { option: EChartsOption; height?: number }) {
  const [full, setFull] = useState(false);
  useEffect(() => {
    if (!full) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [full]);
  const opt = { color: PALETTE, ...base, ...thin(option) } as EChartsOption;
  const btn = "absolute right-1 top-1 z-10 grid h-7 w-7 place-items-center rounded-full bg-[#e6ecf4] text-[13px] font-bold hover:bg-[#d8e0ec]";
  return (
    <div className="relative">
      <button onClick={() => setFull(true)} aria-label="Pantalla completa" title="Pantalla completa" className={`${btn} opacity-70 hover:opacity-100`}>⛶</button>
      <ReactECharts style={{ height, width: "calc(100% - 30px)" }} notMerge={false} lazyUpdate option={opt} />
      {full && createPortal(
        <div role="dialog" aria-label="Gráfico en pantalla completa" className="fixed inset-0 z-[80] flex flex-col bg-white p-3 md:p-6">
          <button onClick={() => setFull(false)} aria-label="Cerrar pantalla completa" title="Cerrar (Esc)" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-[#e6ecf4] text-lg font-bold hover:bg-[#d8e0ec] md:right-6 md:top-6">×</button>
          <div className="min-h-0 flex-1 pt-10"><ReactECharts style={{ height: "100%", width: "100%" }} notMerge={false} lazyUpdate option={opt} /></div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export const axisT = { type: "value" as const, name: "h", nameTextStyle: { color: "#8b97a8" }, axisLine: { lineStyle: { color: "#d5dce8" } }, splitLine: { show: false } };
export const axisV = { type: "value" as const, splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } };
// Ejes con unidad estilo cátedra ET5/ET6 (no borrar axisT/axisV: compat con imports existentes).
export const axisTiempoH = { ...axisT, name: "Tiempo [h]" };
export const axisTiempoMin = { type: "value" as const, name: "Tiempo [min]", nameTextStyle: { color: "#8b97a8" } };
export const axisWIP = { type: "value" as const, name: "WIP [cajas]", splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } };
export const axisThroughput = { type: "value" as const, name: "Throughput [pal/h]", splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } };
export const axisEspera = { type: "value" as const, name: "Espera [min]", splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } };
export const axisFrec = { type: "value" as const, name: "Frecuencia [n]", splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } };
