"use client";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, RoundedBox, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OC } from "three-stdlib";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { FLEET, MACHINES, OPERARIOS, STATE_COLOR, byId } from "@/lib/layout";
import { utilization } from "@/lib/derive";
import { clock, indexAt, snapshotAt, useLatest, useStore } from "@/lib/store";
import { demoFleetAt } from "@/lib/demo";
import { fleetAt } from "@/lib/fleetPath";
import { alongPath, pathBetween } from "@/lib/network";
import { trucksAt } from "@/lib/trucks";
import { fleetGround, forklifts, huellaUsuario } from "@/lib/live3d";
import { crearCamion, rigMontacargas, stepRigs } from "@/lib/vehicleFx";
import Walk from "@/components/Walk";
import OperariosPlanta from "@/components/OperariosPlanta";
import { CineRig, CineTruck } from "@/components/Cinematics";
import { useCine } from "@/lib/cine";

// Blender (x, y, z-arriba) -> three (x, z, -y)
const P = (x: number, y: number, z = 0) => new THREE.Vector3(x, z, -y);

/* ---------- paleta vivida para los materiales del modelo ---------- */
const COLORS: Record<string, string> = {
  M_Rack_Azul: "#2b74ff", M_Rack_Naranja: "#ff7d1f", M_Amarillo_Seg: "#ffc61a", M_Azul_Compresor: "#3a86ff",
  M_Rojo_PATY: "#f23a4f", M_Metal_Estructura: "#8aa4cf", M_Negro_Cinta: "#344060", M_Goma: "#3c4660", M_Llanta: "#7c8aa6",
  M_Inox: "#d7e2f5", M_Inox_Cepillado: "#c9d7ee", M_Cromo: "#e6eefb", M_Carton: "#f3b567", M_Madera_Pallet: "#e7ae6d",
  M_Madera_Mueble: "#d89a5c", M_Panel_Sandwich: "#f1f6ff", M_Blanco_Aislado: "#ffffff", M_Hormigon_Piso: "#eaf1ff",
  M_Asfalto: "#b4c2dd", M_Vereda: "#f6ead8", M_Cordon: "#efe8da", M_Pino: "#1fae62", M_Copa_Verde: "#4fd35c",
  M_Arbusto: "#43c765", M_Tronco: "#9a6238", M_Verde_Industrial: "#1ccd84", M_Bateas_Rojas: "#ff3d52",
  M_Auto_Rojo: "#ff3b4e", M_Auto_Azul: "#2f7bff", M_Auto_Plata: "#e4ecf8", M_Auto_Gris: "#94a9c9", M_Auto_Negro: "#39425a",
  M_Moto_Azul: "#2f7bff", M_Moto_Roja: "#ff3b4e", M_Cabina_Azul: "#2f7bff", M_Cabina_Roja: "#ff3b4e", M_Locker: "#62adff",
  M_Gris_Puerta: "#8fa2c4", M_Alambrado: "#9fb0cc", M_Junta: "#8a98b3", M_Panel_Junta: "#e2eaf8",
};
const HIDE = new Set(["M_Campo", "M_Pasto"]); // las reemplaza la isla de pasto
// camiones fijos que reemplazan los animados (muelles de MP y PT de la nave original y los de la báscula)
// (también la plantilla del camión de la cinemática, y cajas y bandejas fijas: en la web se mueven)
const TRUCK_HIDE = /^(Camion_Descarga_MP_|Camion_Carga_PT_|Camion_Bascula_|Camion_Espera_Bascula|CamionCine|Caja_PATY_|Hamburguesas_|Operario_|Op_)/; // Operario_* y Op_* (KIT_Operario): los empleados estáticos, los reemplaza OperariosPlanta

/* ---------- iluminación horneada sobre los pisos (blender/hornear_piso.py): se prende y apaga sin recargar ---------- */
const luzU = { uLuz: { value: null as THREE.Texture | null }, uOn: { value: 0 }, uRect: { value: new THREE.Vector4(0, 0, 1, 1) } };
/** El piso toma la luz horneada según su posición en planta (x, z): no hace falta una segunda capa de UV en el GLB. */
function conLuz(mat: THREE.Material) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, luzU);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vLuzXZ;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvLuzXZ = (modelMatrix * vec4(transformed, 1.0)).xz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vLuzXZ;\nuniform sampler2D uLuz;\nuniform float uOn;\nuniform vec4 uRect;")
      .replace("#include <map_fragment>", `#include <map_fragment>
        if (uOn > 0.5) {
          vec2 uvL = (vLuzXZ - uRect.xy) / uRect.zw;
          if (uvL.x >= 0.0 && uvL.x <= 1.0 && uvL.y >= 0.0 && uvL.y <= 1.0) diffuseColor.rgb *= texture2D(uLuz, vec2(uvL.x, 1.0 - uvL.y)).r;
        }`);
  };
  mat.needsUpdate = true;
}

function Plant() {
  const { scene } = useGLTF("/models/planta_v10.glb");
  const luz = useStore((s) => s.luz);
  useMemo(() => {
    const seen = new Set<THREE.Material>();
    const pisos: THREE.Mesh[] = []; // mallas chatas a nivel del suelo: reciben la luz horneada
    const caja = new THREE.Box3();
    scene.updateWorldMatrix(true, true);
    scene.traverse((o) => {
      if (TRUCK_HIDE.test(o.name)) { o.visible = false; return; }
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      caja.setFromObject(m);
      if (caja.max.y < 0.6 && caja.max.y - caja.min.y < 0.6) pisos.push(m);
      mats.forEach((mat) => {
        const sm = mat as THREE.MeshStandardMaterial;
        if (HIDE.has(sm.name)) { m.visible = false; return; }
        if (seen.has(sm)) return;
        seen.add(sm);
        sm.metalness = 0;
        sm.roughness = Math.max(sm.roughness ?? 0.6, 0.55);
        const hex = COLORS[sm.name];
        if (hex) sm.color.set(hex);
        else if (sm.color && sm.opacity >= 1) { // el resto: un poco más saturado y claro
          const hsl = { h: 0, s: 0, l: 0 };
          sm.color.getHSL(hsl);
          sm.color.setHSL(hsl.h, Math.min(1, hsl.s * 1.35), Math.min(0.92, hsl.l * 1.12 + 0.03));
        }
        sm.needsUpdate = true;
      });
    });
    // los pisos usan una copia del material con la luz: el mismo material en algo alto (una pared, una tarima) queda como estaba
    const copia = new Map<THREE.Material, THREE.Material>();
    const conPiso = (x: THREE.Material) => {
      let c = copia.get(x);
      if (!c) { c = x.clone(); conLuz(c); copia.set(x, c); }
      return c;
    };
    for (const m of pisos) m.material = Array.isArray(m.material) ? m.material.map(conPiso) : conPiso(m.material);
  }, [scene]);
  // la textura se baja recién la primera vez que se prende; si falta, el interruptor vuelve a apagado
  useEffect(() => {
    if (!luz) { luzU.uOn.value = 0; return; }
    if (luzU.uLuz.value) { luzU.uOn.value = 1; return; }
    Promise.all([
      fetch("/models/planta_luz.json").then((r) => { if (!r.ok) throw new Error(`planta_luz.json: ${r.status}`); return r.json(); }),
      new THREE.TextureLoader().loadAsync("/models/planta_luz.jpg"),
    ]).then(([j, t]: [{ x0: number; x1: number; z0: number; z1: number }, THREE.Texture]) => {
      t.anisotropy = 8;
      luzU.uRect.value.set(j.x0, j.z0, j.x1 - j.x0, j.z1 - j.z0);
      luzU.uLuz.value = t;
      luzU.uOn.value = useStore.getState().luz ? 1 : 0;
    }).catch((e) => { console.warn("Sin iluminación horneada:", e); useStore.getState().setLuz(false); });
  }, [luz]);
  return <primitive object={scene} />;
}

