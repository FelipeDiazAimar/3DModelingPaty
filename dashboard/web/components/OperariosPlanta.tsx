"use client";
import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { OPERARIOS, byId } from "@/lib/layout";
import { clock, snapshotAt, useStore } from "@/lib/store";
import { alcanzar, mirar } from "@/lib/vehicleFx";

/* ---------- empleados de la planta: el mismo operario.glb animado en cada puesto ----------
   planta_v10.glb trae ~660 mallas estáticas "Operario_*" (5-10 por persona; Plant las oculta). Acá se lee dónde
   estaba cada persona (su malla "Torso") y se pone un clon animado con su propio mixer. De pie hacen una tarea con
   objeto: base Idle (piernas / torso) y brazos por IK (alcanzar, después del mixer) hasta puntos de trabajo tomados
   de la geometría de la planta: "caja" (cinta / envasado / encajonado / desencajado / estibado: toma una caja de 5 kg
   de una superficie, la lleva ~0,5 m con las dos manos y la apoya) o "maq" (toca el panel HMI de su máquina y la mira
   con la cabeza). Los de los montacargas van sentados (Sit). Si su máquina no está en `proc` quedan quietos (sin
   máquina o sin snapshot trabajan). Solo se dibujan y animan los que están cerca de la cámara; IK y caja, solo a
   menos de CERCA. No están en la planta que usa Walk: no tienen colisión. */
const DIST = 50;                // m: más lejos que esto ni se dibuja ni se anima
const CERCA = 25;               // m: dentro de esto hay IK y caja
const PISO_TORSO = 1.15, ASIENTO = 0.6; // altura del torso de pie sobre sus pies; pies del conductor sentado sobre el piso
const LADO = 0.17;              // m: cada mano a este lado del centro de la caja
const CAJA = new THREE.BoxGeometry(0.34, 0.18, 0.24); // caja de 5 kg
const MAQ: Record<string, string> = { Desencajado: "Desencajado", Picadora: "Picadora", Plataforma_Mezclado: "MezA", Formadora: "FormA", Envasadora: "EnvA", Encajonadora: "EncA" };
// duración (s) de cada fase; 0 = al azar. caja: pausa, alcanzar, agarrar, llevar, apoyar, soltar. maq: pausa, alcanzar panel, pulsar, soltar, revisar
const FASES = { caja: [0, 0.8, 0.25, 1, 0.35, 0.6], maq: [0, 0.7, 0, 0.5, 0] };

interface Cand { b: THREE.Box3; tipo: "panel" | "maq" | "sup" }
interface Pers {
  obj: THREE.Object3D; mixer: THREE.AnimationMixer; acc: Record<string, THREE.AnimationAction>; maq?: string;
  tarea: "caja" | "maq" | "sentado" | "libre"; cur: string; yaw: number; raiz: THREE.Group;
  A: THREE.Vector3; B: THREE.Vector3; // puntos de trabajo en mundo. caja: origen y destino. maq: panel y centro de la máquina (lo que mira)
  f: number; tf: number; dur: number; w: number; wl: number; box?: THREE.Mesh; enMano: boolean;
}

