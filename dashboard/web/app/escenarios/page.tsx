import { Card, Page, PageHead, Tag } from "@/components/Ui";

const ESC = [
  { id: "E1", nombre: "Base (como es hoy)", cambio: "Carga manual a 982 kg/h, paros históricos, molde F26 de 4 cavidades.", pregunta: "Línea base y error del modelo contra el tablero.", metrica: "Pallets/día (meta 36,0)" },
  { id: "E2", nombre: "Más dotación", cambio: "Asistencia en la carga manual: 1843 kg/h.", pregunta: "¿Se elimina el cuello de botella de entrada?", metrica: "Throughput y ocupación del túnel" },
  { id: "E3", nombre: "Estrés por fallas", cambio: "MTTR +25 % en formadora y túnel.", pregunta: "¿Resiste un mantenimiento peor?", metrica: "WIP máximo y pérdida de carne" },
  { id: "E4", nombre: "Tamaño de batch", cambio: "Batch de 1200 a 1500 kg.", pregunta: "¿Pesan menos los cambios de formato y lavados?", metrica: "Pallets/día y rendimiento neto" },
];

export default function Escenarios() {
  return (
    <Page>
      <PageHead title="Escenarios" sub="Cuatro experimentos con 10 réplicas cada uno y números aleatorios comunes, para comparar mejoras sin tocar la planta." />
      <div className="grid gap-4 md:grid-cols-2">
        {ESC.map((e) => (
          <Card key={e.id} title={`${e.id} · ${e.nombre}`} sub={e.cambio} right={<Tag kind="sinCorrida" />}>
            <dl className="space-y-1.5 text-[13px]">
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-muted">Pregunta</dt><dd className="font-semibold">{e.pregunta}</dd></div>
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-muted">Se mide</dt><dd className="font-semibold">{e.metrica}</dd></div>
            </dl>
          </Card>
        ))}
      </div>
      <Card className="mt-4" title="Comparación entre escenarios" sub="Box-plots de throughput y diferencias pareadas">
        <p className="text-[14px] text-muted">Se completa cuando se corran las réplicas. Por ahora ningún escenario tiene corrida: el informe los marca como pendientes.</p>
      </Card>
    </Page>
  );
}