/* ---------- modo rendimiento: la planta estática fundida en una malla por material ----------
   El modelo trae ~17.000 piezas y cada una es un dibujo aparte por cuadro (eso, no los triángulos, es lo que la
   hace lenta). Fundida quedan unas decenas. Las piezas originales pasan a una capa que la cámara no dibuja pero
   los rayos del recorrido a pie sí ven (colisiones). */
const CAPA_ORIGINAL = 1;
function PlantaFundida() {
  const { scene } = useGLTF("/models/planta_v10.glb");
  const { fundidas, piezas } = useMemo(() => {
    scene.updateWorldMatrix(true, true);
    const grupos = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[] }>();
    const piezas: THREE.Mesh[] = [];
    scene.traverseVisible((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || Array.isArray(m.material)) return;
      const g = m.geometry;
      // se funden juntas solo las que comparten material y los mismos atributos
      const clave = `${m.material.uuid}|${Object.keys(g.attributes).sort().join(",")}|${g.index ? 1 : 0}`;
      let gr = grupos.get(clave);
      if (!gr) grupos.set(clave, (gr = { mat: m.material, geos: [] }));
      gr.geos.push(g.clone().applyMatrix4(m.matrixWorld));
      piezas.push(m);
    });
    const fundidas: THREE.Mesh[] = [];
    for (const { mat, geos } of grupos.values()) {
      const g = mergeGeometries(geos, false);
      geos.forEach((x) => x.dispose());
      if (g) fundidas.push(new THREE.Mesh(g, mat));
    }
    return { fundidas, piezas };
  }, [scene]);
  useEffect(() => {
    piezas.forEach((m) => m.layers.set(CAPA_ORIGINAL));
    return () => { piezas.forEach((m) => m.layers.set(0)); fundidas.forEach((m) => m.geometry.dispose()); };
  }, [piezas, fundidas]);
  return <>{fundidas.map((m) => <primitive key={m.uuid} object={m} />)}</>;
}

/* ---------- operarios de FlexSim con el modelo del operario (blender/operario.blend) ----------
   Si el publicador manda su posición (fleet), la siguen; si no, quedan en su puesto. Trabajan (Interact)
   mientras su máquina procesa, caminan cuando se mueven y si no esperan (Idle). */
interface Op { o: (typeof OPERARIOS)[number]; obj: THREE.Object3D; mixer: THREE.AnimationMixer; acc: Record<string, THREE.AnimationAction>; clip: { v: string }; prev: THREE.Vector3 }
function Operarios() {
  const { scene, animations } = useGLTF("/models/operario.glb");
  const ops = useMemo<Op[]>(() => OPERARIOS.map((o) => {
    const obj = cloneSkinned(scene);
    obj.traverse((x) => { x.frustumCulled = false; }); // malla con esqueleto: su caja no sigue a la animación
    obj.position.copy(P(o.x, o.y, 0));
    const mixer = new THREE.AnimationMixer(obj);
    const acc = Object.fromEntries(animations.map((c) => [c.name, mixer.clipAction(c)]));
    return { o, obj, mixer, acc, clip: { v: "" }, prev: obj.position.clone() };
  }), [scene, animations]);
  useFrame((_, dt) => animarOperarios(ops, dt));
  return <>{ops.map((p) => <primitive key={p.o.id} object={p.obj} />)}</>;
}

const opMeta = new THREE.Vector3(), opMira = new THREE.Vector3();
function animarOperarios(ops: Op[], dt: number) {
  const h = useStore.getState().history;
  const snap = h.length ? snapshotAt(h, clock.t) : undefined;
  for (const p of ops) {
    const f = snap?.fleet[p.o.id];
    opMeta.copy(f ? P(f.x, f.y, 0) : P(p.o.x, p.o.y, 0));
    p.obj.position.lerp(opMeta, Math.min(1, dt * 6));
    const vel = p.obj.position.distanceTo(p.prev) / Math.max(dt, 1e-3);
    const m = byId(p.o.maq);
    // de frente a donde camina; quieto, de frente a su máquina
    if (vel > 0.3) opMira.subVectors(p.obj.position, p.prev);
    else if (m) opMira.subVectors(P(m.x, m.y, 0), p.obj.position);
    if (opMira.lengthSq() > 1e-6) {
      let da = Math.atan2(opMira.x, opMira.z) - p.obj.rotation.y;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      p.obj.rotation.y += da * Math.min(1, dt * 8);
    }
    const want = vel > 0.3 ? "Walk" : snap?.machines[p.o.maq]?.state === "proc" ? "Interact" : "Idle";
    if (want !== p.clip.v) {
      p.acc[p.clip.v]?.fadeOut(0.25);
      p.acc[want]?.reset().fadeIn(0.25).play();
      p.clip.v = want;
    }
    p.mixer.update(dt);
    p.prev.copy(p.obj.position);
  }
}