/** Mallas de la planta que sirven de objetivo: panel HMI, cuerpo de máquina y superficies donde apoyar cajas. */
function candidatos(planta: THREE.Object3D) {
  const out: Cand[] = [];
  planta.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    const n = o.name;
    const tipo = /HMI_Pantalla/.test(n) ? "panel" : /^(Mezcladora_.*_Olla|Picadora_.*_Cuerpo|Formadora_.*_(Gabinete|Cabezal))/.test(n) ? "maq"
      : /Cinta_.*_Banda|Mesada_.*_Tapa|Cartones_Planos|Envasadora_.*_Base|Pallet.*_Pallet|Carrito_Pasillo|Aditivos_Mesa$/.test(n) ? "sup" : null;
    if (tipo) out.push({ b: new THREE.Box3().setFromObject(o), tipo });
  });
  return out;
}
const dxz = (b: THREE.Box3, p: THREE.Vector3) => Math.hypot(Math.max(b.min.x - p.x, 0, p.x - b.max.x), Math.max(b.min.z - p.z, 0, p.z - b.max.z));
/** Punto de `b` más cercano a (pos.x, y, pos.z), `inset` m adentro del borde y a lo sumo 0,5 m del operario (se acerca el objetivo, no el operario). */
function punto(b: THREE.Box3, pos: THREE.Vector3, y: number, inset: number) {
  const c = (lo: number, hi: number, v: number) => (hi - lo > 2 * inset ? THREE.MathUtils.clamp(v, lo + inset, hi - inset) : (lo + hi) / 2);
  const p = new THREE.Vector3(c(b.min.x, b.max.x, pos.x), THREE.MathUtils.clamp(y, b.min.y, b.max.y), c(b.min.z, b.max.z, pos.z));
  const d = Math.hypot(p.x - pos.x, p.z - pos.z);
  if (d > 0.5) { p.x = pos.x + ((p.x - pos.x) * 0.5) / d; p.z = pos.z + ((p.z - pos.z) * 0.5) / d; }
  return p;
}

export default function OperariosPlanta() {
  const { scene: planta } = useGLTF("/models/planta_v10.glb");
  const { scene, animations } = useGLTF("/models/operario.glb");
  const { gente, raiz } = useMemo(() => {
    planta.updateWorldMatrix(true, true);
    const cands = candidatos(planta);
    let carton: THREE.Material | undefined;
    planta.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (!carton && m?.name === "M_Carton") carton = m; });
    const matCaja = carton ?? new THREE.MeshStandardMaterial({ color: "#b98a54" });
    const raiz = new THREE.Group(); // cajas apoyadas (mundo)
    const vistos = new Set<string>();
    const out: Pers[] = [];
    const pos = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), fwd = new THREE.Vector3();
    planta.traverse((o) => {
      if (!/^Operario_.*Torso|^Op_/.test(o.name)) return; // Op_*: los humanoides "KIT_Operario" fundidos del resto de la planta
      o.matrixWorld.decompose(pos, q, s);
      // el export repite algunas personas en el mismo lugar; las de FlexSim (Operarios) ya están animadas en su sitio
      const k = `${o.name}|${pos.x.toFixed(1)}|${pos.z.toFixed(1)}`;
      if (vistos.has(k) || OPERARIOS.some((f) => Math.hypot(f.x - pos.x, -f.y - pos.z) < 0.5)) return;
      vistos.add(k);
      const sentado = o.name.includes("Autoelevador"), kit = o.name.startsWith("Op_");
      const obj = cloneSkinned(scene);
      obj.traverse((x) => { x.frustumCulled = false; });
      // la persona estática mira hacia +X de su malla; operario.glb mira hacia +Z
      fwd.set(1, 0, 0).applyQuaternion(q);
      let yaw = Math.atan2(fwd.x, fwd.z);
      const piso = kit ? pos.y + (sentado ? ASIENTO : 0) : pos.y - (sentado ? 1.08 - ASIENTO : PISO_TORSO); // Op_*: el origen está en los pies
      const m = o.name.match(/^Operario_([LT]\d)_(Desencajado|Picadora|Plataforma_Mezclado|Formadora|Envasadora|Encajonadora)/);
            // puntos de trabajo: lo más cercano de la geometría de la planta; si no hay, un punto delante del operario a la cintura
      const cerca = (tipo: Cand["tipo"], r: number) => cands
        .filter((c) => c.tipo === tipo && dxz(c.b, pos) < r && (tipo !== "sup" || (c.b.max.y - piso > 0.05 && c.b.max.y - piso < 1.25)))
        .sort((a, b) => dxz(a.b, pos) - dxz(b.b, pos));
      const delante = (d: number, l: number, y: number) => new THREE.Vector3(pos.x + Math.sin(yaw) * d + Math.cos(yaw) * l, piso + y, pos.z + Math.cos(yaw) * d - Math.sin(yaw) * l);
      const sups = cerca("sup", 1);
      // los de kit sin superficie cerca (oficina, comedor...) quedan en Idle: sin objeto no hay tarea
      const tarea = sentado ? "sentado" : m && /Picadora|Mezclado|Formadora/.test(m[2]) ? "maq" : kit && !sups.length ? "libre" : "caja";
      let A = delante(0.45, 0.25, 0.95), B = delante(0.45, -0.25, 0.95);
      if (tarea === "caja") {
        const [s1, s2] = sups;
        if (s1) {
          const y = (c: Cand) => c.b.max.y + CAJA.parameters.height / 2;
          A = punto(s1.b, pos, y(s1), 0.15);
          const B2 = s2 && punto(s2.b, pos, y(s2), 0.15);
          // destino: otra superficie cercana o, si no hay, 0,5 m a la derecha sobre la misma
          B = B2 && B2.distanceTo(A) > 0.3 ? B2 : punto(s1.b, pos.clone().add(new THREE.Vector3(-Math.cos(yaw), 0, Math.sin(yaw)).multiplyScalar(0.5)), y(s1), 0.15);
          yaw = Math.atan2((A.x + B.x) / 2 - pos.x, (A.z + B.z) / 2 - pos.z);
        }
      } else {
        const pan = cerca("panel", 1.2)[0], cu = cerca("maq", 1.5)[0];
        if (pan || cu) {
          A = pan ? pan.b.getCenter(new THREE.Vector3()) : punto(cu.b, pos, piso + 1.2, 0);
          B = (cu ?? pan).b.getCenter(new THREE.Vector3());
          yaw = Math.atan2(A.x - pos.x, A.z - pos.z);
        } else { A = delante(0.5, 0, 1.2); B = delante(2, 0, 1.4); }
      }
      obj.rotation.y = yaw;
      obj.position.set(pos.x, piso, pos.z);
      obj.visible = false;
      const mixer = new THREE.AnimationMixer(obj);
      const acc = Object.fromEntries(animations.map((c) => [c.name, mixer.clipAction(c)]));
      const box = tarea === "caja" ? new THREE.Mesh(CAJA, matCaja) : undefined;
      if (box) { box.visible = false; raiz.add(box); }
      out.push({ obj, mixer, acc, maq: (m && byId(`${MAQ[m[2]]}_${m[1]}`)?.id) || undefined, tarea, cur: "", yaw, raiz, A, B, f: 0, tf: 0, dur: ((Math.abs(pos.x * 7.3 + pos.z * 3.1) % 1) * 2), // fase inicial distinta por persona
        w: 0, wl: 0, box, enMano: false });
    });
    return { gente: out, raiz };
  }, [planta, scene, animations]);
  useFrame(({ camera }, dt) => animarGente(gente, camera.position, dt));
  return <>{gente.map((p) => <primitive key={p.obj.uuid} object={p.obj} />)}<primitive object={raiz} /></>;
}

