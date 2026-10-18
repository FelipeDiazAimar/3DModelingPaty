"use client";
import { useEffect, useState } from "react";
import { Chart, axisT } from "./Chart";
import { Card, Table, Tag } from "./Ui";
import { formatES } from "@/lib/format";

interface Stat { media: number; desv: number; h: number; ic_inf: number; ic_sup: number; h_rel: number; p95: number; n_req_2pct: number; min: number; max: number }
interface Val { real: number; sim: number; ic_inf: number; ic_sup: number; error_rel_pct: number; real_en_ic: boolean; ton_sim: number; ton_real: number }
interface Paro { equipos: number; min_media: number; min_desv: number; eventos_media: number; min_esperado: number; eventos_esperado: number }
export interface E1Data {
  replicas: number; horizonte_h: number; metodo: string;
  metricas: Record<string, Stat>;
  validacion: Record<"L7" | "L8" | "Planta", Val>;
  paros: Record<string, Paro>;
  welch: { horas: number[]; tasa_cajas_h: number[]; media_movil_w3: number[]; hora_estable_95pct: number | null };
}

/** Resultados de las 10 réplicas E1 (datos_trazabilidad/e1_final → public/e1/summary.json). */
export function useE1() {
  const [d, setD] = useState<E1Data | null>(null);
  useEffect(() => {
    fetch("/e1/summary.json").then((r) => r.json()).then(setD).catch(() => setD(null));
  }, []);
  return d;
}

const f = (v: number, d = 1) => formatES(v, d);
const sign = (v: number) => (v > 0 ? "+" : "") + formatES(v, 1) + " %";
const PARO_NOMBRE: Record<string, string> = { FOR: "Formadoras", TUN: "Túneles", FLW: "Envasadoras", EST: "Estibadores", PIC: "Picadoras" };