/* ---------- mapa de calor: el piso de cada máquina de L7/L8 según su utilización acumulada ---------- */
function Calor() {
  const grupo = useMemo(() => {
    const g = new THREE.Group();
    for (const m of MACHINES.filter((x) => x.line !== "Común")) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(m.sx + 1.6, m.sy + 1.6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.78, depthWrite: false }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.copy(P(m.x, m.y, 0.06));
      mesh.name = m.id;
      mesh.renderOrder = 2;
      g.add(mesh);
    }
    return g;
  }, []);
  useFrame(() => pintarCalor(grupo));
  useEffect(() => { calorT.v = 0; }, []); // al prender, pintar en el primer cuadro
  return <primitive object={grupo} />;
}
const calorT = { v: 0 };
/** Recalcula cada 1,5 s (recorre todo el historial): verde = libre, rojo = saturada. */
function pintarCalor(g: THREE.Group) {
  const now = performance.now();
  if (now - calorT.v < 1500) return;
  calorT.v = now;
  const h = useStore.getState().history;
  for (const o of g.children) {
    const mesh = o as THREE.Mesh;
    mesh.visible = h.length > 0;
    (mesh.material as THREE.MeshBasicMaterial).color.setHSL((1 - utilization(h, mesh.name).proc) * 0.33, 0.95, 0.45);
  }
}

/* ---------- comparar un escenario contra E1 en el 3D (resultados de public/e1) ---------- */
const CAMBIA: Record<"E2" | "E3" | "E4", { maq: string[]; color: string }> = {
  E2: { maq: ["FormA_L7", "FormB_L7", "FormA_L8", "FormB_L8"], color: "#2f7bff" },
  E3: { maq: ["FormA_L7", "FormB_L7", "FormA_L8", "FormB_L8", "Tunel_L7", "Tunel_L8"], color: "#e08a1e" },
  E4: { maq: ["Desencajado_L7", "Picadora_L7", "MezA_L7", "MezB_L7", "Desencajado_L8", "Picadora_L8", "MezA_L8", "MezB_L8"], color: "#8b5cf6" },
};
interface IC { media: number; ic_inf: number; ic_sup: number }
interface Esc { nombre: string; cambio: string; pallets: IC }
interface DatosEsc { e: { escenarios: Record<string, Esc> }; e4: { descripcion: string; replicas_15min: number; filas: { lavado_min: number; pal_1500: number; pal_1200: number }[] } }

function Escenario3D() {
  const esc = useStore((s) => s.escenario);
  const [datos, setDatos] = useState<DatosEsc | null>(null);
  useEffect(() => {
    if (!esc || datos) return;
    Promise.all([fetch("/e1/escenarios.json").then((r) => r.json()), fetch("/e1/e4.json").then((r) => r.json())])
      .then(([e, e4]) => setDatos({ e, e4 }))
      .catch((err) => console.warn("Sin resultados de escenarios:", err));
  }, [esc, datos]);
  if (!esc) return null;
  const c = CAMBIA[esc];
  const f = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  let titulo: string = esc, cambio = "", filas: [string, string][] = [], veredicto = "";
  if (datos && esc !== "E4") {
    const b = datos.e.escenarios.E1, x = datos.e.escenarios[esc];
    const d = x.pallets.media - b.pallets.media;
    const solapan = !(x.pallets.ic_inf > b.pallets.ic_sup || x.pallets.ic_sup < b.pallets.ic_inf);
    titulo = `${esc} · ${x.nombre}`; cambio = x.cambio;
    filas = [["E1 · Base", `${f(b.pallets.media)} pallets/día (IC ${f(b.pallets.ic_inf)}–${f(b.pallets.ic_sup)})`],
             [esc, `${f(x.pallets.media)} pallets/día (IC ${f(x.pallets.ic_inf)}–${f(x.pallets.ic_sup)})`],
             ["Diferencia", `${d >= 0 ? "+" : ""}${f(d)} pallets/día`]];
    veredicto = Math.abs(d) < 0.05 ? "Sin diferencia con E1." : solapan ? "Los IC 95 % se solapan: con este criterio la diferencia no alcanza (ver la prueba pareada en Escenarios)." : "Los IC 95 % no se solapan: la diferencia es significativa.";
  } else if (datos) {
    const r = datos.e4.filas.find((x) => x.lavado_min === 15) ?? datos.e4.filas[0];
    titulo = "E4 · Batch de 1200 kg"; cambio = datos.e4.descripcion;
    filas = [["Batch 1500 kg", `${r.pal_1500} pallets/día`], ["Batch 1200 kg", `${r.pal_1200} pallets/día`],
             ["Diferencia", `${r.pal_1200 - r.pal_1500 >= 0 ? "+" : ""}${r.pal_1200 - r.pal_1500} pallets/día (lavado de ${r.lavado_min} min, ${datos.e4.replicas_15min} réplicas)`]];
  }
  return (
    <group>
      {c.maq.map((id) => {
        const m = byId(id);
        return m ? (
          <RoundedBox key={id} args={[m.sx + 0.8, m.sz + 0.6, m.sy + 0.8]} radius={0.4} smoothness={3} position={P(m.x, m.y, m.sz / 2)}>
            <meshBasicMaterial color={c.color} transparent opacity={0.35} depthWrite={false} />
          </RoundedBox>
        ) : null;
      })}
      <Html position={P(-5, -4, 9)} center zIndexRange={[20, 0]}>
        <div className="glass w-[320px] p-4 text-[12px]" style={{ borderTop: `4px solid ${c.color}` }}>
          <div className="text-[15px] font-extrabold leading-tight">{titulo}</div>
          {cambio && <div className="mt-1 text-muted">{cambio}</div>}
          {datos ? (
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
              {filas.flatMap(([k, v]) => [<dt key={`${k}t`} className="font-bold">{k}</dt>, <dd key={`${k}d`} className="tnum">{v}</dd>])}
            </dl>
          ) : <div className="mt-2 text-muted">Cargando resultados…</div>}
          {veredicto && <div className="mt-2 rounded-lg bg-[#eef3fa] px-2 py-1.5 font-bold">{veredicto}</div>}
          <div className="mt-2 text-[11px] text-muted">Resaltadas: las máquinas que cambian en {esc}.</div>
        </div>
      </Html>
    </group>
  );
}

