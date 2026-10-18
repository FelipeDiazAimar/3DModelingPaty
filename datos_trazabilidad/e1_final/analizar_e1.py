"""Analiza las 10 réplicas E1 (24 h, modelo final PLANTASJ.fsm) -> replicas.csv, summary_e1.json y copia para la web."""
import json, math, os, re, statistics as st

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "..", "..", "dashboard", "web", "public", "e1")
T975_9 = 2.262            # t(0,975; 9 gl), 10 réplicas
Z = 1.96
REAL_PAL = {"L7": 25.8, "L8": 39.1}          # FITTING_EVIDENCIA.md §E (pallets/día medios por línea, tablero Sep-Oct)
KG_PAL_REAL = 862.5                          # FITTING §C (peso medio de pallet PT)
KG_CAJA = 5.0
GROUPS = {  # idx del equipo -> (grupo, MTBF min, MTTR min) — los mismos que usa Tools/Fallas
    0: "FOR", 1: "FOR", 2: "FOR", 3: "FOR", 4: "TUN", 5: "TUN", 6: "FLW", 7: "FLW", 8: "FLW", 9: "FLW", 10: "EST", 11: "EST", 12: "PIC", 13: "PIC",
}
SPEC = {"FOR": (709.3, 6.15, 4), "TUN": (2795.3, 8.65, 2), "FLW": (4752.0, 5.0, 4), "EST": (1827.7, 13.0, 2), "PIC": (880.0, 11.3, 2)}  # MTBF, MTTR, nº equipos

reps = []
for line in open(os.path.join(HERE, "raw_replicas.txt"), encoding="utf-8"):
    line = line.strip()
    if not line.startswith("R|"):
        continue
    head, rest = line.split("|F|")
    fpart, mpart = rest.split("|M|")
    _, rep, q7, q8, sink, c7, c8 = head.split("|")
    down = {}
    for kv in filter(None, fpart.split(",")):
        k, v = kv.split("=")
        down[k] = float(v)
    grp_min = {g: 0.0 for g in SPEC}
    grp_n = {g: 0 for g in SPEC}
    for i, g in GROUPS.items():
        grp_min[g] += down.get(f"d{i}", 0.0) / 60.0
        grp_n[g] += int(down.get(f"n{i}", 0))
    hours = []
    for row in mpart.split("\\n"):
        row = row.strip()
        if row:
            h, a, b, ca, cb = row.split(",")
            hours.append((float(h), int(a), int(b), int(ca), int(cb)))
    reps.append(dict(rep=int(rep), q7=int(q7), q8=int(q8), sink=int(sink), c7=int(c7), c8=int(c8), grp_min=grp_min, grp_n=grp_n, hours=hours))

n = len(reps)
assert n == 10, n


def stats(xs):
    m = st.mean(xs)
    s = st.stdev(xs) if len(xs) > 1 else 0.0
    h = T975_9 * s / math.sqrt(len(xs))
    xs_sorted = sorted(xs)
    k = 0.95 * (len(xs) - 1)
    f = math.floor(k)
    p95 = xs_sorted[f] + (xs_sorted[min(f + 1, len(xs) - 1)] - xs_sorted[f]) * (k - f)
    n_req = math.ceil((Z * s / (0.02 * m)) ** 2) if s > 0 and m else 1
    return dict(media=m, desv=s, h=h, ic_inf=m - h, ic_sup=m + h, h_rel=(h / m * 100 if m else 0), p95=p95, n_req_2pct=max(n_req, 2), min=min(xs), max=max(xs))


M = {
    "pal_L7": stats([r["q7"] for r in reps]),
    "pal_L8": stats([r["q8"] for r in reps]),
    "pal_total": stats([r["q7"] + r["q8"] for r in reps]),
    "cajas_L7": stats([r["c7"] for r in reps]),
    "cajas_L8": stats([r["c8"] for r in reps]),
    "ton_L7": stats([r["c7"] * KG_CAJA / 1000 for r in reps]),
    "ton_L8": stats([r["c8"] * KG_CAJA / 1000 for r in reps]),
}
# régimen: pallets/día extrapolando hs 3..23 (excluye el llenado de la línea)
def steady(r, col):
    hs = {h: v for h, *v in r["hours"]}
    return (hs[23.0][col] - hs[3.0][col]) / 20.0 * 24.0
M["cajas_dia_reg_L7"] = stats([steady(r, 2) for r in reps])
M["cajas_dia_reg_L8"] = stats([steady(r, 3) for r in reps])
M["pal_dia_reg_L7"] = stats([steady(r, 2) / 144 for r in reps])
M["pal_dia_reg_L8"] = stats([steady(r, 3) / 144 for r in reps])

# validación contra el tablero
VAL = {}
for ln, key in (("L7", "pal_L7"), ("L8", "pal_L8")):
    real = REAL_PAL[ln]
    s = M[key]
    VAL[ln] = dict(real=real, sim=s["media"], ic_inf=s["ic_inf"], ic_sup=s["ic_sup"], error_rel_pct=(s["media"] - real) / real * 100, real_en_ic=(s["ic_inf"] <= real <= s["ic_sup"]),
                   ton_sim=M["ton_" + ln]["media"], ton_real=real * KG_PAL_REAL / 1000)
