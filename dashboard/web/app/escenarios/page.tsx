"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Page, PageHead, Tag, Table } from "@/components/Ui";
import { CuelloPanel } from "@/components/CuelloPanel";
import { useE1 } from "@/components/E1";
import { formatES } from "@/lib/format";
import { useStore } from "@/lib/store";
import { COLOR_AFECTADA, COLOR_CUELLO, NOMBRE_ETAPA, claveEsc, useCuellos, type Esc, type Lavado } from "@/lib/cuellos";

interface Stat { media: number; desv: number; h: number; ic_inf: number; ic_sup: number; cero_en_ic?: boolean }
interface EscRes { nombre: string; cambio: string; pallets: Stat; cajas: Stat; ton: Stat; dif_pallets?: Stat; dif_cajas?: Stat; dif_pallets_pct?: number; dif_cajas_pct?: number; dif_vs_E2_pallets?: Stat }
interface EscData { replicas: number; metodo: string; escenarios: Record<string, EscRes>; tope_mp: { texto: string } }
interface E4Row { lavado_min: number; n: number; pal_1500: Stat; pal_1200: Stat; dif_pal: Stat; dif_pal_pct: number; cajas_1500: number; cajas_1200: number; dif_cajas_pct: number; ton_1500: number; ton_1200: number }
interface E4Data { descripcion: string; nota: string; replicas: number; filas: E4Row[] }

const f = (v: number, d = 1) => formatES(v, d);
const sg = (v: number, d = 1) => (v > 0 ? "+" : "") + f(v, d);

const ESCENARIOS: { id: Esc; titulo: string; sub: string }[] = [
  { id: "E1", titulo: "E1 · Base", sub: "Como es hoy (lavado 30 min)" },
  { id: "E2", titulo: "E2 · Formadoras rápidas", sub: "1843 kg/h" },
  { id: "E3", titulo: "E3 · Más MP + E2", sub: "24 pallets por turno" },
  { id: "E4", titulo: "E4 · Batch 1200 kg", sub: "con lavado" },
];

