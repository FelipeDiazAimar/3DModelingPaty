"use client";
import { Card, Page, PageHead, Tag } from "@/components/Ui";
import { useE1 } from "@/components/E1";
import { formatES } from "@/lib/format";

const ESC = [
  { id: "E2", nombre: "Más dotación", cambio: "Asistencia en la carga manual: 1843 kg/h.", pregunta: "¿Se elimina el cuello de botella de entrada?", metrica: "Throughput y ocupación del túnel" },
  { id: "E3", nombre: "Estrés por fallas", cambio: "MTTR +25 % en formadora y túnel.", pregunta: "¿Resiste un mantenimiento peor?", metrica: "WIP máximo y pérdida de carne" },
  { id: "E4", nombre: "Tamaño de batch", cambio: "Batch de 1200 a 1500 kg.", pregunta: "¿Pesan menos los cambios de formato y lavados?", metrica: "Pallets/día y rendimiento neto" },
];

export default function Escenarios() {
  const d = useE1();
  const t = d?.metricas.pal_total, v = d?.validacion;
  return (
    <Page>
      <PageHead title="Escenarios" sub="Cuatro experimentos con 10 réplicas cada uno y números aleatorios comunes, para comparar mejoras sin tocar la planta." />
      <Card className="mb-4" title="E1 · Base (como es hoy)" sub="Modelo final L7 + L8 con las fallas del tablero · 10 réplicas de 24 h" right={<><Tag kind="real">10 réplicas</Tag><Tag kind="supuesto">No valida en pallets</Tag></>}>
        {!d || !t || !v ? <div className="skeleton h-16 w-full" /> : (
          <div className="grid gap-3 text-[13px] md:grid-cols-4">
            <div><div className="text-muted">Planta [pallets/día]</div><div className="tnum text-[22px] font-extrabold">{formatES(t.media, 1)}</div><div className="text-[12px] text-muted">IC 95 % [{formatES(t.ic_inf, 1)} ; {formatES(t.ic_sup, 1)}]</div></div>
            <div><div className="text-muted">Real del tablero</div><div className="tnum text-[22px] font-extrabold">{formatES(v.Planta.real, 1)}</div><div className="text-[12px] text-muted">L7 25,8 · L8 39,1</div></div>
            <div><div className="text-muted">Error relativo</div><div className="tnum text-[22px] font-extrabold text-[var(--crit)]">{(v.Planta.error_rel_pct > 0 ? "+" : "") + formatES(v.Planta.error_rel_pct, 1)} %</div><div className="text-[12px] text-muted">El real queda fuera del IC</div></div>
            <div><div className="text-muted">Toneladas [t/día]</div><div className="tnum text-[22px] font-extrabold">{formatES(v.Planta.ton_sim, 1)}</div><div className="text-[12px] text-muted">Real {formatES(v.Planta.ton_real, 1)} t</div></div>
          </div>
        )}
        <p className="mt-3 text-[12px] leading-relaxed text-muted">Detalle de la validación en Paradas y del intervalo de confianza y el período de calentamiento en Estadística.</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {ESC.map((e) => (
          <Card key={e.id} title={`${e.id} · ${e.nombre}`} sub={e.cambio} right={<Tag kind="sinCorrida" />}>
            <dl className="space-y-1.5 text-[13px]">
              <div className="flex gap-2"><dt className="w-20 shrink-0 text-muted">Pregunta</dt><dd className="font-semibold">{e.pregunta}</dd></div>
              <div className="flex gap-2"><dt className="w-20 shrink-0 text-muted">Se mide</dt><dd className="font-semibold">{e.metrica}</dd></div>
            </dl>
          </Card>
        ))}
      </div>
      <Card className="mt-4" title="Comparación entre escenarios" sub="Box-plots de throughput y diferencias pareadas">
        <p className="text-[14px] text-muted">Falta correr E2, E3 y E4 con los mismos números aleatorios que E1. Cuando estén, acá se comparan contra la base.</p>
      </Card>
    </Page>
  );
}
