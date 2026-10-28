"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";
import { FLEET, MACHINES, STAGES, STAGE_LABEL, STATE_COLOR, byId } from "@/lib/layout";
import type { LayoutItem } from "@/lib/types";
import { forklifts } from "@/lib/live3d";
import { EDGES, NODES } from "@/lib/network";
import { useCine } from "@/lib/cine";
import { clock, indexAt, useStore } from "@/lib/store";

/**
 * Recorrido a pie por la planta: operario en 1ª o 3ª persona (caminar, correr, saltar), interacción con las
 * máquinas y montacargas / camión manejables. Colisiones por raycast contra la planta (BVH armado a demanda,
 * solo para lo que está cerca). Coordenadas three: Blender (x, y) -> three (x, -y).
 */

const PLANTA = "/models/planta_v10.glb";
const WALK = 1.8, RUN = 4.5, GRAV = 20, JUMP = 5.5; // m/s, m/s², m/s
const RADIO = 0.35, PASO = 0.5;                    // radio del operario; escalón que sube caminando (m)
const UP = new THREE.Vector3(0, 1, 0);

/* ---------- estado del recorrido (persiste entre entradas y salidas del modo) ---------- */
const keys = new Set<string>();
// teclas de un toque: se atienden en el próximo cuadro aunque se suelten antes; ir / punto = viaje pedido (punto de interés o clic en el plano)
const press = { e: false, jump: false, gesto: null as string | null, ir: null as string | null, punto: null as THREE.Vector3 | null, traer: null as "montacargas" | "camion" | null };

/** Gestos del operario (como los "emotes" del robot de webgl_animation_skinning_morph de three.js): clip del GLB, etiqueta y tecla. */
export const GESTOS = [
  { clip: "Wave", label: "Saludar", key: "1" },
  { clip: "Yes", label: "Sí", key: "2" },
  { clip: "No", label: "No", key: "3" },
  { clip: "Dance", label: "Bailar", key: "4" },
] as const;
export const hacerGesto = (clip: string) => { press.gesto = clip; };
/** Pide un vehículo: aparece al lado del operario y lo sube a manejar. */
export const traerVehiculo = (t: "montacargas" | "camion") => { press.traer = t; };

/* ---------- sonidos sintetizados (sin archivos): bocina y pitido de marcha atrás ---------- */
let audio: AudioContext | null = null;
/** El navegador solo deja crear el audio después de un gesto del usuario: se llama desde teclas y botones. */
function prenderAudio() {
  try { audio ??= new AudioContext(); if (audio.state === "suspended") void audio.resume(); } catch { audio = null; }
}
function tono(freq: number, dur: number, tipo: OscillatorType = "square", vol = 0.06) {
  if (!audio) return;
  const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
  o.type = tipo; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(audio.destination);
  o.start(t); o.stop(t + dur);
}
const bocina = () => { tono(311, 0.55, "sawtooth"); tono(392, 0.55, "sawtooth"); };
const pitido = { t: 0 }; // cuánto falta para el próximo "bip" de marcha atrás
export const irAMaquina = (id: string) => { press.ir = id; };

/** Puntos de interés (como los de Shapespark): las etapas de una línea, cada una con su primera máquina. */
export const puntosDeInteres = (linea: "L7" | "L8") =>
  STAGES.map((st) => MACHINES.find((m) => m.line === linea && m.stage === st)).filter((m): m is LayoutItem => !!m);

/** Viaje en arco hasta un punto (puntos de interés y clic en el plano): ~1 s, pasa por encima de lo que haya en el medio. */
const viaje = { a: new THREE.Vector3(), b: new THREE.Vector3(), yaw0: 0, yaw1: 0, t: 1 };
function irA(p: THREE.Vector3, yaw: number) {
  viaje.a.copy(me.pos); viaje.b.copy(p);
  viaje.yaw0 = look.yaw;
  viaje.yaw1 = look.yaw + Math.atan2(Math.sin(yaw - look.yaw), Math.cos(yaw - look.yaw)); // por el giro más corto
  viaje.t = 0;
}

/** Vista de plano: cámara desde arriba con el norte hacia arriba; WASD la desplaza, la rueda acerca y aleja. */
const plano = { c: new THREE.Vector3(), alt: 160 };
export function abrirPlano(abrir: boolean) {
  if (abrir) {
    plano.c.copy(live.veh ? live.veh.obj.position : me.pos).setY(0);
    plano.alt = 160;
    if (document.pointerLockElement) document.exitPointerLock();
  }
  useStore.getState().setPlan(abrir);
}
const gesto = { clip: null as string | null, t: 0 }; // gesto en curso y cuánto le queda (s); el baile sigue hasta moverse
const look = { yaw: Math.PI / 2, pitch: -0.12 }; // yaw 0 = mirar hacia -z; a pie es absoluto, manejando es relativo al vehículo
// arranca en el pasillo central entre L7 y L8 (Blender (0, -4)), fuera de las rutas de los montacargas, mirando al oeste
const me = { pos: new THREE.Vector3(0, 0, 4), vy: 0, onGround: true, ry: -Math.PI / 2, interact: 0, floor: 0 };

interface Veh { id: string; label: string; obj: THREE.Object3D; fwd: THREE.Vector3; cx: number; half: number; side: number; vmax: number; speed: number; eye: THREE.Vector3; seat?: THREE.Vector3; dist: number }
let truck: Veh | null = null;
const live = { veh: null as Veh | null }; // vehículo que se maneja ahora: lo leen el minimapa y el velocímetro