/* ---------- camiones animados (MP a Elaborados y expedición de PT; horarios de lib/trucks.ts) ---------- */
function Trucks() {
  const { scene } = useGLTF("/models/planta_v10.glb");
  // el camión articulado del modelo (tractor + acoplado, con ruedas sueltas), apoyado en el piso: cabina hacia +x local
  const slots = useMemo(() => {
    const src = scene.getObjectByName("Camion_Carga_PT_1");
    if (!src) return [] as THREE.Group[];
    return [0, 1, 2, 3].map(() => {
      const g = crearCamion(src).g;
      g.visible = false;
      return g;
    });
  }, [scene]);
  useFrame(() => {
    // durante las escenas del camión de la cinemática no se dibujan los camiones de los datos
    const c = useCine.getState();
    const escena = c.id ? c.shots[c.idx]?.escena : undefined;
    ubicarCamiones(slots, escena ? [] : trucksAt(useStore.getState().history, clock.t));
  });
  return <>{slots.map((g, i) => <primitive key={i} object={g} />)}</>;
}

/** Ubica cada camión en su lugar (o lo oculta si no está en viaje). */
function ubicarCamiones(slots: THREE.Group[], poses: ReturnType<typeof trucksAt>) {
  slots.forEach((g) => { g.visible = false; });
  for (const p of poses) {
    const g = slots[p.slot];
    if (!g) continue;
    g.visible = true;
    g.position.copy(P(p.x, p.y, 0));
    g.rotation.set(0, p.h, 0);
  }
}

/* ---------- isla de pasto con bordes redondeados ---------- */
function roundedRect(w: number, d: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

const ISLE_W = 310, ISLE_D = 214;

/** Pasto que se extiende hasta el horizonte (la niebla lo funde con el cielo). */
function Island() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
      <planeGeometry args={[9000, 9000]} />
      <meshLambertMaterial color="#79d957" />
    </mesh>
  );
}

/* ---------- vegetación instanciada ---------- */
function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ZONES: [number, number, number, number][] = [ // x0, x1, z0, z1 (coordenadas three)
  [-146, 146, -100, -58], [-146, 146, 93, 103], [133, 148, -100, 103], [-148, -133, -100, 103],
];
// bosque lejano: afuera del campo y los lotes del modelo de planta completa (±620 m); el modelo trae sus árboles
const FAR: [number, number, number, number][] = [
  [-1500, -650, -1500, 1500], [650, 1500, -1500, 1500], [-650, 650, -1500, -650], [-650, 650, 650, 1500],
];
const CERCA = false; // vegetación procedural dentro del predio: apagada (el modelo v10 ya la tiene)
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)];

function Vegetation() {
  const data = useMemo(() => {
    const r = rng(7);
    const at = (): [number, number] => { const z = pick(r, ZONES); return [z[0] + r() * (z[1] - z[0]), z[2] + r() * (z[3] - z[2])]; };
    const atFar = (): [number, number] => { const z = pick(r, FAR); return [z[0] + r() * (z[1] - z[0]), z[2] + r() * (z[3] - z[2])]; };
    const round: { x: number; z: number; s: number; c: string }[] = [];
    const pines: { x: number; z: number; s: number; c: string }[] = [];
    const bushes: { x: number; z: number; s: number; c: string }[] = [];
    const flowers: { x: number; z: number; c: string }[] = [];
    const greens = ["#4cc957", "#35b95b", "#72d84c", "#27a85f", "#8be04e"];
    const blossom = ["#ff8fb1", "#ffb347", "#ffd84d", "#ff7aa8"];
    const nC = CERCA ? 1 : 0;
    for (let i = 0; i < 95 * nC; i++) { const [x, z] = at(); round.push({ x, z, s: 0.8 + r() * 0.9, c: r() < 0.16 ? pick(r, blossom) : pick(r, greens) }); }
    for (let i = 0; i < 55 * nC; i++) { const [x, z] = at(); pines.push({ x, z, s: 0.8 + r() * 0.8, c: pick(r, ["#1f9d5a", "#16864b", "#2db36a", "#35c277"]) }); }
    for (let i = 0; i < 90 * nC; i++) { const [x, z] = at(); bushes.push({ x, z, s: 0.7 + r() * 0.9, c: pick(r, [...greens, "#a6e35a"]) }); }
    for (let i = 0; i < 260; i++) { const [x, z] = atFar(); round.push({ x, z, s: 1.1 + r() * 1.3, c: r() < 0.12 ? pick(r, blossom) : pick(r, greens) }); }
    for (let i = 0; i < 160; i++) { const [x, z] = atFar(); pines.push({ x, z, s: 1.1 + r() * 1.2, c: pick(r, ["#1f9d5a", "#16864b", "#2db36a", "#35c277"]) }); }
    for (let i = 0; i < 150; i++) { const [x, z] = atFar(); bushes.push({ x, z, s: 1 + r() * 1.4, c: pick(r, [...greens, "#a6e35a"]) }); }
    for (let i = 0; i < 520 * nC; i++) { const [x, z] = at(); flowers.push({ x, z, c: pick(r, ["#ff5d8f", "#ffd23f", "#ffffff", "#b388ff", "#ff8a3d", "#5ec8ff"]) }); }
    return { round, pines, bushes, flowers };
  }, []);

  const trunks = useRef<THREE.InstancedMesh>(null!);
  const crowns = useRef<THREE.InstancedMesh>(null!);
  const cones = useRef<THREE.InstancedMesh>(null!);
  const bush = useRef<THREE.InstancedMesh>(null!);
  const flo = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    const all = [...data.round, ...data.pines];
    all.forEach((t, i) => {
      d.position.set(t.x, 1.1 * t.s, t.z); d.scale.set(t.s, t.s, t.s); d.rotation.set(0, 0, 0); d.updateMatrix();
      trunks.current.setMatrixAt(i, d.matrix);
    });
    data.round.forEach((t, i) => {
      d.position.set(t.x, 3.9 * t.s, t.z); d.scale.set(2.3 * t.s, 2.1 * t.s, 2.3 * t.s); d.updateMatrix();
      crowns.current.setMatrixAt(i, d.matrix); crowns.current.setColorAt(i, col.set(t.c));
    });
    data.pines.forEach((t, i) => {
      d.position.set(t.x, 4.2 * t.s, t.z); d.scale.set(1.9 * t.s, 6 * t.s, 1.9 * t.s); d.updateMatrix();
      cones.current.setMatrixAt(i, d.matrix); cones.current.setColorAt(i, col.set(t.c));
    });
    data.bushes.forEach((t, i) => {
      d.position.set(t.x, 0.55 * t.s, t.z); d.scale.set(1.3 * t.s, 0.85 * t.s, 1.3 * t.s); d.updateMatrix();
      bush.current.setMatrixAt(i, d.matrix); bush.current.setColorAt(i, col.set(t.c));
    });
    data.flowers.forEach((t, i) => {
      d.position.set(t.x, 0.3, t.z); d.scale.set(1, 1, 1); d.updateMatrix();
      flo.current.setMatrixAt(i, d.matrix); flo.current.setColorAt(i, col.set(t.c));
    });
    [trunks, crowns, cones, bush, flo].forEach((m) => { m.current.instanceMatrix.needsUpdate = true; if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true; });
  }, [data]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, data.round.length + data.pines.length]}>
        <cylinderGeometry args={[0.35, 0.5, 2.2, 8]} /><meshLambertMaterial color="#9a6238" />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, data.round.length]}>
        <icosahedronGeometry args={[1, 2]} /><meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={cones} args={[undefined, undefined, data.pines.length]}>
        <coneGeometry args={[1, 1, 9]} /><meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={bush} args={[undefined, undefined, data.bushes.length]}>
        <icosahedronGeometry args={[1, 1]} /><meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={flo} args={[undefined, undefined, data.flowers.length]}>
        <icosahedronGeometry args={[0.3, 0]} /><meshLambertMaterial color="#ffffff" />
      </instancedMesh>
    </group>
  );
}