export default function Escenarios() {
  const router = useRouter();
  const d1 = useE1();
  const cuellos = useCuellos();
  const [d, setD] = useState<EscData | null>(null);
  const [e4, setE4] = useState<E4Data | null>(null);
  const sel = useStore((s) => s.escenario) ?? "E1";
  const lavado = useStore((s) => s.lavado);
  const setSel = useStore((s) => s.setEscenario);
  const setLavado = useStore((s) => s.setLavado);
  useEffect(() => { fetch("/e1/e4.json").then((r) => r.json()).then(setE4).catch(() => setE4(null)); }, []);
  useEffect(() => { fetch("/e1/escenarios.json").then((r) => r.json()).then(setD).catch(() => setD(null)); }, []);
  const t = d1?.metricas.pal_total, v = d1?.validacion;
  const esc = d?.escenarios;
  const p = cuellos?.escenarios[claveEsc(sel, lavado)];
  const fila4 = e4?.filas.find((r) => r.lavado_min === lavado);
  const verEn3D = () => { setSel(sel); router.push("/"); };

  // resultado de producción del escenario elegido
  let produccion: { etiqueta: string; pal: Stat; base?: Stat; dif?: Stat; difPct?: number; baseNombre: string } | null = null;
  if (esc && sel !== "E4") {
    const e = esc[sel];
    produccion = { etiqueta: sel, pal: e.pallets, dif: e.dif_pallets, difPct: e.dif_pallets_pct, baseNombre: "E1" };
  } else if (fila4) {
    produccion = { etiqueta: "1200 kg", pal: fila4.pal_1200, base: fila4.pal_1500, dif: fila4.dif_pal, difPct: fila4.dif_pal_pct, baseNombre: `1500 kg (lavado ${lavado} min)` };
  }

  return (
    <Page>
      <PageHead title="Escenarios" sub="Elegí un escenario para ver dónde está el cuello de botella y qué provoca en cada etapa. Todos con réplicas pareadas (mismos números aleatorios)." />

      <div className="mb-3 grid gap-2 md:grid-cols-4" role="group" aria-label="Escenario">
        {ESCENARIOS.map((e) => (
          <button key={e.id} onClick={() => setSel(e.id)} aria-pressed={sel === e.id}
            className={`rounded-2xl px-4 py-3 text-left transition ${sel === e.id ? "bg-ink text-white shadow-lg" : "bg-white/80 hover:bg-white"}`}>
            <div className="text-[14px] font-extrabold leading-tight">{e.titulo}</div>
            <div className={`text-[12px] ${sel === e.id ? "text-white/70" : "text-muted"}`}>{e.sub}</div>
          </button>
        ))}
      </div>
      {sel === "E4" && (
        <div className="mb-3 flex items-center gap-2 text-[12.5px]" role="group" aria-label="Lavado por batch">
          <span className="font-semibold text-muted">Lavado por batch:</span>
          {([0, 15, 30] as Lavado[]).map((l) => (
            <button key={l} onClick={() => setLavado(l)} aria-pressed={lavado === l}
              className={`rounded-full px-3 py-1 font-bold transition ${lavado === l ? "bg-brand text-white" : "bg-[#eef3fa] hover:opacity-80"}`}>{l === 0 ? "Sin lavado" : `${l} min`}</button>
          ))}
          <Tag kind="real">30 min = dato de planta</Tag>
        </div>
      )}

      <Card className="mb-4" title={`Cuello de botella · ${ESCENARIOS.find((e) => e.id === sel)?.titulo}${sel === "E4" ? ` · lavado ${lavado} min` : ""}`}
        sub={p?.texto.titulo} right={<><Tag kind="real">{sel === "E4" ? "5 réplicas" : "10 réplicas"}</Tag></>}>
        {!p || !produccion ? <div className="skeleton h-40 w-full" /> : (
          <>
            <div className="grid gap-3 text-[13px] md:grid-cols-3">
              <div>
                <div className="text-muted">Pallets/día (planta)</div>
                <div className="tnum text-[22px] font-extrabold">{f(produccion.pal.media, 1)}</div>
                <div className="text-[12px] text-muted">IC 95 % [{f(produccion.pal.ic_inf, 1)} ; {f(produccion.pal.ic_sup, 1)}]</div>
              </div>
              <div>
                <div className="text-muted">{produccion.dif ? `Diferencia contra ${produccion.baseNombre}` : "Escenario de referencia"}</div>
                {produccion.dif ? (
                  <>
                    <div className="tnum text-[22px] font-extrabold">{sg(produccion.dif.media, 1)} <span className="text-[13px] text-muted">({sg(produccion.difPct ?? 0, 1)} %)</span></div>
                    <div className="text-[12px] text-muted">IC [{sg(produccion.dif.ic_inf, 1)} ; {sg(produccion.dif.ic_sup, 1)}] · {produccion.dif.cero_en_ic ? "no distinguible de cero" : "distinta de cero"}</div>
                  </>
                ) : <div className="text-[12px] text-muted">Sin comparación: es la base de E2, E3 y E4.</div>}
              </div>
              <div>
                <div className="text-muted">Cuello: <b style={{ color: COLOR_CUELLO }}>{NOMBRE_ETAPA[p.cuello.etapa]}</b></div>
                <div className="tnum text-[22px] font-extrabold">{f(p.cuello.cap_t, 1)} <span className="text-[13px] text-muted">t/día</span></div>
                <div className="text-[12px] text-muted">Le sigue {NOMBRE_ETAPA[p.cuello.siguiente]} con {f(p.cuello.cap_siguiente, 1)} t/día</div>
              </div>
            </div>

            <p className="mt-4 rounded-xl bg-[#eef3fa] px-3 py-2 text-[13px] leading-relaxed">{p.texto.cuello}</p>

            <div className="mt-4">
              <CuelloPanel p={p} esBase={sel === "E1"} etiquetaBase={sel === "E4" ? `1500 kg · lavado ${lavado} min` : "E1 · Base"} etiquetaEsc={sel === "E4" ? `1200 kg · lavado ${lavado} min` : sel} />
            </div>

            <h3 className="mt-4 text-[13px] font-extrabold">Qué provoca en cada etapa <span className="font-normal text-muted">(solo las más afectadas)</span></h3>
            <ul className="mt-1.5 space-y-1.5 text-[12.5px] leading-relaxed">
              {p.texto.efectos.map((e) => (
                <li key={e.etapa} className="flex gap-2">
                  <i className="mt-[6px] inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: e.etapa === p.cuello.etapa ? COLOR_CUELLO : COLOR_AFECTADA }} />
                  <span><b>{NOMBRE_ETAPA[e.etapa]}.</b> {e.txt}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] leading-relaxed"><b>Conclusión:</b> {p.texto.conclusion}</p>
            {sel === "E3" && esc?.E3?.dif_vs_E2_pallets && (
              <p className="mt-1 text-[12px] text-muted">E3 contra E2 (pareada): {sg(esc.E3.dif_vs_E2_pallets.media, 1)} pallets/día, IC [{sg(esc.E3.dif_vs_E2_pallets.ic_inf, 1)} ; {sg(esc.E3.dif_vs_E2_pallets.ic_sup, 1)}].</p>
            )}

            <button onClick={verEn3D} className="mt-4 rounded-full bg-brand px-4 py-2 text-[13px] font-bold text-white transition hover:opacity-90">Ver este cuello de botella en la planta 3D</button>
          </>
        )}
      </Card>

      {(sel === "E1" || (sel === "E4" && lavado > 0)) && p?.contexto_lavado && (
        <Card className="mb-4" title={`Qué provoca el lavado de ${sel === "E1" ? 30 : lavado} min por sí solo`} sub="1500 kg con lavado contra 1500 kg sin lavado" right={<Tag kind={(sel === "E1" || lavado === 30) ? "real" : "supuesto"}>{(sel === "E1" || lavado === 30) ? "Dato de planta" : "Sensibilidad"}</Tag>}>
          <CuelloPanel p={p.contexto_lavado} esBase={false} etiquetaBase="1500 kg · sin lavado" etiquetaEsc={`1500 kg · lavado ${sel === "E1" ? 30 : lavado} min`} />
          <p className="mt-3 text-[12px] leading-relaxed text-muted">La cola de entrada de las mezcladoras pasa de {f(p.contexto_lavado.cola_mez.base, 1)} a {f(p.contexto_lavado.cola_mez.esc, 1)} lotes: es el cuello que aparece cuando cada batch ocupa la mezcladora más tiempo.</p>
        </Card>
      )}

      <Card className="mb-4" title="E1 · Base (como es hoy)" sub="Modelo final L7 + L8 con fallas del tablero, arribos y pallets aleatorios y lavado de 30 min por batch · 10 réplicas de 24 h" right={<><Tag kind="real">10 réplicas</Tag><Tag kind="real">Valida: −2,6 % en pallets, −2,1 % en toneladas</Tag></>}>
        {!d1 || !t || !v ? <div className="skeleton h-16 w-full" /> : (
          <div className="grid gap-3 text-[13px] md:grid-cols-4">
            <div><div className="text-muted">Planta [pallets/día]</div><div className="tnum text-[22px] font-extrabold">{f(t.media, 1)}</div><div className="text-[12px] text-muted">IC 95 % [{f(t.ic_inf, 1)} ; {f(t.ic_sup, 1)}]</div></div>
            <div><div className="text-muted">Real del tablero</div><div className="tnum text-[22px] font-extrabold">{f(v.Planta.real, 1)}</div><div className="text-[12px] text-muted">L7 25,8 · L8 39,1</div></div>
            <div><div className="text-muted">Error relativo</div><div className="tnum text-[22px] font-extrabold text-[var(--crit)]">{sg(v.Planta.error_rel_pct, 1)} %</div><div className="text-[12px] text-muted">Por el tamaño del pallet (720 contra 862 kg)</div></div>
            <div><div className="text-muted">Toneladas [t/día]</div><div className="tnum text-[22px] font-extrabold">{f(v.Planta.ton_sim, 1)}</div><div className="text-[12px] text-muted">Real {f(v.Planta.ton_real, 1)} t</div></div>
          </div>
        )}
        <p className="mt-3 text-[12px] leading-relaxed text-muted">Detalle de la validación en Paradas y del intervalo de confianza y el período de calentamiento en Estadística. En toneladas la planta da {f(v?.Planta.ton_sim ?? 0, 1)} t/día contra {f(v?.Planta.ton_real ?? 0, 1)} del tablero: el lavado de 30 min por batch cierra la brecha.</p>
      </Card>

      <Card className="mb-4" title="E4 · Tamaño de batch" sub="Batch de 1200 contra 1500 kg, con lavado de la mezcladora entre batches" right={<><Tag kind="real">5 a 10 réplicas</Tag><Tag kind="real">Lavado real: 30 min</Tag></>}>
        {!e4 ? <div className="skeleton h-24 w-full" /> : (
          <>
            <Table maxH={260} head={[{ label: "Lavado por batch" }, { label: "Pallets/día 1500 kg", right: true }, { label: "Pallets/día 1200 kg", right: true }, { label: "Diferencia (IC 95 % pareado)", right: true }, { label: "Cajas/día 1200 contra 1500", right: true }]}>
              {e4.filas.map((r) => (
                <tr key={r.lavado_min}>
                  <td className="first font-semibold">{r.lavado_min === 0 ? "Sin lavado (modelo base)" : `${r.lavado_min} min`}</td>
                  <td className="num">{f(r.pal_1500.media, 1)} ± {f(r.pal_1500.h, 1)}</td>
                  <td className="num">{f(r.pal_1200.media, 1)} ± {f(r.pal_1200.h, 1)}</td>
                  <td className="num font-bold">{sg(r.dif_pal.media, 1)} [{sg(r.dif_pal.ic_inf, 1)} ; {sg(r.dif_pal.ic_sup, 1)}]</td>
                  <td className="num">{sg(r.dif_cajas_pct, 1)} %</td>
                </tr>
              ))}
            </Table>
            <div className="mt-3 space-y-2 text-[12px] leading-relaxed text-muted">
              <p><b>Lectura:</b> con el lavado real de 30 min, el batch de 1500 kg rinde 4,0 pallets/día más que el de 1200 kg (10 réplicas), porque se lava menos veces por tonelada. Con 15 min la ventaja es de 2,4. Sin lavado (solo sensibilidad) el de 1200 kg gana unos 1,8 por latencia, no por capacidad. El lavado es lo que pone el cuello en las mezcladoras.</p>
              <p><b>Cómo se armó:</b> {e4.descripcion} {e4.nota}</p>
            </div>
          </>
        )}
      </Card>

      <Card className="mb-4" title="Comparación entre escenarios" sub="Pallets por día de la planta: media e IC 95 % de las 10 réplicas">
        {!esc ? <div className="skeleton h-24 w-full" /> : (
          <>
            <Table maxH={300} head={[{ label: "Escenario" }, { label: "Pallets/día", right: true }, { label: "IC 95 %", right: true }, { label: "Cajas/día", right: true }, { label: "Toneladas/día", right: true }]}>
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
            <p className="mt-2 text-[12px] leading-relaxed text-muted">La materia prima entra a 16 pallets de 1500 kg cada 8 h (72 t/día) en E1, E2 y E4, y a 24 pallets por turno en E3. E5 es la prueba de fallas que antes figuraba como E3 (MTTR ×1,25): se midió con el modelo anterior, sin lavado, así que no es comparable con el E1 de hoy; sin efecto en producción porque los acumuladores absorben paros de 10 a 20 minutos.</p>
          </>
        )}
      </Card>
    </Page>
  );
}
