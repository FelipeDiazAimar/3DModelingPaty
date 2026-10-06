"use client";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OC } from "three-stdlib";
import { FLEET, MACHINES, STATE_COLOR, byId } from "@/lib/layout";
import { clock, indexAt, snapshotAt, useLatest, useStore } from "@/lib/store";
import { demoFleetAt } from "@/lib/demo";
import { fleetAt } from "@/lib/fleetPath";

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

function Plant() {
  const { scene } = useGLTF("/models/planta.glb");
  useMemo(() => {
    const seen = new Set<THREE.Material>();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
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
  }, [scene]);
  return <primitive object={scene} />;
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
const FAR: [number, number, number, number][] = [ // bosque lejano alrededor de la planta
  [-900, -160, -900, 900], [160, 900, -900, 900], [-160, 160, -900, -115], [-160, 160, 110, 900],
];
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
    for (let i = 0; i < 95; i++) { const [x, z] = at(); round.push({ x, z, s: 0.8 + r() * 0.9, c: r() < 0.16 ? pick(r, blossom) : pick(r, greens) }); }
    for (let i = 0; i < 55; i++) { const [x, z] = at(); pines.push({ x, z, s: 0.8 + r() * 0.8, c: pick(r, ["#1f9d5a", "#16864b", "#2db36a", "#35c277"]) }); }
    for (let i = 0; i < 90; i++) { const [x, z] = at(); bushes.push({ x, z, s: 0.7 + r() * 0.9, c: pick(r, [...greens, "#a6e35a"]) }); }
    for (let i = 0; i < 260; i++) { const [x, z] = atFar(); round.push({ x, z, s: 1.1 + r() * 1.3, c: r() < 0.12 ? pick(r, blossom) : pick(r, greens) }); }
    for (let i = 0; i < 160; i++) { const [x, z] = atFar(); pines.push({ x, z, s: 1.1 + r() * 1.2, c: pick(r, ["#1f9d5a", "#16864b", "#2db36a", "#35c277"]) }); }
    for (let i = 0; i < 150; i++) { const [x, z] = atFar(); bushes.push({ x, z, s: 1 + r() * 1.4, c: pick(r, [...greens, "#a6e35a"]) }); }
    for (let i = 0; i < 520; i++) { const [x, z] = at(); flowers.push({ x, z, c: pick(r, ["#ff5d8f", "#ffd23f", "#ffffff", "#b388ff", "#ff8a3d", "#5ec8ff"]) }); }
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
    <group ref={(g) => { if (g) fk.set(id, g); else fk.delete(id); }} scale={1.35}>
      {/* ruedas (motrices adelante, directrices atrás) */}
      {[[-0.62, 0.55, 0.36], [0.62, 0.55, 0.36], [-0.6, -0.85, 0.3], [0.6, -0.85, 0.3]].map(([x, z, r], i) => (
        <group key={i} position={[x, r, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh><cylinderGeometry args={[r, r, 0.3, 20]} /><meshLambertMaterial color={dark} /></mesh>
          <mesh position={[0, x > 0 ? 0.16 : -0.16, 0]}><cylinderGeometry args={[r * 0.5, r * 0.5, 0.04, 16]} /><meshLambertMaterial color="#aeb9d0" /></mesh>
        </group>
      ))}
      {/* chasis y contrapeso */}
      <RoundedBox args={[1.24, 0.62, 2.2]} radius={0.14} smoothness={4} position={[0, 0.66, -0.1]}><meshLambertMaterial color="#ff9a1f" /></RoundedBox>
      <RoundedBox args={[1.2, 0.8, 0.62]} radius={0.2} smoothness={4} position={[0, 0.82, -1.18]}><meshLambertMaterial color="#f07d00" /></RoundedBox>
      <RoundedBox args={[1.0, 0.12, 0.5]} radius={0.04} position={[0, 1.04, 0.62]}><meshLambertMaterial color="#e08800" /></RoundedBox>
      {/* asiento */}
      <RoundedBox args={[0.7, 0.14, 0.6]} radius={0.05} position={[0, 1.04, -0.4]}><meshLambertMaterial color={dark} /></RoundedBox>
      <RoundedBox args={[0.7, 0.5, 0.12]} radius={0.05} position={[0, 1.3, -0.72]}><meshLambertMaterial color={dark} /></RoundedBox>
      {/* volante */}
      <mesh position={[0, 1.32, 0.12]} rotation={[0.9, 0, 0]}><torusGeometry args={[0.16, 0.025, 8, 20]} /><meshLambertMaterial color={dark} /></mesh>
      {/* techo de protección */}
      {[[-0.52, 0.55], [0.52, 0.55], [-0.52, -0.82], [0.52, -0.82]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.55, z]}><boxGeometry args={[0.06, 1.0, 0.06]} /><meshLambertMaterial color={dark} /></mesh>
      ))}
      <RoundedBox args={[1.22, 0.07, 1.5]} radius={0.03} position={[0, 2.06, -0.14]}><meshLambertMaterial color="#3a4560" /></RoundedBox>
      <mesh position={[0, 2.16, -0.1]}><cylinderGeometry args={[0.07, 0.09, 0.12, 12]} /><meshLambertMaterial color="#ffd23f" /></mesh>
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
const ground = new Map<string, THREE.Vector3>(); // montacargas: posición en el piso (suavizada)
const els = new Map<string, HTMLElement>();
const fk = new Map<string, THREE.Group>();
const pal = new Map<string, THREE.Group>(); // pallet sobre las horquillas
MACHINES.forEach((m) => world.set(m.id, P(m.x, m.y, Math.max(m.sz, 1.2) + 1.6)));
FLEET.forEach((f) => ground.set(f.id, P(f.x, f.y, 0)));