/* ---------- nubes ---------- */
function Clouds() {
  const g = useRef<THREE.Group>(null!);
  const puffs = useMemo(() => {
    const r = rng(21);
    return Array.from({ length: 7 }, () => ({ x: -260 + r() * 520, y: 70 + r() * 35, z: -140 + r() * 280, s: 7 + r() * 8 }));
  }, []);
  useFrame((_, dt) => { g.current.children.forEach((c) => { c.position.x += dt * 2.2; if (c.position.x > 280) c.position.x = -280; }); });
  return (
    <group ref={g}>
      {puffs.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]}>
          {[[0, 0, 0, 1], [1.1, -0.15, 0.2, 0.8], [-1.1, -0.2, -0.1, 0.75], [0.4, 0.45, 0, 0.7]].map((c, k) => (
            <mesh key={k} position={[c[0] * p.s, c[1] * p.s, c[2] * p.s]} scale={p.s * c[3]}>
              <icosahedronGeometry args={[1, 2]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ---------- montacargas 3D ---------- */
function ForkliftModel({ id }: { id: string }) {
  const steel = "#5f6f8d", dark = "#252d40";
  return (
    <group ref={(g) => { if (g) { fk.set(id, g); rigMontacargas(g); } else fk.delete(id); }} scale={1.35}>
      {/* ruedas (motrices adelante, directrices atrás): userData.wheel = radio; el grupo es la dirección y su hijo el giro */}
      {[[-0.62, 0.55, 0.36], [0.62, 0.55, 0.36], [-0.6, -0.85, 0.3], [0.6, -0.85, 0.3]].map(([x, z, r], i) => (
        <group key={i} position={[x, r, z]} userData={{ wheel: r, rear: z < 0 }}>
          <group>
            <group rotation={[0, 0, Math.PI / 2]}>
              <mesh><cylinderGeometry args={[r, r, 0.3, 20]} /><meshLambertMaterial color={dark} /></mesh>
              <mesh position={[0, x > 0 ? 0.16 : -0.16, 0]}><cylinderGeometry args={[r * 0.5, r * 0.5, 0.04, 16]} /><meshLambertMaterial color="#aeb9d0" /></mesh>
              <mesh position={[0, x > 0 ? 0.19 : -0.19, 0]}><boxGeometry args={[0.03, 0.03, r * 0.9]} /><meshLambertMaterial color={dark} /></mesh>
            </group>
          </group>
        </group>
      ))}
      {/* chasis y contrapeso */}
      <RoundedBox args={[1.24, 0.62, 2.2]} radius={0.14} smoothness={4} position={[0, 0.66, -0.1]}><meshLambertMaterial color="#ff9a1f" /></RoundedBox>
      <RoundedBox args={[1.2, 0.8, 0.62]} radius={0.2} smoothness={4} position={[0, 0.82, -1.18]}><meshLambertMaterial color="#f07d00" /></RoundedBox>
      <RoundedBox args={[1.0, 0.12, 0.5]} radius={0.04} position={[0, 1.04, 0.62]}><meshLambertMaterial color="#e08800" /></RoundedBox>
      {/* asiento (tope a 1,25: el conductor se sienta ahí con los pies sobre el chasis; el marcador "asiento" son sus pies) y pedales */}
      <RoundedBox args={[0.5, 0.2, 0.5]} radius={0.03} position={[0, 1.07, -0.4]}><meshLambertMaterial color="#2b3447" /></RoundedBox>
      <RoundedBox args={[0.7, 0.14, 0.6]} radius={0.05} position={[0, 1.182, -0.4]}><meshLambertMaterial color={dark} /></RoundedBox>
      <RoundedBox args={[0.7, 0.5, 0.12]} radius={0.05} position={[0, 1.5, -0.55]}><meshLambertMaterial color={dark} /></RoundedBox>
      <object3D name="asiento" position={[0, 0.652, -0.4]} />
      {[-0.1, 0.1].map((x) => <mesh key={x} position={[x, 0.99, 0.14]}><boxGeometry args={[0.1, 0.04, 0.12]} /><meshLambertMaterial color="#161b28" /></mesh>)}
      {/* volante: gira con la dirección (grupo "volante", eje = normal del aro) y las manos del operario lo siguen; la columna lo une al chasis */}
      <group position={[0, 1.581, -0.104]} rotation={[0.9, 0, 0]}>
        <group name="volante">
          <mesh><torusGeometry args={[0.2, 0.03, 8, 20]} /><meshLambertMaterial color={dark} /></mesh>
          <mesh><boxGeometry args={[0.4, 0.03, 0.03]} /><meshLambertMaterial color={dark} /></mesh>
          <mesh><boxGeometry args={[0.03, 0.2, 0.03]} /><meshLambertMaterial color={dark} /></mesh>
        </group>
      </group>
      <mesh position={[0, 1.327, 0.098]} rotation={[0.9 + Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 0.65, 10]} /><meshLambertMaterial color={dark} /></mesh>
      <RoundedBox args={[0.3, 0.1, 0.3]} radius={0.03} position={[0, 1.03, 0.3]}><meshLambertMaterial color="#e08800" /></RoundedBox>
      {/* techo de protección */}
      {[[-0.52, 0.55], [0.52, 0.55], [-0.52, -0.82], [0.52, -0.82]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.62, z]}><boxGeometry args={[0.06, 1.3, 0.06]} /><meshLambertMaterial color={dark} /></mesh>
      ))}
      <RoundedBox args={[1.22, 0.07, 1.5]} radius={0.03} position={[0, 2.3, -0.14]}><meshLambertMaterial color="#3a4560" /></RoundedBox>
      <mesh position={[0, 2.4, -0.1]}><cylinderGeometry args={[0.07, 0.09, 0.12, 12]} /><meshLambertMaterial color="#ffd23f" /></mesh>
      {/* mástil, carro y horquillas */}
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 1.02, 1.12]}><boxGeometry args={[0.1, 2.0, 0.12]} /><meshLambertMaterial color={steel} /></mesh>
      ))}
      <mesh position={[0, 1.95, 1.12]}><boxGeometry args={[0.94, 0.08, 0.1]} /><meshLambertMaterial color={steel} /></mesh>
      <mesh position={[0, 0.2, 1.12]}><boxGeometry args={[0.94, 0.1, 0.1]} /><meshLambertMaterial color={steel} /></mesh>
      <mesh position={[0, 0.48, 1.22]}><boxGeometry args={[0.9, 0.46, 0.06]} /><meshLambertMaterial color="#7c8bab" /></mesh>
      {[-0.3, 0.3].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.18, 1.82]}><boxGeometry args={[0.12, 0.06, 1.2]} /><meshLambertMaterial color="#4a5670" /></mesh>
          <mesh position={[x, 0.42, 1.27]}><boxGeometry args={[0.12, 0.54, 0.05]} /><meshLambertMaterial color="#4a5670" /></mesh>
        </group>
      ))}
      {/* pallet con cajas: se muestra solo cuando va cargado */}
      <group visible={false} ref={(g) => { if (g) pal.set(id, g); else pal.delete(id); }}>
        <mesh position={[0, 0.27, 1.85]}><boxGeometry args={[1.0, 0.14, 1.2]} /><meshLambertMaterial color="#e2a35f" /></mesh>
        {[[-0.25, -0.3], [0.25, -0.3], [-0.25, 0.3], [0.25, 0.3]].map(([x, z], i) => (
          <RoundedBox key={i} args={[0.46, 0.5, 0.56]} radius={0.03} position={[x, 0.59, 1.85 + z]}><meshLambertMaterial color="#f6efe0" /></RoundedBox>
        ))}
        {[[-0.25, 0], [0.25, 0]].map(([x, z], i) => (
          <RoundedBox key={i} args={[0.46, 0.5, 1.12]} radius={0.03} position={[x, 1.09, 1.85 + z]}><meshLambertMaterial color="#efe5cf" /></RoundedBox>
        ))}
      </group>
    </group>
  );
}

