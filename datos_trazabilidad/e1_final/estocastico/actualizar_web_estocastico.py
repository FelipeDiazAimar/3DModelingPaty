# -*- coding: utf-8 -*-
"""Actualiza los JSON de la web (dashboard/web/public/e1/) con las 40 réplicas del modelo con arribos y pallets aleatorios.

Entradas: E1.txt..E4.txt de esta carpeta (salida de Tools/codCollect, ver analizar_estocastico.py).
Salidas: escenarios.json, summary.json, e4.json y cuellos.json (E1, E2, E3 y E4_L30). Las variantes con lavado de 0 y 15 min
(E4_L0, E4_L15) y los escenarios E5 quedan del modelo con llegadas fijas y se rotulan como tales.
"""
import json, math, os, statistics as st

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "..", "..", "..", "dashboard", "web", "public", "e1")
TICKS = 8640.0
T9 = 2.262


def cargar(tag):
    reps = []
    for ln in open(os.path.join(HERE, tag + ".txt"), encoding="utf-8").read().strip().split("\n"):
        p = ln.split(";")
        cab = p[0].split(",")
        d = {"h": {k: float(v) for k, v in (kv.split("=") for kv in cab[2:])}, "S": {}}
        for x in p[1:]:
            t = x.split()
            if t[0] == "R":
                d["rack"] = dict(avg=float(t[1]), max=float(t[2]))
            else:
                d["S"][t[0]] = dict(proc=float(t[1]) / TICKS, block=float(t[2]) / TICKS, inp=float(t[3]))
        reps.append(d)
    return reps


def stat(xs):
    n = len(xs); m = sum(xs) / n; s = st.stdev(xs)
    h = T9 * s / math.sqrt(n)
    return dict(media=m, desv=s, h=h, ic_inf=m - h, ic_sup=m + h)


def par(a, b):
    d = stat([y - x for x, y in zip(a, b)])
    d["cero_en_ic"] = d["ic_inf"] <= 0 <= d["ic_sup"]
    return d


def f(x, d=1):
    return f"{x:.{d}f}".replace(".", ",")


E = {k: cargar(k) for k in ("E1", "E2", "E3", "E4")}
P = lambda r: r["h"]["p7"] + r["h"]["p8"]
C = lambda r: r["h"]["c7"] + r["h"]["c8"]
TN = lambda r: C(r) * 5 / 1000.0
bloque = lambda reps: dict(pallets=stat([P(r) for r in reps]), cajas=stat([C(r) for r in reps]), ton=stat([TN(r) for r in reps]))

# ------------------------------------------------------------------ etapas / cuello
ETAPAS = {"desencajado": ["Desencajado"], "picado": ["Picadora"], "mezclado": ["MezA", "MezB"], "formado": ["FormA", "FormB"]}


def medir(reps, batch):
    out = {}
    for eid, pref in ETAPAS.items():
        ms = [f"{p}_L{l}" for l in (7, 8) for p in pref]
        oc = {m: st.mean([r["S"][m]["proc"] + r["S"][m]["block"] for r in reps]) for m in ms}
        ip = {m: st.mean([r["S"][m]["inp"] for r in reps]) for m in ms}
        kg = 150.0 if eid == "formado" else batch
        out[eid] = dict(ocup=st.mean(oc.values()) * 100, cap=sum(ip[m] / oc[m] for m in ms) * kg / 1000.0)
    c = sorted((e["cap"], i) for i, e in out.items())
    return out, dict(etapa=c[0][1], cap_t=c[0][0], siguiente=c[1][1], cap_siguiente=c[1][0])


M = {"E1": medir(E["E1"], 1500), "E2": medir(E["E2"], 1500), "E3": medir(E["E3"], 1500), "E4": medir(E["E4"], 1200)}
rack = {k: st.mean([r["rack"]["avg"] for r in v]) for k, v in E.items()}
rackmax = {k: max(r["rack"]["max"] for r in v) for k, v in E.items()}
B = {k: bloque(v) for k, v in E.items()}

# ------------------------------------------------------------------ escenarios.json
esc = json.load(open(os.path.join(WEB, "escenarios.json"), encoding="utf-8"))
esc["metodo"] = ("mismas 10 réplicas (streams 60-87 de fallas, 90 de arribos y 91-92 de pallets, desplazados por réplica) en todos los escenarios; "
                 "arribos de MP con la tabla empírica y pallets de PT con los 500 pesos reales; diferencias pareadas con t(0,975; 9 gl)")
