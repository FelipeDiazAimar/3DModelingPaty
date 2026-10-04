"use client";
import { Chart, axisT, axisV } from "@/components/Chart";
import { Card, Empty, Kpi, Page, PageHead, Tag } from "@/components/Ui";
import { series } from "@/lib/derive";
import { useHist, useLatest, useStore } from "@/lib/store";

const KG_BATCH = 1500; // un pallet de MP = un batch
const KG_CAJA = 5;
const KG_PALLET_PT = 144 * KG_CAJA;

export default function Masa() {
  const h = useHist();
  const last = useLatest();
  if (!last) return <Page><PageHead title="Balance de masa" sub="Cuánta carne entra, cuánta sale como producto y cuánta está en proceso." /><Empty /></Page>;
  const mpIn = last.kpi.palletsMP * KG_BATCH;
  const cajas = last.kpi.cajasL7 + last.kpi.cajasL8;
  const pt = cajas * KG_CAJA;
  const wip = Math.max(0, mpIn - pt);
  const fmt = (n: number) => n.toLocaleString("es-AR");
  return (
    <Page>
      <PageHead title="Balance de masa" sub="Cuánta carne entra, cuánta sale como producto y cuánta está en proceso." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon="meat" accent="brand" label="Materia prima recibida" value={fmt(mpIn)} unit="kg" />
        <Kpi icon="box" accent="green" label="Producto en cajas" value={fmt(pt)} unit="kg" hint={`${fmt(cajas)} cajas`} />
        <Kpi icon="pallet" accent="blue" label="Pallets PT (144 cajas)" value={fmt(Math.floor(pt / KG_PALLET_PT))} hint={`${fmt(KG_PALLET_PT)} kg por pallet`} />
        <Kpi icon="layers" accent="amber" label="En proceso (por diferencia)" value={fmt(wip)} unit="kg" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Entra y sale" sub="Kilos acumulados">
          <Chart option={{ legend: { top: 0, right: 0 }, xAxis: axisT, yAxis: axisV, series: [
            { name: "MP recibida", type: "line", showSymbol: false, data: series(h, (s) => s.kpi.palletsMP * KG_BATCH) },
            { name: "Producto en cajas", type: "line", showSymbol: false, areaStyle: { opacity: 0.1 }, data: series(h, (s) => (s.kpi.cajasL7 + s.kpi.cajasL8) * KG_CAJA) },
          ] }} />
        </Card>
        <Card title="Mermas y regalía por sobrepeso" sub="El modelo no descuenta merma ni mide giveaway" right={<Tag kind="supuesto" />}>
          <ul className="space-y-3 text-[14px]">
            <li className="flex justify-between"><span className="text-muted">Merma de proceso (informe)</span><b>3,00 % del ingreso</b></li>
            <li className="flex justify-between"><span className="text-muted">Giveaway (informe)</span><b>1,54 %</b></li>
            <li className="flex justify-between"><span className="text-muted">Referencia tablero: carne real procesada</span><b>2,62 M kg</b></li>
          </ul>
          <p className="mt-3 text-[12px] text-muted">Son supuestos del informe, no resultados de la simulación. El balance de arriba toma 1 pallet de MP = 1 batch de 1500 kg.</p>
        </Card>
      </div>
    </Page>
  );
}