/* ---------- registro de objetos animados por cuadro ---------- */
const world = new Map<string, THREE.Vector3>(); // posición del pin
const ground = fleetGround; // montacargas: posición en el piso (suavizada); la leen también las cinemáticas
const els = new Map<string, HTMLElement>();
const fk = forklifts;
const pal = new Map<string, THREE.Group>(); // pallet sobre las horquillas
const visFleet = new Map<string, { x: number; y: number }>(); // posición mostrada (Blender)
const VIS_MAX_SPEED = 14; // m/s: velocidad visual máxima de un montacargas
MACHINES.forEach((m) => world.set(m.id, P(m.x, m.y, Math.max(m.sz, 1.2) + 1.6)));
FLEET.forEach((f) => ground.set(f.id, P(f.x, f.y, 0)));

/** Un cuadro: mueve montacargas y proyecta los pines a pantalla (todo sin pasar por React). */
function Projector() {
  const size = useThree((s) => s.size);
  const cam = useThree((s) => s.camera);
  const v = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    stepRigs(dt);
    const st = useStore.getState();
    const h = st.history;
    const snap = h.length ? snapshotAt(h, clock.t) : undefined;
    const k = Math.min(1, dt * 12);
    FLEET.forEach((f) => {
      const l = snap?.fleet[f.id];
      const g = fk.get(f.id);
      const c = ground.get(f.id)!;
      if (g && st.driving === f.id) { // lo maneja el operario (Walk): al soltarlo vuelve solo por la red a su posición simulada
        c.copy(g.position);
        visFleet.set(f.id, { x: c.x, y: -c.z });
        world.set(f.id, c.clone().setY(3.4));
        return;
      }
      let tb: { x: number; y: number } | null = null; // posición objetivo (coordenadas de Blender)
      if (st.demo) { const dd = demoFleetAt(f.id, clock.t); tb = { x: dd.x, y: dd.y }; }
      else if (l) tb = fleetAt(h, f.id, clock.t) ?? { x: l.x, y: l.y };
      if (tb) {
        // el montacargas se mueve por la red hacia su objetivo con un tope de velocidad visual (si la simulación
        // va muy rápida no se teletransporta: se ve avanzando fluido, un poco atrasado)
        const vis = visFleet.get(f.id);
        let nx = tb.x, ny = tb.y;
        if (vis) {
          const dist = Math.hypot(tb.x - vis.x, tb.y - vis.y);
          if (dist > 0.02) {
            const path = pathBetween([vis.x, vis.y], [tb.x, tb.y]);
            let total = 0;
            for (let i = 1; i < path.length; i++) total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
            const step = VIS_MAX_SPEED * dt;
            if (total > step) { const q = alongPath(path, step / total); nx = q.x; ny = q.y; }
          }
        }
        if (vis && huellaUsuario.length) { // el vehículo que maneja el operario no se atraviesa: este espera si se acerca a su huella
          const q = P(nx, ny, 0);
          if (huellaUsuario.some((h) => Math.hypot(q.x - h.x, q.z - h.z) < h.r + 1.3)) { nx = vis.x; ny = vis.y; }
        }
        visFleet.set(f.id, { x: nx, y: ny });
        const prev = c.clone();
        c.copy(P(nx, ny, 0));
        const dx = c.x - prev.x, dz = c.z - prev.z;
        if (g) {
          // rumbo: solo si se movió de verdad, y girando de a poco por el camino más corto (sin remolinos)
          if (dx * dx + dz * dz > 4e-4) {
            const want = Math.atan2(dx, dz);
            let da = want - g.rotation.y;
            da = Math.atan2(Math.sin(da), Math.cos(da));
            g.rotation.y += da * Math.min(1, dt * 6);
          }
          g.position.copy(c);
        }
      } else if (g) g.position.copy(c);
      world.set(f.id, c.clone().setY(3.4));
      const pg = pal.get(f.id);
      if (pg) pg.visible = st.demo ? !!(tb && demoFleetAt(f.id, clock.t).forward) : !!l?.carrying;
      world.set(f.id, c.clone().setY(3.4));
    });
    els.forEach((el, id) => {
      const t = world.get(id);
      if (!t) return;
      v.current.copy(t).project(cam);
      el.style.display = v.current.z > 1 || v.current.z < -1 ? "none" : "";
      el.style.transform = `translate(${((v.current.x + 1) / 2) * size.width}px, ${((1 - v.current.y) / 2) * size.height}px) translate(-50%, -50%)`;
      el.style.zIndex = String(Math.round((1 - v.current.z) * 1000));
    });
  });
  return null;
}

