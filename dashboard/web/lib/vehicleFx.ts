/**
 * Dinámica visual de los vehículos (camiones y montacargas): ruedas que giran según la distancia recorrida,
 * dirección (yaw de las ruedas directrices y volante), cabeceo / balanceo con resorte y acoplado articulado
 * en la quinta rueda. No toca a quien mueve el vehículo: mide cuánto se movió el objeto entre cuadros
 * (posición y rumbo), así vale igual para la simulación que para el que maneja el operario.
 */
import * as THREE from "three";

interface Wheel { steer: THREE.Object3D | null; spin: THREE.Object3D[]; r: number }
interface Cfg {
  truck: boolean;      // frente +x local (camión) o +z local (montacargas)
  L: number;           // distancia entre ejes (m)
  d: number;           // quinta rueda a ejes del acoplado (m)
  kmax: number;        // curvatura máxima (1/m)
  kp: number; kr: number; lim: number; // cabeceo y balanceo por m/s² y por m/s² lateral; tope (rad)
  ratio: number;       // giro del volante por giro de la rueda
}
interface Rig {
  obj: THREE.Object3D; tilt: THREE.Object3D; cfg: Cfg; wheels: Wheel[];
  volante?: THREE.Object3D; semi?: THREE.Object3D;
  init: boolean; px: number; pz: number; ry: number;
  vs: number; as: number; lat: number; kap: number; gam: number;
  pitch: number; pv: number; roll: number; rv: number;
}
const rigs = new Map<THREE.Object3D, Rig>();
const clamp = THREE.MathUtils.clamp;

function alta(obj: THREE.Object3D, tilt: THREE.Object3D, cfg: Cfg, wheels: Wheel[], volante?: THREE.Object3D, semi?: THREE.Object3D) {
  rigs.set(obj, { obj, tilt, cfg, wheels, volante, semi, init: false, px: 0, pz: 0, ry: 0, vs: 0, as: 0, lat: 0, kap: 0, gam: 0, pitch: 0, pv: 0, roll: 0, rv: 0 });
}

/** Montacargas de Scene3D (o una copia): las ruedas son grupos con userData.wheel (radio) y .rear, el volante se llama "volante". */
export function rigMontacargas(g: THREE.Object3D) {
  g.rotation.order = "YXZ"; // yaw primero y después cabeceo (x) y balanceo (z) en el marco del vehículo
  const wheels: Wheel[] = [];
  g.traverse((o) => { if (o.userData.wheel) wheels.push({ steer: o.userData.rear ? o : null, spin: [o.children[0]], r: o.userData.wheel }); });
  alta(g, g, { truck: false, L: 1.4, d: 0, kmax: 0.9, kp: 0.012, kr: 0.012, lim: 0.045, ratio: 3 }, wheels, g.getObjectByName("volante") ?? undefined);
}

/** Un cuerpo rígido en planta (para colisiones): rectángulo en el marco de `obj`, largo sobre `eje` ("x" o "z" local) y semiancho `b` sobre el otro. */
export interface Cuerpo { obj: THREE.Object3D; eje: "x" | "z"; a0: number; a1: number; b: number }

/** Agarre del volante: mano izquierda en (izq·r·cos a, r·sin a) del marco del volante, la derecha en el simétrico (rotan con él). */
export const AGARRE = { a: 0.5 };
const RV = 0.17; // radio del volante del camión (m)

