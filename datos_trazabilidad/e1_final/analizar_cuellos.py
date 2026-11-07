"""Cuello de botella por escenario a partir de raw_cuellos/*.txt (registro por estación de cada réplica de 24 h).

Cada réplica trae, por estación: ticks de 10 s en cada estado (inactiva, procesando, bloqueada, sin material, falla),
contenido medio, estadía media, entradas y salidas; y contenido medio/máximo de colas, racks y cintas.

Salidas (se copian a dashboard/web/public/e1/):
  cuellos.json        etapas, cuello y etapas más afectadas de E1, E2, E3 y E4 (lavado 0/15/30)
  escenarios.json     pallets/cajas/toneladas con IC 95 % y diferencias pareadas (E1, E2, E3 nuevo, E5 = antiguo E3 de fallas)
  e4.json             1200 contra 1500 kg por lavado (5 réplicas)

Definiciones
  ocupación = % de tiempo procesando + bloqueada. En un Separator (mezcladora, formadora) "bloqueada" es el tiempo
  que sostiene carga que no puede entregar, así que tampoco puede recibir otra: cuenta como ocupada.
  capacidad implícita [t de MP/día] = (entradas por día / ocupación) × kg por entrada, sumada sobre las máquinas de
  la etapa. Es lo máximo que la etapa dejaría pasar si estuviera ocupada el 100 % del tiempo. El cuello es la etapa
  de menor capacidad implícita. Túnel (varios lotes a la vez) y estibado (el Combiner espera pallet) no son
  candidatos: su "procesando" solo indica que tienen algo adentro.
"""
import json, math, os, statistics as st

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw_cuellos")
WEB = os.path.join(HERE, "..", "..", "dashboard", "web", "public", "e1")
TICKS = 8640.0
T = {10: 2.262, 5: 2.776}  # t(0,975; n-1)


# ---------------------------------------------------------------- lectura
def cargar(nombre):
    reps = []
    for r in open(os.path.join(RAW, nombre + ".txt"), encoding="utf-8").read().split("@")[:-1]:
        p = r.split(";")
        cab = p[0].split(",")
        d = {"rep": int(cab[1]), "h": {k: float(v) for k, v in (kv.split("=") for kv in cab[2:])}, "S": {}, "Q": {}}
        for x in p[1:]:
            t = x.split()
            if not t:
                continue
            if t[0] == "S":
                v = list(map(float, t[2:]))
                d["S"][t[1]] = dict(proc=v[1] / TICKS, block=v[2] / TICKS, cont=v[5], stay=v[6], inp=v[7], out=v[8])
            elif t[0] == "Q":
                d["Q"][t[1]] = dict(avg=float(t[2]), max=float(t[3]))
        reps.append(d)
    return reps


def media(xs):
    return sum(xs) / len(xs)


def stat(xs):
    n = len(xs)
    m = media(xs)
    s = st.stdev(xs) if n > 1 else 0.0
    h = T[n] * s / math.sqrt(n)
    return dict(media=m, desv=s, h=h, ic_inf=m - h, ic_sup=m + h)


def pareada(a, b):
    """b - a, réplica a réplica (mismos números aleatorios)."""
    d = stat([y - x for x, y in zip(a, b)])
    d["cero_en_ic"] = d["ic_inf"] <= 0 <= d["ic_sup"]
    return d


pal = lambda r: r["h"]["p7"] + r["h"]["p8"]
caj = lambda r: r["h"]["c7"] + r["h"]["c8"]

# ---------------------------------------------------------------- etapas
ETAPAS = [  # id, nombre, prefijos de máquina, candidata a cuello, kg por entrada (None = kg del batch), entradas por batch
    ("desencajado", "Desencajado", ["Desencajado"], True),
    ("picado", "Picado", ["Picadora"], True),
    ("mezclado", "Mezclado", ["MezA", "MezB"], True),
    ("formado", "Formado", ["FormA", "FormB"], True),
    ("tunel", "Túnel de frío", ["Tunel"], False),
    ("envasado", "Envasado", ["EnvA", "EnvB"], True),
    ("encajonado", "Encajonado", ["EncA", "EncB"], True),
    ("estibado", "Estibado", ["EstA"], False),
]


def maquinas(prefijos):
    return [f"{p}_L{l}" for l in (7, 8) for p in prefijos]