/** Rumbo de la cámara (yaw absoluto) y frente del vehículo en coordenadas three. */
const frente = (v: Veh, out = new THREE.Vector3()) => out.copy(v.fwd).applyAxisAngle(UP, v.obj.rotation.y);
const yawCamara = () => { const v = live.veh; if (!v) return look.yaw; const d = frente(v); return look.yaw + Math.atan2(-d.x, -d.z); };

/* ---------- colisiones ---------- */
interface Solid { mesh: THREE.Mesh; c: THREE.Vector3; r: number }
const ray = new THREE.Raycaster();
ray.firstHitOnly = true;
ray.layers.enableAll(); // en modo rendimiento las piezas originales de la planta quedan en otra capa
let near: THREE.Mesh[] = [];

function sólidos(root: THREE.Object3D): Solid[] {
  root.updateWorldMatrix(true, true);
  const out: Solid[] = [];
  root.traverseVisible((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh) return;
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    const s = m.geometry.boundingSphere!.clone().applyMatrix4(m.matrixWorld);
    out.push({ mesh: m, c: s.center, r: s.radius });
  });
  return out;
}

/** Lo que está a menos de 30 m: arma su BVH la primera vez (así no se traba al entrar con las 7000 mallas). */
function cerca(all: Solid[], p: THREE.Vector3) {
  near = [];
  for (const s of all) {
    if (s.c.distanceTo(p) - s.r > 30) continue;
    const g = s.mesh.geometry as THREE.BufferGeometry & { boundsTree?: MeshBVH };
    if (!g.boundsTree) g.boundsTree = new MeshBVH(g);
    s.mesh.raycast = acceleratedRaycast;
    near.push(s.mesh);
  }
}

function golpe(from: THREE.Vector3, dir: THREE.Vector3, far: number) {
  ray.set(from, dir);
  ray.far = far;
  return ray.intersectObjects(near, false)[0];
}
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
/** Altura del piso bajo p (busca desde un escalón arriba, así no toma techos ni entrepisos). */
function piso(p: THREE.Vector3) {
  const h = golpe(tmp.copy(p).setY(p.y + PASO), tmp2.set(0, -1, 0), 60);
  return h ? h.point.y : 0;
}
/** ¿Hay algo a menos de `d` en la dirección `dir` a las alturas dadas? */
function choca(p: THREE.Vector3, dir: THREE.Vector3, d: number, alturas: number[]) {
  return alturas.some((y) => !!golpe(tmp.copy(p).setY(p.y + y), dir, d));
}

const eje = (a: string[], b: string[]) => (a.some((k) => keys.has(k)) ? 1 : 0) - (b.some((k) => keys.has(k)) ? 1 : 0);

/** Distancia horizontal de p al rectángulo de una máquina (coordenadas Blender). */
export function distRect(px: number, py: number, m: { x: number; y: number; sx: number; sy: number }) {
  return Math.hypot(Math.max(Math.abs(px - m.x) - m.sx / 2, 0), Math.max(Math.abs(py - m.y) - m.sy / 2, 0));
}

/** Lugar libre a 1,6 m de un costado de la máquina (prueba los cuatro), mirándola. */
function frenteDe(m: LayoutItem, all: Solid[]) {
  const c = new THREE.Vector3(m.x, 0, -m.y);
  cerca(all, c);
  const lados: [number, number][] = [[0, -(m.sy / 2 + 1.6)], [0, m.sy / 2 + 1.6], [-(m.sx / 2 + 1.6), 0], [m.sx / 2 + 1.6, 0]];
  const dirs = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)];
  let p: THREE.Vector3 | null = null;
  for (const [dx, dy] of lados) {
    const q = new THREE.Vector3(m.x + dx, 3, -(m.y + dy));
    q.y = piso(q);
    if (q.y < 0.6 && !dirs.some((d) => choca(q, d, RADIO + 0.1, [0.6, 1.4]))) { p = q; break; }
  }
  p ??= new THREE.Vector3(m.x + lados[0][0], 0, -(m.y + lados[0][1])); // todo ocupado: el primero igual
  return { p, yaw: Math.atan2(-(c.x - p.x), -(c.z - p.z)) };
}

/* ---------- vehículos ---------- */
const vehs = new Map<string, Veh>();
function montacargas(id: string): Veh | null {
  const obj = forklifts.get(id);
  if (!obj) return null;
  let v = vehs.get(id);
  // modelo de Scene3D (escala 1,35, frente +z): asiento en (0, 1,04, -0,4)
  if (!v) vehs.set(id, v = { id, label: FLEET.find((f) => f.id === id)?.label ?? "montacargas", obj, fwd: new THREE.Vector3(0, 0, 1), cx: 0, half: 1.9, side: 1.4, vmax: 4, speed: 0,
    eye: new THREE.Vector3(0, 1.6, -0.3), seat: new THREE.Vector3(0, 0.47, -0.4), dist: 6 });
  v.obj = obj;
  return v;
}

/** Montacargas propio para pedir con F: copia de uno de los de la simulación, que siguen en sus rutas. */
let propio: THREE.Object3D | null = null;
function montacargasPropio(scene: THREE.Object3D) {
  const molde = forklifts.get(FLEET[0].id);
  if (!propio && molde) propio = molde.clone(true);
  if (!propio) return null;
  if (!propio.parent) scene.add(propio);
  forklifts.set("propio", propio as THREE.Group);
  return montacargas("propio");
}

