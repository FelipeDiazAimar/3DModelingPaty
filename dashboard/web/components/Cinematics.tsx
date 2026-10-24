"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OC } from "three-stdlib";
import type { EChartsOption } from "echarts";
import { CINES, fichaMaquina, gemela, useCine, vistaMaquina, type Shot } from "@/lib/cine";
import { useStore } from "@/lib/store";
import { duracionSalidaPT, muellePT, poseSalidaPT } from "@/lib/trucks";
import { camionCine } from "@/lib/live3d";
import { byId, STATE_COLOR, STATE_LABEL } from "@/lib/layout";
import { utilization } from "@/lib/derive";
import type { Snapshot } from "@/lib/types";
import { Chart } from "./Chart";
import { Icon } from "./Icons";

// Blender (x, y, z-arriba) -> three (x, z, -y)
const P = (x: number, y: number, z = 0) => new THREE.Vector3(x, z, -y);
const UP = new THREE.Vector3(0, 1, 0);
const smoother = (u: number) => { const v = Math.max(0, Math.min(1, u)); return v * v * v * (v * (v * 6 - 15) + 10); };
const DOCK_CINE = 1;          // muelle de expedición que usa el camión de la cinemática
const VEL_SALIDA = 6;         // la partida se ve a 6 veces la velocidad real (205 s -> 34 s, con el pesaje)

/** Punto de vista de una toma (en coordenadas three). La que sigue al camión se recalcula cada cuadro. */
function vistaToma(shot: Shot, i: number): { p: THREE.Vector3; t: THREE.Vector3 } | null {
  if (shot.pos && shot.target) return { p: P(...shot.pos), t: P(...shot.target) };
  if (shot.maquina) {
    const v = vistaMaquina(shot.maquina, i);
    return v ? { p: P(...v.pos), t: P(...v.target) } : null;
  }
  if (shot.seguirCamion && camionCine.visible) {
    const { x, y, h } = camionCine;
    return { t: P(x, y, 2.5), p: P(x - Math.cos(h) * 24 + Math.sin(h) * 9, y - Math.sin(h) * 24 - Math.cos(h) * 9, 11) };
  }
  return null;
}

/** Corrimiento horizontal del centro de la imagen (px) para que lo que se mira quede en la zona libre. */
function corrimiento(shot: Shot | undefined, ancho: number) {
  if (!shot?.maquina || ancho < 768) return 0;
  return shot.graficas ? 50 : -188;   // ficha a la izquierda (376 px); gráficas a la derecha (476 px)
}

/** Mueve la cámara durante una cinemática. Si el usuario toca el 3D, la cinemática se corta. */
export function CineRig() {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as OC | null;
  const st = useRef<{ i: number; fromP: THREE.Vector3; fromT: THREE.Vector3; goal?: { p: THREE.Vector3; t: THREE.Vector3 } } | null>(null);
  const off = useRef(0);

  useEffect(() => useCine.subscribe((c, prev) => {
    if (c.id && c.id !== prev.id && controls) {
      st.current = { i: 0, fromP: cam.position.clone(), fromT: controls.target.clone() };
    } else if (!c.id) { st.current = null; off.current = 0; cam.clearViewOffset(); }
  }), [cam, controls]);

  useEffect(() => {
    if (!controls) return;
    const ctl = controls as unknown as THREE.EventDispatcher<{ start: object }>;
    const cortar = () => { if (useCine.getState().id) useCine.getState().stop(); };
    ctl.addEventListener("start", cortar);
    return () => ctl.removeEventListener("start", cortar);
  }, [controls]);

  useFrame((_, dt) => {
    const c = useCine.getState();
    const s = st.current;
    if (!c.id || !s || !controls) return;
    const shot = c.shots[s.i];
    if (!shot) { c.stop(); return; }
    const v = vistaToma(shot, s.i);
    // seguimiento suave: el objetivo se acerca de a poco a la vista calculada (no tiembla en las curvas)
    if (v) {
      if (!s.goal) s.goal = { p: v.p.clone(), t: v.t.clone() };
      const k = shot.seguirCamion ? Math.min(1, dt * 2.5) : 1;
      s.goal.p.lerp(v.p, k);
      s.goal.t.lerp(v.t, k);
    }
    const goal = s.goal ?? { p: s.fromP, t: s.fromT };
    const el = (performance.now() - c.t0) / 1000;
    const p = new THREE.Vector3(), t = new THREE.Vector3();
    if (el < shot.viaje) {
      const e = smoother(el / shot.viaje);
      p.lerpVectors(s.fromP, goal.p, e);
      t.lerpVectors(s.fromT, goal.t, e);
      const salto = Math.min(60, s.fromP.distanceTo(goal.p) * 0.18);   // sube en el medio del viaje
      p.addScaledVector(UP, salto * Math.sin(Math.PI * e));
    } else {
      // pausa: gira despacio alrededor del objetivo (no cuando sigue al camión)
      const giro = shot.seguirCamion ? 0 : (el - shot.viaje) * 0.05;
      const o = goal.p.clone().sub(goal.t).applyAxisAngle(UP, giro);
      t.copy(goal.t);
      p.copy(goal.t).add(o);
    }
    cam.position.copy(p);
    controls.target.copy(t);
    // encuadre: corre el centro de la imagen hacia la zona que no tapan la ficha y las gráficas
    off.current += (corrimiento(shot, size.width) - off.current) * Math.min(1, dt * 3);
    if (Math.abs(off.current) > 0.5) cam.setViewOffset(size.width, size.height, off.current, 0, size.width, size.height);
    else cam.clearViewOffset();
    if (el >= shot.viaje + shot.pausa) {
      s.i += 1;
      s.fromP = cam.position.clone();
      s.fromT = controls.target.clone();
      s.goal = undefined;
      if (s.i >= c.shots.length) c.stop();
      else c.setIdx(s.i, performance.now());
    }
  });
  return null;
}