def kg_entrada(etapa, batch_kg):
    return {"desencajado": batch_kg, "picado": batch_kg, "mezclado": batch_kg, "formado": 150.0,
            "envasado": 5.0, "encajonado": 5.0}.get(etapa, 0.0)


def medir(reps, batch_kg):
    """Métricas por máquina y por etapa promediando las réplicas."""
    maq, etapas = {}, {}
    for _, _, pref, _ in ETAPAS:
        for m in maquinas(pref):
            pr, bl = media([r["S"][m]["proc"] for r in reps]), media([r["S"][m]["block"] for r in reps])
            maq[m] = dict(proc=pr, block=bl, ocup=pr + bl, cont=media([r["S"][m]["cont"] for r in reps]),
                          stay=media([r["S"][m]["stay"] for r in reps]), inp=media([r["S"][m]["inp"] for r in reps]))
    cola_mez = media([sum(r["Q"][q]["avg"] for q in ("AlimMezA_L7", "AlimMezB_L7", "AlimMezA_L8", "AlimMezB_L8")) for r in reps])
    rack = media([r["Q"]["RackMPCongelado"]["avg"] + r["Q"]["RackMPEnfriado"]["avg"] for r in reps])
    rack_max = max(r["Q"]["RackMPCongelado"]["max"] + r["Q"]["RackMPEnfriado"]["max"] for r in reps)
    for eid, nombre, pref, cand in ETAPAS:
        ms = maquinas(pref)
        cap = None
        if cand:
            cap = sum(maq[m]["inp"] / max(maq[m]["ocup"], 1e-6) for m in ms) * kg_entrada(eid, batch_kg) / 1000.0
        etapas[eid] = dict(nombre=nombre, maquinas=ms, cand=cand,
                           ocup=media([maq[m]["ocup"] for m in ms]), proc=media([maq[m]["proc"] for m in ms]),
                           block=media([maq[m]["block"] for m in ms]), cont=media([maq[m]["cont"] for m in ms]),
                           stay=media([maq[m]["stay"] for m in ms]), cap_t=cap)
    etapas["mezclado"]["cola"] = cola_mez
    return dict(maq=maq, etapas=etapas, cola_mez=cola_mez, rack=rack, rack_max=rack_max)


def cuello_de(M):
    c = [(e["cap_t"], k) for k, e in M["etapas"].items() if e["cand"]]
    c.sort()
    return c[0][1], c[0][0], c[1][1], c[1][0]


def comparar(MB, MS):
    """Etapas más afectadas de MS contra MB: puntaje = |Δ ocupación| en puntos; cámara MP = |Δ pallets| × 4."""
    filas = []
    for eid, e in MS["etapas"].items():
        b = MB["etapas"][eid]
        d_oc = (e["ocup"] - b["ocup"]) * 100 if e["cand"] else 0.0
        d_cont = (e["cont"] - b["cont"])
        puntaje = abs(d_oc)
        filas.append(dict(id=eid, puntaje=puntaje, ocup_base=b["ocup"] * 100, ocup=e["ocup"] * 100, d_ocup=d_oc,
                          cont_base=b["cont"], cont=e["cont"], stay_base=b["stay"], stay=e["stay"],
                          d_stay=e["stay"] - b["stay"], cap_base=b["cap_t"], cap=e["cap_t"],
                          cola_base=MB["cola_mez"] if eid == "mezclado" else None,
                          cola=MS["cola_mez"] if eid == "mezclado" else None))
    d_rack = MS["rack"] - MB["rack"]
    filas.append(dict(id="camara_mp", puntaje=abs(d_rack) * 4, rack_base=MB["rack"], rack=MS["rack"], rack_max=MS["rack_max"], d_rack=d_rack))
    filas.sort(key=lambda f: -f["puntaje"])
    return filas