/** Camión manejable: el mismo del modelo (cabina hacia +x local), estacionado donde la planta tiene el que espera la báscula. */
function armarCamion(plant: THREE.Object3D): Veh | null {
  const src = plant.getObjectByName("Camion_Bascula_Ingreso");
  const spot = plant.getObjectByName("Camion_Espera_Bascula");
  if (!src) return null;
  const c = src.clone(true);
  c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.scale.set(1, 1, 1);
  c.traverse((o) => { o.visible = true; });
  c.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(c);
  const g = new THREE.Group();
  g.add(c);
  if (spot) {
    spot.updateWorldMatrix(true, false);
    g.position.setFromMatrixPosition(spot.matrixWorld);
    const x = new THREE.Vector3(1, 0, 0).transformDirection(spot.matrixWorld);
    g.rotation.y = Math.atan2(-x.z, x.x);
  }
  return { id: "camion", label: "camión", obj: g, fwd: new THREE.Vector3(1, 0, 0), cx: (box.max.x + box.min.x) / 2, half: (box.max.x - box.min.x) / 2,
    side: (box.max.z - box.min.z) / 2 + 0.9, vmax: 11, speed: 0, // ojo apenas delante del parabrisas: la cabina del modelo es maciza por dentro
    eye: new THREE.Vector3(box.max.x + 0.15, 2.4, -0.55), dist: 20 };
}

/** Caminar <-> correr en fase (como webgl_animation_skinning_blending de three.js): sigue pisando el mismo pie. */
function enFase(prev: THREE.AnimationAction, next: THREE.AnimationAction) {
  next.time = (prev.time / prev.getClip().duration) * next.getClip().duration;
}

