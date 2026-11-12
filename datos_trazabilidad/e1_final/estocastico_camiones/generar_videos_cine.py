"""Genera videos MP4 de las cinemáticas de E2, E3 y E4 (gráficas + problema de cada escenario).

Lee las cifras de analisis.json (misma carpeta). Las capacidades por estación salen de PENDIENTES.md, sección 3.
Uso: python generar_videos_cine.py <carpeta_salida>
Requiere: matplotlib y ffmpeg en PATH.
"""
import json
import os
import subprocess
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "videos")
FPS = 30
W, H = 1920, 1080
COL_BASE = "#7f8c8d"
COL_ESC = "#e67e22"
COL_OK = "#27ae60"
COL_BAD = "#c0392b"
BG = "#fbfaf7"
INK = "#222222"

with open(os.path.join(HERE, "analisis.json"), encoding="utf-8") as f:
    AN = json.load(f)
RES = AN["res"]
DIF = AN["dif"]

# Capacidad (t/día) de las dos estaciones más lentas, de PENDIENTES.md sección 3.
CUELLOS = {
    "E1": [("Mezcladoras", 60.5), ("Desencajado", 74.7)],
    "E2": [("Desencajado", 74.7), ("Mezcladoras", 77.9)],
    "E3": [("Desencajado", 75.2), ("Mezcladoras", 77.9)],
    "E4": [("Mezcladoras", 61.6), ("Desencajado", 74.7)],
}

ESCENARIOS = {
    "E2": {
        "titulo": "E2 · Formadoras a 1843 kg/h",
        "problema": (
            "Pregunta: ¿la formadora es el cuello de botella?\n"
            "Hipótesis inicial: sí. Se duplica la velocidad de las formadoras (982 → 1843 kg/h).\n"
            "Resultado: sube la producción, pero el cuello no era la formadora:\n"
            "pasa al desencajado (74,7 t/día) y después al mezclado (77,9 t/día)."
        ),
        "diff": "E2_vs_E1",
        "conclusion": "La hipótesis de la formadora queda refutada como cuello único.\nGanancia real: +9,3 pallets/día, pero limitada por el desencajado.",
        "rack": False,
    },
    "E3": {
        "titulo": "E3 · E2 + 1,5× materia prima",
        "problema": (
            "Pregunta: si además entra más materia prima, ¿la línea produce más?\n"
            "Se toma E2 y se multiplica por 1,5 la materia prima que llega a la planta.\n"
            "Resultado: la cámara de MP se llena (19,4 → 30,3 pallets en promedio) y el\n"
            "desencajado sigue siendo el cuello. Respecto de E2 la mejora no se distingue de cero."
        ),
        "diff": "E3_vs_E2",
        "conclusion": "Más materia prima solo llena la cámara de MP.\nLa mejora contra E2 (+3,6 pallets/día) no es estadísticamente distinta de cero.",
        "rack": True,
    },
    "E4": {
        "titulo": "E4 · Batch de 1200 kg (8 cargas)",
        "problema": (
            "Pregunta: ¿conviene aumentar el batch de 1050 kg (7 cargas) a 1200 kg (8 cargas)?\n"
            "Cada batch tiene más carga, pero las mezcladoras tardan más por batch (escalado ×8/7).\n"
            "Resultado: el cuello sigue siendo las mezcladoras (61,6 t/día contra 60,5 de E1)."
        ),
        "diff": "E4_vs_E1",
        "conclusion": "Batch de 1200 kg: +0,6 pallets/día contra E1.\nNo se distingue de cero: no justifica el cambio.",
        "rack": False,
    },
}


def ci(d):
    return d["ic_inf"], d["ic_sup"]


def base_fig():
    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100, facecolor=BG)
    return fig


def titulo(fig, texto, sub=None):
    fig.text(0.05, 0.92, texto, fontsize=38, weight="bold", color=INK)
    if sub:
        fig.text(0.05, 0.875, sub, fontsize=20, color="#555555")


