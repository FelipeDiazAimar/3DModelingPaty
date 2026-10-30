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

/** Camión articulado a partir de Camion_Carga_PT_1 (cabina en -x): tractor + acoplado con ruedas separables, frente +x. */
export function crearCamion(src: THREE.Object3D) {
  const c = src.clone(true);
  // la cola queda donde estaba la del modelo fundido (x = -9,04): el camión de PT mide 20 m y el fundido 18
  c.position.set(1.11, 0, 0); c.rotation.set(0, Math.PI, 0); c.scale.set(1, 1, 1);
  c.traverse((o) => { o.visible = true; });
  const por = (re: RegExp) => { const l: THREE.Object3D[] = []; c.children.forEach((o) => { if (re.test(o.name)) l.push(o); }); return l; };
  const quinta = por(/_Tractor_Quinta_Rueda$/)[0];
  const cabina = por(/_Tractor_(Cabina|Parabrisas|Espejo_[LR]|Parrilla)$/); // lo que tapa la vista en 1ª persona
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
  // acoplado: todo lo Semi_ (y los logos) cuelga de un pivote en la quinta rueda
  const semi = new THREE.Group();
  semi.position.set(quinta?.position.x ?? -4.6, 0, 0);
  for (const o of por(/_(Semi|Logo)_/)) { o.position.x -= semi.position.x; semi.add(o); }
  c.add(semi);

  // interior simple (la cabina del modelo es maciza): solo se ve en 1ª persona, con la cabina oculta
  const interior = new THREE.Group();
  interior.visible = false;
  const mat = (col: string) => new THREE.MeshLambertMaterial({ color: col });
  const caja = (w: number, h: number, d: number, x: number, y: number, z: number, col: string) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(col));
    m.position.set(x, y, z);
    interior.add(m);
  };
  caja(2.3, 0.1, 2.5, -8.7, 1.05, 0, "#2b3447");       // piso
  caja(2.3, 0.1, 2.5, -8.7, 3.75, 0, "#3a4560");       // techo
  caja(0.7, 1.45, 2.4, -9.5, 1.725, 0, "#3a4560");     // tablero
  caja(0.1, 2.7, 2.5, -7.6, 2.4, 0, "#2b3447");        // pared trasera
  caja(2.3, 1.5, 0.1, -8.7, 1.8, 1.2, "#2b3447");      // puertas
  caja(2.3, 1.5, 0.1, -8.7, 1.8, -1.2, "#2b3447");
  caja(0.7, 0.2, 0.7, -8.55, 1.75, 0.55, "#1d2230");   // asiento del conductor (izquierda)
  caja(0.12, 0.8, 0.7, -8.15, 2.25, 0.55, "#1d2230");
  const colvo = new THREE.Group();                     // volante: inclinado hacia el conductor (+x)
  colvo.position.set(-9.2, 2.75, 0.55); colvo.rotation.z = 0.5;
  const plano = new THREE.Group(); plano.rotation.y = Math.PI / 2;
  const volante = new THREE.Group(); volante.name = "volante";
  const negro = mat("#161b28");
  volante.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 24), negro));
  volante.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.03), negro));
  volante.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.03), negro));
  plano.add(volante); colvo.add(plano); interior.add(colvo);
  c.add(interior);

  const tilt = new THREE.Group();
  tilt.add(c);
  const g = new THREE.Group();
  g.add(tilt);
  g.updateMatrixWorld(true);
  const eye = c.localToWorld(new THREE.Vector3(-8.6, 3.0, 0.55)); // ojos del conductor, en el marco del camión
  alta(g, tilt, { truck: true, L: 4, d: 11.5, kmax: 0.25, kp: 0.006, kr: 0.006, lim: 0.025, ratio: 6 }, wheels, volante, semi);
  return { g, cabina, interior, eye };
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
    if (r.volante) r.volante.rotation.z = clamp(delta * c.ratio, -3.2, 3.2) * (c.truck ? 1 : -1);
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