/** Tabla de validación campo vs. modelo (Paradas). */
export function ValidacionE1() {
  const d = useE1();
  if (!d) return <Card className="mt-4" title="Validación campo vs. modelo" sub="Cargando resultados de las réplicas…"><div className="skeleton h-24 w-full" /></Card>;
  const rows: { nombre: string; unidad: string; v: Val; pal: boolean }[] = [
    { nombre: "Línea 7", unidad: "pallets/día", v: d.validacion.L7, pal: true },
    { nombre: "Línea 8", unidad: "pallets/día", v: d.validacion.L8, pal: true },
    { nombre: "Planta (L7+L8)", unidad: "pallets/día", v: d.validacion.Planta, pal: true },
  ];
  const tons = [
    { nombre: "Línea 7", v: d.validacion.L7 }, { nombre: "Línea 8", v: d.validacion.L8 }, { nombre: "Planta (L7+L8)", v: d.validacion.Planta },
  ];
  const ptot = d.metricas.pal_total;
  return (
    <Card
      className="mt-4"
      title="Validación campo vs. modelo (E1 base, 10 réplicas)"
      sub="Error relativo = (sim − real)/real · ¿real ∈ IC 95 %? · media y P95 sobre 10 réplicas de 24 h, con fallas aleatorias del tablero"
      right={<><Tag kind="real">10 réplicas</Tag><Tag kind="supuesto">No valida en pallets</Tag></>}
    >
      <Table maxH={340} head={[{ label: "Indicador" }, { label: "Real (tablero)", right: true }, { label: "Sim media", right: true }, { label: "P95 sim", right: true }, { label: "IC 95 %", right: true }, { label: "Error rel.", right: true }, { label: "¿Real ∈ IC?", right: true }]}>
        {rows.map((r) => (
          <tr key={r.nombre}>
            <td className="first font-semibold">{r.nombre} <span className="text-muted">· {r.unidad}</span></td>
            <td className="num">{f(r.v.real, 1)}</td>
            <td className="num">{f(r.v.sim, 1)}</td>
            <td className="num">{f(r.nombre.startsWith("Planta") ? ptot.p95 : r.nombre === "Línea 7" ? d.metricas.pal_L7.p95 : d.metricas.pal_L8.p95, 0)}</td>
            <td className="num">[{f(r.v.ic_inf, 1)} ; {f(r.v.ic_sup, 1)}]</td>
            <td className="num font-bold">{sign(r.v.error_rel_pct)}</td>
            <td className="num">{r.v.real_en_ic ? "Sí" : "No"}</td>
          </tr>
        ))}
        {tons.map((r) => (
          <tr key={"t" + r.nombre}>
            <td className="first font-semibold">{r.nombre} <span className="text-muted">· toneladas/día</span></td>
            <td className="num">{f(r.v.ton_real, 1)}</td>
            <td className="num">{f(r.v.ton_sim, 1)}</td>
            <td className="num">—</td>
            <td className="num">—</td>
            <td className="num font-bold">{sign((r.v.ton_sim - r.v.ton_real) / r.v.ton_real * 100)}</td>
            <td className="num">—</td>
          </tr>
        ))}
      </Table>
      <div className="mt-3 space-y-2 text-[12px] leading-relaxed text-muted">
        <p><b>Lectura:</b> en pallets el modelo <b>no valida</b>: produce ≈ 45 pallets/día por línea y el tablero muestra 25,8 (L7) y 39,1 (L8); el real queda fuera del IC en las dos. Las dos líneas trabajan por igual, así que esa diferencia entre líneas del tablero no la explica la planta: la comparación que corresponde es contra las dos líneas juntas (planta: {f(d.validacion.Planta.sim, 1)} contra {f(d.validacion.Planta.real, 1)} pallets/día, {sign(d.validacion.Planta.error_rel_pct)}), y conviene revisar cómo se asignan los pallets a cada línea en el tablero.</p>
        <p><b>Unidad:</b> el modelo arma pallets de 144 bandejas × 5 kg = 720 kg, dentro del rango real de 700–900 kg; el tablero promedia 862,5 kg. En toneladas la planta da {f(d.validacion.Planta.ton_sim, 1)} t/día contra {f(d.validacion.Planta.ton_real, 1)} t ({sign((d.validacion.Planta.ton_sim - d.validacion.Planta.ton_real) / d.validacion.Planta.ton_real * 100)}).</p>
        <p><b>Qué falta en el modelo:</b> trabaja a capacidad las 24 h y solo para por las fallas (menos de 1 % de la producción). La planta real tiene además lavados y cambios de formato. Con un lavado supuesto de 30 min por batch la planta daría 55,7 t/día, casi igual al real (56,0): es una <b>hipótesis a confirmar en planta</b>, no una calibración (ver E4 en Escenarios).</p>
        <p>Con {d.replicas} réplicas el semiancho del IC es {f(ptot.h_rel, 2)} % de la media, por debajo del 2 % pedido (n necesario: {ptot.n_req_2pct}). Significancia ≠ importancia práctica (ET6 p.35).</p>
      </div>
    </Card>
  );
}

/** Paros simulados contra lo esperado por los datos de entrada (verificación del módulo de fallas). */
export function ParosSimulados() {
  const d = useE1();
  if (!d) return null;
  return (
    <Card className="mt-4" title="Paros aplicados en la simulación" sub="Verificación: minutos de paro por día en las 10 réplicas contra lo que implican el MTBF y el MTTR del tablero" right={<Tag kind="real">Verificación</Tag>}>
      <Table maxH={300} head={[{ label: "Equipos" }, { label: "Cantidad", right: true }, { label: "Paro sim [min/día]", right: true }, { label: "Paro esperado [min/día]", right: true }, { label: "Fallas sim [n/día]", right: true }, { label: "Fallas esperadas [n/día]", right: true }]}>
        {Object.entries(d.paros).map(([g, p]) => (
          <tr key={g}>
            <td className="first font-semibold">{PARO_NOMBRE[g] ?? g}</td>
            <td className="num">{p.equipos}</td>
            <td className="num">{f(p.min_media, 1)} ± {f(p.min_desv, 1)}</td>
            <td className="num">{f(p.min_esperado, 1)}</td>
            <td className="num">{f(p.eventos_media, 1)}</td>
            <td className="num">{f(p.eventos_esperado, 1)}</td>
          </tr>
        ))}
      </Table>
      <p className="mt-2 text-[12px] text-muted">MTBF exponencial y MTTR lognormal (σ = 0,9) por equipo, tomados del tablero Sep–Oct (línea 3) bajo el supuesto de 3 turnos continuos; las picadoras usan el dato de planta. Con 10 réplicas la dispersión es grande porque son pocos eventos por día.</p>
    </Card>
  );
}