/* ---------- cajas sobre las cintas reales (posición = reloj de simulación, así avanzan fluido y se frenan al pausar) ---------- */
// kind: "hamb" = hamburguesas (discos de 11 cm en dos carriles) · "caja" = cajas de 5 kg
interface Belt { kind: "hamb" | "caja"; x1: number; y1: number; x2: number; y2: number; spacing: number; speed: number; src: string[]; color: string; size: [number, number, number]; lanes: number[]; n: number; len: number; vis: number }
const mkBelts = (): Belt[] => (["L7", "L8"] as const).flatMap((L) => {
  const y = L === "L7" ? { a: 9.6, b: 14.4, c: 12 } : { a: -22.4, b: -17.6, c: -20 };
  const def = (kind: Belt["kind"], x1: number, y1: number, x2: number, y2: number, spacing: number, speed: number, src: string[], color: string, size: [number, number, number], lanes: number[] = [0]): Belt => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    return { kind, x1, y1, x2, y2, spacing, speed, src, color, size, lanes, len, n: Math.max(1, Math.floor(len / spacing)), vis: 0 };
  };
  const HAMB: [number, number, number] = [0.11, 0.016, 0.11];
  return [
    def("hamb", -20.5, y.a, -12, y.a, 0.3, 0.25, [`FormA_${L}`], "#a5503d", HAMB, [-0.14, 0.14]),
    def("hamb", -20.5, y.b, -12, y.b, 0.3, 0.25, [`FormB_${L}`], "#a5503d", HAMB, [-0.14, 0.14]),
    def("hamb", 2.6, y.c, 6.4, y.c, 0.3, 0.2, [`Tunel_${L}`], "#c99a8c", HAMB, [-0.14, 0.14]),   // escarchadas
    def("caja", 19.1, y.c, 25.75, y.c, 1.2, 0.25, [`EncA_${L}`, `EncB_${L}`], "#d9a35c", [0.5, 0.35, 0.4]),
  ];
});

const BELTS = mkBelts();
const TOT_FLOW = {
  hamb: BELTS.filter((b) => b.kind === "hamb").reduce((a, b) => a + b.n * b.lanes.length, 0),
  caja: BELTS.filter((b) => b.kind === "caja").reduce((a, b) => a + b.n * b.lanes.length, 0),
};
const flowD = new THREE.Object3D();
const flowCol = new THREE.Color();

function Flow() {
  const hamb = useRef<THREE.InstancedMesh>(null!);
  const caja = useRef<THREE.InstancedMesh>(null!);
  useFrame((_, dt) => animarFlow(hamb.current, caja.current, dt));
  return (
    <>
      <instancedMesh ref={hamb} args={[undefined, undefined, TOT_FLOW.hamb]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.5, 1, 14]} /><meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={caja} args={[undefined, undefined, TOT_FLOW.caja]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="#ffffff" />
      </instancedMesh>
    </>
  );
}