def paquete(MB, MS, nombre_base):
    ids_c, cap_c, ids_2, cap_2 = cuello_de(MS)
    ids_cb, cap_cb, _, _ = cuello_de(MB)
    filas = comparar(MB, MS)
    afect = [f["id"] for f in filas if f["puntaje"] >= 3 and f["id"] != ids_c][:3]
    maq = {}
    for m, v in MS["maq"].items():
        b = MB["maq"][m]
        maq[m] = dict(ocup=v["ocup"] * 100, proc=v["proc"] * 100, block=v["block"] * 100, d_ocup=(v["ocup"] - b["ocup"]) * 100,
                      cont=v["cont"], cont_base=b["cont"], stay=v["stay"], stay_base=b["stay"])
    return dict(base=nombre_base, cuello=dict(etapa=ids_c, cap_t=cap_c, siguiente=ids_2, cap_siguiente=cap_2),
                cuello_base=dict(etapa=ids_cb, cap_t=cap_cb), afectadas=afect, etapas=filas, maquinas=maq,
                rack=dict(base=MB["rack"], esc=MS["rack"], max=MS["rack_max"]),
                cola_mez=dict(base=MB["cola_mez"], esc=MS["cola_mez"]))


# ---------------------------------------------------------------- datos
# Base = lavado de 30 min por batch (dato de planta). raw_cuellos/sin_lavado/ guarda las corridas anteriores sin lavado (sensibilidad).
E1, E2, E3 = cargar("E1"), cargar("E2"), cargar("E3")
SIN = cargar("sin_lavado/E1")
V = {k: cargar(k) for k in ("E4_1200_L0", "E4_1500_L15", "E4_1200_L15", "E4_1200_L30")}
B1500 = {0: SIN[:5], 15: V["E4_1500_L15"], 30: E1}  # mismos streams (réplica k = stream k) en cada par
B1200 = {0: V["E4_1200_L0"], 15: V["E4_1200_L15"], 30: V["E4_1200_L30"]}
assert all(len(x) == 10 for x in (E1, E2, E3, SIN, V["E4_1200_L30"])) and len(V["E4_1200_L0"]) == 5 and len(V["E4_1500_L15"]) == 5

M = {"E1": medir(E1, 1500), "E2": medir(E2, 1500), "E3": medir(E3, 1500)}
for l in (0, 15, 30):
    M[f"1500_L{l}"] = medir(B1500[l], 1500)
    M[f"1200_L{l}"] = medir(B1200[l], 1200)

# ---------------------------------------------------------------- escenarios.json
def bloque(reps):
    return dict(pallets=stat([pal(r) for r in reps]), cajas=stat([caj(r) for r in reps]), ton=stat([caj(r) * 5 / 1000 for r in reps]))


old = json.load(open(os.path.join(HERE, "summary_escenarios.json"), encoding="utf-8"))["escenarios"]
esc = {}
esc["E1"] = dict(nombre="Base", cambio="Fallas del tablero, formadoras a 982 kg/h, 16 pallets de MP por turno y lavado de 30 min por batch (dato de planta)", **bloque(E1))
for k, nombre, cambio, reps in (("E2", "Formadoras más rápidas", "Formadoras a 1843 kg/h (separación entre bandejas 3,27 → 1,554 m)", E2),
                                ("E3", "Más materia prima + formadoras rápidas", "E2 y 24 pallets de MP por turno en lugar de 16 (72 t/día en lugar de 48 pallets de 1500 kg)", E3)):
    b = bloque(reps)
    b["dif_pallets"] = pareada([pal(r) for r in E1], [pal(r) for r in reps])
    b["dif_cajas"] = pareada([caj(r) for r in E1], [caj(r) for r in reps])
    b["dif_pallets_pct"] = b["dif_pallets"]["media"] / esc["E1"]["pallets"]["media"] * 100
    b["dif_cajas_pct"] = b["dif_cajas"]["media"] / esc["E1"]["cajas"]["media"] * 100
    esc[k] = dict(nombre=nombre, cambio=cambio, **b)