def pie(fig, texto):
    fig.text(0.05, 0.03,
             "Simulación estocástica · 10 réplicas de 24 h · IC 95 % · sin comparar contra planta",
             fontsize=13, color="#777777")


def frame_titulo(e):
    fig = base_fig()
    fig.text(0.5, 0.62, e["titulo"], fontsize=56, weight="bold", ha="center", color=INK)
    fig.text(0.5, 0.42, e["problema"], fontsize=24, ha="center", va="center", color=INK, linespacing=1.6)
    pie(fig, "")
    return fig


def frame_pallets(e_key, esc, p):
    """p en [0,1]: barras crecen con IC."""
    fig = base_fig()
    titulo(fig, "Producción diaria de pallets", "Media y intervalo de confianza 95 %")
    ax = fig.add_axes([0.08, 0.14, 0.86, 0.68])
    ax.set_facecolor(BG)
    keys = ["E1", e_key]
    vals = [RES[k]["pallets"]["media"] * p for k in keys]
    errs = [[(RES[k]["pallets"]["media"] - RES[k]["pallets"]["ic_inf"]) * p,
             (RES[k]["pallets"]["ic_sup"] - RES[k]["pallets"]["media"]) * p] for k in keys]
    colores = [COL_BASE, COL_ESC]
    x = np.arange(2)
    ax.bar(x, vals, color=colores, width=0.5)
    ax.errorbar(x, vals, yerr=np.array(errs).T, fmt="none", ecolor=INK, capsize=18, lw=2.5)
    for i, k in enumerate(keys):
        if p > 0.98:
            ax.text(i, RES[k]["pallets"]["ic_sup"] + 4, f"{RES[k]['pallets']['media']:.1f}".replace(".", ",") + " pal/día",
                    ha="center", fontsize=22, color=INK, weight="bold")
    ax.set_xticks(x, ["E1 base", esc["titulo"].split("·")[0].strip() + " · " + esc["titulo"].split("·")[1].strip()],
                  fontsize=20)
    ax.set_ylim(0, 90)
    ax.set_ylabel("pallets / día", fontsize=20)
    ax.tick_params(axis="y", labelsize=16)
    for s in ["top", "right"]:
        ax.spines[s].set_visible(False)
    pie(fig, "")
    return fig


def frame_diff(esc, p):
    """Forest plot de la diferencia pareada con IC, animado."""
    fig = base_fig()
    d = DIF[esc["diff"]]["pallets"]
    titulo(fig, "Diferencia en pallets/día (pareada)",
           esc["diff"].replace("_", " ").replace("vs", "contra"))
    ax = fig.add_axes([0.2, 0.18, 0.72, 0.62])
    ax.set_facecolor(BG)
    lo, hi = d["ic_inf"], d["ic_sup"]
    m = d["media"] * p
    ax.axvline(0, color="#555555", lw=2, ls="--")
    ax.hlines(0, lo * p, hi * p, color=COL_ESC, lw=10)
    ax.plot([m], [0], "o", ms=30, color=COL_ESC)
    ax.text(m, 0.25, f"{m:+.1f}".replace(".", ","), ha="center", fontsize=26, weight="bold")
    ax.set_xlim(-4, 18)
    ax.set_ylim(-0.6, 0.6)
    ax.set_yticks([])
    ax.tick_params(axis="x", labelsize=18)
    ax.set_xlabel("pallets/día de diferencia · IC 95 %", fontsize=20)
    for s in ["top", "right", "left"]:
        ax.spines[s].set_visible(False)
    pie(fig, "")
    return fig