/* ---------- escena ---------- */
export default function Walk() {
  const { scene: plant } = useGLTF(PLANTA);
  const { scene: op, animations } = useGLTF("/models/operario.glb");
  const body = useRef<THREE.Group>(null!);
  const blob = useRef<THREE.Mesh>(null!);
  const { actions } = useAnimations(animations, body);
  const get = useThree((s) => s.get);
  const all = useMemo(() => sólidos(plant), [plant]);
  useMemo(() => { truck ??= armarCamion(plant); }, [plant]);
  const clip = useRef("");
  const lastNear = useRef(-1);
  const lastSel = useRef<string | null>(null);

  useEffect(() => {
    op.traverse((o) => { o.frustumCulled = false; }); // malla con esqueleto: su caja no sigue a la animación
    for (const c of ["Jump", "Wave", "Yes", "No"]) actions[c]?.setLoop(THREE.LoopOnce, 1);
  }, [op, actions]);

  // al entrar: cámara de persona, sin cinemáticas; al salir: vuelve la vista orbital
  useEffect(() => {
    useCine.getState().stop();
    const { camera, gl } = get();
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 70; cam.updateProjectionMatrix();
    const el = gl.domElement;
    const lock = (e: MouseEvent) => {
      if (!useStore.getState().plan) { if (document.pointerLockElement !== el) el.requestPointerLock(); return; }
      // en el plano: clic en el piso para ir ahí, o sobre una máquina para pararse frente a ella
      const r = el.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), get().camera);
      ray.far = Infinity;
      const h = ray.intersectObjects(all.map((x) => x.mesh), false)[0];
      if (!h) return;
      const m = MACHINES.find((mm) => distRect(h.point.x, -h.point.z, mm) < 0.3);
      if (m) press.ir = m.id; else press.punto = h.point.clone();
      abrirPlano(false);
    };
    const rueda = (e: WheelEvent) => {
      if (!useStore.getState().plan) return;
      e.preventDefault();
      plano.alt = THREE.MathUtils.clamp(plano.alt * (1 + e.deltaY * 0.0012), 25, 900);
    };
    const mm = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      look.yaw -= e.movementX * 0.0024;
      look.pitch = THREE.MathUtils.clamp(look.pitch - e.movementY * 0.0024, -1.35, 1.2);
    };
    const kd = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keys.add(e.code);
      if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
      if (e.repeat) return;
      const st = useStore.getState();
      if (e.code === "KeyE") press.e = true;
      if (e.code === "Space") press.jump = true;
      const g = GESTOS.find((x) => e.code === `Digit${x.key}`);
      if (g) press.gesto = g.clip;
      if (e.code === "KeyV" || e.code === "KeyC") st.setView(st.view === "1p" ? "3p" : "1p");
      if (e.code === "KeyM") abrirPlano(!st.plan);
      prenderAudio();
      if (e.code === "KeyF") press.traer = "montacargas";
      if (e.code === "KeyG") press.traer = "camion";
      if (e.code === "KeyH" && st.driving) bocina();
      if (e.code === "Escape" && !document.pointerLockElement) { if (st.plan) abrirPlano(false); else st.setMode("orbit"); }
    };
    const ku = (e: KeyboardEvent) => keys.delete(e.code);
    const blur = () => keys.clear();
    el.addEventListener("click", lock);
    el.addEventListener("wheel", rueda, { passive: false });
    window.addEventListener("mousemove", mm);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    return () => {
      el.removeEventListener("click", lock);
      el.removeEventListener("wheel", rueda);
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", blur);
      keys.clear();
      if (document.pointerLockElement === el) document.exitPointerLock();
      cam.fov = 32; cam.updateProjectionMatrix();
      cam.position.set(86, 66, 86);
      if (propio) { propio.removeFromParent(); forklifts.delete("propio"); }
    };
  }, [get, all]);

  useFrame(({ camera: cam, scene }, rawDt) => {
    const cam3 = truck;
    const dt = Math.min(rawDt, 0.25); // los rayos cubren el paso entero: aguanta cuadros lentos sin atravesar paredes
    const st = useStore.getState();
    let veh = st.driving === "camion" ? cam3 : st.driving ? montacargas(st.driving) : null;
    if (st.driving && !veh) st.setDriving(null);
    // en el plano, elegir una máquina por su pin lleva hasta ella
    if (st.plan && st.selected && st.selected !== lastSel.current && byId(st.selected)) { press.ir = st.selected; abrirPlano(false); }
    lastSel.current = st.selected;
    if (press.ir || press.punto) {
      if (veh) { veh.speed = 0; st.setDriving(null); veh = null; }
      const m = press.ir ? byId(press.ir) : undefined;
      if (m) { const d = frenteDe(m, all); irA(d.p, d.yaw); st.select(m.id); }
      else if (press.punto) { const q = press.punto.setY(3); cerca(all, q); q.y = piso(q); irA(q, look.yaw); }
      press.ir = null; press.punto = null;
      lastNear.current = -1;
      plano.c.set(viaje.b.x, 0, viaje.b.z); // si el plano está abierto, que muestre el destino
    }
    if (press.traer) {
      const tipo = press.traer;
      press.traer = null;
      const v = tipo === "camion" ? cam3 : montacargasPropio(scene);
      if (v && v !== veh) {
        if (veh) veh.speed = 0;
        const yaw = yawCamara();
        const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        const der = new THREE.Vector3(-fwd.z, 0, fwd.x);
        // alineado con la dirección elegida; su centro, a 1,5 m del operario más medio largo del vehículo
        const c = 1.5 + v.half;
        const libre = [fwd, der, der.clone().negate(), fwd.clone().negate()].find((d) => !choca(me.pos, d, c + v.half + 0.5, [0.8]));
        if (libre || tipo === "montacargas") { // el camión, si no entra en ningún lado, se lo maneja donde está
          const d = libre ?? fwd;
          v.obj.position.copy(me.pos).addScaledVector(d, c);
          v.obj.position.y = piso(v.obj.position);
          v.obj.rotation.y = Math.atan2(d.x, d.z) - Math.atan2(v.fwd.x, v.fwd.z);
        }
        v.speed = 0;
        look.yaw = 0;
        st.setDriving(v.id);
        veh = v;
        lastNear.current = -1;
      }
    }
    live.veh = veh;
    const enPlano = useStore.getState().plan;
    const ref = veh ? veh.obj.position : me.pos;
    // BVH y lista de cercanos: se renuevan cada ~5 m recorridos (en pleno viaje no: armaría BVH de todo lo que sobrevuela)
    const k = Math.round(ref.x / 5) * 10007 + Math.round(ref.z / 5);
    if (viaje.t >= 1 && k !== lastNear.current) { lastNear.current = k; cerca(all, ref); }

    const f = enPlano ? 0 : eje(["KeyW", "ArrowUp"], ["KeyS", "ArrowDown"]);
    const s = enPlano ? 0 : eje(["KeyD", "ArrowRight"], ["KeyA", "ArrowLeft"]);
    const run = keys.has("ShiftLeft") || keys.has("ShiftRight");
    let moving = false;

    if (veh) {
      /* ----- manejando: acelera / frena con W-S, dobla con A-D ----- */
      veh.speed += f * (veh.speed * f < 0 ? 9 : 3) * dt;
      if (!f) veh.speed *= 1 - Math.min(1, dt * 1.2);
      veh.speed = THREE.MathUtils.clamp(veh.speed, -veh.vmax * 0.4, veh.vmax * (run ? 1.4 : 1));
      veh.obj.rotation.y -= s * 0.9 * dt * THREE.MathUtils.clamp(veh.speed / 3, -1, 1);
      const dir = tmp2.copy(veh.fwd).applyAxisAngle(UP, veh.obj.rotation.y);
      const centro = veh.obj.position.clone().addScaledVector(dir, veh.cx);
      const paso = veh.speed * dt;
      const sentido = dir.clone().multiplyScalar(Math.sign(paso) || 1);
      if (Math.abs(paso) > 1e-4 && choca(centro, sentido, veh.half + Math.abs(paso) + 0.2, [0.6, 1.4])) veh.speed = 0;
      else veh.obj.position.addScaledVector(dir, paso);
      veh.obj.position.y = piso(veh.obj.position);
      if (veh.speed < -0.2) { pitido.t -= dt; if (pitido.t <= 0) { tono(1050, 0.22); pitido.t = 0.9; } }
      else pitido.t = 0;
      // el operario va sentado en el montacargas (en el camión queda adentro de la cabina)
      if (veh.seat) { me.pos.copy(veh.obj.localToWorld(veh.seat.clone())); me.ry = veh.obj.rotation.y; }
      else me.pos.copy(veh.obj.position);
    } else if (viaje.t < 1) {
      /* ----- viajando a un punto de interés o a donde se tocó en el plano ----- */
      viaje.t = Math.min(1, viaje.t + dt / 1.1);
      const u = viaje.t * viaje.t * (3 - 2 * viaje.t);
      me.pos.lerpVectors(viaje.a, viaje.b, u);
      me.pos.y += Math.sin(Math.PI * u) * Math.min(viaje.a.distanceTo(viaje.b) * 0.2, 25);
      look.yaw = viaje.yaw0 + (viaje.yaw1 - viaje.yaw0) * u;
      me.ry = look.yaw + Math.PI; // de espaldas a la cámara, mirando hacia donde va
      me.vy = 0; me.onGround = true; me.floor = viaje.b.y;
    } else {
      /* ----- a pie ----- */
      const fwd = new THREE.Vector3(-Math.sin(look.yaw), 0, -Math.cos(look.yaw));
      const right = new THREE.Vector3(Math.cos(look.yaw), 0, -Math.sin(look.yaw));
      const mv = fwd.multiplyScalar(f).addScaledVector(right, s);
      if (mv.lengthSq() > 0) {
        moving = true;
        mv.normalize();
        const step = (run ? RUN : WALK) * dt;
        // eje por eje: si choca en x todavía puede deslizar por z (y al revés)
        for (const [ax, d] of [[new THREE.Vector3(Math.sign(mv.x), 0, 0), mv.x * step], [new THREE.Vector3(0, 0, Math.sign(mv.z)), mv.z * step]] as const) {
          if (Math.abs(d) < 1e-5) continue;
          if (!choca(me.pos, ax, RADIO + Math.abs(d), [0.6, 1.4])) me.pos.addScaledVector(ax, Math.abs(d));
        }
        let da = Math.atan2(mv.x, mv.z) - me.ry;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        me.ry += da * Math.min(1, dt * 12);
      }
      if (press.jump && me.onGround) { me.vy = JUMP; me.onGround = false; actions.Jump?.reset(); }
      press.jump = false;
      const yAntes = me.pos.y;
      me.pos.y += me.vy * dt - 0.5 * GRAV * dt * dt; // exacto con gravedad constante: el salto no depende de los cuadros por segundo
      me.vy -= GRAV * dt;
      // el piso se busca desde la altura previa: con cuadros lentos la caída de un cuadro puede pasar por debajo del suelo
      const y0 = piso(new THREE.Vector3(me.pos.x, Math.max(yAntes, me.pos.y), me.pos.z));
      me.floor = y0;
      if (me.pos.y <= y0) { me.pos.y = y0; me.vy = 0; me.onGround = true; }
      else if (me.pos.y - y0 > 0.08) me.onGround = false;
      me.interact = Math.max(0, me.interact - dt);
      // gestos: solo parado en el piso; moverse o saltar los corta
      if (press.gesto && me.onGround && !moving) {
        const dur = actions[press.gesto]?.getClip().duration ?? 1;
        gesto.clip = press.gesto;
        gesto.t = press.gesto === "Dance" ? Infinity : dur - 0.15; // termina un poco antes para fundirse sin volver a la pose de reposo
      }
      gesto.t -= dt;
      if (moving || !me.onGround || gesto.t <= 0) gesto.clip = null;
    }
    press.gesto = null;
    if (veh) gesto.clip = null;

    /* ----- modelo y animación ----- */
    const g = body.current;
    g.position.copy(me.pos);
    g.rotation.y = me.ry;
    g.visible = enPlano || (st.view === "3p" && !(veh && !veh.seat));
    // sombra de contacto: se achica y aclara con la altura del salto
    const alto = Math.min(1, (me.pos.y - me.floor) / 1.2);
    blob.current.visible = g.visible && !veh;
    blob.current.position.set(me.pos.x, me.floor + 0.03, me.pos.z);
    blob.current.scale.setScalar(enPlano ? plano.alt / 30 : 1 - alto * 0.45); // en el plano, marca grande de "estás acá"
    const want = veh ? "Sit" : !me.onGround ? "Jump" : moving ? (run ? "Run" : "Walk") : me.interact > 0 ? "Interact" : gesto.clip ?? "Idle";
    if (want !== clip.current) {
      const prev = actions[clip.current], next = actions[want];
      next?.reset();
      if (prev && next && ["Walk", "Run"].includes(clip.current) && ["Walk", "Run"].includes(want)) enFase(prev, next);
      prev?.fadeOut(0.18);
      next?.fadeIn(0.18).play();
      clip.current = want;
    }

    /* ----- qué hay a mano para la tecla E ----- */
    let target: { kind: "veh"; v: Veh } | { kind: "maq"; id: string; label: string } | null = null;
    if (!veh) {
      const cands = [...FLEET.map((fl) => montacargas(fl.id)), propio?.parent ? montacargas("propio") : null, cam3].filter((v): v is Veh => !!v);
      let best = 2.6;
      for (const v of cands) {
        const dir = tmp.copy(v.fwd).applyAxisAngle(UP, v.obj.rotation.y);
        // distancia al eje del vehículo (un segmento de su largo), menos su medio ancho
        const a = v.obj.position.clone().addScaledVector(dir, v.cx - v.half), b = v.obj.position.clone().addScaledVector(dir, v.cx + v.half);
        const d = new THREE.Line3(a.setY(0), b.setY(0)).closestPointToPoint(me.pos.clone().setY(0), true, new THREE.Vector3()).distanceTo(me.pos.clone().setY(0)) - (v.side - 0.9);
        if (d < best) { best = d; target = { kind: "veh", v }; }
      }
      if (!target) {
        let bm = 1.6;
        for (const m of MACHINES) {
          const d = distRect(me.pos.x, -me.pos.z, m);
          if (d < bm) { bm = d; target = { kind: "maq", id: m.id, label: `${m.label}${m.line !== "Común" ? ` · ${m.line}` : ""}` }; }
        }
      }
    }
    const hint = veh ? `E · bajarse del ${veh.label}` : target?.kind === "veh" ? `E · subir al ${target.v.label}` : target ? `E · ver ${target.label}` : null;
    if (hint !== st.hint) st.setHint(hint);

    if (press.e) {
      press.e = false;
      if (veh) { // bajarse por el costado izquierdo
        const dir = tmp.copy(veh.fwd).applyAxisAngle(UP, veh.obj.rotation.y);
        const izq = new THREE.Vector3(dir.z, 0, -dir.x);
        me.pos.copy(veh.obj.position).addScaledVector(dir, veh.cx + (veh.seat ? 0 : veh.half - 2)).addScaledVector(izq, -veh.side);
        me.vy = 0;
        look.yaw += Math.atan2(-dir.x, -dir.z);
        veh.speed = 0;
        st.setDriving(null);
      } else if (target?.kind === "veh") {
        look.yaw = 0; // cámara detrás del vehículo
        st.setDriving(target.v.id);
      } else if (target) {
        st.select(st.selected === target.id ? null : target.id);
        me.interact = 0.9;
        actions.Interact?.reset();
      }
    }

    /* ----- cámara ----- */
    const pc = cam as THREE.PerspectiveCamera, fov = enPlano ? 45 : 70;
    if (pc.fov !== fov) { pc.fov = fov; pc.updateProjectionMatrix(); }
    if (enPlano) {
      const pan = plano.alt * 0.9 * dt;
      plano.c.x += eje(["KeyD", "ArrowRight"], ["KeyA", "ArrowLeft"]) * pan;
      plano.c.z -= eje(["KeyW", "ArrowUp"], ["KeyS", "ArrowDown"]) * pan;
      cam.position.set(plano.c.x, plano.alt, plano.c.z + 0.01); // apenas corrida al sur: el norte queda arriba en pantalla
      cam.lookAt(plano.c);
      return;
    }
    const yaw = yawCamara();
    const lookDir = new THREE.Vector3(-Math.sin(yaw) * Math.cos(look.pitch), Math.sin(look.pitch), -Math.cos(yaw) * Math.cos(look.pitch));
    if (st.view === "1p") {
      cam.position.copy(veh ? veh.obj.localToWorld(veh.eye.clone()) : me.pos.clone().setY(me.pos.y + 1.62));
      cam.lookAt(tmp.copy(cam.position).add(lookDir));
    } else {
      const tgt = veh ? veh.obj.position.clone().addScaledVector(tmp2.copy(veh.fwd).applyAxisAngle(UP, veh.obj.rotation.y), veh.cx).setY(veh.obj.position.y + 2.2) : me.pos.clone().setY(me.pos.y + 1.5);
      let dist = veh ? veh.dist : 3.6;
      const back = lookDir.clone().negate();
      const h = golpe(tgt, back, dist);
      if (h && !veh) dist = Math.max(0.6, h.distance - 0.25); // que la pared no se meta entre la cámara y el operario
      cam.position.copy(tgt).addScaledVector(back, dist);
      cam.lookAt(tgt);
    }
  });

  return (
    <>
      {truck && <primitive object={truck.obj} />}
      <group ref={body}><primitive object={op} /></group>
      <mesh ref={blob} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[0.34, 24]} />
        <meshBasicMaterial color="#0b1424" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </>
  );
}