/** Un cuadro de las hamburguesas y cajas sobre las cintas (posición = reloj de simulación). */
function animarFlow(hambMesh: THREE.InstancedMesh, cajaMesh: THREE.InstancedMesh, dt: number) {
  const d = flowD, col = flowCol;
  {
    const st = useStore.getState();
    const h = st.history;
    const snap = h.length ? h[indexAt(h, clock.t)] : undefined;
    const idx = { hamb: 0, caja: 0 };
    for (const b of BELTS) {
      const on = !!snap && b.src.some((id) => { const m = snap.machines[id]; return !!m && (m.state === "proc" || m.content > 0); });
      b.vis += ((on ? 1 : 0) - b.vis) * Math.min(1, dt * 4);
      const mesh = b.kind === "hamb" ? hambMesh : cajaMesh;
      const top = b.kind === "hamb" ? 0.985 : 1.2;   // apoyadas sobre la banda
      for (let k = 0; k < b.n; k++) {
        const dist = (((clock.t * b.speed + k * b.spacing) % b.len) + b.len) % b.len;
        const f = dist / b.len;
        const fade = Math.max(Math.min(1, dist / 0.5, (b.len - dist) / 0.5) * b.vis, 0.0001);
        for (const off of b.lanes) {
          d.position.set(b.x1 + (b.x2 - b.x1) * f, top, -(b.y1 + (b.y2 - b.y1) * f + off));
          d.scale.set(b.size[0] * fade, b.size[1] * fade, b.size[2] * fade);
          d.updateMatrix();
          const i = idx[b.kind]++;
          mesh.setMatrixAt(i, d.matrix);
          mesh.setColorAt(i, col.set(b.color));
        }
      }
    }
    for (const m of [hambMesh, cajaMesh]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }
}

/* ---------- pines clicables (DOM sobre el canvas) ---------- */
export function PinLayer() {
  const last = useLatest();
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const line = useStore((s) => s.line);
  const walk = useStore((s) => s.mode === "walk" && !s.plan); // a pie: solo el pin de lo elegido (en el plano, todos)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {MACHINES.map((m) => {
        if (line !== "Todas" && m.line !== "Común" && m.line !== line) return null;
        const on = selected === m.id;
        if (walk && !on) return null;
        const state = last?.machines[m.id]?.state ?? "idle";
        return (
          <div key={m.id} ref={(e) => { if (e) els.set(m.id, e); else els.delete(m.id); }} className="absolute left-0 top-0" style={{ willChange: "transform" }}>
            <button onClick={() => select(on ? null : m.id)} className={`pin pointer-events-auto ${on ? "pin-on" : ""} ${state === "proc" ? "pin-proc" : ""}`} aria-label={`${m.label} ${m.line}`} style={{ ["--c" as string]: STATE_COLOR[state] }}>
              <span className="pin-dot" />
              {on && <span className="pin-tag">{m.label}{m.line !== "Común" ? ` · ${m.line}` : ""}</span>}
            </button>
          </div>
        );
      })}
      {FLEET.map((f) => {
        const on = selected === f.id;
        const carrying = last?.fleet[f.id]?.carrying;
        if (walk && !on) return null;
        return (
          <div key={f.id} ref={(e) => { if (e) els.set(f.id, e); else els.delete(f.id); }} className="absolute left-0 top-0" style={{ willChange: "transform" }}>
            <button onClick={() => select(on ? null : f.id)} className={`pin pin-fork pointer-events-auto ${on ? "pin-on" : ""}`} aria-label={f.label}>
              <span className="pin-dot" />
              {(on || carrying) && <span className="pin-tag">{f.label}{carrying ? " · con carga" : ""}</span>}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Highlight() {
  const selected = useStore((s) => s.selected);
  const live = useLatest();
  const ref = useRef<THREE.Mesh>(null!);
  const m = selected ? byId(selected) : undefined;
  useFrame(({ clock: c }) => { if (ref.current) { const s = 1 + Math.sin(c.elapsedTime * 3) * 0.025; ref.current.scale.set(s, s, s); } });
  if (!m) return null;
  const color = STATE_COLOR[live?.machines[m.id]?.state ?? "idle"];
  return (
    <RoundedBox ref={ref} args={[m.sx + 1, m.sz + 0.6, m.sy + 1]} radius={0.55} smoothness={4} position={P(m.x, m.y, m.sz / 2)}>
      <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
    </RoundedBox>
  );
}

/** Al elegir un objeto: la cámara se centra y se acerca con una transición suave de duración fija (igual en PC y celular). */
function Rig() {
  const selected = useStore((s) => s.selected);
  const controls = useThree((s) => s.controls) as unknown as OC | null;
  const cam = useThree((s) => s.camera);
  const tween = useRef<{ t0: number; fromT: THREE.Vector3; toT: THREE.Vector3; fromD: number; toD: number; dir: THREE.Vector3 } | null>(null);
  const pending = useRef<{ target: THREE.Vector3; dist: number } | null>(null);
  useEffect(() => {
    if (!selected) { pending.current = null; return; }
    const m = byId(selected);
    if (m) pending.current = { target: P(m.x, m.y, m.sz / 2), dist: Math.max(9, Math.max(m.sx, m.sy, m.sz) * 2.2 + 6) };
    else if (FLEET.some((f) => f.id === selected)) {
      const g = ground.get(selected);
      pending.current = { target: (g ?? new THREE.Vector3()).clone().setY(1), dist: 12 };
    }
  }, [selected]);
  useEffect(() => {
    if (!controls) return;
    const ctl = controls as unknown as THREE.EventDispatcher<{ start: object }>;
    const stop = () => { if (tween.current && performance.now() - tween.current.t0 > 350) tween.current = null; }; // el usuario toma la cámara
    ctl.addEventListener("start", stop);
    return () => ctl.removeEventListener("start", stop);
  }, [controls]);
  useFrame(() => {
    if (!controls) return;
    if (pending.current) {
      const g = pending.current;
      pending.current = null;
      const dir = cam.position.clone().sub(controls.target);
      const dist = dir.length() || 1;
      tween.current = { t0: performance.now(), fromT: controls.target.clone(), toT: g.target.clone(), fromD: dist, toD: g.dist, dir: dir.divideScalar(dist) };
    }
    const tw = tween.current;
    if (!tw) return;
    const u = Math.min(1, (performance.now() - tw.t0) / 900);
    const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; // easeInOutCubic
    controls.target.copy(tw.fromT).lerp(tw.toT, e);
    const nd = tw.fromD + (tw.toD - tw.fromD) * e;
    cam.position.copy(controls.target).addScaledVector(tw.dir, nd);
    controls.update();
    if (u >= 1) tween.current = null;
  });
  return null;
}

function LoaderOverlay() {
  const { active, progress } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="absolute inset-0 z-10 grid place-items-center">
      <div className="glass flex w-[min(380px,88vw)] flex-col items-center gap-4 p-7 text-center" role="status" aria-live="polite">
        <div className="spinner" aria-hidden />
        <div>
          <div className="text-[16px] font-extrabold tracking-tight">Armando la planta en 3D</div>
          <div className="mt-0.5 text-[12px] text-muted">El modelo pesa unos 21 MB; las próximas veces carga más rápido.</div>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#dbe4f1]">
          <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${Math.max(6, progress)}%` }} />
        </div>
        <div className="tnum text-[12px] font-bold text-muted">{progress.toFixed(0)} %</div>
      </div>
    </div>
  );
}

export default function Scene3D() {
  const walk = useStore((s) => s.mode === "walk");
  const rend = useStore((s) => s.rend);
  const calor = useStore((s) => s.calor);
  return (
    <div className="absolute inset-0" style={{ isolation: "isolate", zIndex: 0, background: "linear-gradient(180deg, #a9dcff 0%, #cfe9ff 40%, #dcefff 100%)" }}>
      <Canvas dpr={rend ? 1 : [1, 1.5]} performance={{ min: 0.6 }} camera={{ position: [86, 66, 86], fov: 32, near: 0.1, far: 3000 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping, logarithmicDepthBuffer: true }}>
        <fog attach="fog" args={["#dcefff", 500, 2800]} />
        <hemisphereLight args={["#ffffff", "#9be37a", 1.55]} />
        <directionalLight position={[80, 150, 60]} intensity={2.1} color="#fffdf6" />
        <Suspense fallback={null}>
          <Plant />
          {rend && <PlantaFundida />}
          <Operarios />
          <OperariosPlanta />
          <Trucks />
          <CineTruck />
        </Suspense>
        <Island />
        <Vegetation />
        <Clouds />
        <Flow />
        {FLEET.map((f) => <ForkliftModel key={f.id} id={f.id} />)}
        <Highlight />
        {calor && <Calor />}
        <Escenario3D />
        {walk ? (
          <Suspense fallback={null}><Walk /></Suspense>
        ) : (
          <>
            <OrbitControls makeDefault enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.15} minDistance={0.05} maxDistance={Infinity} zoomToCursor target={[0, 0, 0]} />
            <Rig />
            <CineRig />
          </>
        )}
        <Projector />
      </Canvas>
      <PinLayer />
      <LoaderOverlay />
    </div>
  );
}
useGLTF.preload("/models/planta_v10.glb");