def frame_cuellos(e_key, p):
    fig = base_fig()
    titulo(fig, "Capacidad de las estaciones más lentas (t/día)",
           "La más baja es el cuello de botella")
    ax = fig.add_axes([0.18, 0.16, 0.76, 0.66])
    ax.set_facecolor(BG)
    filas = [("E1", CUELLOS["E1"]), (e_key, CUELLOS[e_key])]
    y = 0
    labels = []
    ypos = []
    for nombre, lista in filas:
        for est, v in lista:
            labels.append(f"{nombre} · {est}")
            ypos.append(y)
            color = COL_BAD if (est, v) == min(lista, key=lambda t: t[1]) else COL_BASE
            ax.barh(y, v * p, color=color, height=0.6)
            ax.text(v * p + 0.8, y, f"{v:.1f}".replace(".", ",") if p > 0.98 else "", va="center", fontsize=20)
            y += 1
        y += 0.8
    ax.set_yticks(ypos, labels, fontsize=20)
    ax.invert_yaxis()
    ax.set_xlim(0, 90)
    ax.tick_params(axis="x", labelsize=16)
    ax.set_xlabel("toneladas por día", fontsize=18)
    for s in ["top", "right"]:
        ax.spines[s].set_visible(False)
    pie(fig, "")
    return fig


def frame_rack(p):
    fig = base_fig()
    titulo(fig, "Cámara de materia prima (pallets, promedio)", "E2 contra E3: más materia prima, más stock")
    ax = fig.add_axes([0.12, 0.16, 0.82, 0.66])
    ax.set_facecolor(BG)
    vals = [RES["E2"]["rack"]["media"], RES["E3"]["rack"]["media"]]
    x = np.arange(2)
    ax.bar(x, [v * p for v in vals], color=[COL_BASE, COL_ESC], width=0.45)
    for i, v in enumerate(vals):
        if p > 0.98:
            ax.text(i, v + 1, f"{v:.1f}".replace(".", ","), ha="center", fontsize=24, weight="bold")
    ax.set_xticks(x, ["E2 (MP × 1)", "E3 (MP × 1,5)"], fontsize=22)
    ax.set_ylim(0, 40)
    ax.tick_params(axis="y", labelsize=16)
    for s in ["top", "right"]:
        ax.spines[s].set_visible(False)
    pie(fig, "")
    return fig


def frame_conclusion(e):
    fig = base_fig()
    fig.text(0.5, 0.6, "Conclusión", fontsize=50, weight="bold", ha="center", color=INK)
    fig.text(0.5, 0.42, e["conclusion"], fontsize=28, ha="center", va="center", color=INK, linespacing=1.6)
    pie(fig, "")
    return fig


def ease(t):
    return t * t * (3 - 2 * t)


def write_video(e_key, e, path):
    seq = []
    seq += [("hold", frame_titulo, dict(e=e), 6)]
    seq += [("anim", frame_pallets, dict(e_key=e_key, esc=e), 8)]
    if e["rack"]:
        seq += [("anim", frame_rack, dict(), 7)]
    seq += [("anim", frame_cuellos, dict(e_key=e_key), 9)]
    seq += [("anim", frame_diff, dict(esc=e), 8)]
    seq += [("hold", frame_conclusion, dict(e=e), 6)]

    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", path]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    try:
        for kind, fn, kw, secs in seq:
            n = int(secs * FPS)
            for i in range(n):
                p = 1.0 if kind == "hold" else ease(min(1.0, (i + 1) / (n * 0.6)))
                if kind == "hold":
                    fig = fn(**kw)
                elif fn is frame_titulo or fn is frame_conclusion:
                    fig = fn(**kw)
                elif fn is frame_pallets:
                    fig = fn(p=p, **kw)
                elif fn is frame_diff:
                    fig = fn(p=p, **kw)
                else:
                    fig = fn(p=p, **kw)
                fig.canvas.draw()
                buf = np.asarray(fig.canvas.buffer_rgba())
                proc.stdin.write(buf.tobytes())
                plt.close(fig)
    finally:
        proc.stdin.close()
        proc.wait()


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for k, e in ESCENARIOS.items():
        destino = os.path.join(OUT, f"cine_{k}.mp4")
        print("render", destino, flush=True)
        write_video(k, e, destino)
    print("listo", OUT)
