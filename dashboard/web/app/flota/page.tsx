"use client";
import { Chart, axisT, axisV } from "@/components/Chart";
import { Card, Empty, Page, PageHead } from "@/components/Ui";
import { FLEET } from "@/lib/layout";
import { series } from "@/lib/derive";
import { useHist, useLatest, useStore } from "@/lib/store";

const ROL: Record<string, string> = {
  MontacargasRecep: "Camiones → cámaras de MP",
  MontacargasAlmacenMP: "Cámaras de MP → desencajado",
  MontacargasLineaPT: "Final de línea → cámaras de PT",
  MontacargasExped: "Cámaras de PT → expedición",
};

export default function Flota() {
  const h = useHist();
  const last = useLatest();
  const select = useStore((s) => s.select);
  return (
    <Page>
      <PageHead title="Montacargas" sub="Cuatro montacargas mueven los pallets entre camiones, cámaras, líneas y expedición." />
      {!last ? <Empty /> : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {FLEET.map((f) => {
              const l = last.fleet[f.id];
              return (
                <button key={f.id} onClick={() => select(f.id)} className="card p-4 text-left transition hover:-translate-y-0.5">
                  <div className="text-[12px] font-semibold text-muted">{ROL[f.id]}</div>
                  <div className="mt-0.5 text-[16px] font-extrabold">{f.label}</div>
                  <div className="mt-3 flex items-baseline gap-2"><span className="tnum text-[28px] font-extrabold">{l?.moves ?? 0}</span><span className="text-[12px] text-muted">traslados</span></div>
                  <div className="mt-1 text-[12px] capitalize text-muted">{l?.state ?? "—"}{l?.carrying ? " · con carga" : ""}</div>
                </button>
              );
            })}
          </div>
          <Card className="mt-4" title="Traslados acumulados" sub="Pallets movidos por cada montacargas">
            <Chart height={300} option={{ legend: { top: 0, right: 0 }, xAxis: axisT, yAxis: axisV,
              series: FLEET.map((f) => ({ name: f.label, type: "line", showSymbol: false, data: series(h, (s) => s.fleet[f.id]?.moves ?? 0) })) }} />
          </Card>
        </>
      )}
    </Page>
  );
}