/** Un cuadro: mueve montacargas y proyecta los pines a pantalla (todo sin pasar por React). */
function Projector() {
  const size = useThree((s) => s.size);
  const cam = useThree((s) => s.camera);
  const v = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    const st = useStore.getState();
    const h = st.history;
    const snap = h.length ? snapshotAt(h, clock.t) : undefined;
    const k = Math.min(1, dt * 12);
    FLEET.forEach((f) => {
      const l = snap?.fleet[f.id];
      const g = fk.get(f.id);
      const c = ground.get(f.id)!;
      let tgt: THREE.Vector3 | null = null;
      if (st.demo) { const d = demoFleetAt(f.id, clock.t); tgt = P(d.x, d.y, 0); }
      else if (l) { const fp = fleetAt(h, f.id, clock.t) ?? l; tgt = P(fp.x, fp.y, 0); }
      if (tgt) {
        const prev = c.clone();
        if (st.demo) c.copy(tgt); else c.lerp(tgt, k);
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
      const pg = pal.get(f.id);
      if (pg) pg.visible = st.demo ? !!(tgt && demoFleetAt(f.id, clock.t).forward) : !!l?.carrying;
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
interface Belt { x1: number; y1: number; x2: number; y2: number; spacing: number; speed: number; src: string[]; color: string; size: [number, number, number]; n: number; len: number; vis: number }
const mkBelts = (): Belt[] => (["L7", "L8"] as const).flatMap((L) => {
  const y = L === "L7" ? { a: 9.6, b: 14.4, c: 12 } : { a: -22.4, b: -17.6, c: -20 };
  const def = (x1: number, y1: number, x2: number, y2: number, spacing: number, speed: number, src: string[], color: string, size: [number, number, number]): Belt => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    return { x1, y1, x2, y2, spacing, speed, src, color, size, len, n: Math.max(1, Math.floor(len / spacing)), vis: 0 };
  };
  return [
    def(-20.5, y.a, -12, y.a, 1.4, 0.25, [`FormA_${L}`], "#b5613a", [0.55, 0.16, 0.5]),
    def(-20.5, y.b, -12, y.b, 1.4, 0.25, [`FormB_${L}`], "#b5613a", [0.55, 0.16, 0.5]),
    def(2.6, y.c, 6.4, y.c, 1.0, 0.2, [`Tunel_${L}`], "#e9eef7", [0.5, 0.14, 0.4]),
    def(19.1, y.c, 25.75, y.c, 1.2, 0.25, [`EncA_${L}`, `EncB_${L}`], "#d9a35c", [0.5, 0.35, 0.4]),
  ];
});

function Flow() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const belts = useMemo(mkBelts, []);
  const total = useMemo(() => belts.reduce((a, b) => a + b.n, 0), [belts]);
  const d = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  useFrame((_, dt) => {
    const st = useStore.getState();
    const h = st.history;
    const snap = h.length ? h[indexAt(h, clock.t)] : undefined;
    let i = 0;
    for (const b of belts) {
      const on = !!snap && b.src.some((id) => { const m = snap.machines[id]; return !!m && (m.state === "proc" || m.content > 0); });
      b.vis += ((on ? 1 : 0) - b.vis) * Math.min(1, dt * 4);
      for (let k = 0; k < b.n; k++, i++) {
        const dist = (((clock.t * b.speed + k * b.spacing) % b.len) + b.len) % b.len;
        const f = dist / b.len;
        const fade = Math.min(1, dist / 0.7, (b.len - dist) / 0.7) * b.vis;
        d.position.set(b.x1 + (b.x2 - b.x1) * f, 1.2, -(b.y1 + (b.y2 - b.y1) * f));
        d.scale.set(b.size[0] * Math.max(fade, 0.0001), b.size[1] * Math.max(fade, 0.0001), b.size[2] * Math.max(fade, 0.0001));
        d.updateMatrix();
        mesh.current.setMatrixAt(i, d.matrix);
        mesh.current.setColorAt(i, col.set(b.color));
      }
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, total]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="#ffffff" />
    </instancedMesh>
  );
}

/* ---------- pines clicables (DOM sobre el canvas) ---------- */
export function PinLayer() {
  const last = useLatest();
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const line = useStore((s) => s.line);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {MACHINES.map((m) => {
        if (line !== "Todas" && m.line !== "Común" && m.line !== line) return null;
        const on = selected === m.id;
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
  return (
    <div className="absolute inset-0" style={{ isolation: "isolate", zIndex: 0, background: "linear-gradient(180deg, #a9dcff 0%, #cfe9ff 40%, #dcefff 100%)" }}>
      <Canvas dpr={[1, 1.5]} performance={{ min: 0.6 }} camera={{ position: [86, 66, 86], fov: 32, near: 0.1, far: 3000 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}>
        <fog attach="fog" args={["#dcefff", 500, 2800]} />
        <hemisphereLight args={["#ffffff", "#9be37a", 1.55]} />
        <directionalLight position={[80, 150, 60]} intensity={2.1} color="#fffdf6" />
        <Suspense fallback={null}>
          <Plant />
        </Suspense>
        <Island />
        <Vegetation />
        <Clouds />
        <Flow />
        {FLEET.map((f) => <ForkliftModel key={f.id} id={f.id} />)}
        <Highlight />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.15} minDistance={0.05} maxDistance={Infinity} zoomToCursor target={[0, 0, 0]} />
        <Rig />
        <Projector />
      </Canvas>
      <PinLayer />
      <LoaderOverlay />
    </div>
  );
}
useGLTF.preload("/models/planta.glb");
