"use client";
import { useEffect, useState } from "react";
import { Chart, axisT, axisV } from "@/components/Chart";
import { Card, Empty, Kpi, MiniBar, Page, PageHead, StatePill, Table } from "@/components/Ui";
import { MACHINES, META_PAL_DIA_LINEA, STAGE_LABEL } from "@/lib/layout";
import { ratePalletsHour, series } from "@/lib/derive";
import { useHist, useLatest, useStore } from "@/lib/store";

function Inner() {
  const h = useHist();
  const last = useLatest();
  const line = useStore((s) => s.line);
  const [focus, setFocus] = useState<string | null>(null);
  useEffect(() => { setFocus(new URLSearchParams(window.location.search).get("m")); }, []);
  if (!last) return <Empty />;
  const hrs = Math.max(last.t / 3600, 0.01);
  const metaPerH = (META_PAL_DIA_LINEA * 2) / 24;
  const rows = MACHINES.filter((m) => m.kind === "machine" && (line === "Todas" || m.line === line));
  const maxRate = Math.max(1, ...rows.map((m) => (last.machines[m.id]?.out ?? 0) / hrs));
  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon="pallet" accent="brand" label="Pallets PT" value={String(last.kpi.palletsPT)} hint={`${ratePalletsHour(h).toFixed(2)} pal/h`} />
        <Kpi icon="truck" accent="blue" label="Pallets MP recibidos" value={String(last.kpi.palletsMP)} />
        <Kpi icon="box" accent="amber" label="Cajas línea 7" value={last.kpi.cajasL7.toLocaleString("es-AR")} hint={`${(last.kpi.cajasL7 / hrs).toFixed(0)} cajas/h`} />
        <Kpi icon="box" accent="violet" label="Cajas línea 8" value={last.kpi.cajasL8.toLocaleString("es-AR")} hint={`${(last.kpi.cajasL8 / hrs).toFixed(0)} cajas/h`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Pallets de producto terminado acumulados" sub="Contra el ritmo del programa (36 pallets/día por línea)">
          <Chart option={{ legend: { top: 0, right: 0 }, xAxis: axisT, yAxis: axisV, series: [
            { name: "Simulado", type: "line", showSymbol: false, areaStyle: { opacity: 0.1 }, data: series(h, (s) => s.kpi.palletsPT) },
            { name: "Meta del programa", type: "line", showSymbol: false, lineStyle: { type: "dashed" }, data: series(h, (s) => s.t / 3600 * metaPerH) },
          ] }} />
        </Card>
        <Card title="Cajas de 5 kg por línea" sub="Salida de las encajonadoras">
          <Chart option={{ legend: { top: 0, right: 0 }, xAxis: axisT, yAxis: axisV, series: [
            { name: "Línea 7", type: "line", showSymbol: false, data: series(h, (s) => s.kpi.cajasL7) },
            { name: "Línea 8", type: "line", showSymbol: false, data: series(h, (s) => s.kpi.cajasL8) },
          ] }} />
        </Card>
      </div>
      <Card className="mt-4" title="Producción por máquina" sub="Ítems procesados desde el inicio de la corrida">
        <Table maxH={420} head={[{ label: "Máquina" }, { label: "Línea" }, { label: "Etapa" }, { label: "Estado" }, { label: "Entradas", right: true }, { label: "Salidas", right: true }, { label: "Ítems/h", right: true }, { label: "Ritmo" }]}>
          {rows.map((m) => {
            const s = last.machines[m.id];
            const rate = (s?.out ?? 0) / hrs;
            return (
              <tr key={m.id} className={focus === m.id ? "row-focus" : ""}>
                <td className="first">{m.label}</td><td>{m.line}</td><td>{STAGE_LABEL[m.stage]}</td>
                <td><StatePill state={s?.state} /></td>
                <td className="num">{s?.inp ?? 0}</td><td className="num">{s?.out ?? 0}</td><td className="num">{rate.toFixed(1)}</td>
                <td><MiniBar v={rate / maxRate} /></td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}

export default function Page_() {
  return (
    <Page>
      <PageHead title="Producción" sub="Qué sale de la planta y a qué ritmo, línea por línea y máquina por máquina." />
      <Inner />
    </Page>
  );
}