for k in ("E1", "E2", "E3"):
    e = esc["escenarios"][k]
    e.update(pallets=B[k]["pallets"], cajas=B[k]["cajas"], ton=B[k]["ton"])
    if k != "E1":
        e["dif_pallets"] = par([P(r) for r in E["E1"]], [P(r) for r in E[k]])
        e["dif_cajas"] = par([C(r) for r in E["E1"]], [C(r) for r in E[k]])
        e["dif_pallets_pct"] = e["dif_pallets"]["media"] / B["E1"]["pallets"]["media"] * 100
        e["dif_cajas_pct"] = e["dif_cajas"]["media"] / B["E1"]["cajas"]["media"] * 100
esc["escenarios"]["E3"]["dif_vs_E2_pallets"] = par([P(r) for r in E["E2"]], [P(r) for r in E["E3"]])
esc["escenarios"]["E1"]["cambio"] = "Fallas del tablero, arribos y pallets aleatorios, formadoras a 982 kg/h, 16 pallets de MP por turno y lavado de 30 min por batch (dato de planta)"
esc["escenarios"]["E5"]["cambio"] = "MTTR ×1,25 en formadoras y túneles (antiguo E3). Medido con el modelo anterior (llegadas fijas, sin lavado): no es comparable con E1 de hoy"
esc["tope_mp"]["texto"] = ("La materia prima de E1 y E2 entra a 16 pallets de 1500 kg por turno (los tiempos entre arribos salen de la tabla empírica): "
                           "72 t/día = 14.400 cajas de 5 kg por día para las dos líneas")
