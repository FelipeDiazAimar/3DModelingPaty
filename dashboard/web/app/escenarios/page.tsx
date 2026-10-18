"use client";
import { useEffect, useState } from "react";
import { Card, Page, PageHead, Tag, Table } from "@/components/Ui";
import { useE1 } from "@/components/E1";
import { formatES } from "@/lib/format";

interface Stat { media: number; desv: number; h: number; ic_inf: number; ic_sup: number; cero_en_ic?: boolean }
interface Esc { nombre: string; cambio: string; pallets: Stat; cajas: Stat; ton: Stat; dif_pallets?: Stat; dif_cajas?: Stat; dif_pallets_pct?: number; dif_cajas_pct?: number }
interface EscData { replicas: number; metodo: string; escenarios: Record<string, Esc>; tope_mp: { texto: string } }

const f = (v: number, d = 1) => formatES(v, d);
const sg = (v: number, d = 1) => (v > 0 ? "+" : "") + f(v, d);

const LECTURA: Record<string, string> = {
  E2: "Subir las formadoras a 1843 kg/h suma unos 2,5 pallets por día (+2,8 %), y la diferencia es real (el IC no incluye el cero). Pero es poco: la materia prima entra a 16 pallets de 1500 kg cada 8 h, es decir 72 t por día, y con la formadora más rápida las cámaras de materia prima quedan vacías. El cuello de botella pasa de la formadora a la recepción. Para aprovechar la mejora hay que traer más materia prima.",
  E3: "Con reparaciones un 25 % más largas en formadoras y túneles la producción no cambia: la diferencia pareada es de −6,5 cajas por día (de unas 13.100) y su IC incluye el cero. Los acumuladores entre estaciones absorben paros de 10 a 20 minutos, así que el sistema resiste un mantenimiento algo peor.",
};

export default function Escenarios() {
  const d1 = useE1();
  const [d, setD] = useState<EscData | null>(null);
  useEffect(() => { fetch("/e1/escenarios.json").then((r) => r.json()).then(setD).catch(() => setD(null)); }, []);
  const t = d1?.metricas.pal_total, v = d1?.validacion;
  const esc = d?.escenarios;
  return (
    <Page>
      <PageHead title="Escenarios" sub="Experimentos con 10 réplicas y los mismos números aleatorios en todos, para comparar mejoras con diferencias pareadas." />
      <Card className="mb-4" title="E1 · Base (como es hoy)" sub="Modelo final L7 + L8 con las fallas del tablero · 10 réplicas de 24 h" right={<><Tag kind="real">10 réplicas</Tag><Tag kind="supuesto">No valida en pallets</Tag></>}>
        {!d1 || !t || !v ? <div className="skeleton h-16 w-full" /> : (
          <div className="grid gap-3 text-[13px] md:grid-cols-4">
            <div><div className="text-muted">Planta [pallets/día]</div><div className="tnum text-[22px] font-extrabold">{f(t.media, 1)}</div><div className="text-[12px] text-muted">IC 95 % [{f(t.ic_inf, 1)} ; {f(t.ic_sup, 1)}]</div></div>
            <div><div className="text-muted">Real del tablero</div><div className="tnum text-[22px] font-extrabold">{f(v.Planta.real, 1)}</div><div className="text-[12px] text-muted">L7 25,8 · L8 39,1</div></div>
            <div><div className="text-muted">Error relativo</div><div className="tnum text-[22px] font-extrabold text-[var(--crit)]">{sg(v.Planta.error_rel_pct, 1)} %</div><div className="text-[12px] text-muted">El real queda fuera del IC</div></div>
            <div><div className="text-muted">Toneladas [t/día]</div><div className="tnum text-[22px] font-extrabold">{f(v.Planta.ton_sim, 1)}</div><div className="text-[12px] text-muted">Real {f(v.Planta.ton_real, 1)} t</div></div>
          </div>
        )}
        <p className="mt-3 text-[12px] leading-relaxed text-muted">Detalle de la validación en Paradas y del intervalo de confianza y el período de calentamiento en Estadística.</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {(["E2", "E3"] as const).map((id) => {
          const e = esc?.[id];
          return (
            <Card key={id} title={`${id} · ${e?.nombre ?? ""}`} sub={e?.cambio} right={<Tag kind="real">10 réplicas</Tag>}>
              {!e ? <div className="skeleton h-28 w-full" /> : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div><div className="text-muted">Pallets/día (planta)</div><div className="tnum text-[22px] font-extrabold">{f(e.pallets.media, 1)}</div><div className="text-[12px] text-muted">IC [{f(e.pallets.ic_inf, 1)} ; {f(e.pallets.ic_sup, 1)}]</div></div>
                    <div><div className="text-muted">Diferencia contra E1</div><div className="tnum text-[22px] font-extrabold">{sg(e.dif_pallets!.media, 1)} <span className="text-[13px] text-muted">({sg(e.dif_pallets_pct!, 1)} %)</span></div><div className="text-[12px] text-muted">IC [{sg(e.dif_pallets!.ic_inf, 1)} ; {sg(e.dif_pallets!.ic_sup, 1)}] · {e.dif_pallets!.cero_en_ic ? "no distinguible de cero" : "distinta de cero"}</div></div>
                    <div><div className="text-muted">Cajas/día (planta)</div><div className="tnum text-[18px] font-extrabold">{f(e.cajas.media, 0)}</div></div>
                    <div><div className="text-muted">Diferencia en cajas</div><div className="tnum text-[18px] font-extrabold">{sg(e.dif_cajas!.media, 0)}</div><div className="text-[12px] text-muted">IC [{sg(e.dif_cajas!.ic_inf, 0)} ; {sg(e.dif_cajas!.ic_sup, 0)}]</div></div>
                  </div>
                  <p className="mt-3 text-[12px] leading-relaxed text-muted">{LECTURA[id]}</p>
                </>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-4" title="E4 · Tamaño de batch" sub="Batch de 1200 a 1500 kg" right={<Tag kind="sinCorrida" />}>
        <p className="text-[13px] leading-relaxed text-muted">Falta correrlo. El modelo ya trabaja con batches de 1500 kg, así que comparar contra 1200 kg exige cambiar la estructura de mezcladora y formadora (cargas por batch) y los tiempos de cambio y lavado, que hoy no están modelados.</p>
      </Card>

      <Card className="mt-4" title="Comparación entre escenarios" sub="Pallets por día de la planta: media e IC 95 % de las 10 réplicas">
        {!esc ? <div className="skeleton h-24 w-full" /> : (
          <>
            <Table maxH={260} head={[{ label: "Escenario" }, { label: "Pallets/día", right: true }, { label: "IC 95 %", right: true }, { label: "Cajas/día", right: true }, { label: "Toneladas/día", right: true }]}>
              {Object.entries(esc).map(([id, e]) => (
                <tr key={id}>
                  <td className="first font-semibold">{id} · {e.nombre}</td>
                  <td className="num">{f(e.pallets.media, 1)}</td>
                  <td className="num">[{f(e.pallets.ic_inf, 1)} ; {f(e.pallets.ic_sup, 1)}]</td>
                  <td className="num">{f(e.cajas.media, 0)}</td>
                  <td className="num">{f(e.ton.media, 1)}</td>
                </tr>
              ))}
            </Table>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">{d?.tope_mp.texto}. Con los mismos números aleatorios en los tres escenarios, la diferencia pareada es mucho más precisa que comparar los intervalos por separado.</p>
          </>
        )}
      </Card>
    </Page>
  );
}