real_tot = sum(REAL_PAL.values())
stot = M["pal_total"]
VAL["Planta"] = dict(real=real_tot, sim=stot["media"], ic_inf=stot["ic_inf"], ic_sup=stot["ic_sup"], error_rel_pct=(stot["media"] - real_tot) / real_tot * 100,
                     real_en_ic=(stot["ic_inf"] <= real_tot <= stot["ic_sup"]), ton_sim=M["ton_L7"]["media"] + M["ton_L8"]["media"], ton_real=real_tot * KG_PAL_REAL / 1000)

# paros simulados vs lo esperado por los datos de entrada (verifica que el modelo los aplica)
PAROS = {}
for g, (mtbf, mttr, neq) in SPEC.items():
    mins = [r["grp_min"][g] for r in reps]
    evs = [r["grp_n"][g] for r in reps]
    esperado_min = neq * 24 * 60 / (mtbf + mttr) * mttr
    esperado_ev = neq * 24 * 60 / (mtbf + mttr)
    PAROS[g] = dict(equipos=neq, min_media=st.mean(mins), min_desv=st.stdev(mins), eventos_media=st.mean(evs), min_esperado=esperado_min, eventos_esperado=esperado_ev)

# Welch sobre cajas/h totales (promedio de las 10 réplicas), ventana w = 3
rate = []
for i in range(1, 23):  # hs 2..23 -> tasa de la hora i
    vals = []
    for r in reps:
        hs = {h: v for h, *v in r["hours"]}
        vals.append((hs[float(i + 1)][2] + hs[float(i + 1)][3]) - (hs[float(i)][2] + hs[float(i)][3]))
    rate.append(st.mean(vals))
w = 3
ma = []
for i in range(len(rate)):
    lo, hi = max(0, i - w), min(len(rate), i + w + 1)
    ma.append(st.mean(rate[lo:hi]))
WELCH = dict(horas=list(range(2, 24)), tasa_cajas_h=rate, media_movil_w3=ma)
hora_estable = next((h for h, v in zip(WELCH["horas"], rate) if v >= 0.95 * st.mean(rate[6:])), None)
WELCH["hora_estable_95pct"] = hora_estable

OUT = dict(modelo="PLANTASJ.fsm (L7+L8)", horizonte_h=24, replicas=n, metodo="10 réplicas, fallas aleatorias (MTBF exp., MTTR lognormal) del tablero; streams 60-87 desplazados por réplica", metricas=M, validacion=VAL, paros=PAROS, welch=WELCH)
json.dump(OUT, open(os.path.join(HERE, "summary_e1.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
os.makedirs(WEB, exist_ok=True)
json.dump(OUT, open(os.path.join(WEB, "summary.json"), "w", encoding="utf-8"), ensure_ascii=False)
with open(os.path.join(HERE, "replicas.csv"), "w", encoding="utf-8") as f:
    f.write("rep,pallets_L7,pallets_L8,pallets_sink,cajas_L7,cajas_L8,paro_FOR_min,paro_TUN_min,paro_FLW_min,paro_EST_min,paro_PIC_min\n")
    for r in reps:
        g = r["grp_min"]
        f.write(f'{r["rep"]},{r["q7"]},{r["q8"]},{r["sink"]},{r["c7"]},{r["c8"]},{g["FOR"]:.1f},{g["TUN"]:.1f},{g["FLW"]:.1f},{g["EST"]:.1f},{g["PIC"]:.1f}\n')

fm = lambda x, d=1: f"{x:.{d}f}"
print("PALLETS/DIA (24 h):")
for k in ("pal_L7", "pal_L8", "pal_total"):
    s = M[k]
    print(f"  {k}: {fm(s['media'],2)} +/- {fm(s['h'],2)}  IC95[{fm(s['ic_inf'],2)};{fm(s['ic_sup'],2)}] sd={fm(s['desv'],2)} P95={fm(s['p95'],1)} h_rel={fm(s['h_rel'],2)}% n_req(2%)={s['n_req_2pct']}")
print("CAJAS 24 h:", {k: (fm(M[k]['media'], 0), fm(M[k]['h'], 0), fm(M[k]['h_rel'], 2)) for k in ("cajas_L7", "cajas_L8")})
print("REGIMEN pallets/dia:", {k: (fm(M[k]['media'], 2), fm(M[k]['h'], 2)) for k in ("pal_dia_reg_L7", "pal_dia_reg_L8")})
print("VALIDACION:")
for k, v in VAL.items():
    print(f"  {k}: real={v['real']} sim={fm(v['sim'],2)} err={fm(v['error_rel_pct'],1)}% real_en_IC={v['real_en_ic']} ton sim={fm(v['ton_sim'],1)} real={fm(v['ton_real'],1)}")
print("PAROS simulados vs esperado (min/dia, eventos):")
for g, v in PAROS.items():
    print(f"  {g}: sim {fm(v['min_media'],1)} +/- {fm(v['min_desv'],1)} min ({fm(v['eventos_media'],1)} ev) | esperado {fm(v['min_esperado'],1)} min ({fm(v['eventos_esperado'],1)} ev)")
print("WELCH hora estable (>=95% del regimen):", hora_estable)
print("tasa cajas/h hs2..:", [round(x) for x in rate[:8]])