esc["E3"]["dif_vs_E2_pallets"] = pareada([pal(r) for r in E2], [pal(r) for r in E3])
esc["E5"] = old["E3"]
esc["E5"]["nombre"] = "Prueba de fallas"
esc["E5"]["cambio"] = "MTTR ×1,25 en formadoras y túneles (antiguo E3). Medido con el modelo anterior, sin lavado: no es comparable con E1 de hoy"
json.dump(dict(replicas=10, metodo="mismas 10 réplicas (streams 60-87 desplazados por réplica) en todos los escenarios; diferencias pareadas con t(0,975; 9 gl)",
               escenarios=esc,
               tope_mp=dict(pallets_mp_dia=48, kg_dia=72000, cajas_dia=14400,
                            texto="La materia prima de E1 y E2 entra a 16 pallets de 1500 kg cada 8 h: 72 t/día = 14.400 cajas de 5 kg por día para las dos líneas")),
          open(os.path.join(HERE, "summary_escenarios_v2.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- e4.json
filas = []
for l in (0, 15, 30):
    a, b = B1500[l], B1200[l]
    filas.append(dict(lavado_min=l, n=len(a), pal_1500=stat([pal(r) for r in a]), pal_1200=stat([pal(r) for r in b]),
                      dif_pal=pareada([pal(r) for r in a], [pal(r) for r in b]),
                      cajas_1500=media([caj(r) for r in a]), cajas_1200=media([caj(r) for r in b]),
                      dif_cajas_pct=(media([caj(r) for r in b]) / media([caj(r) for r in a]) - 1) * 100,
                      ton_1500=media([caj(r) * 5 / 1000 for r in a]), ton_1200=media([caj(r) * 5 / 1000 for r in b]),
                      dif_pal_pct=(media([pal(r) for r in b]) / media([pal(r) for r in a]) - 1) * 100))
e4 = dict(descripcion="Batch de 1200 kg = 8 cargas por batch, desencajado y picadora al 80 % del tiempo y 20 pallets de 1200 kg por turno de recepción (mismas 72 t/día de MP). El lavado de la mezcladora por batch entra como tiempo de preparación (supuesto, no hay dato).",
          replicas=5, nota="5 réplicas por variante con los mismos streams; 1500 kg sin lavado = réplicas 1 a 5 de E1. IC con t(0,975; 4 gl) = 2,776.", filas=filas)
json.dump(e4, open(os.path.join(HERE, "summary_e4_v2.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- cuellos.json
fm = lambda x, d=1: f"{x:.{d}f}".replace(".", ",")
sg = lambda x, d=1: ("+" if x > 0 else "") + fm(x, d)
cu = {}
cu["E1"] = paquete(M["E1"], M["E1"], "E1")
cu["E2"] = paquete(M["E1"], M["E2"], "E1")
cu["E3"] = paquete(M["E1"], M["E3"], "E1")
for l in (0, 15, 30):
    cu[f"E4_L{l}"] = paquete(M[f"1500_L{l}"], M[f"1200_L{l}"], f"1500 kg, lavado {l} min")
cu["E4_L0"]["contexto_lavado"] = None
for l in (15, 30):  # qué provoca el lavado en sí (1500 kg con lavado contra 1500 kg sin lavado)
    cu[f"E4_L{l}"]["contexto_lavado"] = paquete(M["1500_L0"], M[f"1500_L{l}"], "1500 kg, sin lavado")
def et(k, eid):
    return next(f for f in cu[k]["etapas"] if f["id"] == eid)


NOM = {e[0]: e[1] for e in ETAPAS}
NOM["camara_mp"] = "Cámaras de MP"
cu["E1"]["contexto_lavado"] = paquete(M["1500_L0"], M["E1"], "1500 kg, sin lavado")  # qué provoca el lavado de 30 min en la base
cu["E1"]["afectadas"] = [e for e in ("desencajado", "formado") if e != cu["E1"]["cuello"]["etapa"]]

# --- E1 (base con lavado de 30 min)
c1, d1, m1, f1 = cu["E1"]["cuello"], et("E1", "desencajado"), et("E1", "mezclado"), et("E1", "formado")
fo0 = next(f for f in cu["E1"]["contexto_lavado"]["etapas"] if f["id"] == "formado")
ton1 = esc["E1"]["ton"]["media"]
cu["E1"]["texto"] = dict(
    titulo="El cuello son las mezcladoras (por el lavado de 30 min)",
    cuello=f"Cada batch ocupa a la mezcladora 30 min más por el lavado: queda ocupada el {fm(m1['ocup'], 0)} % del tiempo y su capacidad implícita es {fm(c1['cap_t'])} t/día, por debajo de los {fm(c1['cap_siguiente'])} t/día del desencajado y de las 72 t/día que llegan. Delante de las mezcladoras se forma una cola de {fm(cu['E1']['cola_mez']['esc'], 1)} lotes.",
    efectos=[
        dict(etapa="desencajado", txt=f"Siguiente restricción: {fm(d1['ocup'], 0)} % ocupado (3500 s por pallet y línea), {fm(d1['cap'])} t/día. Si se arreglan las mezcladoras, el cuello pasa acá."),
        dict(etapa="formado", txt=f"Ocupación {fm(fo0['ocup_base'], 0)} → {fm(f1['ocup'], 0)} % respecto de la planta sin lavado: recibe menos cargas porque las mezcladoras no alcanzan a entregar."),
    ],
    conclusion=f"La planta produce {fm(esc['E1']['pallets']['media'])} pallets/día ({fm(ton1)} t/día), a {fm((ton1/55.97625-1)*100)} % de las 56,0 t/día del tablero: el lavado de 30 min es lo que faltaba para que el modelo valide en toneladas.")

# --- E2
a2, b2, g2 = cu["E2"], et("E2", "formado"), et("E2", "mezclado")
cu["E2"]["texto"] = dict(
    titulo="Las formadoras rápidas liberan a las mezcladoras y el cuello pasa al desencajado",
    cuello=f"Con las formadoras a 1843 kg/h el cuello deja de estar en las mezcladoras ({fm(c1['cap_t'])} t/día) y pasa al desencajado ({fm(a2['cuello']['cap_t'])} t/día).",
    efectos=[
        dict(etapa="mezclado", txt=f"Ocupación {fm(g2['ocup_base'], 0)} → {fm(g2['ocup'], 0)} %, cola de entrada {fm(g2['cola_base'], 1)} → {fm(g2['cola'], 1)} lotes y estadía {fm(g2['stay_base'], 0)} → {fm(g2['stay'], 0)} s ({fm(-g2['d_stay']/60, 0)} min menos): la mezcladora sigue ocupada mientras entrega sus cargas y con la cinta más rápida termina antes. Capacidad {fm(g2['cap_base'])} → {fm(g2['cap'])} t/día."),
        dict(etapa="formado", txt=f"Ocupación {fm(b2['ocup_base'], 0)} → {fm(b2['ocup'], 0)} %; cada lote pasa en {fm(b2['stay'], 0)} s en lugar de {fm(b2['stay_base'], 0)} s."),
    ],
    conclusion=f"{sg(esc['E2']['dif_pallets']['media'])} pallets/día ({sg(esc['E2']['dif_pallets_pct'])} %), IC [{sg(esc['E2']['dif_pallets']['ic_inf'])} ; {sg(esc['E2']['dif_pallets']['ic_sup'])}]: es la mejora grande. El techo nuevo es el desencajado ({fm(a2['cuello']['cap_t'])} t/día).")

# --- E3
a3, r3, f3, g3, d3 = cu["E3"], et("E3", "camara_mp"), et("E3", "formado"), et("E3", "mezclado"), et("E3", "desencajado")
cu["E3"]["texto"] = dict(
    titulo="Después de E2, más materia prima no suma: el cuello es el desencajado",
    cuello=f"Desencajado al {fm(d3['ocup'], 0)} % ({fm(a3['cuello']['cap_t'])} t/día). Llegan 108 t/día de MP (24 pallets por turno) pero solo se procesan unas 74 t: el resto espera en las cámaras.",
    efectos=[
        dict(etapa="camara_mp", txt=f"Las cámaras de MP pasan de {fm(r3['rack_base'], 1)} a {fm(r3['rack'], 1)} pallets en promedio (máximo {fm(r3['rack_max'], 0)}) y crecen durante el día: es la cola que provoca el cuello."),
        dict(etapa="formado", txt=f"Ocupación {fm(f3['ocup_base'], 0)} → {fm(f3['ocup'], 0)} % (efecto de las formadoras de E2, no de la MP)."),
        dict(etapa="mezclado", txt=f"Ocupación {fm(g3['ocup_base'], 0)} → {fm(g3['ocup'], 0)} % (efecto de E2, no de la MP)."),
    ],
    conclusion=f"{sg(esc['E3']['dif_vs_E2_pallets']['media'])} pallets/día contra E2 (IC [{sg(esc['E3']['dif_vs_E2_pallets']['ic_inf'])} ; {sg(esc['E3']['dif_vs_E2_pallets']['ic_sup'])}], no distinguible de cero): la materia prima extra no suma nada. Para aprovecharla hay que ampliar el desencajado (más puestos o menos de 3500 s por pallet).")

# --- E4
for l in (0, 15, 30):
    k = f"E4_L{l}"
    a4, mb = cu[k], et(k, "mezclado")
    fila = e4["filas"][[0, 15, 30].index(l)]
    ctx = a4.get("contexto_lavado")
    if l == 0:
        a4["texto"] = dict(
            titulo="Sin lavado (no es el caso real) el cuello es el desencajado",
            cuello=f"Con 1200 kg el desencajado tarda 2800 s por pallet pero procesa pallets más chicos: la capacidad en toneladas es la misma ({fm(a4['cuello']['cap_t'])} t/día).",
            efectos=[dict(etapa="mezclado", txt=f"Estadía {fm(mb['stay_base'], 0)} → {fm(mb['stay'], 0)} s: los batches de 1200 kg entregan 8 cargas en lugar de 10 y terminan antes.")],
            conclusion=f"{sg(fila['dif_pal']['media'])} pallets/día ({sg(fila['dif_pal_pct'])} %), distinto de cero con las 5 réplicas pareadas: el beneficio es de latencia (los lotes salen antes en un día que arranca vacío), no de capacidad. Es solo sensibilidad: el lavado real es de 30 min.")
    else:
        cm = et(k, "mezclado")
        fo = next(f for f in ctx["etapas"] if f["id"] == "formado")
        real = " (dato de planta)" if l == 30 else " (sensibilidad: el lavado real es de 30 min)"
        a4["texto"] = dict(
            titulo=f"Con lavado de {l} min el cuello está en las mezcladoras",
            cuello=f"Cada batch ocupa a la mezcladora {l} min más: con 1500 kg su capacidad implícita es {fm(a4['cuello_base']['cap_t'])} t/día, por debajo de los {fm(a4['cuello']['cap_siguiente'])} t/día del desencajado. La cola de entrada de las mezcladoras pasa de {fm(ctx['cola_mez']['base'], 1)} (sin lavado) a {fm(ctx['cola_mez']['esc'], 1)} lotes.",
            efectos=[dict(etapa="mezclado", txt=f"Con 1200 kg hay 30 batches por día en lugar de 24 y se lava más veces: capacidad {fm(cm['cap_base'])} → {fm(cm['cap'])} t/día, ocupación {fm(cm['ocup_base'], 0)} → {fm(cm['ocup'], 0)} %; cola de entrada {fm(cm['cola_base'], 1)} → {fm(cm['cola'], 1)}."),
                     dict(etapa="formado", txt=f"Aguas abajo, formado queda ocupado el {fm(fo['ocup'], 0)} % contra {fm(fo['ocup_base'], 0)} % sin lavado: recibe menos cargas porque las mezcladoras no alcanzan a entregar.")],
            conclusion=f"1200 kg rinde {sg(fila['dif_pal']['media'])} pallets/día ({sg(fila['dif_pal_pct'])} %) contra 1500 kg: el batch grande lava menos veces por tonelada{real}.")

json.dump(dict(replicas=dict(E1=10, E2=10, E3=10, E4_L30=10, E4_otros=5), escenarios=cu), open(os.path.join(HERE, "summary_cuellos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# resumen para consola
for k, v in cu.items():
    c = v["cuello"]
    print(f"{k:7s} cuello={c['etapa']:12s} cap={c['cap_t']:.1f} t/día  siguiente={c['siguiente']} {c['cap_siguiente']:.1f}  afectadas={v['afectadas']}  (base {v['cuello_base']['etapa']} {v['cuello_base']['cap_t']:.1f})")
    for f in v["etapas"][:4]:
        print("     ", {a: (round(b, 1) if isinstance(b, float) else b) for a, b in f.items() if a in ("id", "puntaje", "ocup_base", "ocup", "stay_base", "stay", "cont_base", "cont", "rack_base", "rack", "cap_base", "cap")})

# copia para la web
import shutil
os.makedirs(WEB, exist_ok=True)
shutil.copy(os.path.join(HERE, "summary_cuellos.json"), os.path.join(WEB, "cuellos.json"))
shutil.copy(os.path.join(HERE, "summary_escenarios_v2.json"), os.path.join(WEB, "escenarios.json"))
shutil.copy(os.path.join(HERE, "summary_e4_v2.json"), os.path.join(WEB, "e4.json"))