/* ---------- interfaz sobre el 3D ---------- */
const Key = ({ k }: { k: string }) => (
  <kbd className="inline-grid h-[22px] min-w-[22px] place-items-center rounded-md border border-[#cfd8e6] bg-white px-1.5 text-[11px] font-extrabold text-ink shadow-[0_1.5px_0_#cfd8e6]">{k}</kbd>
);

const MAPA = 168, RADIO_MAPA = 45; // px; metros que muestra el minimapa del centro al borde
const GAUGE = 2 * Math.PI * 50;    // perímetro del arco del velocímetro

/** Minimapa girado según el rumbo (adelante = arriba), como el GPS de un auto. Coordenadas Blender. */
function dibujarMapa(ctx: CanvasRenderingContext2D) {
  const v = live.veh;
  const p = v ? v.obj.position : me.pos;
  const px = p.x, py = -p.z;
  const yaw = yawCamara();
  const hx = -Math.sin(yaw), hy = Math.cos(yaw); // adelante, en Blender
  const R = MAPA / 2, k = R / RADIO_MAPA;
  const to = (x: number, y: number): [number, number] => {
    const dx = x - px, dy = y - py;
    return [R + (dx * hy - dy * hx) * k, R - (dx * hx + dy * hy) * k];
  };
  ctx.clearRect(0, 0, MAPA, MAPA);
  ctx.save();
  ctx.beginPath(); ctx.arc(R, R, R - 1, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = "#16233a"; ctx.fillRect(0, 0, MAPA, MAPA);
  // rutas de los montacargas
  ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath();
  for (const [a, b] of EDGES) { ctx.moveTo(...to(...NODES[a])); ctx.lineTo(...to(...NODES[b])); }
  ctx.stroke();
  // máquinas con el color de su estado
  const h = useStore.getState().history;
  const snap = h.length ? h[indexAt(h, clock.t)] : undefined;
  ctx.globalAlpha = 0.85;
  for (const m of MACHINES) {
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => to(m.x + (a * m.sx) / 2, m.y + (b * m.sy) / 2));
    ctx.fillStyle = STATE_COLOR[snap?.machines[m.id]?.state ?? "idle"];
    ctx.beginPath(); c.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // vehículos
  for (const [id, g] of forklifts) {
    if (v?.id === id) continue;
    const [x, y] = to(g.position.x, -g.position.z);
    ctx.fillStyle = "#ff9a1f"; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  }
  if (truck && v !== truck) {
    const d = frente(truck), c = truck.obj.position.clone().addScaledVector(d, truck.cx);
    ctx.strokeStyle = "#f23a4f"; ctx.lineWidth = 6; ctx.beginPath();
    ctx.moveTo(...to(c.x - d.x * truck.half, -(c.z - d.z * truck.half)));
    ctx.lineTo(...to(c.x + d.x * truck.half, -(c.z + d.z * truck.half)));
    ctx.stroke();
  }
  ctx.restore();
  // norte en el borde
  const [nx, ny] = to(px, py + 1);
  const n = Math.hypot(nx - R, ny - R) || 1;
  ctx.fillStyle = "#ffffff"; ctx.font = "800 11px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("N", R + ((nx - R) / n) * (R - 10), R + ((ny - R) / n) * (R - 10));
  // yo: flecha al centro (naranja si voy manejando)
  ctx.fillStyle = v ? "#ff9a1f" : "#4fd1c5";
  ctx.beginPath(); ctx.moveTo(R, R - 8); ctx.lineTo(R + 6, R + 6); ctx.lineTo(R, R + 3); ctx.lineTo(R - 6, R + 6); ctx.closePath(); ctx.fill();
}

/** Zona donde está el operario: la máquina más cercana a menos de 15 m. */
function zona(): [string, string] {
  const p = live.veh ? live.veh.obj.position : me.pos;
  let best: (typeof MACHINES)[number] | null = null, bd = 15;
  for (const m of MACHINES) { const d = distRect(p.x, -p.z, m); if (d < bd) { bd = d; best = m; } }
  if (!best) return ["Predio San Jorge", "Seguí las rutas de los montacargas"];
  const etapa = STAGE_LABEL[best.stage] ?? best.stage;
  return [best.line === "Común" ? etapa : `Línea ${best.line.slice(1)} · ${etapa}`, `Cerca · ${best.label}`];
}

export function WalkHud() {
  const walk = useStore((s) => s.mode === "walk");
  const view = useStore((s) => s.view);
  const hint = useStore((s) => s.hint);
  const driving = useStore((s) => s.driving);
  const setMode = useStore((s) => s.setMode);
  const setView = useStore((s) => s.setView);
  const plan = useStore((s) => s.plan);
  const [locked, setLocked] = useState(false);
  const [linea, setLinea] = useState<"L7" | "L8">("L7");
  const mapa = useRef<HTMLCanvasElement>(null);
  const zonaT = useRef<HTMLDivElement>(null), zonaS = useRef<HTMLDivElement>(null);
  const arco = useRef<SVGCircleElement>(null), kmh = useRef<HTMLSpanElement>(null), marcha = useRef<HTMLSpanElement>(null);

  // minimapa, zona y velocímetro: se pintan por cuadro directo en el DOM (sin pasar por React)
  useEffect(() => {
    if (!walk) return;
    const onLock = () => setLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onLock);
    const ctx = mapa.current?.getContext("2d");
    let raf = 0, zt = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (ctx) dibujarMapa(ctx);
      if (t - zt > 400) {
        zt = t;
        const [a, b] = zona();
        if (zonaT.current) zonaT.current.textContent = a;
        if (zonaS.current) zonaS.current.textContent = b;
      }
      const v = live.veh;
      if (v && arco.current && kmh.current && marcha.current) {
        const u = Math.min(1, Math.abs(v.speed) / (v.vmax * 1.4));
        arco.current.style.strokeDashoffset = String(GAUGE * (1 - u * 0.75));
        kmh.current.textContent = String(Math.round(Math.abs(v.speed) * 3.6)).padStart(2, "0");
        marcha.current.textContent = v.speed > 0.15 ? "D" : v.speed < -0.15 ? "R" : "N";
      }
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("pointerlockchange", onLock); };
  }, [walk]);

  if (!walk) {
    return (
      <button onClick={() => setMode("walk")} className="glass pointer-events-auto hidden items-center gap-2.5 px-3 py-2 text-left transition hover:-translate-y-0.5 md:flex">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eef3fa] text-[17px]" aria-hidden>🚶</span>
        <span>
          <span className="block text-[12.5px] font-extrabold leading-tight">Recorrer a pie</span>
          <span className="block text-[11px] leading-tight text-muted">Operario, montacargas y camión</span>
        </span>
      </button>
    );
  }
  return (
    <>
      {view === "1p" && locked && !plan && <div className="pointer-events-none fixed left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(0,0,0,.45)]" aria-hidden />}
      {plan && (
        <div className="glass pointer-events-none fixed left-1/2 top-[96px] z-20 -translate-x-1/2 px-5 py-3 text-center">
          <div className="text-[15px] font-extrabold tracking-tight">Plano de la planta</div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1 text-[12px] text-muted">
            Clic en el piso o en una máquina para ir · <Key k="W" /><Key k="A" /><Key k="S" /><Key k="D" /> mover · rueda: zoom · <Key k="M" /> volver
          </div>
        </div>
      )}
      {!driving && (
        <div className="pointer-events-auto fixed bottom-[76px] left-1/2 z-10 flex max-w-[min(760px,calc(100vw-640px))] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-full bg-[#16233a]/85 p-1 text-[12px] font-bold text-white shadow-lg">
          <span className="pl-2 pr-1 text-white/60">Ir a</span>
          <button onClick={() => setLinea(linea === "L7" ? "L8" : "L7")} className="shrink-0 rounded-full bg-white px-2 py-1 text-[#16233a]" aria-label={`Línea ${linea}, cambiar de línea`}>{linea}</button>
          {puntosDeInteres(linea).map((m) => (
            <button key={m.id} onClick={() => irAMaquina(m.id)} className="shrink-0 rounded-full px-2.5 py-1 hover:bg-white/15">{STAGE_LABEL[m.stage] ?? m.stage}</button>
          ))}
        </div>
      )}
      {!locked && !plan && (
        <div className="glass pointer-events-none fixed left-1/2 top-[26%] z-20 -translate-x-1/2 px-6 py-4 text-center">
          <div className="text-[17px] font-extrabold tracking-tight">Hacé clic para jugar</div>
          <div className="mt-1.5 flex items-center justify-center gap-1 text-[12px] text-muted">El mouse mira · <Key k="Esc" /> lo suelta · <Key k="Esc" /> otra vez sale</div>
        </div>
      )}
      {driving && (
        <div className="pointer-events-none fixed bottom-[76px] left-1/2 z-10 -translate-x-1/2" aria-hidden>
          <div className="relative grid h-[120px] w-[120px] place-items-center rounded-full bg-[#16233a]/90 text-white shadow-lg">
            <svg viewBox="0 0 120 120" className="absolute inset-0 rotate-[135deg]">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="7" strokeDasharray={`${GAUGE * 0.75} ${GAUGE}`} strokeLinecap="round" />
              <circle ref={arco} cx="60" cy="60" r="50" fill="none" stroke="#4fd1c5" strokeWidth="7" strokeDasharray={GAUGE} strokeDashoffset={GAUGE} strokeLinecap="round" />
            </svg>
            <div className="text-center leading-none">
              <span ref={kmh} className="tnum block text-[34px] font-extrabold">00</span>
              <span className="mt-1 block text-[10px] font-bold tracking-[.2em] text-white/60">KM/H</span>
            </div>
            <span ref={marcha} className="absolute bottom-2 rounded bg-white px-1.5 text-[11px] font-extrabold text-[#16233a]">N</span>
          </div>
        </div>
      )}
      <div className="flex flex-col items-start gap-2">
        <div className="pointer-events-none flex flex-col items-center" aria-hidden>
          <canvas ref={mapa} width={MAPA} height={MAPA} className="rounded-full shadow-lg ring-2 ring-white/70" style={{ width: MAPA, height: MAPA }} />
          <div ref={zonaT} className="mt-1.5 rounded-full bg-[#16233a]/85 px-3 py-0.5 text-[13px] font-extrabold text-white" />
          <div ref={zonaS} className="mt-0.5 text-[10.5px] font-bold uppercase tracking-[.12em] text-ink/70" />
        </div>
        <div className="glass pointer-events-auto w-[280px] p-3 text-[12px]">
          <div className="mb-2 text-[13px] font-extrabold">{driving ? "Manejando" : "Recorriendo a pie"}</div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-muted">
            <span className="flex items-center gap-1"><Key k="W" /><Key k="A" /><Key k="S" /><Key k="D" /> {driving ? "manejar" : "moverse"}</span>
            <span className="flex items-center gap-1"><Key k="Shift" /> {driving ? "turbo" : "correr"}</span>
            {!driving && <span className="flex items-center gap-1"><Key k="Espacio" /> saltar</span>}
            <span className="flex items-center gap-1"><Key k="C" /> cámara</span>
            <span className="flex items-center gap-1"><Key k="M" /> plano</span>
            {driving && <span className="flex items-center gap-1"><Key k="H" /> bocina</span>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <span className="mr-0.5 font-bold text-ink">Pedir:</span>
            {([["montacargas", "F", "Montacargas"], ["camion", "G", "Camión"]] as const).map(([t, k, l]) => (
              <button key={t} onClick={() => { prenderAudio(); traerVehiculo(t); }} className="flex items-center gap-1 rounded-full bg-[#ffe8cc] py-0.5 pl-0.5 pr-2 font-bold hover:opacity-80">
                <Key k={k} /> {l}
              </button>
            ))}
          </div>
          {!driving && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {GESTOS.map((g) => (
                <button key={g.clip} onClick={() => hacerGesto(g.clip)} className="flex items-center gap-1 rounded-full bg-[#eef3fa] py-0.5 pl-0.5 pr-2 font-bold hover:opacity-80">
                  <Key k={g.key} /> {g.label}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex min-h-[32px] items-center gap-2 rounded-lg bg-[#eef3fa] px-2.5 py-1.5 text-[12px] font-bold" aria-live="polite">
            {hint ? <><Key k="E" /> {hint.replace(/^E · /, "")}</> : "Acercate a una máquina o a un vehículo"}
          </div>
          <div className="mt-2 flex gap-1.5">
            <button onClick={() => setView(view === "1p" ? "3p" : "1p")} className="flex-1 rounded-full bg-[#eef3fa] px-3 py-1.5 font-bold hover:opacity-80">{view === "1p" ? "3ª persona" : "1ª persona"}</button>
            <button onClick={() => abrirPlano(!plan)} aria-pressed={plan} className={`flex-1 rounded-full px-3 py-1.5 font-bold hover:opacity-80 ${plan ? "bg-brand text-white" : "bg-[#eef3fa]"}`}>Plano</button>
            <button onClick={() => setMode("orbit")} className="flex-1 rounded-full bg-ink px-3 py-1.5 font-bold text-white hover:opacity-90">Salir</button>
          </div>
        </div>
      </div>
    </>
  );
}
useGLTF.preload("/models/operario.glb");