/** Intervalo de confianza del 95 % y curva de Welch (Estadística). */
export function IntervaloConfianzaE1() {
  const d = useE1();
  if (!d) return <Card title="Intervalo de Confianza del 95 %" sub="Cargando resultados de las réplicas…"><div className="skeleton h-32 w-full" /></Card>;
  const rows: [string, Stat][] = [
    ["Pallets/día · L7", d.metricas.pal_L7], ["Pallets/día · L8", d.metricas.pal_L8], ["Pallets/día · Planta", d.metricas.pal_total],
    ["Cajas/día · L7", d.metricas.cajas_L7], ["Cajas/día · L8", d.metricas.cajas_L8],
  ];
  const wh = d.welch;
  return (
    <Card className="lg:col-span-2" title="Intervalo de Confianza del 95 % y período de calentamiento" sub={`${d.replicas} réplicas independientes de ${d.horizonte_h} h · t(0,975; 9 gl) = 2,262 · h = t·s/√n`} right={<Tag kind="real">10 réplicas</Tag>}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <Table maxH={300} head={[{ label: "Medida" }, { label: "Media", right: true }, { label: "s", right: true }, { label: "IC 95 %", right: true }, { label: "h/media", right: true }, { label: "n p/ 2 %", right: true }]}>
            {rows.map(([name, s]) => (
              <tr key={name}>
                <td className="first font-semibold">{name}</td>
                <td className="num">{f(s.media, name.startsWith("Cajas") ? 0 : 2)}</td>
                <td className="num">{f(s.desv, name.startsWith("Cajas") ? 0 : 2)}</td>
                <td className="num">[{f(s.ic_inf, name.startsWith("Cajas") ? 0 : 2)} ; {f(s.ic_sup, name.startsWith("Cajas") ? 0 : 2)}]</td>
                <td className="num">{f(s.h_rel, 2)} %</td>
                <td className="num">{s.n_req_2pct}</td>
              </tr>
            ))}
          </Table>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">En todas las medidas h ≤ 2 % de la media: con {d.replicas} réplicas alcanza (n = (1,96·s / h)², h = 0,02·media). La variabilidad es chica porque las fallas del tablero casi no reducen la producción diaria; si se agregan otras fuentes de variación (llegadas por hora, tiempos de máquina) el n necesario sube.</p>
        </div>
        <div>
          <Chart height={260} option={{
            legend: { top: 0, right: 0 },
            grid: { left: 56, right: 16, top: 34, bottom: 30 },
            xAxis: { ...axisT, name: "Tiempo [h]", min: 2, max: 23 },
            yAxis: { type: "value", name: "Cajas por hora [cajas/h]", splitLine: { lineStyle: { color: "rgba(15,27,45,.07)" } } },
            series: [
              { name: "Promedio de 10 réplicas", type: "line", showSymbol: false, lineStyle: { width: 1.5, opacity: 0.5 }, data: wh.horas.map((h, i) => [h, wh.tasa_cajas_h[i]]) },
              { name: "Media móvil (Welch, w = 3)", type: "line", showSymbol: false, lineStyle: { width: 3 }, data: wh.horas.map((h, i) => [h, wh.media_movil_w3[i]]),
                markLine: wh.hora_estable_95pct ? { silent: true, symbol: "none", lineStyle: { type: "dashed", color: "#d9293b" }, data: [{ xAxis: wh.hora_estable_95pct, label: { formatter: `Estable desde ${wh.hora_estable_95pct} h` } }] } : undefined },
            ],
          }} />
          <p className="mt-1 text-[12px] leading-relaxed text-muted">Welch sobre la producción de cajas por hora (L7 + L8): el transitorio dura alrededor de {wh.hora_estable_95pct ?? "—"} h, el tiempo que tarda en llenarse la línea desde vacía. Como el informe pide una corrida terminante de 24 h arrancando vacía, el transitorio queda incluido en las medidas de arriba.</p>
        </div>
      </div>
    </Card>
  );
}