const ease = (u: number) => u * u * (3 - 2 * u);
const tR = new THREE.Vector3(), tL = new THREE.Vector3(), tC = new THREE.Vector3(), tq = new THREE.Quaternion(), yq = new THREE.Quaternion(), EJE_Y = new THREE.Vector3(0, 1, 0);

/** Suelta la caja de `p` (si la tiene en la mano) en el mundo, derecha, en `donde`; la oculta si `ocultar`. */
function soltar(p: Pers, donde: THREE.Vector3, ocultar: boolean) {
  const b = p.box;
  if (!b) return;
  p.raiz.attach(b); p.enMano = false;
  b.position.copy(donde); b.quaternion.copy(yq.setFromAxisAngle(EJE_Y, p.yaw));
  b.visible = !ocultar;
}

/** Avanza la tarea de `p` un cuadro (si trabaja) y deja los objetivos de las manos en tR / tL y la cabeza en p.wl. Devuelve el peso de IK de los brazos. */
function avanzar(p: Pers, dt: number, trabaja: boolean) {
  const caja = p.tarea === "caja", fases = caja ? FASES.caja : FASES.maq, b = p.box;
  if (trabaja) p.tf += dt;
  if (p.tf >= p.dur) {
    p.f = (p.f + 1) % fases.length;
    p.tf = 0;
    p.dur = fases[p.f] || (caja ? 0.4 + Math.random() : p.f === 2 ? 1 + Math.random() : p.f === 0 ? 1 + Math.random() * 1.5 : 1.5 + Math.random());
    if (caja && b) {
      if (p.f === 1) { b.visible = true; b.position.copy(p.A); b.quaternion.setFromAxisAngle(EJE_Y, p.yaw); }
      else if (p.f === 3) { p.obj.getObjectByName("WristR")?.attach(b); p.enMano = true; }  // la caja pasa a ser hija de la mano
      else if (p.f === 4) soltar(p, p.B, false);
      else if (p.f === 0) b.visible = false;
    }
  }
  const u = Math.min(1, p.tf / p.dur), f = p.f;
  p.wl = 0;
  if (caja) {
    const e = ease(u);
    if (f === 3) { tR.lerpVectors(p.A, p.B, e); tR.y += 0.08 * Math.sin(Math.PI * u); } else tR.copy(f >= 4 ? p.B : p.A);
    const c = tC.copy(tR); // centro de la caja; cada mano a un lado
    tL.set(Math.cos(p.yaw), 0, -Math.sin(p.yaw)).multiplyScalar(LADO); // izquierda del operario
    tR.copy(c).sub(tL); tL.add(c);
    if (p.enMano && b) { // hija de la muñeca: se la mantiene derecha
      b.parent!.getWorldQuaternion(tq).invert().multiply(yq.setFromAxisAngle(EJE_Y, p.yaw));
      b.quaternion.copy(tq);
    }
    return f === 1 ? e : f >= 2 && f <= 4 ? 1 : f === 5 ? 1 - e : 0;
  }
  tR.copy(p.A);
  if (f === 2) tR.y += 0.012 * Math.sin(p.tf * 18); // pulsa con un pequeño vaivén
  if (f === 4) p.wl = Math.min(1, 4 * u, 4 * (1 - u));
  return f === 1 ? ease(u) : f === 2 ? 1 : f === 3 ? 1 - ease(u) : 0;
}