/** Camión articulado a partir de Camion_Carga_PT_1 (cabina en -x): tractor + acoplado con ruedas separables, frente +x. */
export function crearCamion(src: THREE.Object3D) {
  const c = src.clone(true);
  // el camión mide 18 m y su cola queda donde estaba la del modelo fundido (x = -9,04): el acoplado se corre 2 m hacia la cabina
  // (su borde delantero queda 1 m por delante del pivote, como en un acoplado real; antes quedaba 1 m detrás y se veía un hueco)
  c.position.set(-0.89, 0, 0); c.rotation.set(0, Math.PI, 0); c.scale.set(1, 1, 1);
  c.traverse((o) => { o.visible = true; });
  const por = (re: RegExp) => { const l: THREE.Object3D[] = []; c.children.forEach((o) => { if (re.test(o.name)) l.push(o); }); return l; };
  const quinta = por(/_Tractor_Quinta_Rueda$/)[0];
  const sol = por(/_Tractor_Cabina$/);
  const rojo = (sol[0] as THREE.Mesh | undefined)?.material as THREE.Material | undefined;
  const cabina = { solida: sol, vista: por(/_Tractor_(Parabrisas|Espejo_[LR]|Parrilla)$/) }; // la maciza se oculta al manejar; el resto tapa la vista en 1ª persona
  const wheels: Wheel[] = [];
  for (const w of por(/_Rueda_\d[LR]$/)) {
    const piezas = [w, ...por(new RegExp(`${w.name}_Llanta$`))];
    let steer: THREE.Group | null = null;
    if (/_Tractor_Rueda_0[LR]$/.test(w.name)) { // eje delantero: grupo en el centro de la rueda que gira en yaw
      steer = new THREE.Group();
      steer.position.copy(w.position);
      c.add(steer);
      piezas.forEach((p) => { p.position.set(0, 0, 0); steer!.add(p); });
    }
    wheels.push({ steer, spin: piezas, r: 0.5 });
  }
  // acoplado: todo lo Semi_ (y los logos) cuelga de un pivote exactamente sobre la quinta rueda
  const semi = new THREE.Group();
  const px = quinta?.position.x ?? -4.6;
  semi.position.set(px, 0, 0);
  for (const o of por(/_(Semi|Logo)_/)) {
    o.position.x -= px + 2;
    if (/_Pata_/.test(o.name)) { o.position.set(1.3, 0.77, Math.sign(o.position.z) * 0.44); o.scale.y = 0.7; } // patas recogidas, bajo el chasis y entre las ruedas
    else if (!/_(Rueda|Paragolpes)/.test(o.name)) o.position.y += 0.22; // el chasis apoya sobre la quinta y pasa por encima del chasis del tractor (1,1 m)
    semi.add(o);
  }
  c.add(semi);

  // cabina hueca (la del modelo es maciza): piso a 1,7 m y ventanas abiertas. Se ve al manejar, en 1ª y 3ª persona
  const interior = new THREE.Group();
  interior.visible = false;
  const mat = (col: string) => new THREE.MeshLambertMaterial({ color: col });
  const caja = (w: number, h: number, d: number, x: number, y: number, z: number, col: string | THREE.Material | undefined) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof col === "string" ? mat(col) : col ?? mat("#b3202e"));
    m.position.set(x, y, z);
    interior.add(m);
  };
  const PISO = 1.7, ASIENTO = 2.08, HX = -8.3, HZ = 0.55; // piso, tope del asiento y cadera del conductor (c-local)
  caja(2.3, 0.1, 2.5, -8.7, PISO - 0.05, 0, "#2b3447");    // piso
  caja(2.3, 0.1, 2.5, -8.7, 3.75, 0, rojo);                // techo
  caja(0.1, 1.5, 2.5, -9.78, 1.75, 0, rojo);               // frente, bajo el parabrisas
  caja(0.1, 0.3, 2.5, -9.78, 3.65, 0, rojo);               // cabecera
  caja(0.7, 0.75, 2.4, -9.45, PISO + 0.375, 0, "#3a4560"); // tablero
  caja(0.1, 2.7, 2.5, -7.6, 2.35, 0, rojo);                // pared trasera
  for (const z of [1.2, -1.2]) {
    caja(2.3, 1.3, 0.1, -8.7, 1.65, z, rojo);              // puertas: llegan a 2,3 m y la ventana queda abierta
    caja(0.12, 1.4, 0.2, -9.78, 3.0, z * 0.96, rojo);      // pilares delantero y trasero
    caja(0.12, 1.4, 0.2, -7.62, 3.0, z * 0.96, rojo);
  }
  caja(0.7, 0.12, 0.7, HX, ASIENTO - 0.06, HZ, "#1d2230");                               // asiento del conductor (izquierda)
  caja(0.5, ASIENTO - 0.12 - PISO, 0.5, HX, (PISO + ASIENTO - 0.12) / 2, HZ, "#2b3447"); // pedestal
  caja(0.12, 0.9, 0.7, HX + 0.2, ASIENTO + 0.45, HZ, "#1d2230");                         // respaldo
  caja(0.12, 0.06, 0.1, HX - 0.75, PISO + 0.03, HZ - 0.12, "#161b28");                   // pedales
  caja(0.12, 0.06, 0.1, HX - 0.75, PISO + 0.03, HZ + 0.12, "#161b28");
  // volante de 0,34 m (el anterior, de 0,44, llenaba la vista en 1ª persona), inclinado hacia el conductor (+x)
  const colvo = new THREE.Group();
  colvo.position.set(HX - 0.42, ASIENTO + 0.42, HZ); colvo.rotation.z = 0.5;
  const plano = new THREE.Group(); plano.rotation.y = Math.PI / 2;
  const volante = new THREE.Group(); volante.name = "volante";
  const negro = mat("#161b28");
  volante.add(new THREE.Mesh(new THREE.TorusGeometry(RV, 0.022, 8, 24), negro));
  volante.add(new THREE.Mesh(new THREE.BoxGeometry(RV * 2, 0.025, 0.025), negro));
  volante.add(new THREE.Mesh(new THREE.BoxGeometry(0.025, RV, 0.025), negro));
  plano.add(volante); colvo.add(plano); interior.add(colvo);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 10), negro); // columna: del tablero al volante
  col.position.set(colvo.position.x - Math.cos(0.5) * 0.25, colvo.position.y - Math.sin(0.5) * 0.25, HZ);
  col.rotation.z = 0.5 - Math.PI / 2;
  interior.add(col);
  c.add(interior);
  // marcador del conductor: origen = pies del operario, +z = adelante (la cadera queda a 0,81 m sobre el asiento)
  const asiento = new THREE.Object3D();
  asiento.position.set(HX, ASIENTO - 0.81, HZ); asiento.rotation.y = -Math.PI / 2;
  c.add(asiento);

  const tilt = new THREE.Group();
  tilt.add(c);
  const g = new THREE.Group();
  g.add(tilt);
  g.updateMatrixWorld(true);
  const eye = c.localToWorld(new THREE.Vector3(HX - 0.12, ASIENTO - 0.81 + 1.66, HZ)); // ojos del conductor, en el marco del camión
  const cuerpos: Cuerpo[] = [{ obj: c, eje: "x", a0: -9.9, a1: -3.6, b: 1.3 }, { obj: semi, eje: "x", a0: -1, a1: 12.7, b: 1.3 }];
  alta(g, tilt, { truck: true, L: 4, d: 9.5, kmax: 0.25, kp: 0.006, kr: 0.006, lim: 0.025, ratio: 4 }, wheels, volante, semi);
  return { g, cabina, interior, eye, asiento, volante, semi, cuerpos, grip: { izq: -1 as const, r: RV } };
}

