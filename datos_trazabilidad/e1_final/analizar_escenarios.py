"""Compara E2 y E3 contra E1 con diferencias pareadas (mismas réplicas = mismos números aleatorios) -> summary_escenarios.json (+ copia web)."""
import json, math, os, statistics as st

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "..", "..", "dashboard", "web", "public", "e1")
T = 2.262  # t(0,975; 9 gl)

# (pallets L7, pallets L8, cajas L7, cajas L8) por réplica 1..10 — salida cruda de FlexSim (ver raw_* )
E1 = [(45, 45, 6594, 6602), (44, 45, 6443, 6606), (44, 45, 6470, 6606), (45, 45, 6594, 6564), (44, 44, 6443, 6375),
      (45, 45, 6594, 6606), (45, 45, 6594, 6576), (44, 44, 6486, 6466), (45, 45, 6538, 6606), (45, 45, 6594, 6606)]
E3 = [(45, 45, 6594, 6606), (44, 45, 6435, 6606), (44, 45, 6432, 6606), (45, 45, 6594, 6564), (44, 44, 6443, 6369),
      (45, 45, 6594, 6606), (45, 45, 6594, 6576), (44, 44, 6486, 6452), (45, 45, 6535, 6606), (45, 45, 6594, 6606)]
E2 = [(46, 46, 6698, 6702), (46, 46, 6698, 6709), (45, 46, 6577, 6709), (46, 46, 6698, 6709), (46, 46, 6698, 6709),
      (46, 46, 6698, 6709), (46, 46, 6698, 6709), (46, 46, 6698, 6709), (46, 46, 6698, 6709), (46, 46, 6698, 6709)]
DEFS = {
    "E1": dict(nombre="Base", cambio="Fallas del tablero, formadoras a 982 kg/h", datos=E1),
    "E2": dict(nombre="Más dotación", cambio="Formadoras a 1843 kg/h (separación entre bandejas 3,27 → 1,554 m)", datos=E2),
    "E3": dict(nombre="Estrés por fallas", cambio="MTTR ×1,25 en formadoras y túneles", datos=E3),
}


def stat(xs):
    m = st.mean(xs); s = st.stdev(xs); h = T * s / math.sqrt(len(xs))
    return dict(media=m, desv=s, h=h, ic_inf=m - h, ic_sup=m + h)


def pal_total(r): return r[0] + r[1]
def caj_total(r): return r[2] + r[3]


OUT = {"replicas": 10, "metodo": "mismas 10 réplicas (streams 60-87 desplazados por réplica) en los tres escenarios; diferencias pareadas con t(0,975; 9 gl)", "escenarios": {}}
base_p = [pal_total(r) for r in E1]; base_c = [caj_total(r) for r in E1]
for k, d in DEFS.items():
    p = [pal_total(r) for r in d["datos"]]; c = [caj_total(r) for r in d["datos"]]
    e = dict(nombre=d["nombre"], cambio=d["cambio"], pallets=stat(p), cajas=stat(c), ton=stat([x * 5 / 1000 for x in c]))
    if k != "E1":
        dp = [a - b for a, b in zip(p, base_p)]; dc = [a - b for a, b in zip(c, base_c)]
        sp, sc = stat(dp), stat(dc)
        e["dif_pallets"] = sp; e["dif_cajas"] = sc
        e["dif_pallets"]["cero_en_ic"] = bool(sp["ic_inf"] <= 0 <= sp["ic_sup"])
        e["dif_cajas"]["cero_en_ic"] = bool(sc["ic_inf"] <= 0 <= sc["ic_sup"])
        e["dif_cajas_pct"] = sc["media"] / st.mean(base_c) * 100
        e["dif_pallets_pct"] = sp["media"] / st.mean(base_p) * 100
    OUT["escenarios"][k] = e
# tope de materia prima: 16 pallets de 1500 kg cada 8 h
OUT["tope_mp"] = dict(pallets_mp_dia=48, kg_dia=72000, cajas_dia=14400, texto="La materia prima entra a 16 pallets de 1500 kg cada 8 h: 72 t/día = 14.400 cajas de 5 kg por día para las dos líneas")
json.dump(OUT, open(os.path.join(HERE, "summary_escenarios.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
os.makedirs(WEB, exist_ok=True)
json.dump(OUT, open(os.path.join(WEB, "escenarios.json"), "w", encoding="utf-8"), ensure_ascii=False)
f = lambda x, d=1: f"{x:.{d}f}"
for k, e in OUT["escenarios"].items():
    print(k, e["nombre"], "pallets", f(e["pallets"]["media"], 2), "+/-", f(e["pallets"]["h"], 2), "cajas", f(e["cajas"]["media"], 0), "+/-", f(e["cajas"]["h"], 0))
    if k != "E1":
        print("   dif pallets", f(e["dif_pallets"]["media"], 2), "IC[", f(e["dif_pallets"]["ic_inf"], 2), ";", f(e["dif_pallets"]["ic_sup"], 2), "] cero_en_ic", e["dif_pallets"]["cero_en_ic"], f"({f(e['dif_pallets_pct'], 1)} %)")
        print("   dif cajas  ", f(e["dif_cajas"]["media"], 1), "IC[", f(e["dif_cajas"]["ic_inf"], 1), ";", f(e["dif_cajas"]["ic_sup"], 1), "] cero_en_ic", e["dif_cajas"]["cero_en_ic"], f"({f(e['dif_cajas_pct'], 2)} %)")