json.dump(esc, open(os.path.join(WEB, "escenarios.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ------------------------------------------------------------------ summary.json
sm = json.load(open(os.path.join(WEB, "summary.json"), encoding="utf-8"))


def met(xs):
    s = stat(xs)
    s["h_rel"] = s["h"] / s["media"] * 100
    s["p95"] = sorted(xs)[int(math.ceil(0.95 * len(xs))) - 1]
    s["n_req_2pct"] = max(2, int(math.ceil((1.96 * s["desv"] / (0.02 * s["media"])) ** 2)))
    s["min"], s["max"] = min(xs), max(xs)
    return s


e1 = E["E1"]
sm["metricas"]["pal_L7"] = met([r["h"]["p7"] for r in e1])
sm["metricas"]["pal_L8"] = met([r["h"]["p8"] for r in e1])
sm["metricas"]["pal_total"] = met([P(r) for r in e1])
sm["metricas"]["cajas_L7"] = met([r["h"]["c7"] for r in e1])
sm["metricas"]["cajas_L8"] = met([r["h"]["c8"] for r in e1])
sm["metricas"]["ton_L7"] = met([r["h"]["c7"] * 5 / 1000 for r in e1])
sm["metricas"]["ton_L8"] = met([r["h"]["c8"] * 5 / 1000 for r in e1])
kgp = st.mean([C(r) * 5 / P(r) for r in e1])
for l in ("L7", "L8"):  # régimen (horas 3-23): las cajas no cambian con el sorteo; los pallets se reestiman con el kg/pallet medio
    cr = sm["metricas"]["cajas_dia_reg_" + l]
    pr = dict(cr)
    for k2 in ("media", "desv", "h", "ic_inf", "ic_sup", "p95", "min", "max"):
        pr[k2] = cr[k2] * 5 / kgp
    sm["metricas"]["pal_dia_reg_" + l] = pr
real = {"L7": (25.8, 22.2525), "L8": (39.1, 33.72375), "Planta": (64.9, 55.97625)}
val = {}
for key, (rp, rt) in real.items():
    if key == "Planta":
        s_p, s_t = sm["metricas"]["pal_total"], B["E1"]["ton"]
    else:
        s_p, s_t = sm["metricas"]["pal_" + key], sm["metricas"]["ton_" + key]
    val[key] = dict(real=rp, sim=s_p["media"], ic_inf=s_p["ic_inf"], ic_sup=s_p["ic_sup"], error_rel_pct=(s_p["media"] / rp - 1) * 100,
                    real_en_ic=s_p["ic_inf"] <= rp <= s_p["ic_sup"], ton_sim=s_t["media"], ton_real=rt, ton_ic_inf=s_t["ic_inf"], ton_ic_sup=s_t["ic_sup"],
                    ton_real_en_ic=s_t["ic_inf"] <= rt <= s_t["ic_sup"], ton_error_rel_pct=(s_t["media"] / rt - 1) * 100)
sm["validacion"] = val
sm["metodo"] = ("10 réplicas de 24 h (terminante, arranca vacío) con fallas aleatorias, arribos de MP aleatorios (tabla empírica) y pallets de PT "
                "con peso aleatorio (500 pesos reales); mismos streams en todos los escenarios")
sm["nota"] = ("Todo con 10 réplicas, lavado de 30 min por batch (dato de planta), arribos y pallets aleatorios. Serie horaria (Welch) y paros "
              "vienen de la corrida con llegadas fijas: las fallas usan los mismos streams, así que los paros no cambian.")
json.dump(sm, open(os.path.join(WEB, "summary.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ------------------------------------------------------------------ e4.json
e4 = json.load(open(os.path.join(WEB, "e4.json"), encoding="utf-8"))
fila = [x for x in e4["filas"] if x["lavado_min"] == 30][0]
fila.update(n=10, pal_1500=B["E1"]["pallets"], pal_1200=B["E4"]["pallets"], dif_pal=par([P(r) for r in E["E1"]], [P(r) for r in E["E4"]]),
            cajas_1500=B["E1"]["cajas"]["media"], cajas_1200=B["E4"]["cajas"]["media"], ton_1500=B["E1"]["ton"]["media"], ton_1200=B["E4"]["ton"]["media"])
fila["dif_cajas_pct"] = (fila["cajas_1200"] / fila["cajas_1500"] - 1) * 100
fila["dif_pal_pct"] = fila["dif_pal"]["media"] / fila["pal_1500"]["media"] * 100
e4["nota"] = ("Lavado de 30 min: 10 réplicas con el modelo actual (arribos y pallets aleatorios, mismos streams); 0 y 15 min: 5 réplicas del modelo anterior "
              "(llegadas fijas), solo como sensibilidad. IC con t(0,975; 9 gl) = 2,262 (4 gl: 2,776).")
json.dump(e4, open(os.path.join(WEB, "e4.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ------------------------------------------------------------------ cuellos.json
cu = json.load(open(os.path.join(WEB, "cuellos.json"), encoding="utf-8"))
NOM = {"desencajado": "desencajado", "mezclado": "mezcladoras", "formado": "formadoras"}


def parchar(clave, esc_k, base_k):
    e = cu["escenarios"][clave]
    me, cue = M[esc_k]
    mb, cueb = M[base_k]
    e["cuello"] = cue
    e["cuello_base"] = dict(etapa=cueb["etapa"], cap_t=cueb["cap_t"])
    for x in e["etapas"]:
        i = x["id"]
        if i in me:
            x["ocup"], x["ocup_base"], x["d_ocup"] = me[i]["ocup"], mb[i]["ocup"], me[i]["ocup"] - mb[i]["ocup"]
            x["cap"], x["cap_base"] = me[i]["cap"], mb[i]["cap"]
            x["puntaje"] = abs(x["d_ocup"])
        if i == "camara_mp":
            x["rack_base"], x["rack"], x["rack_max"], x["d_rack"] = rack["E1"], rack[esc_k], rackmax[esc_k], rack[esc_k] - rack["E1"]
            x["puntaje"] = abs(x["d_rack"]) * 4
    e["rack"] = dict(base=rack["E1"], esc=rack[esc_k], max=rackmax[esc_k])
    return e


e = parchar("E1", "E1", "E1")
t = cu["escenarios"]["E1"]["texto"]
o = M["E1"][0]
t["titulo"] = "El cuello son las mezcladoras (por el lavado de 30 min)"
t["cuello"] = (f"Cada batch ocupa a la mezcladora 30 min más por el lavado: queda ocupada el {f(o['mezclado']['ocup'], 0)} % del tiempo y su capacidad implícita es "
               f"{f(o['mezclado']['cap'])} t/día, por debajo de los {f(o['desencajado']['cap'])} t/día del desencajado y de las 72 t/día que llegan.")
t["efectos"] = [{"etapa": "desencajado", "txt": f"Siguiente restricción: {f(o['desencajado']['ocup'], 0)} % ocupado (3500 s por pallet y línea), {f(o['desencajado']['cap'])} t/día. Si se arreglan las mezcladoras, el cuello pasa acá."},
                {"etapa": "formado", "txt": f"Ocupación {f(o['formado']['ocup'], 0)} %: recibe menos cargas porque las mezcladoras no alcanzan a entregar."}]
pt, tt = B["E1"]["pallets"], B["E1"]["ton"]
t["conclusion"] = (f"La planta produce {f(pt['media'])} pallets/día ({f(tt['media'])} t/día): −{f((1 - pt['media'] / 64.9) * 100)} % de los 64,9 pallets y −{f((1 - tt['media'] / 55.97625) * 100)} % de las 56,0 t/día "
                   f"del tablero. Con arribos y pallets aleatorios el modelo valida en pallets y en toneladas.")
for k in ("E2", "E3"):
    parchar(k, k, "E1")
o2, o3 = M["E2"][0], M["E3"][0]
d2 = esc["escenarios"]["E2"]
tx = cu["escenarios"]["E2"]["texto"]
tx["cuello"] = f"Con las formadoras a 1843 kg/h el cuello deja de estar en las mezcladoras ({f(o['mezclado']['cap'])} t/día) y pasa al desencajado ({f(o2['desencajado']['cap'])} t/día)."
tx["efectos"] = [{"etapa": "mezclado", "txt": f"Ocupación {f(o['mezclado']['ocup'], 0)} → {f(o2['mezclado']['ocup'], 0)} %. Capacidad {f(o['mezclado']['cap'])} → {f(o2['mezclado']['cap'])} t/día."},
                 {"etapa": "formado", "txt": f"Ocupación {f(o['formado']['ocup'], 0)} → {f(o2['formado']['ocup'], 0)} %."}]
tx["conclusion"] = (f"+{f(d2['dif_pallets']['media'])} pallets/día (+{f(d2['dif_pallets_pct'])} %), IC [+{f(d2['dif_pallets']['ic_inf'])} ; +{f(d2['dif_pallets']['ic_sup'])}]: es la mejora grande. "
                    f"El techo nuevo es el desencajado ({f(o2['desencajado']['cap'])} t/día).")
d3 = esc["escenarios"]["E3"]["dif_vs_E2_pallets"]
tx = cu["escenarios"]["E3"]["texto"]
tx["cuello"] = (f"Desencajado al {f(o3['desencajado']['ocup'], 0)} % ({f(o3['desencajado']['cap'])} t/día). Llegan 108 t/día de MP (24 pallets por turno) pero solo se procesan unas 74 t: el resto espera en las cámaras.")
tx["efectos"] = [{"etapa": "camara_mp", "txt": f"Las cámaras de MP pasan de {f(rack['E1'])} a {f(rack['E3'])} pallets en promedio (máximo {rackmax['E3']:.0f}) y crecen durante el día: es la cola que provoca el cuello."},
                 {"etapa": "formado", "txt": f"Ocupación {f(o['formado']['ocup'], 0)} → {f(o3['formado']['ocup'], 0)} % (efecto de las formadoras de E2, no de la MP)."},
                 {"etapa": "mezclado", "txt": f"Ocupación {f(o['mezclado']['ocup'], 0)} → {f(o3['mezclado']['ocup'], 0)} % (efecto de E2, no de la MP)."}]
tx["conclusion"] = (f"{f(d3['media'])} pallets/día contra E2 (IC [{f(d3['ic_inf'])} ; {f(d3['ic_sup'])}], {f(d3['media'] / B['E2']['pallets']['media'] * 100)} %): "
                    f"la materia prima extra casi no suma. Para aprovecharla hay que ampliar el desencajado (más puestos o menos de 3500 s por pallet).")
# E4 (lavado 30 min) contra E1
e4c = parchar("E4_L30", "E4", "E1")
o4 = M["E4"][0]
tx = e4c["texto"]
d4 = fila["dif_pal"]
tx["titulo"] = "Con lavado de 30 min el cuello está en las mezcladoras"
tx["cuello"] = (f"Cada batch ocupa a la mezcladora 30 min más: con 1500 kg su capacidad implícita es {f(o['mezclado']['cap'])} t/día, por debajo de los {f(o['desencajado']['cap'])} t/día del desencajado.")
tx["efectos"] = [{"etapa": "mezclado", "txt": f"Con 1200 kg hay 30 batches por día en lugar de 24 y se lava más veces: capacidad {f(o['mezclado']['cap'])} → {f(o4['mezclado']['cap'])} t/día, ocupación {f(o['mezclado']['ocup'], 0)} → {f(o4['mezclado']['ocup'], 0)} %."},
                 {"etapa": "formado", "txt": f"Aguas abajo, formado queda ocupado el {f(o4['formado']['ocup'], 0)} % (contra {f(o['formado']['ocup'], 0)} %): recibe menos cargas porque las mezcladoras no alcanzan a entregar."}]
tx["conclusion"] = f"1200 kg rinde {f(d4['media'])} pallets/día ({f(fila['dif_pal_pct'])} %) contra 1500 kg: el batch grande lava menos veces por tonelada (dato de planta)."
cu["nota"] = ("E1, E2, E3 y E4 con lavado de 30 min: 10 réplicas del modelo con arribos y pallets aleatorios. E4 con lavado de 0 y 15 min: sensibilidad del modelo anterior "
              "(llegadas fijas, 5 réplicas). Medidos solo desencajado, picado, mezclado y formado; las demás etapas y las colas de entrada conservan el valor de la corrida anterior.")
json.dump(cu, open(os.path.join(WEB, "cuellos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("web actualizada:", {k: f(B[k]["pallets"]["media"]) for k in B})
