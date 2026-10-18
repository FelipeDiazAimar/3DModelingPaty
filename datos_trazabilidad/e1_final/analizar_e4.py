"""E4: tamaño de batch 1200 vs 1500 kg con lavado de mezcladora por batch (sensibilidad 0 / 15 / 30 min) -> summary_e4.json (+ copia web)."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "..", "..", "dashboard", "web", "public", "e1")

# (pallets L7, pallets L8, cajas L7, cajas L8) salida cruda de FlexSim, 24 h, réplica 1 (con 15 min: 10 réplicas idénticas)
RUNS = {
    (1500, 0): (45, 45, 6594, 6602),   # = E1 réplica 1
    (1500, 15): (43, 43, 6231, 6245),  # idéntico en las 10 réplicas
    (1500, 30): (38, 38, 5563, 5577),
    (1200, 0): (46, 46, 6675, 6686),
    (1200, 15): (41, 41, 6000, 6004),  # idéntico en las 10 réplicas
    (1200, 30): (36, 36, 5244, 5257),
}
OUT = {
    "descripcion": "Batch de 1200 kg = 8 cargas por batch, desencajado y picadora al 80 % del tiempo, 20 pallets de 1200 kg por turno de recepción (mismas 72 t/día de materia prima). Lavado de mezcladora por batch como tiempo de preparación (supuesto, no hay dato).",
    "replicas_15min": 10,
    "nota": "Con lavado de 15 min las 10 réplicas dieron el mismo valor en las dos variantes (el cuello son las mezcladoras y las fallas no pasan por ahí); 0 y 30 min son una réplica.",
    "filas": [],
}
for lav in (0, 15, 30):
    a, b = RUNS[(1500, lav)], RUNS[(1200, lav)]
    ca, cb = a[2] + a[3], b[2] + b[3]
    OUT["filas"].append(dict(lavado_min=lav, pal_1500=a[0] + a[1], pal_1200=b[0] + b[1], cajas_1500=ca, cajas_1200=cb, dif_cajas_pct=(cb - ca) / ca * 100,
                             ton_1500=ca * 5 / 1000, ton_1200=cb * 5 / 1000))
json.dump(OUT, open(os.path.join(HERE, "summary_e4.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
os.makedirs(WEB, exist_ok=True)
json.dump(OUT, open(os.path.join(WEB, "e4.json"), "w", encoding="utf-8"), ensure_ascii=False)
for r in OUT["filas"]:
    print(r)