/* ---------- camión de la cinemática: se le saca una pared y el techo, y después parte ---------- */
export function CineTruck() {
  const { scene } = useGLTF("/models/planta_v10.glb");
  const t = useMemo(() => {
    const src = scene.getObjectByName("CamionCine");
    if (!src) return null;
    const g = src.clone(true);
    g.position.set(0, 0, 0); g.rotation.set(0, 0, 0);
    g.traverse((o) => { o.visible = true; });
    const pieza = (n: string) => {
      const o = g.getObjectByName(n);
      if (!o) return null;
      const mats: THREE.Material[] = [];
      o.traverse((x) => {   // material propio para poder desvanecerla sin tocar el resto del modelo
        const m = x as THREE.Mesh;
        if (m.isMesh) {
          m.material = Array.isArray(m.material) ? m.material.map((q) => q.clone()) : m.material.clone();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((q) => { q.transparent = true; mats.push(q); });
        }
      });
      return { o, mats, base: o.position.clone() };
    };
    const raiz = new THREE.Group();
    raiz.add(g);
    raiz.visible = false;
    return { raiz, pared: pieza("CamionCine_Pared_Der"), techo: pieza("CamionCine_Techo") };
  }, [scene]);

  useFrame(() => animarCamionCine(t));
  return t ? <primitive object={t.raiz} /> : null;
}

type Pieza = { o: THREE.Object3D; mats: THREE.Material[]; base: THREE.Vector3 } | null;
function abrir(pz: Pieza, u: number, subir: number, costado: number) {
  if (!pz) return;
  // three: x = x Blender, y = arriba, z = -y Blender
  pz.o.position.set(pz.base.x, pz.base.y + subir * u, pz.base.z - costado * u);
  pz.o.visible = u < 0.99;
  pz.mats.forEach((m) => { m.opacity = 1 - u; m.depthWrite = u < 0.05; });
}

function animarCamionCine(t: { raiz: THREE.Group; pared: Pieza; techo: Pieza } | null) {
  if (!t) return;
  const c = useCine.getState();
  const shot = c.id ? c.shots[c.idx] : undefined;
  const el = (performance.now() - c.t0) / 1000;
  if (!shot?.escena) { t.raiz.visible = false; camionCine.visible = false; return; }
  let pose = muellePT(DOCK_CINE);
  let u = 0;
  if (shot.escena === "camion_abre") u = smoother((el - shot.viaje - 1) / 3);   // se abre al llegar la cámara
  else pose = poseSalidaPT(DOCK_CINE, Math.min(duracionSalidaPT(DOCK_CINE), el * VEL_SALIDA));
  abrir(t.pared, u, 3.2, 2.2);
  abrir(t.techo, u, 4.5, 0);
  t.raiz.visible = true;
  t.raiz.position.copy(P(pose.x, pose.y, 0));
  t.raiz.rotation.set(0, pose.h, 0);
  camionCine.x = pose.x; camionCine.y = pose.y; camionCine.h = pose.h; camionCine.visible = true;
}