const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), v4 = new THREE.Vector3();
const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), q3 = new THREE.Quaternion();
/** Gira el hueso `h` (en mundo, alrededor de su origen) para que su hijo, ahora en `from`, quede hacia `to`; w mezcla con la pose actual. */
function apuntar(h: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, w: number) {
  const p = h.getWorldPosition(v1);
  q1.setFromUnitVectors(v2.copy(from).sub(p).normalize(), v3.copy(to).sub(p).normalize()).multiply(h.getWorldQuaternion(q2));
  q3.copy(h.parent!.getWorldQuaternion(q2)).invert().multiply(q1);
  h.quaternion.slerp(q3, w);
  h.updateWorldMatrix(false, true);
}

/** IK analítica de 2 huesos (UpperArm, LowerArm): la muñeca (hueso Wrist) llega a 9 cm de `grip` con el codo hacia `polo`.
 *  Devuelve cuánto le falta a la mano para llegar (m; 0 si alcanza). */
export function brazoA(op: THREE.Object3D, lado: "L" | "R", grip: THREE.Vector3, polo: THREE.Vector3, w: number) {
  const sup = op.getObjectByName(`UpperArm${lado}`), inf = op.getObjectByName(`LowerArm${lado}`), mano = op.getObjectByName(`Wrist${lado}`);
  if (!sup || !inf || !mano) return 0;
  const A = sup.getWorldPosition(new THREE.Vector3()), B = inf.getWorldPosition(new THREE.Vector3()), W = mano.getWorldPosition(new THREE.Vector3());
  const l1 = A.distanceTo(B), l2 = B.distanceTo(W);
  const T = grip.clone().addScaledVector(grip.clone().sub(A).normalize(), -0.09);
  const u = T.clone().sub(A), largo = u.length();
  const d = THREE.MathUtils.clamp(largo, Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  u.normalize();
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const perp = polo.clone().addScaledVector(u, -polo.dot(u)).normalize();
  apuntar(sup, B, A.clone().addScaledVector(u, a).addScaledVector(perp, h), w);
  apuntar(inf, mano.getWorldPosition(v4), A.clone().addScaledVector(u, d), w);
  return Math.max(0, largo - (l1 + l2));
}

/** Las dos manos del operario `op` sobre el volante `v`, en agarres que giran con él. w = 0 deja la animación, 1 la IK completa.
 *  Devuelve el mayor faltante de alcance (m). */
export function agarrarVolante(op: THREE.Object3D, v: THREE.Object3D, grip: { izq: 1 | -1; r: number }, w: number) {
  if (w < 0.01) return 0;
  op.updateWorldMatrix(true, true); v.updateWorldMatrix(true, false);
  const q = op.getWorldQuaternion(new THREE.Quaternion());
  let falta = 0;
  for (const lado of ["L", "R"] as const) {
    const s = lado === "L" ? grip.izq : -grip.izq;
    const g = v.localToWorld(new THREE.Vector3(s * grip.r * Math.cos(AGARRE.a), grip.r * Math.sin(AGARRE.a), 0));
    const polo = new THREE.Vector3(lado === "L" ? 0.6 : -0.6, -1, -0.3).applyQuaternion(q); // codo hacia abajo, afuera y atrás
    falta = Math.max(falta, brazoA(op, lado, g, polo, w));
  }
  return falta;
}

/** Un cuadro: pone a cada vehículo (que ya se movió en este cuadro o en el anterior) su dinámica. */
export function stepRigs(rawDt: number) {
  const dt = Math.min(rawDt, 0.05);
  if (dt <= 0) return;
  for (const r of rigs.values()) {
    const o = r.obj, c = r.cfg;
    if (!o.parent || !o.visible) { r.init = false; continue; }
    const { x, z } = o.position, ry = o.rotation.y;
    if (!r.init) { Object.assign(r, { init: true, px: x, pz: z, ry, vs: 0, as: 0, lat: 0, kap: 0, gam: 0 }); continue; }
    const dx = x - r.px, dz = z - r.pz;
    const dy = Math.atan2(Math.sin(ry - r.ry), Math.cos(ry - r.ry)); // giro a la izquierda > 0
    r.px = x; r.pz = z; r.ry = ry;
    if (Math.abs(dx) + Math.abs(dz) > 8) { r.vs = 0; r.as = 0; continue; } // salto (teletransporte / reloj muy acelerado)
    const ds = dx * (c.truck ? Math.cos(ry) : Math.sin(ry)) + dz * (c.truck ? -Math.sin(ry) : Math.cos(ry)); // avance con signo

    // curvatura filtrada por distancia: da el ángulo de las directrices, del volante y del acoplado
    if (Math.abs(ds) > 1e-3) r.kap += (clamp(dy / ds, -c.kmax, c.kmax) - r.kap) * (1 - Math.exp(-Math.abs(ds) / 1.5));
    const delta = clamp(Math.atan(c.L * r.kap), -0.6, 0.6);
    const sc = c.truck ? 1 : o.scale.x;
    for (const w of r.wheels) {
      for (const s of w.spin) { if (c.truck) s.rotation.y += ds / w.r; else s.rotation.x += ds / (w.r * sc); }
      if (w.steer) w.steer.rotation.y = c.truck ? delta : -delta; // el montacargas dirige con las ruedas traseras
    }
    if (r.volante) r.volante.rotation.z = clamp(delta * c.ratio, -2.4, 2.4) * (c.truck ? 1 : -1);
    if (r.semi) { // sigue al tractor por detrás: en curva estacionaria el ángulo es atan(d·k), con atraso por distancia
      r.gam += (-Math.atan(c.d * r.kap) - r.gam) * (1 - Math.exp(-Math.abs(ds) / 6));
      r.semi.rotation.y = clamp(r.gam, -1, 1);
    }

    // suspensión: resorte amortiguado hacia el cabeceo (acelerar / frenar) y balanceo (curva) que pide la aceleración
    const k = Math.min(1, dt * 6), vp = r.vs;
    r.vs += (ds / dt - r.vs) * k;
    r.as += ((r.vs - vp) / dt - r.as) * k;
    r.lat += (r.vs * dy / dt - r.lat) * k;
    const pt = clamp(c.kp * r.as, -c.lim, c.lim), rt = clamp(c.kr * r.lat, -c.lim, c.lim);
    r.pv += (180 * (pt - r.pitch) - 14 * r.pv) * dt; r.pitch += r.pv * dt;
    r.rv += (180 * (rt - r.roll) - 14 * r.rv) * dt; r.roll += r.rv * dt;
    // + cabeceo = frente arriba, + balanceo = inclina a la derecha (hacia afuera en curva a la izquierda)
    if (c.truck) { r.tilt.rotation.z = r.pitch; r.tilt.rotation.x = r.roll; }
    else { r.tilt.rotation.x = -r.pitch; r.tilt.rotation.z = r.roll; }
  }
}
