"use client";
import dynamic from "next/dynamic";
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
  option = thin(option);
  return (
    <ReactECharts
      style={{ height, width: "100%" }}
      notMerge={false}
      lazyUpdate
      option={{ color: PALETTE, ...base, ...option } as EChartsOption}
    />
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