/* ---------- botones ---------- */
export function CineButtons() {
  const id = useCine((s) => s.id);
  const play = useCine((s) => s.play);
  const stop = useCine((s) => s.stop);
  return (
    <div className="pointer-events-auto flex gap-1.5 overflow-x-auto md:flex-col">
      {CINES.map((c) => {
        const on = id === c.id;
        return (
          <button key={c.id} onClick={() => (on ? stop() : play(c.id, useStore.getState().history))}
            className={`glass flex shrink-0 items-center gap-2.5 px-3 py-2 text-left transition hover:-translate-y-0.5 ${on ? "ring-2 ring-brand" : ""}`}
            title={c.sub}>
            <span className={`grid h-8 w-8 place-items-center rounded-full ${on ? "bg-brand text-white" : "bg-[#eef3fa] text-ink"}`}>
              <Icon name={on ? "pause" : c.icon} size={17} />
            </span>
            <span className={id ? "hidden" : "hidden md:block"}>
              <span className="block text-[12.5px] font-extrabold leading-tight">{c.label}</span>
              <span className="block text-[11px] leading-tight text-muted">{on ? "Tocá para detener" : c.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- lo que se ve en pantalla durante la cinemática ---------- */
const fmt = (v: number, d = 0) => v.toLocaleString("es-AR", { maximumFractionDigits: d, minimumFractionDigits: d });

function Ficha({ id }: { id: string }) {
  const history = useStore((s) => s.history);
  const f = useMemo(() => fichaMaquina(history, id), [history, id]);
  const m = byId(id);
  if (!m) return null;
  return (
    <div className="glass w-[300px] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[15px] font-extrabold">{m.label} <span className="text-muted">{m.line}</span></div>
        {f && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: STATE_COLOR[f.state] }}>{f.estado}</span>}
      </div>
      {!f ? <p className="mt-2 text-[12px] text-muted">Sin datos de la simulación todavía.</p> : (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
          <div><div className="text-muted">Adentro ahora</div><div className="tnum text-[18px] font-extrabold">{fmt(f.dentro)} <span className="text-[11px] font-semibold text-muted">{f.unidad.adentro}</span></div></div>
          <div><div className="text-muted">Utilización</div><div className="tnum text-[18px] font-extrabold">{fmt(f.u.proc * 100)} %</div><div className="text-[10.5px] text-muted">del tiempo procesando</div></div>
          <div><div className="text-muted">Entradas</div><div className="tnum text-[15px] font-bold">{fmt(f.entradas)} <span className="text-[11px] font-semibold text-muted">{f.unidad.entra}</span></div></div>
          <div><div className="text-muted">Salidas</div><div className="tnum text-[15px] font-bold">{fmt(f.salidas)} <span className="text-[11px] font-semibold text-muted">{f.unidad.sale}</span></div></div>
          <div><div className="text-muted">Ritmo (últimas 2 h)</div><div className="tnum text-[15px] font-bold">{fmt(f.ritmo, 1)} <span className="text-[11px] font-semibold text-muted">{f.unidad.sale}/h</span></div></div>
          <div><div className="text-muted">Tiempo entre salidas</div><div className="tnum text-[15px] font-bold">{f.entreSalidas ? `${fmt(f.entreSalidas, 0)} s` : "—"}</div></div>
          <div className="col-span-2 mt-1 flex h-2 overflow-hidden rounded-full bg-[#e6ecf4]" title="Reparto del tiempo">
            {(["proc", "blocked", "starved", "down", "idle"] as const).map((k) => (
              <div key={k} style={{ width: `${f.u[k] * 100}%`, background: STATE_COLOR[k] }} />
            ))}
          </div>
          <div className="col-span-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-muted">
            {(["proc", "blocked", "starved", "down", "idle"] as const).filter((k) => f.u[k] > 0.005).map((k) => (
              <span key={k}><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: STATE_COLOR[k] }} />{STATE_LABEL[k]} {fmt(f.u[k] * 100)} %</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Estados por media hora simulada (fracción del tiempo en cada estado). */
function estadosEnElTiempo(h: Snapshot[], id: string) {
  const bins = new Map<number, Record<string, number>>();
  for (const s of h) {
    const st = s.machines[id]?.state;
    if (!st) continue;
    const b = Math.floor(s.t / 1800);
    const r = bins.get(b) ?? { proc: 0, blocked: 0, starved: 0, down: 0, idle: 0, n: 0 };
    r[st] = (r[st] ?? 0) + 1; r.n += 1;
    bins.set(b, r);
  }
  const ks = [...bins.keys()].sort((a, b) => a - b).slice(-48);
  return { x: ks.map((b) => (b * 0.5).toFixed(1)), rows: ks.map((b) => bins.get(b)!) };
}

function Graficas({ id }: { id: string }) {
  const history = useStore((s) => s.history);
  const g = gemela(id);
  const uSal = fichaMaquina(history, id)?.unidad.sale ?? "ítems";
  const opts = useMemo(() => {
    const e = estadosEnElTiempo(history, id);
    const estados: EChartsOption = {
      grid: { left: 40, right: 10, top: 30, bottom: 30 },
      legend: { top: 0, itemWidth: 10, itemHeight: 8, textStyle: { fontSize: 10 } },
      xAxis: { type: "category", data: e.x, name: "h", nameGap: 4, axisLabel: { fontSize: 10 } },
      yAxis: { type: "value", max: 100, axisLabel: { formatter: "{value} %", fontSize: 10 } },
      series: (["proc", "blocked", "starved", "down", "idle"] as const).map((k) => ({
        name: STATE_LABEL[k], type: "bar", stack: "e", barCategoryGap: "10%", color: STATE_COLOR[k],
        data: e.rows.map((r) => (r.n ? (100 * (r[k] ?? 0)) / r.n : 0)),
      })),
    };
    const serie = (mid: string) => history.filter((_, i) => i % 6 === 0).map((s) => [s.t / 3600, s.machines[mid]?.out ?? 0]);
    const prod: EChartsOption = {
      grid: { left: 50, right: 10, top: 30, bottom: 30 },
      legend: { top: 0, textStyle: { fontSize: 10 } },
      xAxis: { type: "value", name: "h", nameGap: 4, axisLabel: { fontSize: 10 } },
      yAxis: { type: "value", name: uSal, nameTextStyle: { fontSize: 10 }, axisLabel: { fontSize: 10 } },
      series: [
        { name: `${byId(id)?.label} ${byId(id)?.line}`, type: "line", showSymbol: false, data: serie(id), color: "#d9293b" },
        ...(g && byId(g) ? [{ name: `${byId(g)?.label} ${byId(g)?.line}`, type: "line" as const, showSymbol: false, data: serie(g), color: "#2b59ff" }] : []),
      ],
    };
    const u = utilization(history, id);
    const reparto: EChartsOption = {
      tooltip: { trigger: "item", valueFormatter: (v) => `${v} %` },
      series: [{
        type: "pie", radius: ["45%", "75%"], label: { fontSize: 10, formatter: "{b}\n{d} %" },
        data: (["proc", "blocked", "starved", "down", "idle"] as const).filter((k) => u[k] > 0.005)
          .map((k) => ({ name: STATE_LABEL[k], value: Math.round(u[k] * 1000) / 10, itemStyle: { color: STATE_COLOR[k] } })),
      }],
    };
    return { estados, prod, reparto };
  }, [history, id, g, uSal]);
  return (
    <div className="glass flex w-[min(460px,92vw)] flex-col gap-1 p-3">
      <div className="px-1 text-[12px] font-extrabold">Estados en el tiempo <span className="font-semibold text-muted">(% de cada media hora simulada)</span></div>
      <Chart option={opts.estados} height={150} />
      <div className="px-1 text-[12px] font-extrabold">Producción acumulada <span className="font-semibold text-muted">({uSal}{g ? ", contra la gemela de la otra línea" : ""})</span></div>
      <Chart option={opts.prod} height={140} />
      <div className="px-1 text-[12px] font-extrabold">Cómo reparte el tiempo <span className="font-semibold text-muted">(% desde el inicio)</span></div>
      <Chart option={opts.reparto} height={150} />
    </div>
  );
}

export function CineOverlay() {
  const id = useCine((s) => s.id);
  const shots = useCine((s) => s.shots);
  const idx = useCine((s) => s.idx);
  const stop = useCine((s) => s.stop);
  if (!id) return null;
  const shot = shots[idx];
  const c = CINES.find((x) => x.id === id);
  if (!shot || !c) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute left-1/2 top-[86px] flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink/85 px-4 py-1.5 text-white shadow-lg">
        <span className="text-[12px] font-bold">{c.label}</span>
        <span className="tnum text-[11px] opacity-75">{idx + 1} / {shots.length}</span>
        <button onClick={stop} className="pointer-events-auto rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold hover:bg-white/25">Detener</button>
      </div>
      <div className="absolute bottom-6 left-1/2 w-[min(620px,92vw)] -translate-x-1/2">
        <div key={idx} className="glass cine-in px-5 py-3 text-center">
          <div className="text-[17px] font-extrabold tracking-tight">{shot.titulo}</div>
          {shot.texto && <div className="mt-0.5 text-[13px] text-muted">{shot.texto}</div>}
        </div>
      </div>
      {shot.maquina && (
        <div key={`f${idx}`} className="cine-in absolute left-[76px] top-[96px] hidden md:block">
          <Ficha id={shot.maquina} />
        </div>
      )}
      {shot.maquina && shot.graficas && (
        <div key={`g${idx}`} className="cine-in absolute right-4 top-[96px] max-h-[calc(100%-200px)] overflow-hidden">
          <Graficas id={shot.maquina} />
        </div>
      )}
    </div>
  );
}
