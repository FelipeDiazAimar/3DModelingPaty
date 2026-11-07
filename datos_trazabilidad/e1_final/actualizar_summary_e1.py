"""Pasa las 10 réplicas de E1 con lavado de 30 min (raw_cuellos/E1.txt) a summary_e1.json y a la copia de la web (public/e1/summary.json).
Actualiza métricas de pallets, cajas y toneladas y la validación contra el tablero. La serie horaria (Welch) y los paros salen de raw_replicas.txt
(10 réplicas con lavado, analizar_e1.py); la corrida sin lavado quedó en raw_cuellos/sin_lavado/."""
import json, math, os, shutil, statistics as st, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from analizar_cuellos import cargar, E1  # E1 = 10 réplicas con lavado de 30 min

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "..", "..", "dashboard", "web", "public", "e1", "summary.json")
T = 2.262


def stat(xs):
    n, m, s = len(xs), st.mean(xs), st.stdev(xs)
    h = T * s / math.sqrt(n)
    xs2 = sorted(xs)
    return dict(media=m, desv=s, h=h, ic_inf=m - h, ic_sup=m + h, h_rel=h / m * 100, p95=float(xs2[min(n - 1, math.ceil(0.95 * n) - 1)]),
                n_req_2pct=max(2, math.ceil((1.96 * s / (0.02 * m)) ** 2)), min=min(xs), max=max(xs))


d = json.load(open(os.path.join(HERE, "summary_e1.json"), encoding="utf-8"))
p7, p8 = [r["h"]["p7"] for r in E1], [r["h"]["p8"] for r in E1]
c7, c8 = [r["h"]["c7"] for r in E1], [r["h"]["c8"] for r in E1]
d["metricas"].update(pal_L7=stat(p7), pal_L8=stat(p8), pal_total=stat([a + b for a, b in zip(p7, p8)]),
                     cajas_L7=stat(c7), cajas_L8=stat(c8), ton_L7=stat([x * 5 / 1000 for x in c7]), ton_L8=stat([x * 5 / 1000 for x in c8]))
ton_t = stat([(a + b) * 5 / 1000 for a, b in zip(c7, c8)])
for k, key, ton in (("L7", "pal_L7", d["metricas"]["ton_L7"]), ("L8", "pal_L8", d["metricas"]["ton_L8"]), ("Planta", "pal_total", ton_t)):
    v, m = d["validacion"][k], d["metricas"][key]
    v.update(sim=m["media"], ic_inf=m["ic_inf"], ic_sup=m["ic_sup"], error_rel_pct=(m["media"] - v["real"]) / v["real"] * 100,
             real_en_ic=m["ic_inf"] <= v["real"] <= m["ic_sup"], ton_sim=ton["media"], ton_ic_inf=ton["ic_inf"], ton_ic_sup=ton["ic_sup"],
             ton_real_en_ic=ton["ic_inf"] <= v["ton_real"] <= ton["ic_sup"])
d["lavado_min"] = 30
d["nota"] = "Todo con 10 réplicas con lavado de 30 min por batch (dato de planta): pallets, cajas, toneladas, validación, serie horaria (Welch) y paros."
json.dump(d, open(os.path.join(HERE, "summary_e1.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
shutil.copy(os.path.join(HERE, "summary_e1.json"), WEB)
for k in ("L7", "L8", "Planta"):
    v = d["validacion"][k]
    print(k, "pal sim %.1f real %.1f err %.1f%% en IC %s | ton sim %.2f [%.2f;%.2f] real %.2f err %.1f%% en IC %s" % (v["sim"], v["real"], v["error_rel_pct"], v["real_en_ic"], v["ton_sim"], v["ton_ic_inf"], v["ton_ic_sup"], v["ton_real"], (v["ton_sim"] - v["ton_real"]) / v["ton_real"] * 100, v["ton_real_en_ic"]))
