# -*- coding: utf-8 -*-
"""Análisis de E1-E4 con arribos y pallets aleatorios (10 réplicas de 24 h, mismos streams)."""
import json, math, statistics as st, sys, os
SP = os.path.dirname(os.path.abspath(__file__))
TICKS = 8640.0
T9 = 2.262  # t(0,975; 9 gl)


def cargar(tag):
    reps = []
    for ln in open(os.path.join(SP, tag + ".txt"), encoding="utf-8").read().strip().split("\n"):
        p = ln.split(";")
        cab = p[0].split(",")
        d = {"rep": int(cab[1]), "h": {k: float(v) for k, v in (kv.split("=") for kv in cab[2:])}, "S": {}}
        for x in p[1:]:
            t = x.split()
            if t[0] == "R":
                d["rack"] = dict(avg=float(t[1]), max=float(t[2]), recep=float(t[3]))
            else:
                d["S"][t[1]] = dict(proc=float(t[3]) / TICKS, block=float(t[4]) / TICKS, inp=float(t[7]))
        reps.append(d)
    return reps


def stat(xs):
    n = len(xs); m = sum(xs) / n; s = st.stdev(xs) if n > 1 else 0.0
    h = T9 * s / math.sqrt(n)
    return dict(media=m, desv=s, h=h, ic_inf=m - h, ic_sup=m + h)


def par(a, b):
    d = stat([y - x for x, y in zip(a, b)])
    d["cero_en_ic"] = d["ic_inf"] <= 0 <= d["ic_sup"]
    return d


pal = lambda r: r["h"]["p7"] + r["h"]["p8"]
caj = lambda r: r["h"]["c7"] + r["h"]["c8"]
ton = lambda r: caj(r) * 5 / 1000.0

E = {k: cargar(k) for k in ("E1", "E2", "E3", "E4")}
assert all(len(v) == 10 for v in E.values())

ETAPAS = [("desencajado", "Desencajado", ["Desencajado"]), ("picado", "Picado", ["Picadora"]),
          ("mezclado", "Mezclado", ["MezA", "MezB"]), ("formado", "Formado", ["FormA", "FormB"])]


def kg(eid, batch):
    return {"desencajado": batch, "picado": batch, "mezclado": batch, "formado": 150.0}[eid]


def etapas(reps, batch):
    out = {}
    for eid, nombre, pref in ETAPAS:
        ms = [f"{p}_L{l}" for l in (7, 8) for p in pref]
        oc = {m: st.mean([r["S"][m]["proc"] + r["S"][m]["block"] for r in reps]) for m in ms}
        ip = {m: st.mean([r["S"][m]["inp"] for r in reps]) for m in ms}
        cap = sum(ip[m] / max(oc[m], 1e-6) for m in ms) * kg(eid, batch) / 1000.0
        out[eid] = dict(nombre=nombre, ocup=st.mean(oc.values()), proc=st.mean([r["S"][m]["proc"] for r in reps for m in ms]),
                        cap_t=cap)
    return out


res = {}
for k, reps in E.items():
    batch = 1200 if k == "E4" else 1050
    res[k] = dict(pallets=stat([pal(r) for r in reps]), cajas=stat([caj(r) for r in reps]), ton=stat([ton(r) for r in reps]),
                  kg_pallet=stat([caj(r) * 5 / pal(r) for r in reps]), mp=st.mean([r["h"]["mp"] for r in E[k]]),
                  rack=stat([r["rack"]["avg"] for r in reps]), rack_max=max(r["rack"]["max"] for r in reps),
                  etapas=etapas(reps, batch))
    c = sorted((e["cap_t"], i) for i, e in res[k]["etapas"].items())
    res[k]["cuello"] = dict(etapa=c[0][1], cap_t=c[0][0], siguiente=c[1][1], cap_sig=c[1][0])

dif = {}
for k in ("E2", "E3", "E4"):
    dif[k + "_vs_E1"] = dict(pallets=par([pal(r) for r in E["E1"]], [pal(r) for r in E[k]]),
                             ton=par([ton(r) for r in E["E1"]], [ton(r) for r in E[k]]))
    dif[k + "_vs_E1"]["pallets_pct"] = dif[k + "_vs_E1"]["pallets"]["media"] / res["E1"]["pallets"]["media"] * 100
    dif[k + "_vs_E1"]["ton_pct"] = dif[k + "_vs_E1"]["ton"]["media"] / res["E1"]["ton"]["media"] * 100
dif["E3_vs_E2"] = dict(pallets=par([pal(r) for r in E["E2"]], [pal(r) for r in E["E3"]]),
                       ton=par([ton(r) for r in E["E2"]], [ton(r) for r in E["E3"]]))

# validación contra el tablero (Sep-Oct): 64,9 pallets/día y 56,0 t/día
val = dict(real_pal=64.9, real_ton=56.0)
b = res["E1"]
val["sim_pal"] = b["pallets"]; val["sim_ton"] = b["ton"]
val["err_pal_pct"] = (b["pallets"]["media"] / 64.9 - 1) * 100
val["err_ton_pct"] = (b["ton"]["media"] / 56.0 - 1) * 100
val["real_en_ic_pal"] = b["pallets"]["ic_inf"] <= 64.9 <= b["pallets"]["ic_sup"]
val["real_en_ic_ton"] = b["ton"]["ic_inf"] <= 56.0 <= b["ton"]["ic_sup"]
# t de Student para validar la diferencia contra el valor real
val["t_pal"] = (b["pallets"]["media"] - 64.9) / (b["pallets"]["desv"] / math.sqrt(10))
val["t_ton"] = (b["ton"]["media"] - 56.0) / (b["ton"]["desv"] / math.sqrt(10))

json.dump(dict(res=res, dif=dif, val=val), open(os.path.join(SP, "analisis.json"), "w"), indent=1, ensure_ascii=False)


def f(x, d=1):
    return f"{x:.{d}f}".replace(".", ",")


print("== Escenarios (planta, 24 h, 10 réplicas)")
for k, r in res.items():
    p, t, c = r["pallets"], r["ton"], r["cajas"]
    print(f"{k}: pallets {f(p['media'])} ± {f(p['h'],2)} (s={f(p['desv'],2)}) | t/día {f(t['media'])} ± {f(t['h'],2)} | cajas {f(c['media'],0)} | kg/pallet {f(r['kg_pallet']['media'],1)} | MP {r['mp']:.0f} pallets | cámara MP {f(r['rack']['media'],1)} (máx {r['rack_max']:.0f})")
    print("   cuello:", r["cuello"]["etapa"], f(r["cuello"]["cap_t"]), "t/d; sig:", r["cuello"]["siguiente"], f(r["cuello"]["cap_sig"]))
    print("   etapas:", {i: (f(e['ocup'] * 100, 0) + "%", f(e['cap_t'])) for i, e in r["etapas"].items()})
print("== Diferencias pareadas")
for k, d in dif.items():
    p = d["pallets"]
    print(f"{k}: pallets {f(p['media'])} [{f(p['ic_inf'])} ; {f(p['ic_sup'])}] cero_en_ic={p['cero_en_ic']}", f"({f(d.get('pallets_pct', 0))} %)" if 'pallets_pct' in d else "", "| t/día", f(d['ton']['media']), f"[{f(d['ton']['ic_inf'])} ; {f(d['ton']['ic_sup'])}]")
print("== Validación")
print(json.dumps({k: (round(v, 3) if isinstance(v, float) else v) for k, v in val.items() if not isinstance(v, dict)}, ensure_ascii=False))