function animarGente(gente: Pers[], cam: THREE.Vector3, dt: number) {
  const h = useStore.getState().history;
  const snap = h.length ? snapshotAt(h, clock.t) : undefined;
  for (const p of gente) {
    const d2 = p.obj.position.distanceToSquared(cam);
    p.obj.visible = d2 < DIST * DIST;
    if (!p.obj.visible) continue;
    if (p.cur === "") { // base: Idle (o Sit) en fases distintas, para que no se muevan al unísono
      p.cur = p.tarea === "sentado" ? "Sit" : "Idle";
      const a = p.acc[p.cur];
      if (a) { a.reset().play(); a.time = Math.random() * a.getClip().duration; }
    }
    p.mixer.update(dt);
    if (p.tarea === "sentado" || p.tarea === "libre") continue;
    if (d2 > CERCA * CERCA) { // lejos: sin IK ni caja
      if (p.w > 0 || p.wl > 0 || p.box?.visible) { p.w = p.wl = 0; p.f = 0; p.tf = 0; p.dur = 1; soltar(p, p.A, true); }
      continue;
    }
    const st = p.maq && snap?.machines[p.maq]?.state;
    const trabaja = !st || st === "proc"; // sin máquina o sin snapshot: trabaja
    const wt = avanzar(p, dt, trabaja);
    p.w += ((trabaja || p.enMano ? wt : 0) - p.w) * Math.min(1, dt * 8); // entra y sale suave; con una caja en la mano queda quieto
    if (p.w > 0.01 || p.wl > 0.01) p.obj.updateWorldMatrix(true, true);
    alcanzar(p.obj, "R", tR, p.w);
    if (p.tarea === "caja") alcanzar(p.obj, "L", tL, p.w);
    else mirar(p.obj, p.B, p.wl);
  }
}
